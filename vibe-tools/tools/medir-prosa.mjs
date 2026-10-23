/**
 * MEDICION: que hay hoy en el repo que un gate de prosa deberia cazar.
 * No se escribe una regla sin saber cuanto_costaria y cuantos falsos positivos
 * generaria.
 */
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = 'C:/Users/nicou/Documents/IA/opita-code';
const SKIP = new Set(['node_modules', 'dist', '.git']);
const EXT = new Set(['.md', '.ts', '.mjs', '.json', '.yml', '.html']);

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e)) continue;
    const f = join(dir, e);
    if (statSync(f).isDirectory()) walk(f, acc);
    else if (EXT.has(f.slice(f.lastIndexOf('.')))) acc.push(f);
  }
  return acc;
}

const files = walk(root).filter((f) => !f.includes('guard-fixtures') && !f.includes('prosa-fixtures'));

// VOSEO: formas de voseo. «vos» es la segunda persona del voseo; «usted» es
// la formal, y NO es voseo (el repo usa «tú», pero el documento legal puede
// usar «usted» legitimamente: por eso no se marca).
const VOSEO = [
  'vos', 'tenés', 'podés', 'querés', 'hacés', 'decís', 'sabés', 'pensás', 'hablás',
  'escribís', 'usás', 'entrás', 'salís', 'vivís', 'sentís', 'mirás', 'elegís', 'seguís',
  'cruzás', 'llegás', 'quedás', 'empezás', 'terminás', 'volvés', 'recibís', 'medís',
  'pedís', 'servís', 'partís', 'compartís', 'permitís', 'decidís', 'acertás', 'importás',
  'ayudás', 'comés', 'sos', 'vas', 'ponés', 'creés', 'leés', 'oís', 'reís', 'tenés',
  'trabajás', 'cambiás', 'dejás', 'dormís', 'oís', 'bebés', 'venís', 'conseguís',
  'vosotros', 'vostras', 'vosotras',
];

const INVISIBLES = [
  ['zero width space', 0x200b], ['zero width non-joiner', 0x200c], ['zero width joiner', 0x200d],
  ['bidi mark', 0x200e], ['bidi override', 0x200f], ['line separator', 0x2028],
  ['paragraph separator', 0x2029], ['non-breaking space', 0x00a0], ['narrow nbsp', 0x202f],
  ['soft hyphen', 0x00ad], ['BOM', 0xfeff], ['word joiner', 0x2060],
  ['mathematical space', 0x205f], ['ogham space', 0x1680], ['en quad', 0x2000],
];

const INGLES = [
  'judging', 'allowed', 'concentrate', 'taught', 'teaches', 'teaching', 'abouted',
  'fruitful', 'splits', 'versus', 'room', 'split', 'judge', 'judged', 'apply',
  'applied', 'holds', 'hold', 'makes', 'making', 'write', 'writes', 'writing',
  'reads', 'reading', 'build', 'builds', 'building', 'runs', 'running', 'check',
  'checks', 'checking', 'test', 'tests', 'testing', 'tool', 'tools', 'gate',
  'gates', 'bug', 'bugs', 'commit', 'commits', 'push', 'pushes', 'draft',
  'workflow', 'workflows', 'spec', 'specs', 'hash', 'scope', 'server', 'client',
  'token', 'tokens', 'target', 'targets', 'output', 'outputs', 'input', 'inputs',
  'default', 'defaults', 'valid', 'invalid', 'public', 'private', 'static',
  'dynamic', 'thread', 'threads', 'stack', 'value', 'values', 'state', 'states',
  'rule', 'rules', 'edge', 'edges', 'case', 'cases', 'loop', 'loops', 'mutant',
  'mutants', 'mutate', 'survive', 'survives', 'survivor', 'fails', 'failing',
];

const cuenta = {
  voseo: [], invisibles: [], repetidas: [], ingles: [], larga: [], trailing: [],
  tabs: [], backticks: [], sinnewline: [], h1dup: [], saltoNivel: [], blank3: [],
};

const VOSEO_RE = new RegExp('\\b(' + VOSEO.join('|') + ')\\b', 'gi');
const INGLES_RE = new RegExp('\\b(' + INGLES.join('|') + ')\\b', 'gi');
const REPETIDA_RE = /\b([A-Za-záéíóúñÁÉÍÓÚÑ]{2,})\s+\1\b/gi;

for (const f of files) {
  const rel = relative(root, f).replace(/\\/g, '/');
  const texto = readFileSync(f, 'utf8');
  const lineas = texto.split('\n');

  if (!texto.endsWith('\n')) cuenta.sinnewline.push(rel);
  if (/\n{3,}/.test(texto)) cuenta.blank3.push(rel);

  lineas.forEach((linea, i) => {
    const at = `${rel}:${i + 1}`;
    if (/\s$/.test(linea)) cuenta.trailing.push(at);
    if (/\t/.test(linea)) cuenta.tabs.push(at);
    if (linea.length > 100) cuenta.larga.push(`${at} (${linea.length})`);
    if ((linea.match(/`/g) || []).length % 2 === 1) cuenta.backticks.push(at);

    for (const [nombre, cp] of INVISIBLES) {
      if (linea.includes(String.fromCharCode(cp))) cuenta.invisibles.push(`${at} ${nombre}`);
    }
    const v = linea.match(VOSEO_RE);
    if (v) cuenta.voseo.push(`${at} ${[...new Set(v.map((x) => x.toLowerCase()))].join(',')}`);
    const r = linea.match(REPETIDA_RE);
    if (r) cuenta.repetidas.push(`${at} ${[...new Set(r.map((x) => x.toLowerCase()))].join(',')}`);
    const ing = linea.match(INGLES_RE);
    if (ing) cuenta.ingles.push(`${at} ${[...new Set(ing.map((x) => x.toLowerCase()))].join(',')}`);
  });

  const h1 = lineas.filter((l) => /^# /.test(l));
  if (h1.length > 1) cuenta.h1dup.push(`${rel} (${h1.length})`);
  let anterior = 1;
  lineas.forEach((linea, i) => {
    const m = linea.match(/^(#{1,6}) /);
    if (!m) return;
    const nivel = m[1].length;
    if (nivel > anterior + 1) cuenta.saltoNivel.push(`${rel}:${i + 1} (h${anterior} -> h${nivel})`);
    anterior = nivel;
  });
}

console.log('\n=== MEDICION DEL REPO (sin los corpus de fixtures) ===\n');
console.log(`  archivos analizados: ${files.length}\n`);
for (const [k, v] of Object.entries(cuenta)) {
  const n = v.length;
  const muestra = v.slice(0, 6).map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join('\n      ');
  console.log(`  ${k.padEnd(12)} ${String(n).padStart(4)}`);
  if (n) console.log(`      ${muestra}\n`);
}
