/**
 * COHERENCIA GUARD — las constantes declaradas, en todos los documentos.
 *
 * POR QUE EXISTE, Y QUE RESUELVE. El juez certifica cada parte por separado
 * y no ve el conjunto: medido el 2026-10-28, dos formulaciones de la
 * afirmacion ("este documento no se contradice a si mismo", y una factual
 * sobre el tope) dan el MISMO veredicto para un documento y para su version
 * contradicha. El juez no distingue una contradiccion de su ausencia.
 *
 * La capa determinista es la otra: los guards, que leen el documento y lo
 * contrastan con la fuente. Y aqui cabe una diferencia que lo cambia todo:
 *
 *   - Una CONSTANTE no envejece. El tope son 4096 B, y sera 4096 B manana.
 *     Medido en 121 documentos: 19 ocurrencias, 19 correctas, 0 falsos
 *     positivos. Una regla sobre constantes se puede aplicar a TODO.
 *   - Un CONTADOR envejece. "105 mutantes" es cierto en su loop y falso hoy.
 *     Medido: extender esas reglas a todos los documentos da 27 falsos
 *     positivos, y los 27 son registros historicos. Por eso los contadores
 *     NO se comprueban aqui: se comprueban en el kit del canal, que es lo
 *     que se publica, y se declara que no se miran.
 *
 * QUE ES UNA CONSTANTE. Un numero que la fuente declara y que no cambia:
 * hoy, `kpis.presupuesto_bytes`. Y aparece en la prosa con un ANCLA ("el
 * tope", "el limite", "excede", "supera", ...) que lo convierte en una
 * declaracion del tope. Sin ancla, "4249 B" (el README que hubo) es un
 * tamano historico, no una afirmacion sobre el tope, y el guard no lo toca.
 *
 * QUE NO VE, Y POR QUE ESTA DICHO AQUI.
 *   - No ve las contradicciones sobre lo que nadie declaro. Si dos partes
 *     discrepan sobre una idea que no es un numero declarado, aqui no se
 *     nota: el guard no lee ideas.
 *   - No ve los contadores en los registros historicos, y a proposito.
 *   - No ve lo que la prosa no nombra con las palabras del ancla.
 *   - No mide nada: contrasta lo que ya existe contra lo que ya existe.
 *
 * USO
 *   node tools/coherencia-guard.mjs
 *   node tools/coherencia-guard.mjs --json
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

/** Donde vive la fuente de las constantes. */
const FUENTE = join(root, 'vibe-tools', 'estado.json');

/** Los documentos que se miran: los juzgables y los transversales. */
const ROOTS = ['vibe-tools/src', 'vibe-tools/db', 'docs/arquitectura/loops', 'docs/avances', 'docs/canal'];
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
];
const EXTS = new Set(['.ts', '.md', '.sql']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);

/**
 * EL ANCLA. Una palabra que convierte al numero que viene despues en una
 * declaracion del tope. Sin ancla, cualquier tamano historico seria un
 * falso positivo, y ese fue el motivo de medir antes de escribir esto.
 */
export const ANCLA_TOPE =
  /(?:tope|l[ií]mite|presupuesto|budget|exced\w+|supera\w*|sigue siendo|pasa de|guard de|ConsensusChunkSize)[^.\n]{0,40}?(\d{3,5})\s*(?:B\b|bytes\b|por\b|del\b|\.|,|$)/gi;

/**
 * Las ocurrencias del tope que dice un texto, con su linea.
 *
 * `esperado` es el valor de la fuente: 4096. Devuelve todas las
 * declaraciones que se encontraron y cuales no coinciden.
 */
export function revisar(texto, esperado) {
  const hallazgos = [];
  const lineas = texto.split('\n');
  lineas.forEach((linea, i) => {
    ANCLA_TOPE.lastIndex = 0;
    let m;
    while ((m = ANCLA_TOPE.exec(linea)) !== null) {
      hallazgos.push({
        linea: i + 1,
        numero: Number(m[1]),
        coincide: Number(m[1]) === esperado,
        contexto: m[0].replace(/\s+/g, ' ').trim().slice(0, 80),
      });
    }
  });
  return {
    hallazgos,
    comparadas: hallazgos.length,
    malas: hallazgos.filter((h) => !h.coincide),
  };
}

/** Los archivos que se miran. */
export function archivos() {
  const acc = [];
  const walk = (dir) => {
    if (!statSync(dir, { throwIfNoEntry: false })?.isDirectory?.()) return;
    for (const e of readdirSync(dir)) {
      if (SKIP_DIRS.has(e)) continue;
      const full = join(dir, e);
      if (statSync(full).isDirectory()) walk(full);
      else if (EXTS.has(full.slice(full.lastIndexOf('.')))) acc.push(full);
    }
  };
  for (const r of ROOTS) walk(join(root, r));
  for (const f of ALSO_FILES) {
    const full = join(root, f);
    if (statSync(full, { throwIfNoEntry: false })?.isFile?.()) acc.push(full);
  }
  return acc;
}

/** La corrida completa: mide y devuelve el resumen. */
export function correr() {
  const fuente = JSON.parse(readFileSync(FUENTE, 'utf8'));
  const esperado = fuente.kpis.presupuesto_bytes;
  const lista = archivos();
  let comparadas = 0;
  const fallos = [];
  for (const abs of lista) {
    const r = revisar(readFileSync(abs, 'utf8'), esperado);
    comparadas += r.comparadas;
    for (const m of r.malas) {
      fallos.push({ archivo: relative(root, abs).replace(/\\/g, '/'), ...m, esperado });
    }
  }
  return { esperado, archivos: lista.length, comparadas, fallos };
}

function main() {
  const json = process.argv.includes('--json');
  const r = correr();
  if (json) {
    console.log(JSON.stringify(r, null, 1));
    process.exit(r.fallos.length ? 1 : 0);
  }
  console.log(`\n=== COHERENCIA GUARD · las constantes declaradas, en ${r.archivos} documentos ===\n`);
  console.log(`  el tope declarado en la fuente: ${r.esperado} B`);
  console.log(`  declaraciones del tope encontradas y contrastadas: ${r.comparadas}`);
  if (r.fallos.length === 0) {
    console.log('  OK: toda declaracion del tope coincide con la fuente.\n');
    console.log('  LO QUE ESTE GUARD NO VE:');
    console.log('    - las contradicciones sobre lo que nadie declaro: no lee ideas;');
    console.log('    - los contadores en los registros historicos, a proposito:');
    console.log('      un contador envejece y un registro con la cifra de su dia es fiel;');
    console.log('    - lo que la prosa no nombra con las palabras del ancla.\n');
    return;
  }
  console.log(`\n  ${r.fallos.length} declaracion(es) del tope NO coinciden con la fuente:\n`);
  for (const f of r.fallos) {
    console.log(`    ${f.archivo}:${f.linea}  dice ${f.numero}, la fuente dice ${f.esperado}`);
    console.log(`      «${f.contexto}»`);
  }
  console.log('\n  Un numero del tope que no es el del tope es una contradiccion.');
  console.log('  La capa del juez no la ve: el veredicto no se movio al mutar el numero.\n');
  process.exit(1);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  main();
}
