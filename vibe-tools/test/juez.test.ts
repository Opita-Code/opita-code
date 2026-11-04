/**
 * L5 · El juez, medido por partes: el ambito, el encargo, la medida y el plan.
 *
 * Cada test dice un comportamiento. Los que importan de verdad son los que
 * separan tres cosas que se confunden: una cuota caida (infraestructura), un
 * juez que no pudo sostener la afirmacion (semantico) y una deriva real.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import type { ModuleDescriptor, ModuleNode, ToolDescriptor } from '../src/contract.js';
import { AMBITOS, DEFINICIONES } from '../src/juez/ambitos.js';
import { ambitoDe, consensoDe } from '../src/juez/ruta-de-ambito.js';
import { agregar, desenlaceDe, desviacion, queHacer, type Muestra, type MedidaDeParte } from '../src/juez/medida.js';
import { bytesDe, revisarEncargo, TOPE_AFIRMACION } from '../src/juez/encargo.js';
import { WHITELIST_BACKEND, revisarWhitelist } from '../src/juez/whitelist.js';
import { cobrar, costeDe, dispersionDeLatencia, type Tarifa } from '../src/juez/coste.js';
import {
  MedidaIncoherenteError,
  comprobarCorrespondencia,
  planificar,
  resolver,
  resumenDe,
  type Parte,
} from '../src/juez/pipeline.js';

// ---------------------------------------------------------------------------
// Las piezas de prueba
// ---------------------------------------------------------------------------

const muestra = (over: Partial<Muestra> = {}): Muestra => ({
  veredicto: 'aligned',
  confianza: 1,
  proveedor: 'judge-minimax',
  latenciaMs: 1000,
  degradado: false,
  razon: '',
  ...over,
});

const parte = (n: number, bytes = 100, sha = `sha-${n}`): Parte => ({
  n,
  titulo: `parte ${n}`,
  bytes,
  sha,
});

const medida = (n: number, muestras: Muestra[], bytes = 100, sha = `sha-${n}`): MedidaDeParte => ({
  parte: n,
  sha,
  bytes,
  muestras,
});

const encargo = (
  ruta: string,
  afirmacion: string | readonly string[] = 'el archivo hace lo que dice',
  evalType = 'drift_judge',
) => ({
  ruta,
  afirmaciones: typeof afirmacion === 'string' ? [afirmacion] : afirmacion,
  evalType,
});

const herramienta = (over: Partial<ToolDescriptor> = {}): ToolDescriptor => ({
  id: 'tool',
  version: '0.1.0',
  author: 'opita',
  title: 't',
  determinism: 'deterministic',
  tier: 'T0',
  effect: 'none',
  context_profile: 'none',
  psychometrics: false,
  inputs: [],
  outputs: [],
  ...over,
});

const modulo = (nodos: ModuleNode[]): ModuleDescriptor => ({
  id: 'modulo',
  version: '0.1.0',
  author: 'opita',
  title: 'm',
  nodes: nodos,
  edges: [],
  sinks: [],
});

// ---------------------------------------------------------------------------
// El ambito: se asigna por ruta, y una ruta sin ambito no lo hereda
// ---------------------------------------------------------------------------

test('L5 · cada raiz del conjunto juzgable tiene su ambito', () => {
  assert.equal(ambitoDe('vibe-tools/src/index.ts'), 'codigo');
  assert.equal(ambitoDe('vibe-tools/db/001-rls.sql'), 'sql');
  assert.equal(ambitoDe('docs/arquitectura/loops/L4-cierre.md'), 'documento');
  assert.equal(ambitoDe('docs/avances/L4.md'), 'avance');
  assert.equal(ambitoDe('docs/canal/linkedin.md'), 'canal');
});

test('L5 · los archivos sueltos del conjunto juzgable tienen su ambito', () => {
  assert.equal(ambitoDe('README.md'), 'superficie');
  assert.equal(ambitoDe('STATUS.md'), 'superficie');
  assert.equal(ambitoDe('vibe-tools/README.md'), 'superficie');
  assert.equal(ambitoDe('docs/avances.md'), 'avance');
  assert.equal(ambitoDe('docs/canal.md'), 'canal');
  assert.equal(ambitoDe('.github/workflows/ci.yml'), 'superficie');
});

test('L5 · una ruta sin ambito devuelve null: no se adivina la clase', () => {
  assert.equal(ambitoDe('docs/legal/cumplimiento-aislamiento-datos-v1.md'), null);
  assert.equal(ambitoDe('vibe-tools/estado.json'), null);
  assert.equal(ambitoDe('scripts/generar-estado.mjs'), null);
});

test('L5 · el ambito no se hereda por parecido de prefijo', () => {
  assert.equal(ambitoDe('vibe-tools/src2/foo.ts'), null);
  assert.equal(ambitoDe('docs/avances-otro/L4.md'), null);
  assert.equal(ambitoDe('vibe-tools/src/'), null, 'una raiz sin archivo no es un artefacto');
});

test('L5 · una ruta absoluta no tiene ambito: la tabla es de rutas del repo', () => {
  assert.equal(ambitoDe('/home/usuario/workspace/opita-code/vibe-tools/src/index.ts'), null);
  assert.equal(ambitoDe('C:\\repo\\vibe-tools\\src\\index.ts'), null);
});

test('L5 · la ruta se normaliza antes de clasificarla', () => {
  assert.equal(ambitoDe('./vibe-tools/src/index.ts'), 'codigo');
  assert.equal(ambitoDe('vibe-tools\\src\\index.ts'), 'codigo');
  assert.equal(ambitoDe('vibe-tools//src//index.ts'), 'codigo');
});

test('L5 · el consenso lo pide el riesgo, y el ambito pone la base', () => {
  assert.equal(consensoDe('codigo', 'normal'), 3);
  assert.equal(consensoDe('documento', 'normal'), 1);
  assert.equal(consensoDe('documento', 'alto'), 3);
  assert.equal(consensoDe('codigo', 'alto'), 3);
});

test('L5 · cada ambito declara lo que NO ve: una tabla que promete todo no sirve', () => {
  for (const ambito of AMBITOS) {
    const d = DEFINICIONES[ambito];
    assert.ok(d.noVe.length > 0, `${ambito} no declara lo que no ve`);
    assert.ok(d.queMide.length > 0, `${ambito} no declara que mide`);
    assert.ok(d.quienAsigna.length > 0, `${ambito} no declara quien asigna`);
  }
});

// ---------------------------------------------------------------------------
// El encargo: lo que se rechaza sin gastar una llamada
// ---------------------------------------------------------------------------

test('L5 · una afirmacion vacia se rechaza antes de llamar al juez', () => {
  const r = revisarEncargo(encargo('vibe-tools/src/index.ts', '   '));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.motivo, 'afirmacion_vacia');
});

test('L5 · un encargo sin ninguna afirmacion se rechaza: no hay pregunta que hacer', () => {
  const r = revisarEncargo(encargo('vibe-tools/src/index.ts', []));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.motivo, 'afirmacion_vacia');
});

test('L5 · una afirmacion vacia en la segunda parte se rechaza, y el mensaje dice cual', () => {
  const r = revisarEncargo(encargo('vibe-tools/src/index.ts', ['la primera', '  ']));
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.motivo, 'afirmacion_vacia');
    assert.match(r.detalle, /parte 2/);
  }
});

test('L5 · una afirmacion con salto de linea se rechaza: una lista neutra el veredicto', () => {
  const r = revisarEncargo(encargo('vibe-tools/src/index.ts', 'primera\n- segunda'));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.motivo, 'afirmacion_multilinea');
});

test('L5 · una afirmacion que pasa el tope se rechaza: el proveedor la truncaria', () => {
  const r = revisarEncargo(encargo('vibe-tools/src/index.ts', 'x'.repeat(TOPE_AFIRMACION + 1)));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.motivo, 'afirmacion_grande');
});

test('L5 · el tope de la afirmacion se puede pasar, porque es configuracion del proyecto', () => {
  const r = revisarEncargo(encargo('vibe-tools/src/index.ts', 'x'.repeat(10)), 10);
  assert.equal(r.ok, true);
});

test('L5 · un tipo de evaluacion ajeno se rechaza, no se ignora', () => {
  const r = revisarEncargo(encargo('vibe-tools/src/index.ts', 'algo', 'brand_match'));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.motivo, 'eval_type_ajeno');
});

test('L5 · una ruta sin ambito se rechaza con su motivo', () => {
  const r = revisarEncargo(encargo('docs/legal/cumplimiento-aislamiento-datos-v1.md'));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.motivo, 'sin_ambito');
});

test('L5 · un encargo valido devuelve el ambito y el consenso ya resueltos', () => {
  const r = revisarEncargo(encargo('docs/arquitectura/loops/L5-pipeline.md'));
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.ambito, 'documento');
    assert.equal(r.consenso, 1);
    assert.equal(r.riesgo, 'normal');
  }
});

test('L5 · el riesgo alto sube el consenso sin cambiar el ambito', () => {
  const r = revisarEncargo({ ...encargo('docs/arquitectura/loops/L5-pipeline.md'), riesgo: 'alto' });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.ambito, 'documento');
    assert.equal(r.consenso, 3);
    assert.equal(r.riesgo, 'alto');
  }
});

test('L5 · los bytes son bytes: una tilde ocupa dos', () => {
  assert.equal(bytesDe('a'), 1);
  assert.equal(bytesDe('á'), 2);
  assert.equal(bytesDe('ñ'), 2);
});

// ---------------------------------------------------------------------------
// El plan: el contrato que el transporte ejecuta
// ---------------------------------------------------------------------------

test('L5 · un artefacto sin partes no se planifica', () => {
  const p = planificar(encargo('vibe-tools/src/index.ts'), [], { tope: 4096 });
  assert.equal(p.ok, false);
  if (!p.ok) assert.equal(p.motivo, 'sin_partes');
});

test('L5 · una parte repetida no se planifica', () => {
  const p = planificar(encargo('vibe-tools/src/index.ts'), [parte(1), parte(1, 200, 'otro')], { tope: 4096 });
  assert.equal(p.ok, false);
  if (!p.ok) assert.equal(p.motivo, 'parte_repetida');
});

test('L5 · una parte vacia no se planifica', () => {
  const p = planificar(encargo('vibe-tools/src/index.ts'), [parte(1, 0)], { tope: 4096 });
  assert.equal(p.ok, false);
  if (!p.ok) assert.equal(p.motivo, 'parte_vacia');
});

test('L5 · una afirmacion para dos partes se rechaza: una parte, una afirmacion', () => {
  const p = planificar(encargo('vibe-tools/src/index.ts', 'una sola para las dos'), [parte(1, 100), parte(2, 200)], { tope: 4096 });
  assert.equal(p.ok, false);
  if (!p.ok) {
    assert.equal(p.motivo, 'afirmaciones_por_parte');
    assert.match(p.detalle, /una parte, una afirmacion/);
  }
});

test('L5 · el plan lleva una afirmacion por parte, en el orden de las partes', () => {
  const p = planificar(encargo('vibe-tools/src/index.ts', ['la primera', 'la segunda']), [parte(1, 100), parte(2, 200)], { tope: 4096 });
  assert.equal(p.ok, true);
  if (p.ok) assert.deepEqual(p.plan.afirmaciones, ['la primera', 'la segunda']);
});

test('L5 · una parte sobre el tope se rechaza, y el mensaje no ofrece subir el tope', () => {
  const p = planificar(encargo('vibe-tools/src/index.ts'), [parte(1, 4097)], { tope: 4096 });
  assert.equal(p.ok, false);
  if (!p.ok) {
    assert.equal(p.motivo, 'parte_grande');
    assert.match(p.detalle, /se parte por concepto/);
    assert.match(p.detalle, /no se sube el tope/);
  }
});

test('L5 · el plan multiplica llamadas y bytes por el consenso', () => {
  const p = planificar(encargo('vibe-tools/src/index.ts', ['la parte uno', 'la parte dos']), [parte(1, 100), parte(2, 200)], { tope: 4096 });
  assert.equal(p.ok, true);
  if (p.ok) {
    assert.equal(p.plan.consenso, 3, 'el codigo pide tres muestras');
    assert.equal(p.plan.llamadas, 6);
    assert.equal(p.plan.bytesEnviados, 900);
    assert.equal(p.plan.partes.length, 2);
  }
});

test('L5 · un documento planifica una sola llamada por parte', () => {
  const p = planificar(encargo('docs/arquitectura/loops/L5-pipeline.md'), [parte(1, 500)], { tope: 4096 });
  assert.equal(p.ok, true);
  if (p.ok) {
    assert.equal(p.plan.consenso, 1);
    assert.equal(p.plan.llamadas, 1);
  }
});

// ---------------------------------------------------------------------------
// La medida: alineado, deriva, parada, y por que
// ---------------------------------------------------------------------------

test('L5 · sin muestras no hay medida', () => {
  const d = desenlaceDe(medida(1, []));
  assert.equal(d.tipo, 'parada');
  if (d.tipo === 'parada') assert.equal(d.motivo, 'sin_muestras');
});

test('L5 · una muestra degradada para la medida ANTES de mirar el veredicto', () => {
  const d = desenlaceDe(
    medida(1, [
      muestra({ veredicto: 'drift_detected', confianza: 1, degradado: true, razon: 'nli: provider rate limited' }),
    ]),
  );
  assert.equal(d.tipo, 'parada');
  if (d.tipo === 'parada') {
    assert.equal(d.motivo, 'infraestructura');
    assert.match(d.razon, /rate limited/);
  }
});

test('L5 · una muestra sin proveedor es infraestructura, aunque diga needs_human con confianza 0', () => {
  const d = desenlaceDe(medida(1, [muestra({ veredicto: 'needs_human', confianza: 0, proveedor: null })]));
  assert.equal(d.tipo, 'parada');
  if (d.tipo === 'parada') assert.equal(d.motivo, 'infraestructura');
});

test('L5 · un needs_human con proveedor y confianza es semantico, no infraestructura', () => {
  const d = desenlaceDe(
    medida(1, [muestra({ veredicto: 'needs_human', confianza: 0.7, proveedor: 'judge-minimax', razon: 'no pudo sostener' })]),
  );
  assert.equal(d.tipo, 'parada');
  if (d.tipo === 'parada') {
    assert.equal(d.motivo, 'semantico');
    assert.equal(d.razon, 'no pudo sostener');
  }
});

test('L5 · tres muestras aligned dan alineado con stddev 0', () => {
  const d = desenlaceDe(medida(1, [muestra(), muestra(), muestra()]));
  assert.equal(d.tipo, 'alineado');
  if (d.tipo === 'alineado') {
    assert.equal(d.muestras, 3);
    assert.equal(d.confianza, 1);
    assert.equal(d.stddev, 0);
  }
});

test('L5 · tres muestras aligned con confianzas distintas siguen alineadas, y el stddev se publica', () => {
  const d = desenlaceDe(medida(1, [muestra({ confianza: 1 }), muestra({ confianza: 1 }), muestra({ confianza: 0.9 })]));
  assert.equal(d.tipo, 'alineado');
  if (d.tipo === 'alineado') {
    assert.ok(d.stddev > 0, 'la dispersion se mide, no se esconde');
  }
});

test('L5 · si una muestra discrepa, no se elige la mayoria: se para', () => {
  const d = desenlaceDe(
    medida(1, [muestra(), muestra(), muestra({ veredicto: 'needs_human', confianza: 0.8 })]),
  );
  assert.equal(d.tipo, 'parada');
  if (d.tipo === 'parada') assert.equal(d.motivo, 'disenso');
});

test('L5 · un empate entre dos veredictos es disenso, y el mensaje lo dice', () => {
  const d = desenlaceDe(medida(1, [muestra(), muestra({ veredicto: 'drift_detected', confianza: 0.9 })]));
  assert.equal(d.tipo, 'parada');
  if (d.tipo === 'parada') {
    assert.equal(d.motivo, 'disenso');
    assert.match(d.razon, /empate/);
  }
});

test('L5 · tres muestras de deriva dan deriva con su razon', () => {
  const d = desenlaceDe(
    medida(1, [muestra({ veredicto: 'drift_detected', confianza: 0.9, razon: 'dice 8192 donde la fuente dice 4096' })]),
  );
  assert.equal(d.tipo, 'deriva');
  if (d.tipo === 'deriva') assert.match(d.razon, /8192/);
});

test('L5 · una deriva manda sobre las partes alineadas', () => {
  const a = agregar([
    medida(1, [muestra()]),
    medida(2, [muestra({ veredicto: 'drift_detected', confianza: 0.95, razon: 'falta la seccion' })]),
    medida(3, [muestra()]),
  ]);
  assert.equal(a.tipo, 'deriva');
  if (a.tipo === 'deriva') assert.deepEqual(a.partes, [2]);
});

test('L5 · una parada deja el agregado incompleto: no hay aprobado parcial', () => {
  const a = agregar([
    medida(1, [muestra()]),
    medida(2, [muestra({ veredicto: 'needs_human', confianza: 0.6 })]),
  ]);
  assert.equal(a.tipo, 'parada');
  if (a.tipo === 'parada') assert.deepEqual(a.partes, [2]);
});

test('L5 · el agregado solo es alineado si TODAS las partes lo estan', () => {
  const a = agregar([medida(1, [muestra()]), medida(2, [muestra({ confianza: 0.9 })])]);
  assert.equal(a.tipo, 'alineado');
  if (a.tipo === 'alineado') {
    assert.equal(a.partes, 2);
    assert.equal(a.confianzaMinima, 0.9, 'la parte mas debil manda');
    assert.equal(a.stddevMaximo, 0);
  }
});

test('L5 · el agregado publica el stddev maximo, no la media', () => {
  const a = agregar([
    medida(1, [muestra({ confianza: 1 }), muestra({ confianza: 1 })]),
    medida(2, [muestra({ confianza: 1 }), muestra({ confianza: 0.8 })]),
  ]);
  assert.equal(a.tipo, 'alineado');
  if (a.tipo === 'alineado') assert.ok(a.stddevMaximo > 0);
});

test('L5 · un agregado sin partes es una parada', () => {
  const a = agregar([]);
  assert.equal(a.tipo, 'parada');
  if (a.tipo === 'parada') assert.deepEqual(a.motivos, ['sin_muestras']);
});

test('L5 · la accion del operador distingue infraestructura de semantico', () => {
  assert.match(queHacer(agregar([medida(1, [muestra({ degradado: true })])])), /no es drift/);
  assert.match(queHacer(agregar([medida(1, [muestra({ veredicto: 'needs_human', confianza: 0.6 })])])), /intent/);
  assert.match(queHacer(agregar([medida(1, [muestra({ veredicto: 'drift_detected', confianza: 1 })])])), /corregir/);
  assert.match(queHacer(agregar([medida(1, [muestra()])])), /publicar/);
});

// ---------------------------------------------------------------------------
// La correspondencia: un veredicto de otro contenido no se publica
// ---------------------------------------------------------------------------

const planDe = (partes: Parte[], consenso = 3) => {
  const afirmaciones = partes.map((p) => `la parte ${p.n} hace lo que dice`);
  const p = planificar(encargo('vibe-tools/src/index.ts', afirmaciones), partes, { tope: 4096 });
  assert.equal(p.ok, true);
  if (!p.ok) throw new Error('el plan de prueba no se construyo');
  return { ...p.plan, consenso };
};

test('L5 · si llegan menos medidas que partes, falla', () => {
  const plan = planDe([parte(1), parte(2)]);
  assert.throws(
    () => comprobarCorrespondencia(plan, [medida(1, [muestra(), muestra(), muestra()])]),
    MedidaIncoherenteError,
  );
});

test('L5 · si el sha no es el del plan, falla', () => {
  const plan = planDe([parte(1)]);
  assert.throws(
    () => comprobarCorrespondencia(plan, [medida(1, [muestra(), muestra(), muestra()], 100, 'otro-sha')]),
    /sha/,
  );
});

test('L5 · si los bytes no son los del plan, falla', () => {
  const plan = planDe([parte(1)]);
  assert.throws(
    () => comprobarCorrespondencia(plan, [medida(1, [muestra(), muestra(), muestra()], 99)]),
    /B/,
  );
});

test('L5 · si el numero de muestras no es el del plan, falla', () => {
  const plan = planDe([parte(1)]);
  assert.throws(
    () => comprobarCorrespondencia(plan, [medida(1, [muestra()])]),
    /muestras/,
  );
});

test('L5 · si una parte llega medida dos veces, falla', () => {
  const plan = planDe([parte(1), parte(2)]);
  assert.throws(
    () =>
      comprobarCorrespondencia(plan, [
        medida(1, [muestra(), muestra(), muestra()]),
        medida(1, [muestra(), muestra(), muestra()]),
      ]),
    /dos veces/,
  );
});

test('L5 · la correspondencia correcta no lanza', () => {
  const plan = planDe([parte(1, 100), parte(2, 200)]);
  assert.doesNotThrow(() =>
    comprobarCorrespondencia(plan, [
      medida(1, [muestra(), muestra(), muestra()], 100),
      medida(2, [muestra(), muestra(), muestra()], 200),
    ]),
  );
});

// ---------------------------------------------------------------------------
// La publicacion: la decision y el coste
// ---------------------------------------------------------------------------

test('L5 · tres muestras alineadas deciden publicar', () => {
  const plan = planDe([parte(1)]);
  const pub = resolver(plan, [medida(1, [muestra(), muestra(), muestra()])]);
  assert.equal(pub.decision, 'publicar');
  assert.equal(pub.accion, 'publicar');
});

test('L5 · una deriva decide corregir', () => {
  const plan = planDe([parte(1)]);
  const pub = resolver(plan, [
    medida(1, [
      muestra({ veredicto: 'drift_detected', confianza: 1 }),
      muestra({ veredicto: 'drift_detected', confianza: 1 }),
      muestra({ veredicto: 'drift_detected', confianza: 1 }),
    ]),
  ]);
  assert.equal(pub.decision, 'corregir');
});

test('L5 · un needs_human semantico decide parar, no publicar', () => {
  const plan = planDe([parte(1)]);
  const pub = resolver(plan, [
    medida(1, [
      muestra({ veredicto: 'needs_human', confianza: 0.6 }),
      muestra({ veredicto: 'needs_human', confianza: 0.6 }),
      muestra({ veredicto: 'needs_human', confianza: 0.6 }),
    ]),
  ]);
  assert.equal(pub.decision, 'parar');
  assert.match(pub.accion, /intent/);
});

test('L5 · el coste de la publicacion cuenta las llamadas y los bytes del plan', () => {
  const plan = planDe([parte(1, 100), parte(2, 200)]);
  const pub = resolver(plan, [
    medida(1, [muestra(), muestra(), muestra()], 100),
    medida(2, [muestra(), muestra(), muestra()], 200),
  ]);
  assert.equal(pub.coste.llamadas, 6);
  assert.equal(pub.coste.bytes, 900);
  assert.equal(pub.coste.tokens, null);
  assert.match(pub.coste.motivoTokens, /no reporta usage/);
});

test('L5 · el resumen del operador dice que paso, que hacer y cuanto costo', () => {
  const plan = planDe([parte(1)]);
  const lineas = resumenDe(resolver(plan, [medida(1, [muestra(), muestra(), muestra()])])).join('\n');
  assert.match(lineas, /alineado: 1 de 1/);
  assert.match(lineas, /decision: publicar/);
  assert.match(lineas, /tokens no medidos/);
});

// ---------------------------------------------------------------------------
// El coste: el maximo de latencia, y el margen que no se puede calcular
// ---------------------------------------------------------------------------

test('L5 · sin latencias, la latencia es null y no cero', () => {
  const c = costeDe({ llamadas: 3, bytes: 300 }, [medida(1, [muestra({ latenciaMs: null })])]);
  assert.equal(c.latenciaMs, null);
});

test('L5 · la latencia es el maximo, no la suma: el servidor repite el valor entre muestras', () => {
  const c = costeDe(
    { llamadas: 3, bytes: 300 },
    [medida(1, [muestra({ latenciaMs: 14294 }), muestra({ latenciaMs: 14294 }), muestra({ latenciaMs: 14294 })])],
  );
  assert.equal(c.latenciaMs, 14294, 'sumar contaria tres veces la misma medida');
});

test('L5 · la dispersion de latencia delata que el servidor repite el valor', () => {
  const repite = dispersionDeLatencia(
    [medida(1, [muestra({ latenciaMs: 10 }), muestra({ latenciaMs: 10 })])],
  );
  const distinta = dispersionDeLatencia(
    [medida(1, [muestra({ latenciaMs: 10 }), muestra({ latenciaMs: 20 })])],
  );
  assert.equal(repite, 0);
  assert.ok(distinta > 0);
});

test('L5 · la desviacion tipica es poblacional, como la del consenso del MCP', () => {
  assert.equal(desviacion([1, 1, 1]), 0);
  assert.equal(desviacion([0, 1]), 0.5);
});

test('L5 · el cargo sale de la tarifa, y el margen no se calcula', () => {
  const coste = costeDe({ llamadas: 6, bytes: 900 }, [medida(1, [muestra(), muestra(), muestra()])]);
  const tarifa: Tarifa = { porLlamada: 0.5, moneda: 'COP' };
  const cargo = cobrar(coste, tarifa);
  assert.equal(cargo.total, 3);
  assert.equal(cargo.moneda, 'COP');
  assert.equal(cargo.margen, null);
  assert.match(cargo.motivoMargen, /no esta medido/);
});

// ---------------------------------------------------------------------------
// La lista blanca de backend
// ---------------------------------------------------------------------------

const nodo = (id: string, tier: 'T0' | 'T1' | 'T2'): ModuleNode => ({
  node: id,
  tool: herramienta({ id, tier }),
});

test('L5 · la lista blanca de backend esta vacia: no hay backend en el MVP', () => {
  assert.deepEqual(WHITELIST_BACKEND, []);
});

test('L5 · un modulo sin nodos T2 pasa la lista blanca', () => {
  const r = revisarWhitelist(modulo([nodo('opita.exec', 'T0')]));
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.backend, 0);
});

test('L5 · un modulo con un nodo T2 y la lista vacia se rechaza, y dice que tool falta', () => {
  const r = revisarWhitelist(modulo([nodo('opita.pago', 'T2')]));
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.motivo, 'tool_no_permitida');
    assert.deepEqual(r.tools, ['opita.pago']);
  }
});

test('L5 · una tool admitida en la lista pasa', () => {
  const r = revisarWhitelist(modulo([nodo('opita.pago', 'T2')]), ['opita.pago']);
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.backend, 1);
});

test('L5 · si hay dos tools T2 y solo una esta permitida, se rechaza la que falta', () => {
  const r = revisarWhitelist(modulo([nodo('opita.pago', 'T2'), nodo('opita.saldo', 'T2')]), ['opita.pago']);
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(r.tools, ['opita.saldo']);
});

test('L5 · una tool T2 repetida en dos nodos se reporta una vez', () => {
  const r = revisarWhitelist(modulo([nodo('opita.pago', 'T2'), nodo('opita.pago', 'T2')]));
  assert.equal(r.ok, false);
  if (!r.ok) assert.deepEqual(r.tools, ['opita.pago']);
});

test('L5 · la lista blanca no mira el efecto ni el perfil: eso es de la puerta de permisos', () => {
  const r = revisarWhitelist(
    modulo([{ node: 'x', tool: herramienta({ id: 'opita.pago', tier: 'T2', effect: 'write', context_profile: 'usage_history' }) }]),
  );
  assert.equal(r.ok, false, 'la lista decide por pertenencia, no por lo que la tool declara');
});
