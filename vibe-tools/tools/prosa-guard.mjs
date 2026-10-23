/**
 * PROSA GUARD — la calidad de lo que esta escrito, que es distinta de que
 * este estructuralmente entero.
 *
 * POR QUE ESTE GUARD, Y POR QUE SEPARADO DEL DE CONTENIDO.
 * El content-guard mira la FORMA: intrusion de guion, marcadores, tablas,
 * enlaces, CRLF. Este mira la CALIDAD: el registro con el que se habla, los
 * caracteres que no se ven, las palabras repetidas, las lineas que no se
 * leen.
 *
 * ORIGEN (medido, 2026-10-23). Al medir el repositorio con elGate de
 * contenido, aparecieron cosas que ese guard no puede ver:
 *   3 palabras repetidas ("esta esta", "que que", "no no")
 *   98 archivos sin salto de linea final
 *   1 documento con dos H1
 *   2 saltos de nivel de encabezado (h1 -> h3)
 *   1 bloque de tres lineas en blanco
 *   9 formas de voseo (8 en la propia lista de este guard)
 * Ninguna la ve el guard de contenido, y todas rompen la lectura.
 *
 * LA REGLA DE REGISTRO, Y POR QUE ES DEL OPERADOR.
 * Español tuteado, nunca voseo. «vos», «tenés», «podés» no son errores de
 * estilo: son otro registro, y mezclarlos en un mismo documento hace que el
 * lector no sepa quien le esta hablando. La forma «usted» NO se marca: es
 * registro formal legitimo, y el documento legal lo usa.
 *
 * EL INGLES, Y POR QUE LA LISTA ES CORTA.
 * La primera version de esta comprobacion marcaba 2220 lugares, porque el
 * repositorio habla ingles tecnico a proposito: tool, test, gate, build,
 * run, hash, scope, spec, bug, commit, push, draft, workflow. Marcar eso es
 * ruido, y un guard que grita por lo legitimo se aprende a silenciar.
 * La lista es de palabras inglesas que NO son vocabulario tecnico de este
 * repositorio, y que aparecen cuando una frase se corrompe: «se judging
 * no se puede». Se midio contra el repo: 0 falsos positivos.
 *
 * LO QUE ESTE GUARD NO HACE.
 * No juzga si el texto dice la verdad (para eso esta el gate de drift).
 * No juzga si la frase esta bien escrita. Y no sabe de espanol: solo sabe
 * de formas, de caracteres y de una lista.
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

/** Formas de voseo. «usted» NO va: es registro formal legitimo. */
const VOSEO = [
  'vos', 'tenés', 'podés', 'querés', 'hacés', 'decís', 'sabés', 'pensás', 'hablás',
  'escribís', 'usás', 'entrás', 'salís', 'vivís', 'sentís', 'mirás', 'elegís', 'seguís',
  'cruzás', 'llegás', 'quedás', 'empezás', 'terminás', 'volvés', 'recibís', 'medís',
  'pedís', 'servís', 'partís', 'compartís', 'permitís', 'decidís', 'acertás', 'importás',
  'ayudás', 'comés', 'sos', 'vas', 'ponés', 'creés', 'leés', 'oís', 'reís', 'trabajás',
  'cambiás', 'dejás', 'dormís', 'bebés', 'venís', 'conseguís', 'entrás', 'vosotros',
  'vostras', 'vosotras',
];

/**
 * Palabras inglesas que no son vocabulario tecnico de este repositorio.
 * MEDIDO contra el repo entero: 0 falsos positivos con esta lista.
 */
const INGLES_NO_TECNICO = [
  'judging', 'judged', 'concentrate', 'taught', 'teaches', 'teaching',
  'abouted', 'fruitful', 'teach', 'making',
  'writes', 'writing', 'reads', 'reading', 'building', 'checks', 'checking',
  'survives', 'survived', 'failing', 'room',
];

/** Caracteres que no se ven y rompen la busqueda, el copiado y el diff. */
const INVISIBLES = [
  ['espacio de ancho cero', 0x200b], ['conector de ancho cero', 0x200c],
  ['unidor de ancho cero', 0x200d], ['marca bidireccional', 0x200e],
  ['anulacion bidireccional', 0x200f], ['separador de linea', 0x2028],
  ['separador de parrafo', 0x2029], ['espacio duro', 0x00a0],
  ['espacio duro angosto', 0x202f], ['guion blando', 0x00ad],
  ['BOM', 0xfeff], ['conector de palabra', 0x2060], ['espacio matematico', 0x205f],
  ['espacio ogham', 0x1680], ['cuadricula', 0x2000],
];

const LIMITE_LINEA = 100;

const PROSA_EXTS = new Set(['.md']);
const TEXTO_EXTS = new Set(['.md', '.ts', '.mjs', '.json', '.yml', '.html']);
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'guard-fixtures', 'prosa-fixtures']);

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const e of readdirSync(dir)) {
    if (SKIP_DIRS.has(e)) continue;
    const f = join(dir, e);
    if (statSync(f).isDirectory()) walk(f, acc);
    else acc.push(f);
  }
  return acc;
}

const reVoseo = new RegExp(`\\b(${VOSEO.join('|')})\\b`, 'gi');
const reIngles = new RegExp(`\\b(${INGLES_NO_TECNICO.join('|')})\\b`, 'gi');
const reRepetida = /\b([A-Za-záéíóúñÁÉÍÓÚÑ]{2,})\s+\1\b/gi;

function escanear(file) {
  // La severidad por defecto es error: un hallazgo sin severidad es un defecto.
  const rel = relative(root, file).replace(/\\/g, '/');
  const problemas = [];
  const severidad = (k, d, sev) => ({ at: k, kind: sev, detail: d });
  const texto = readFileSync(file, 'utf8');
  const ext = extname(file);
  const esProsa = PROSA_EXTS.has(ext);
  const lineas = texto.split('\n');

  if (TEXTO_EXTS.has(ext) && !texto.endsWith('\n')) {
    problemas.push({ at: rel, kind: 'sin salto final', detail: 'el archivo no termina en salto de linea' });
  }
  if (/\n{3,}/.test(texto)) {
    const n = (texto.match(/\n{3,}/g) || []).length;
    problemas.push({ at: rel, kind: 'lineas en blanco de mas', detail: `${n} bloque(s) de tres o mas lineas en blanco` });
  }

  let enFence = false;
  lineas.forEach((linea, i) => {
    const at = `${rel}:${i + 1}`;
    if (/^\s*```/.test(linea)) { enFence = !enFence; return; }
    if (TEXTO_EXTS.has(ext) && /\s$/.test(linea)) {
      problemas.push({ at, kind: 'espacio al final', detail: 'la linea termina en espacio' });
    }
    if (TEXTO_EXTS.has(ext) && /\t/.test(linea)) {
      problemas.push({ at, kind: 'tabulador', detail: 'la linea lleva un tabulador' });
    }
    for (const [nombre, cp] of INVISIBLES) {
      if (linea.includes(String.fromCharCode(cp))) {
        problemas.push({ at, kind: 'caracter invisible', detail: `${nombre}: no se ve, y rompe la busqueda y el copiado` });
      }
    }
    if (!esProsa || enFence) return;
    // Tablas y citas no se envuelven: una fila de tabla de 259 caracteres es
    // legible, y partirla la rompe.
    if (/^\s*[|>]/.test(linea)) return;
    // Se mide la PROSA, no la linea entera: una linea larga por un enlace o
    // por un codigo en linea no es un defecto de lectura. La longitud esta en
    // el enlace, no en la frase.
    const prosa = linea
      .replace(/`[^`]*`/g, '``')
      .replace(/\[[^\]]*\]\([^)]*\)/g, '[]()')
      .replace(/https?:\/\/\S+/g, 'url');
    if (prosa.length > LIMITE_LINEA) {
      // AVISO, y no error. La deuda esta medida y es real: la convencion del
      // repositorio es de unos 80 caracteres (percentil 90 medido: 81), y hay
      // lineas que no la cumplen. Pero reenvolverlas cambia el sha de unos
      // cuarenta documentos y deja sus veredictos obsoletos, y eso es una
      // unidad de trabajo con su decision, no un cambio de paso. El guard lo
      // dice y lo cuenta, en vez de callarlo.
      problemas.push({ at, kind: 'linea larga', severidad: 'aviso', detalle: `${prosa.length} caracteres de prosa, y el limite de lectura es ${LIMITE_LINEA}` });
    }
    const v = linea.match(reVoseo);
    if (v) {
      problemas.push({ at, kind: 'voseo', detail: `${[...new Set(v.map((x) => x.toLowerCase()))].join(', ')}: el registro es tuteado, no voseado` });
    }
    const ing = linea.match(reIngles);
    if (ing) {
      problemas.push({ at, kind: 'ingles no tecnico', detail: `${[...new Set(ing.map((x) => x.toLowerCase()))].join(', ')}: ingles que no es vocabulario tecnico del repo` });
    }
    const rep = linea.match(reRepetida);
    if (rep) {
      problemas.push({ at, kind: 'palabra repetida', detail: `${[...new Set(rep.map((x) => x.toLowerCase()))].join(', ')}` });
    }
  });

  if (esProsa) {
    const h1 = lineas.filter((l) => /^# /.test(l));
    if (h1.length > 1) {
      problemas.push({ at: rel, kind: 'H1 duplicado', detail: `${h1.length} titulos de primer nivel` });
    }
    let anterior = 1;
    lineas.forEach((linea, i) => {
      const m = linea.match(/^(#{1,6}) /);
      if (!m) return;
      const nivel = m[1].length;
      if (nivel > anterior + 1) {
        problemas.push({ at: `${rel}:${i + 1}`, kind: 'salto de nivel', detail: `de h${anterior} a h${nivel}` });
      }
      anterior = nivel;
    });
  }
  return problemas;
}

function main() {
  const override = process.argv[2];
  const roots = override
    ? override.split(',').map((d) => (/^([A-Za-z]:[\\/]|[\\/])/.test(d) ? d : join(root, d)))
    : ['docs', 'vibe-tools', '.github', 'site'].map((d) => join(root, d));
  for (const d of roots) {
    if (!existsSync(d)) {
      console.error(`\n  RUTA INEXISTENTE: ${d}\n`);
      process.exit(2);
    }
  }
  const files = roots.flatMap((d) => (statSync(d).isDirectory() ? walk(d) : [d]))
    .filter((f) => TEXTO_EXTS.has(extname(f)));
  const todos = files.flatMap(escanear);
  const errores = todos.filter(p => p.severidad !== 'aviso');
  const avisos = todos.filter(p => p.severidad === 'aviso');
  const porClase = new Map();
  for (const p of errores) {
    if (!porClase.has(p.kind)) porClase.set(p.kind, []);
    porClase.get(p.kind).push(p);
  }
  console.log(`\n=== PROSA GUARD · ${files.length} archivos ===\n`);
  if (errores.length === 0) {
    console.log('  OK: sin voseo, sin caracteres invisibles, sin palabras repetidas,');
    console.log('  sin titulos duplicados, sin saltos de nivel y con el salto final.\n');
  } else {
    for (const [kind, rows] of [...porClase.entries()].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${String(rows.length).padStart(4)} × ${kind}`);
      for (const p of rows.slice(0, 8)) console.log(`        ${p.at}  ${p.detail}`);
      if (rows.length > 8) console.log(`        … y ${rows.length - 8} más`);
    }
    console.log(`\n  ${errores.length} hallazgos en ${files.length} archivos. Son defectos, no dudas.\n`);
  }
  if (avisos.length > 0) {
    console.log(`  ${String(avisos.length).padStart(4)} × linea larga (AVISO, no bloquea)`);
    console.log('        deuda declarada: la convencion del repo es de unos 80 caracteres');
    console.log('        (percentil 90 medido: 81) y hay lineas que no la cumplen.');
    console.log('        Rewrapperlas cambia el sha de los documentos afectados y deja sus');
    console.log('        veredictos obsoletos: es una unidad de trabajo con su decision.\n');
  }
  if (errores.length > 0) process.exit(1);
}

main();
