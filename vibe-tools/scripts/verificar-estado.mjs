/**
 * VERIFICADOR DEL ESTADO PUBLICADO.
 *
 * QUE ES. El guard que impide que la superficie publica envejezca en
 * silencio. Declara lo que el repo afirma sobre si mismo y lo CONTRASTA contra
 * la realidad medida. Si un numero no cuadra, sale con error.
 *
 * POR QUE EXISTE. El README del paquete decia «Siguiente: L3» cuando L3 ya
 * estaba cerrado y validado, y decia 67 unidades juzgables cuando eran 77.
 * Dos numero falsos, ninguno detectado, porque no habia nada que los mirara.
 * Este archivo es ese algo.
 *
 * QUE VERIFICA, Y COMO
 *   1. Los KPI declarados contra la realidad medida: tests, mutantes,
 *      paquetes, unidades juzgables, presupuesto. Se mide de verdad, no se
 *      lee de un archivo: `node --test` con informe TAP, el runner de
 *      mutacion en modo --json, y el guard de presupuesto en modo --json.
 *   2. El reparto de tests por prefijo, y que cuadre con el total.
 *   3. Que cada loop declarado cerrado tenga su documento de cierre en disco.
 *   4. Que la fecha de actualizacion no sea anterior al ultimo commit que
 *      toco la fuente: si el estado cambio y la fecha no, esto falla.
 *   5. Que la superficie generada cuadre con la fuente, delegando en el
 *      generador en modo --check.
 *
 * LO QUE NO VERIFICA. Que el veredicto del juez sea el que dice el archivo:
 * ese vive en la base de dark-memory, no en el repo, y por eso se cita como
 * declaracion y no se re-deriva. Tampoco verifica la vision: verifica que su
 * hueco siga declarado, que es lo unico que se puede hacer sin inventarla.
 *
 * USO: node scripts/verificar-estado.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const estado = JSON.parse(readFileSync(join(root, 'vibe-tools', 'estado.json'), 'utf8'));
const k = estado.kpis;
const problemas = [];

/**
 * El runner imprime su informe humano y, en medio, la linea JSON. Se busca
 * por su forma y no por su posicion: pedir la ultima linea fue un bug que
 * costo una corrida entera.
 */
function jsonDe(salida) {
  for (const linea of String(salida).split(String.fromCharCode(10))) {
    const t = linea.trim();
    if (!t.startsWith(String.fromCharCode(123))) continue;
    try { return JSON.parse(t); } catch { /* no es la linea que buscamos */ }
  }
  throw new Error(String(salida).slice(0, 300));
}
function medir(comando, args) {
  try {
    return execFileSync(comando, args, { cwd: join(root, 'vibe-tools'), encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  } catch (e) {
    // El runner de mutacion sale con codigo 1 cuando el verificador esta
    // DEBIL: hay mutantes que sobreviven. Eso no es un fallo de la medicion:
    // es el dato que hay que leer. Se lee su salida igual, y el contraste de
    // abajo es el que decide.
    if (e.stdout) return e.stdout;
    throw e;
  }
}

function comparar(etiqueta, declarado, medido) {
  if (declarado !== medido) {
    problemas.push(`${etiqueta}: declarado ${JSON.stringify(declarado)}, medido ${JSON.stringify(medido)}`);
  }
  return declarado === medido;
}

// 1. PRESUPUESTO. El guard de presupuesto en modo --json.
const presupuesto = jsonDe(medir('node', ['tools/gate-budget.mjs', '--json']));
comparar('unidades juzgables', k.unidades_juzgables, presupuesto.unidades);
comparar('unidades que exceden', k.unidades_exceden, presupuesto.exceden);
comparar('presupuesto en bytes', k.presupuesto_bytes, presupuesto.presupuesto);

// 2. TESTS. Informe TAP: el resumen es estable y los subtests de primer nivel
//    dan el reparto por prefijo.
if (!existsSync(join(root, 'vibe-tools', 'dist', 'test'))) {
  console.error('\n  falta vibe-tools/dist: corre `npm run build` antes de verificar\n');
  process.exit(2);
}
const tap = medir('node', ['--test', '--test-reporter=tap', 'dist/test/*.test.js']);
const num = (re) => {
  const m = tap.match(re);
  return m ? Number(m[1]) : null;
};
comparar('tests totales', k.tests_total, num(/^# tests (\d+)$/m));
comparar('tests que pasan', k.tests_pasan, num(/^# pass (\d+)$/m));
comparar('tests que fallan', k.tests_fallan, num(/^# fail (\d+)$/m));

const porPrefijo = {};
for (const m of tap.matchAll(/^# Subtest: (\S+)/gm)) {
  const prefijo = m[1].match(/^(L\d+|P)/)?.[0] ?? 'otros';
  porPrefijo[prefijo] = (porPrefijo[prefijo] ?? 0) + 1;
}
for (const [prefijo, cuenta] of Object.entries(k.tests_por_prefijo)) {
  comparar(`tests con prefijo ${prefijo}`, cuenta, porPrefijo[prefijo] ?? 0);
}
const suma = Object.values(k.tests_por_prefijo).reduce((a, b) => a + b, 0);
comparar('suma del reparto por prefijo', k.tests_total, suma);

// 3. MUTANTES. El runner en modo --json.
const mut = jsonDe(medir('node', ['tools/mutation/run.mjs', '--json']));
comparar('mutantes totales', k.mutantes_total, mut.mutantes);
comparar('mutantes muertos', k.mutantes_muertos, mut.muertos);
comparar('mutantes que sobreviven', k.mutantes_sobrevivientes, mut['sobrevivientes']);
comparar('mutantes por paquete', k.mutantes_paquetes, mut.paquetes);
comparar('mutantes sin aplicar', 0, mut.no_aplicable);
comparar('score de mutacion', k.mutantes_score, mut.score);

// 4. DECLARACIONES DE LOS LOOPS. Un loop cerrado sin documento de cierre es
//    una afirmacion sin respaldo en el repo.
const cerrados = estado.loops.filter((l) => l.estado === 'cerrado');
comparar('loops cerrados', k.loops_cerrados, cerrados.length);
for (const l of cerrados) {
  if (!l.documento_cierre || !existsSync(join(root, l.documento_cierre))) {
    problemas.push(`loop ${l.id}: dice estar cerrado pero su documento de cierre no existe: ${l.documento_cierre}`);
  }
  if (!l.indice || !existsSync(join(root, l.indice))) {
    problemas.push(`loop ${l.id}: su indice no existe: ${l.indice}`);
  }
}

// 5. LA FECHA. Si el estado cambio, la fecha tiene que haber cambiado. Se
//    compara contra el ultimo commit que toco la fuente.
try {
  const ultimo = execFileSync('git', ['log', '-1', '--format=%cs', '--', 'vibe-tools/estado.json'], {
    cwd: root, encoding: 'utf8',
  }).trim();
  if (ultimo && ultimo > String(estado.proyecto.actualizado)) {
    problemas.push(`la fuente cambio el ${ultimo} pero 'actualizado' sigue en ${estado.proyecto.actualizado}`);
  }
} catch {
  // Sin git no hay fecha que contrastar: no se inventa un fallo.
}

// 6. LA SUPERFICIE. El generador en modo --check dice si lo publicado
//    cuadra con la fuente.
try {
  execFileSync('node', ['scripts/generar-estado.mjs', '--check'], { cwd: join(root, 'vibe-tools'), stdio: 'pipe' });
} catch (e) {
  problemas.push('la superficie publicada no cuadra con la fuente: ' + (e.stderr?.toString() ?? '').trim().split('\n').filter(Boolean).join(' | '));
}

// 7. LA VISION. No se verifica que sea buena: se verifica que su hueco siga
//    declarado, para que no se pierda en una regeneracion.
const readme = existsSync(join(root, 'README.md')) ? readFileSync(join(root, 'README.md'), 'utf8') : '';
const visionPendiente = estado.vision.estado === 'pendiente-del-operador';
if (visionPendiente && !readme.includes('PENDIENTE DEL OPERADOR')) {
  problemas.push('la vision sigue pendiente y el README ya no lo declara: el hueco se perdio');
}
if (!visionPendiente && readme.includes('PENDIENTE DEL OPERADOR')) {
  // El caso inverso, que es el que se puede dar sin querer: la vision se
  // confirma, el README se regenera, y el hueco se queda escrito porque nadie
  // lo quito. Un README que dice «aqui no hay nada todavia» cuando ya hay,
  // es una pagina desactualizada, y es justo lo que este guard evita.
  problemas.push('la vision ya esta confirmada y el README sigue declarando el hueco: el README se quedo atras');
}

if (problemas.length > 0) {
  console.error('\n=== EL ESTADO PUBLICADO NO CUADRA CON LA REALIDAD ===\n');
  for (const p of problemas) console.error(`  x ${p}`);
  console.error(`\n  ${problemas.length} discrepancia(s). La superficie publica no se publica con numeros falsos.\n`);
  process.exit(1);
}

console.log(`\n=== ESTADO PUBLICADO: VERIFICADO ===\n`);
console.log(`  tests        ${k.tests_pasan}/${k.tests_total}, ${k.tests_fallan} fallos`);
console.log(`  reparto      ${Object.entries(k.tests_por_prefijo).map(([p, c]) => `${p} ${c}`).join(' · ')}`);
console.log(`  mutantes     ${k.mutantes_muertos}/${k.mutantes_total} en ${k.mutantes_paquetes} paquetes`);
console.log(`  presupuesto  ${k.unidades_juzgables} unidades, ${k.unidades_exceden} exceden`);
console.log(`  loops        ${cerrados.length} cerrados, cada uno con su documento`);
console.log(`  superficie   al dia\n`);
