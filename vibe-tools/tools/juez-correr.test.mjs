/**
 * L5 · EL TRANSPORTE, MEDIDO SIN PROVEEDOR.
 *
 * Lo que se prueba aqui no es el juez: es que el transporte le entregue al
 * pipeline la medida correcta. Eso son dos cosas y las dos importan:
 *
 *   1. TRADUCIR. El veredicto vive dentro de `verdict_json`; el sobre no trae
 *      `verdict`. Una respuesta malformada no se adivina: es infraestructura.
 *   2. NO GASTAR. Un encargo sin ambito, una afirmacion multilinea o una parte
 *      que no cabe se rechazan ANTES de abrir el servidor. Se mide con el log
 *      del doble, no con la suposicion de que asi fue.
 *
 * El doble (`juez-falso.mjs`) habla JSON-RPC por stdio con la forma del
 * servidor real: dos capas de sobre, logs en stdout, y el veredicto dentro de
 * una cadena JSON. Si el transporte vuelve a leer `data.verdict`, estos tests
 * se caen.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { configDelServidor, muestraDe } from './juez-correr.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const TRANSPORTE = join(AQUI, 'juez-correr.mjs');
const DOBLE = join(AQUI, 'juez-falso.mjs');

// ---------------------------------------------------------------------------
// La traduccion de una respuesta a una muestra
// ---------------------------------------------------------------------------

test('L5 · el veredicto se lee dentro de verdict_json, no en el sobre', () => {
  const m = muestraDe({
    verdict_json: JSON.stringify({
      verdict: 'aligned',
      confidence: 0.96,
      provider_id: 'judge-minimax',
      latency_ms: 14294,
      degraded: false,
      reasoning: 'el artefacto afirma lo que el intent dice',
    }),
    provider: 'minimax',
    confidence: 0.7,
  });
  assert.equal(m.veredicto, 'aligned');
  assert.equal(m.confianza, 0.96, 'la confianza es la del veredicto, no la del sobre');
  assert.equal(m.proveedor, 'judge-minimax');
  assert.equal(m.latenciaMs, 14294);
  assert.equal(m.degradado, false);
});

test('L5 · el camino por contenido devuelve CoT crudo: no es una muestra, es infraestructura', () => {
  const m = muestraDe({ verdict_json: 'primero pienso, luego dudo, luego no concluyo' });
  assert.equal(m.veredicto, 'needs_human');
  assert.equal(m.degradado, true);
  assert.equal(m.proveedor, null);
  assert.match(m.razon, /verdict_json no es JSON/);
});

test('L5 · un veredicto desconocido no se adivina: es infraestructura', () => {
  const m = muestraDe({ verdict_json: JSON.stringify({ verdict: 'maybe', confidence: 0.9 }) });
  assert.equal(m.degradado, true);
  assert.match(m.razon, /veredicto desconocido: maybe/);
});

test('L5 · el provider del sobre no es el del juez: sin provider_id la muestra no tiene proveedor', () => {
  const m = muestraDe({
    verdict_json: JSON.stringify({ verdict: 'aligned', confidence: 0.9 }),
    provider: 'minimax',
  });
  assert.equal(m.proveedor, null, 'el sobre nombra el proveedor del camino por contenido, no el juez');
});

test('L5 · una muestra sin proveedor en ninguna capa se marca para que el pipeline la pare', () => {
  const m = muestraDe({
    verdict_json: JSON.stringify({ verdict: 'needs_human', confidence: 0, degraded: false }),
  });
  assert.equal(m.proveedor, null);
  assert.equal(m.degradado, false, 'la muestra no esta degradada: es que no hay proveedor');
});

// ---------------------------------------------------------------------------
// La configuracion: el entorno sale del harness, no de valores inventados
// ---------------------------------------------------------------------------

test('L5 · DARK_MEM_BIN manda sobre el comando del harness', () => {
  const anterior = process.env.DARK_MEM_BIN;
  process.env.DARK_MEM_BIN = '/ruta/al/doble';
  try {
    assert.deepEqual(configDelServidor().command, ['/ruta/al/doble']);
  } finally {
    if (anterior === undefined) delete process.env.DARK_MEM_BIN;
    else process.env.DARK_MEM_BIN = anterior;
  }
});

// ---------------------------------------------------------------------------
// La corrida completa contra el doble
// ---------------------------------------------------------------------------

/** Un arbol de repo minimo: la ruta decide el ambito, el contenido no. */
function arbol() {
  const raiz = mkdtempSync(join(tmpdir(), 'juez-correr-'));
  mkdirSync(join(raiz, 'vibe-tools', 'src'), { recursive: true });
  mkdirSync(join(raiz, 'docs', 'arquitectura', 'loops'), { recursive: true });
  mkdirSync(join(raiz, 'docs', 'legal'), { recursive: true });

  writeFileSync(
    join(raiz, 'vibe-tools', 'src', 'prueba.ts'),
    [
      '/** Un archivo de prueba: dos exportaciones y su porque. */',
      'export const UNO = 1;',
      'export const DOS = 2;',
      '',
    ].join('\n'),
    'utf8',
  );

  const secciones = [];
  for (let i = 1; i <= 6; i++) {
    secciones.push(`## Seccion ${i}`);
    secciones.push('palabra '.repeat(220).trim());
    secciones.push('');
  }
  writeFileSync(join(raiz, 'docs', 'arquitectura', 'loops', 'prueba.md'), secciones.join('\n'), 'utf8');
  writeFileSync(join(raiz, 'docs', 'legal', 'prueba.md'), '# legal\n\ntexto\n', 'utf8');

  const log = join(raiz, 'llamadas.jsonl');
  const envoltorio = join(raiz, 'servidor-falso.sh');
  writeFileSync(envoltorio, `#!/bin/sh\nexec '${process.execPath}' '${DOBLE}' "$@"\n`, 'utf8');
  chmodSync(envoltorio, 0o755);

  return { raiz, log, envoltorio };
}

/** Corre el transporte contra el doble y devuelve el proceso y el JSON. */
function correr(a, modo, extra = {}) {
  const afirmaciones = Array.isArray(extra.afirmacion)
    ? extra.afirmacion
    : [extra.afirmacion ?? 'el archivo hace lo que dice y explica por que'];
  const res = spawnSync(
    process.execPath,
    [
      TRANSPORTE,
      '--raiz',
      a.raiz,
      '--ruta',
      extra.ruta ?? 'vibe-tools/src/prueba.ts',
      ...afirmaciones.flatMap((x) => ['--afirmacion', x]),
      '--json',
      ...(extra.args ?? []),
    ],
    {
      encoding: 'utf8',
      env: {
        ...process.env,
        DARK_MEM_BIN: a.envoltorio,
        JUEZ_FALSO_MODO: modo,
        JUEZ_FALSO_LOG: a.log,
      },
    },
  );
  let salida = null;
  try {
    salida = JSON.parse(res.stdout);
  } catch {
    salida = null;
  }
  return { res, salida };
}

/** Las llamadas que anoto el doble. */
function llamadas(a) {
  if (!existsSync(a.log)) return [];
  return readFileSync(a.log, 'utf8')
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l) => JSON.parse(l));
}

test('L5 · tres muestras alineadas del codigo deciden publicar (exit 0)', () => {
  const a = arbol();
  try {
    const { res, salida } = correr(a, 'aligned');
    assert.equal(res.status, 0, res.stderr);
    assert.equal(salida.decision, 'publicar');
    assert.equal(salida.consenso, 3, 'el codigo pide tres muestras');
    assert.equal(salida.agregado.tipo, 'alineado');
    assert.equal(salida.agregado.stddevMaximo, 0);
    assert.equal(salida.coste.tokens, null, 'los tokens no se proyectan');
    assert.equal(salida.coste.latenciaMs, 14294, 'la latencia es el maximo, no la suma');
    assert.equal(llamadas(a).length, 3);
  } finally {
    rmSync(a.raiz, { recursive: true, force: true });
  }
});

test('L5 · cada llamada usa artifact_ref y no content: el camino por contenido devuelve otra cosa', () => {
  const a = arbol();
  try {
    correr(a, 'aligned');
    const l = llamadas(a);
    assert.ok(l.length > 0);
    for (const c of l) {
      assert.equal(c.tiene_content, false);
      assert.equal(c.eval_type, 'drift_judge');
      assert.equal(c.artifact.kind, 'file');
      assert.ok(typeof c.artifact.path === 'string' && c.artifact.path.length > 0);
    }
  } finally {
    rmSync(a.raiz, { recursive: true, force: true });
  }
});

test('L5 · una deriva decide corregir (exit 1)', () => {
  const a = arbol();
  try {
    const { res, salida } = correr(a, 'drift');
    assert.equal(res.status, 1, res.stderr);
    assert.equal(salida.decision, 'corregir');
    assert.match(salida.agregado.razon, /8192/);
  } finally {
    rmSync(a.raiz, { recursive: true, force: true });
  }
});

test('L5 · un needs_human con proveedor es semantico: se para y se revisa el intent (exit 3)', () => {
  const a = arbol();
  try {
    const { res, salida } = correr(a, 'semantico');
    assert.equal(res.status, 3, res.stderr);
    assert.equal(salida.decision, 'parar');
    assert.deepEqual(salida.agregado.motivos, ['semantico']);
    assert.match(salida.accion, /intent/);
  } finally {
    rmSync(a.raiz, { recursive: true, force: true });
  }
});

test('L5 · una muestra degradada es infraestructura, no drift: no se toca el artefacto (exit 3)', () => {
  const a = arbol();
  try {
    const { res, salida } = correr(a, 'infra');
    assert.equal(res.status, 3, res.stderr);
    assert.deepEqual(salida.agregado.motivos, ['infraestructura']);
    assert.match(salida.accion, /no es drift/);
  } finally {
    rmSync(a.raiz, { recursive: true, force: true });
  }
});

test('L5 · un needs_human sin proveedor es cuota, no juicio: infraestructura (exit 3)', () => {
  const a = arbol();
  try {
    const { res, salida } = correr(a, 'sin_proveedor');
    assert.equal(res.status, 3, res.stderr);
    assert.deepEqual(salida.agregado.motivos, ['infraestructura']);
    assert.match(salida.agregado.razon, /cuota agotada/);
  } finally {
    rmSync(a.raiz, { recursive: true, force: true });
  }
});

test('L5 · una respuesta malformada es infraestructura, no un veredicto (exit 3)', () => {
  const a = arbol();
  try {
    const { res, salida } = correr(a, 'malformed');
    assert.equal(res.status, 3, res.stderr);
    assert.deepEqual(salida.agregado.motivos, ['infraestructura']);
    assert.match(salida.agregado.razon, /verdict_json no es JSON/);
  } finally {
    rmSync(a.raiz, { recursive: true, force: true });
  }
});

test('L5 · si las muestras no coinciden, no se elige la mayoria: se para (exit 3)', () => {
  const a = arbol();
  try {
    const { res, salida } = correr(a, 'disenso');
    assert.equal(res.status, 3, res.stderr);
    assert.deepEqual(salida.agregado.motivos, ['disenso']);
    assert.match(salida.accion, /no coinciden/);
  } finally {
    rmSync(a.raiz, { recursive: true, force: true });
  }
});

test('L5 · una ruta sin ambito se rechaza SIN abrir el servidor (exit 2, cero llamadas)', () => {
  const a = arbol();
  try {
    const { res } = correr(a, 'aligned', { ruta: 'docs/legal/prueba.md' });
    assert.equal(res.status, 2);
    assert.match(res.stderr, /ENCARGO RECHAZADO \(sin_ambito\)/);
    assert.equal(llamadas(a).length, 0, 'un encargo sin ambito no gasta una llamada');
  } finally {
    rmSync(a.raiz, { recursive: true, force: true });
  }
});

test('L5 · una afirmacion multilinea se rechaza SIN abrir el servidor (exit 2, cero llamadas)', () => {
  const a = arbol();
  try {
    const { res } = correr(a, 'aligned', { afirmacion: 'primera linea\n- segunda linea' });
    assert.equal(res.status, 2);
    assert.match(res.stderr, /ENCARGO RECHAZADO \(afirmacion_multilinea\)/);
    assert.equal(llamadas(a).length, 0);
  } finally {
    rmSync(a.raiz, { recursive: true, force: true });
  }
});

test('L5 · un documento se parte por concepto y cada parte se juzga con su afirmacion', () => {
  const a = arbol();
  try {
    const { res, salida } = correr(a, 'aligned', {
      ruta: 'docs/arquitectura/loops/prueba.md',
      afirmacion: ['las secciones uno y dos', 'las secciones tres y cuatro', 'las secciones cinco y seis'],
    });
    assert.equal(res.status, 0, res.stderr);
    assert.ok(salida.partes.length > 1, 'el documento de prueba tiene que partirse');
    for (const p of salida.partes) assert.ok(p.bytes <= 4096, 'ninguna parte pasa del tope');
    assert.equal(llamadas(a).length, salida.partes.length, 'una llamada por parte: consenso 1');
    assert.equal(salida.coste.llamadas, salida.partes.length);
    assert.equal(salida.composicion.ok, true, 'las partes tienen que dar el original');
  } finally {
    rmSync(a.raiz, { recursive: true, force: true });
  }
});

test('L5 · una sola afirmacion para un documento de varias partes se rechaza SIN llamar (exit 2)', () => {
  const a = arbol();
  try {
    const { res } = correr(a, 'aligned', { ruta: 'docs/arquitectura/loops/prueba.md' });
    assert.equal(res.status, 2);
    assert.match(res.stderr, /ENCARGO RECHAZADO \(afirmaciones_por_parte\)/);
    assert.match(res.stderr, /una parte, una afirmacion/);
    assert.equal(llamadas(a).length, 0, 'una afirmacion para todas las partes no gasta una llamada');
  } finally {
    rmSync(a.raiz, { recursive: true, force: true });
  }
});

test('L5 · cada parte recibe su propia afirmacion, en orden', () => {
  const a = arbol();
  try {
    const afirmaciones = ['las secciones uno y dos', 'las secciones tres y cuatro', 'las secciones cinco y seis'];
    correr(a, 'aligned', { ruta: 'docs/arquitectura/loops/prueba.md', afirmacion: afirmaciones });
    const l = llamadas(a);
    assert.deepEqual(l.map((c) => c.intent), afirmaciones);
  } finally {
    rmSync(a.raiz, { recursive: true, force: true });
  }
});

test('L5 · el intent que recibe el juez es la afirmacion del encargo, no la ruta', () => {
  const a = arbol();
  try {
    const afirmacion = 'el archivo exporta dos constantes y explica su proposito';
    correr(a, 'aligned', { afirmacion });
    for (const c of llamadas(a)) assert.equal(c.intent, afirmacion);
  } finally {
    rmSync(a.raiz, { recursive: true, force: true });
  }
});

test('L5 · las partes temporales se borran al terminar, y se conservan solo si se pide', () => {
  const a = arbol();
  try {
    correr(a, 'aligned');
    assert.equal(existsSync(join(a.raiz, '.partes-juez')), false, 'sin --conservar no queda basura');

    correr(a, 'aligned', { args: ['--conservar'] });
    assert.equal(existsSync(join(a.raiz, '.partes-juez')), true, '--conservar deja las partes para inspeccionarlas');
  } finally {
    rmSync(a.raiz, { recursive: true, force: true });
  }
});
