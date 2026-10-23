/**
 * GATE BUDGET — enforcement de la decision del operador (opcion A).
 *
 * Ningun artefacto que se pase al gate de drift_judge puede superar
 * ConsensusChunkSize = 4096 bytes. Con ese tope el artefacto es UN chunk, el
 * SpecIntent aplica al artefacto completo, y el veredicto es decidible.
 *
 * (Fuente: internal/orchestration/drift_judge_consensus.go — ConsensusChunkSize)
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

const BUDGET = 4096;
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

const ROOTS = ['vibe-tools/src', 'docs/arquitectura/loops'];
const ALSO_FILES = ['vibe-tools/README.md'];
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
 * Tamano del artefacto tal como lo veria el juez: texto con finales de linea
 * normalizados a LF.
 *
 * HALLAZGO 2026-10-23. core.autocrlf=true y sin .gitattributes hacia que el MISMO
 * documento mida 4081 B con LF y 4169 B con CRLF: 88 bytes de retorno de carro,
 * uno por linea. Seis documentos que el repositorio tiene en verde se ponian en
 * rojo con solo hacer checkout, y la cifra de 67 unidades / 0 exceden del cierre
 * de L2 no se reproducia en un clon nuevo.
 *
 * Eso convierte el veredicto del guard en una propiedad del checkout y no del
 * documento, que es exactamente lo contrario de lo que un guard debe ser.
 *
 * Y el conteo estaba mal por si mismo: ConsensusChunkSize mide el texto que
 * chunk-ea, y un CR es espacio en blanco para el juez. Contarlo contra un
 * presupuesto de fidelidad no tiene sentido.
 */
function artifactBytes(rel) {
  try {
    const text = readFileSync(join(root, rel), 'utf8').replace(/\r\n/g, '\n');
    return Buffer.byteLength(text, 'utf8');
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
    .map((f) => ({ path: relative(root, f).replace(/\\/g, '/'), bytes: artifactBytes(relative(root, f).replace(/\\/g, '/')) }))
    .sort((a, b) => b.bytes - a.bytes);
  const over = rows.filter((r) => r.bytes > BUDGET);

  console.log(`\n=== GATE BUDGET · ${BUDGET} B por unidad juzgable ===\n`);
  for (const r of rows) {
    const pct = ((r.bytes / BUDGET) * 100).toFixed(0);
    const bar = '#'.repeat(Math.min(40, Math.round((r.bytes / BUDGET) * 40)));
    const flag = r.bytes > BUDGET ? ' EXCEDE' : '        ';
    console.log(`  ${flag} ${String(r.bytes).padStart(6)} B ${String(pct).padStart(4)}%  ${bar.padEnd(40)} ${r.path}`);
  }

  console.log(`\n  ${rows.length} unidades juzgables · ${over.length} exceden el presupuesto`);

  console.log('\n  NO juzgables (clasificacion explicita, no silenciosa):');
  for (const [p, motivo] of NO_JUZGABLE) {
    const b = artifactBytes(p);
    console.log(`    - ${p}${b === null ? '' : ` (${b} B)`}  <-  ${motivo}`);
  }
  if (faltantes.length > 0) {
    console.log(`\n  AVISO: raices declaradas que no existen: ${faltantes.join(', ')}`);
  }

  if (over.length > 0) {
    console.log('\n  Para cruzar el tope hay que PARTIR el artefacto por concepto, no subir el limite.');
    for (const r of over) console.log(`    - ${r.path} (${r.bytes} B, +${r.bytes - BUDGET} sobre el tope)`);
    process.exit(1);
  }
  console.log('\n  OK: todo artefacto juzgable cabe en un solo chunk.\n');
}

main();