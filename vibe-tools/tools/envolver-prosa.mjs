/**
 * Envuelve la prosa larga al ancho de lectura.
 *
 * QUE ES. Una linea de prosa de 259 caracteres se lee mal en un editor y mal
 * en un diff: el diff entero aparece como una sola linea cambiada, y el
 * revisor no ve que cambio. Con la prosa envuelta, el diff muestra la frase.
 *
 * LA CONVENCION, MEDIDA. En los documentos del repositorio, la mediana de la
 * linea de prosa es 32 caracteres y el percentil 90 es 81. O sea: la
 * convencion de envoltura del repo es de unos 80. Y hay 183 lineas que la
 * incumplen.
 *
 * LO QUE NO TOCA, Y POR QUE.
 *   - Bloques de codigo: ahi la linea es parte del codigo.
 *   - Filas de tabla: partir una fila la rompe, y una tabla con celdas largas
 *     es legitima.
 *   - Listas y citas: tienen su propia estructura de continuacion.
 *   - Titulos: no se envuelven.
 *   - Lineas con codigo en linea o con enlaces: partir por ahi parte el
 *     enlace o el codigo, y un enlace roto es un defecto.
 * Eso deja un resto que NO se envuelve, y se reporta: es honesto decir
 * «esto no lo he tocado y esto es lo que queda» en vez de romper algo.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = 'C:/Users/nicou/Documents/IA/opita-code';
const ANCHO = 100;
const SKIP = new Set(['node_modules', 'dist', '.git', 'guard-fixtures']);

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e)) continue;
    const f = join(dir, e);
    if (statSync(f).isDirectory()) walk(f, acc);
    else acc.push(f);
  }
  return acc;
}

function envolver(texto) {
  const lineas = texto.split('\n');
  const salida = [];
  let enFence = false;
  let envueltas = 0;
  let sinTocar = 0;

  for (const linea of lineas) {
    if (/^\s*```/.test(linea)) { enFence = !enFence; salida.push(linea); continue; }
    const trim = linea.trim();
    const esProsa = !enFence
      && linea.length > ANCHO
      && !/^\s*[|>#*-]/.test(linea)
      && !/^\s*\[[^\]]+\]:/.test(linea)
      && !linea.includes('`')
      && !linea.includes('](')
      && !linea.includes('http');
    if (!esProsa) {
      if (!enFence && linea.length > ANCHO && trim && !/^\s*[|>#*-]/.test(linea)) sinTocar++;
      salida.push(linea);
      continue;
    }
    // Se parte por palabras, sin partir una palabra.
    const palabras = linea.split(/\s+/);
    let actual = '';
    for (const palabra of palabras) {
      if (!actual) { actual = palabra; continue; }
      if (actual.length + 1 + palabra.length <= ANCHO) { actual += ' ' + palabra; continue; }
      salida.push(actual);
      actual = palabra;
    }
    if (actual) salida.push(actual);
    envueltas++;
  }
  return { texto: salida.join('\n'), envueltas, sinTocar };
}

let totalEnvueltas = 0;
let totalSinTocar = 0;
const tocados = [];
for (const f of walk(root)) {
  if (!f.endsWith('.md')) continue;
  const original = readFileSync(f, 'utf8');
  const r = envolver(original);
  if (r.envueltas > 0) {
    writeFileSync(f, r.texto);
    totalEnvueltas += r.envueltas;
    totalSinTocar += r.sinTocar;
    tocados.push(`${f.replace(/\\/g, '/').split('/opita-code/')[1]}: ${r.envueltas} envueltas, ${r.sinTocar} sin tocar`);
  }
}
console.log(`\n  lineas envueltas: ${totalEnvueltas}`);
console.log(`  lineas largas que no se tocan (codigo en linea, enlaces, tablas): ${totalSinTocar}`);
console.log(`  documentos tocados: ${tocados.length}\n`);
for (const t of tocados.slice(0, 12)) console.log('    ' + t);
