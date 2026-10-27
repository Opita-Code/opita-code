/**
 * GATE BUDGET — enforcement de la decision del operador (opcion A).
 *
 * Ninguna PARTE que se pase al gate de drift_judge puede superar
 * ConsensusChunkSize = 4096 bytes. Con ese tope la parte es UN chunk, el
 * SpecIntent aplica a la parte completa, y el veredicto es decidible.
 *
 * (Fuente: internal/orchestration/drift_judge_consensus.go — ConsensusChunkSize)
 *
 * QUE MIDE, DESDE EL 2026-10-27. La parte mas grande que veria el juez, no el
 * archivo. La partida es SOLO para el juez: en el repositorio el documento es
 * UNO y entero, y un script recompone las partes y las verifica contra el
 * original. Un documento de 5000 B que se parte en dos de 2500 B es legal.
 *
 * Este guard es lo que convierte la decision en regla. Sin el, la primera regla
 * nueva cruza el tope en silencio y K3 vuelve a ser inalcanzable sin que nadie
 * se entere.
 *
 * ALCANCE, y por que no es "todo .ts y .md del repo":
 *
 *   JUZGABLE  vibe-tools/src/**      cada archivo es una unidad de codigo juzgada
 *                                    por el gate, con su propio SpecIntent
 *              docs/arquitectura/loops/**   un documento por loop, cada uno
 *                                    su unidad juzgada
 *
 *   NO JUZGABLE  los cuatro documentos de la fase 1 (arquitectura v1/v2,
 *              boundary, cumplimiento legal). No son artefactos por loop: son
 *              texto de referencia que no se re-verifica cada iteracion. Partirlos
 *              en rodajas de 4 KB no agrega verificacion, solo riesgo de alterar
 *              decisiones de boundary y legales ya escritas. Se listan explicitamente
 *              con su motivo para que la clasificacion sea visible y no se pudra.
 */

import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { partir, TOPE } from './juez-partes.mjs';

const BUDGET = 4096;
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

const ROOTS = ['vibe-tools/src', 'docs/arquitectura/loops', 'docs/avances', 'docs/canal'];
const ALSO_FILES = [
  'vibe-tools/README.md',
  'README.md',
  'STATUS.md',
  'docs/avances.md',
  'docs/como-verificar.md',
  'docs/controles.md',
  'docs/canal.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  '.github/workflows/ci.yml',
  '.github/workflows/estado.yml',
  '.github/workflows/release.yml',
];
const EXTS = new Set(['.ts', '.md']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);

/** Documentos de la fase 1, fuera del gate. El motivo se imprime en cada corrida. */
const NO_JUZGABLE = [
  ['docs/arquitectura/vibe-studio-arquitectura-v1.md', 'SUPERSEDED por v2, no se mantiene'],
  ['docs/arquitectura/vibe-studio-arquitectura-v2-vibe-tools.md', 'referencia de la fase 1, no es artefacto por loop'],
  ['docs/arquitectura/boundary-memory-v1.md', 'texto de boundary; se re-verifica en el loop L3'],
  ['docs/legal/cumplimiento-aislamiento-datos-v1.md', 'texto legal; requiere abogado, no juez LLM'],
  ['docs/arquitectura/plan-iteracion-mvp.md', 'plan de 10 loops; se sustituye por docs/arquitectura/loops/'],
  ['docs/arquitectura/mvp-vibe-tools-spec533.md', 'spec 533, superado por spec 535'],
  ['vibe-tools/estado.json', 'FUENTE UNICA de la superficie publica; sus numeros los verifica el guard de estado, que mide la realidad, y partirla por el tope romperia la regla de una sola fuente'],
];

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (EXTS.has(extname(entry))) acc.push(full);
  }
  return acc;
}

/**
 * Tamano del artefacto TAL COMO LO VERIA EL JUEZ: los BYTES CRUDOS del archivo.
 *
 * HALLAZGO 2026-10-23 (el importante de los dos). El juez resuelve el artefacto
 * leyendo el archivo CRUDO y lo trocea a ConsensusChunkSize sobre esos bytes.
 * Asi que el guard tiene que medir los mismos bytes. Medir otra cosa hace que
 * el guard y el juez discrepen, y la discrepancia es exactamente el fallo que
 * el tope existe para evitar: con 2 chunks, el SpecIntent escrito sobre el
 * todo se aplica a fragmentos y el juez reporta neutral o contradiccion que es
 * artefacto del troceado.
 *
 * MEDIDO: con core.autocrlf=true y sin .gitattributes, seis documentos caian
 * en la banda de divergencia. El guard los decia "un chunk" (4042 B en LF) y
 * el juez los troceaba en dos (4149 B en CRLF). Un documento con el veredicto
 * neutral por una causa que no era del documento.
 *
 * ASI QUE: aqui NO se normaliza. La independencia del checkout se consigue
 * FIJANDO los finales de linea (.gitattributes con eol=lf), no escondiendo la
 * diferencia aqui. Normalizar en este punto fue el error: hacia el guard
 * checkout-independiente y lo dejaba mintiendo sobre lo que el juez ve.
 * El content-guard tiene una comprobacion de CRLF para que la divergencia no
 * pueda volver en silencio.
 */
function artifactBytes(rel) {
  try {
    return readFileSync(join(root, rel)).length;
  } catch {
    return null;
  }
}

/**
 * EL CONTEO DECLARADO, CONTRA EL MEDIDO.
 *
 * El numero de unidades juzgables que publica la superficie sale de este
 * guard, asi que este guard es quien puede decir si el declarado y el medido
 * son el mismo numero. Sin esta comprobacion, anadir un documento al
 * presupuesto deja la superficie publicando un numero que ya no existe, y
 * solo lo nota el verificador del estado, que corre mas tarde y en otro
 * paso de la CI.
 *
 * Y esto no es hipotetico: pasa cada vez que se anade un documento al
 * conjunto juzgable. Tres veces en un dia, y las tres las atrapo la CI.
 */
/**
 * LAS PARTES DE UN ARTEFACTO.
 *
 * LA REGLA (decision del operador, 2026-10-27). La partida es SOLO para el
 * juez. En el repositorio el documento es UNO, entero: partirlo ahi obligaba a
 * recortar la prosa de otros documentos para que un indice quepa, y producia
 * un arbol de archivos que existen solo por un tope de bytes. Ahora el
 * documento se queda entero, el juez ve sus partes, y un script las recompone
 * y las verifica contra el original.
 *
 * ASI QUE LO QUE MIDE ESTE GUARD es la parte mas grande que veria el juez, no
 * el archivo. Un archivo de 5000 B que se parte en dos de 2500 B es legal: lo
 * que el juez resuelve son las partes.
 */
function partesDe(rel) {
  const abs = join(root, rel);
  const bytes = artifactBytes(rel);
  try {
    const texto = readFileSync(abs, 'utf8');
    const partes = partir(texto, BUDGET, extname(abs));
    const mayor = Math.max(...partes.map((p) => Buffer.byteLength(p.texto, 'utf8')));
    return { partes: partes.length, mayor, error: null };
  } catch (e) {
    // Un concepto que solo no cabe: el problema es del documento.
    return { partes: 1, mayor: bytes ?? 0, error: e.codigo || 'E_LEER' };
  }
}

function declaradoUnidades() {
  const p = join(root, 'vibe-tools', 'estado.json');
  try {
    const j = JSON.parse(readFileSync(p, 'utf8'));
    const n = Number(j?.kpis?.unidades_juzgables);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function main() {
  const present = ROOTS.filter((r) => {
    try { return statSync(join(root, r)).isDirectory(); } catch { return false; }
  });
  const faltantes = ROOTS.filter((r) => !present.includes(r));

  const files = present.flatMap((r) => walk(join(root, r)))
    .concat(ALSO_FILES.filter((f) => artifactBytes(f) !== null).map((f) => join(root, f)));
  const rows = files
    .map((f) => {
      const path = relative(root, f).replace(/\\/g, '/');
      const bytes = artifactBytes(path);
      return { path, bytes, ...partesDe(path) };
    })
    .sort((a, b) => b.mayor - a.mayor);
  const over = rows.filter((r) => r.mayor > BUDGET || r.error);

  // El declarado, contra el medido. Si no coinciden, la superficie publica
  // un numero que no existe, y eso se cae aqui, no tres pasos despues.
  const unidades = rows.reduce((a, r) => a + r.partes, 0);
  const declarado = declaradoUnidades();
  const conteoDescuadrado = declarado !== null && declarado !== unidades;

  // Modo JSON: la superficie publica necesita estos numeros en forma
  // MACHINE-READABLE, no parseando prosa. Un guard que hay que leer con
  // regexp es un guard que se rompe en silencio el dia que cambia el formato
  // de su salida. La salida humana no cambia; esta es una via adicional.
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({
      presupuesto: BUDGET,
      unidades,
      archivos: rows.length,
      declaradas: declarado,
      exceden: over.length,
      sobre_el_tope: over.map((r) => ({ ruta: r.path, bytes: r.bytes, mayor: r.mayor, error: r.error ?? null })),
    }));
    if (over.length > 0) process.exit(1);
    if (conteoDescuadrado) {
      console.error(`\n  EL CONTEO DECLARADO NO ES EL MEDIDO: declarado ${declarado}, medido ${unidades}`);
      console.error('  Actualiza vibe-tools/estado.json (kpis.unidades_juzgables) y regenera la superficie.\n');
      process.exit(1);
    }
    return;
  }

  console.log(`\n=== GATE BUDGET · ${BUDGET} B por unidad juzgable ===\n`);
  for (const r of rows) {
    const pct = ((r.mayor / BUDGET) * 100).toFixed(0);
    const bar = '#'.repeat(Math.min(40, Math.round((r.mayor / BUDGET) * 40)));
    const flag = r.mayor > BUDGET ? ' EXCEDE' : '        ';
    const partes = r.partes > 1 ? ` ${r.partes} partes` : '';
    console.log(`  ${flag} ${String(r.mayor).padStart(6)} B ${String(pct).padStart(4)}%  ${bar.padEnd(40)} ${r.path}${partes}`);
  }

  console.log(`\n  ${unidades} unidades juzgables (partes) en ${rows.length} archivos · ${over.length} exceden el presupuesto`);

  console.log('\n  NO juzgables (clasificacion explicita, no silenciosa):');
  for (const [p, motivo] of NO_JUZGABLE) {
    const b = artifactBytes(p);
    console.log(`    - ${p}${b === null ? '' : ` (${b} B)`}  <-  ${motivo}`);
  }
  if (faltantes.length > 0) {
    console.log(`\n  AVISO: raices declaradas que no existen: ${faltantes.join(', ')}`);
  }

  if (over.length > 0) {
    console.log('\n  Para cruzar el tope hay que PARTIR POR CONCEPTO, no subir el limite.');
    console.log('  Un concepto que no cabe solo se dice: partirlo por bytes seria amputar.');
    for (const r of over) {
      console.log(`    - ${r.path} (${r.bytes} B, parte mayor ${r.mayor} B${r.error ? `, ${r.error}` : ''})`);
    }
    process.exit(1);
  }
  if (conteoDescuadrado) {
    console.error(`\n  EL CONTEO DECLARADO NO ES EL MEDIDO: declarado ${declarado}, medido ${unidades}`);
    console.error('  La superficie publica un numero que no existe. Actualiza');
    console.error('  vibe-tools/estado.json (kpis.unidades_juzgables) y regenera la superficie.\n');
    process.exit(1);
  }
  console.log('\n  OK: toda parte que ve el juez cabe en un solo chunk.');
  console.log(`  Y el conteo declarado (${declarado}) es el medido (${unidades}).`);
  console.log('  Los documentos siguen enteros: la partida es solo para el juez.\n');
}

main();
