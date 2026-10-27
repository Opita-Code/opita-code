/**
 * LAS PARTES QUE VE EL JUEZ: partir por concepto, y recomponer el completo.
 *
 * QUE ES. El juez resuelve un artefacto de hasta 4096 B (ConsensusChunkSize).
 * Uno mas largo se lo trocea el proveedor por bytes, y el SpecIntent escrito
 * sobre el todo se aplica a fragmentos: el veredicto es entonces neutral o
 * contradiccion que es artefacto del troceado, no del documento.
 *
 * LA DECISION DEL OPERADOR (2026-10-27). La partida es SOLO para el juez. En el
 * repositorio el documento es UNO, entero, con su prosa completa; la partida
 * ocurre en el momento de juzgarse, y un script recompone el completo y lo
 * verifica contra el original. Si las partes no dan el original byte a byte, no
 * hay veredicto que valga.
 *
 * POR QUE, Y QUE ARREGLA. Partir en el repositorio obligaba a recortar la prosa
 * de OTROS documentos para que un indice quepa, y producia un arbol de
 * archivos que existen solo por un tope de bytes. El tope es una regla nuestra
 * para que el veredicto signifique algo (judge-partes.md, punto 4); partir es
 * para el juez, no para el arbol.
 *
 * LA REGLA: PARTIR POR CONCEPTO, NUNCA AMPUTAR. Un concepto es un titulo y lo
 * que va debajo, y los cortes van ahi. Si un concepto solo no cabe, el script
 * falla y lo dice: ahi el problema es del documento, no del tope.
 *
 * LO QUE NO HACE. No juzga, no decide que una parte es coherente con otra, y no
 * certifica nada: eso es el juez, sobre cada parte por separado. La composicion
 * demuestra que las partes son el original, y nada mas.
 */

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { pathToFileURL } from 'node:url';

/** El tope del framework: 4096 B por artefacto juzgable. */
export const TOPE = 4096;

/** La cabecera que lleva cada parte, y que hace que se sepa de donde sale. */
export function cabecera(n, k, ruta, sha) {
  return `<!-- parte ${n} de ${k} · ${ruta} · sha256 ${sha} -->\n`;
}

const CABECERA_RE = /^<!-- parte \d+ de \d+ · .* · sha256 [0-9a-f]{64} -->$/;

/** El sha de un texto, en hexadecimal. */
export function sha(texto) {
  return createHash('sha256').update(texto, 'utf8').digest('hex');
}

/**
 * LOS CONCEPTOS: un titulo y lo que va debajo.
 *
 * En markdown, un titulo. En codigo, una declaracion de nivel superior: el
 * archivo entero es una unidad, y partirlo es cortar entre exportaciones.
 *
 * LA PREMABULA es lo que va antes del primer titulo (los imports, el
 * comentario de cabecera). Viaja con la primera parte: sola no es un
 * concepto, y partirla separaria el archivo en algo que no compila.
 */
export function conceptosDe(texto, ext) {
  const lineas = texto.split('\n');
  const esConcepto =
    ext === '.md'
      ? (l) => /^#{1,6}\s/.test(l)
      : (l) => /^export\s/.test(l);
  const cortes = [];
  for (let i = 0; i < lineas.length; i++) if (esConcepto(lineas[i])) cortes.push(i);
  if (cortes.length === 0) return [{ texto, titulo: '(sin titulo)' }];
  const conceptos = [];
  if (cortes[0] > 0) conceptos.push({ texto: lineas.slice(0, cortes[0]).join('\n'), titulo: '(preambulo)' });
  for (let c = 0; c < cortes.length; c++) {
    const fin = c + 1 < cortes.length ? cortes[c + 1] : lineas.length;
    const titulo = lineas[cortes[c]].replace(/^#+\s*/, '').trim();
    conceptos.push({ texto: lineas.slice(cortes[c], fin).join('\n'), titulo: titulo.slice(0, 80) });
  }
  return conceptos;
}

/**
 * LA PARTIDA. Los conceptos se agrupan en partes de hasta `tope` bytes, sin
 * partir un concepto: se llena la parte con conceptos enteros, y cuando el
 * siguiente no cabe, se abre otra parte.
 *
 * SI UN CONCEPTO NO CABE SOLO, se lanza el error. La alternativa —partirlo por
 * bytes— es exactamente lo que esta regla no quiere: un veredicto sobre un
 * trozo de una idea.
 */
export function partir(texto, tope = TOPE, ext = '.md') {
  const conceptos = conceptosDe(texto, ext);
  const partes = [];
  let actual = null;
  for (const c of conceptos) {
    const bytes = Buffer.byteLength(c.texto, 'utf8');
    if (bytes > tope) {
      const e = new Error(`un concepto no cabe solo (${bytes} B): ${c.titulo}`);
      e.codigo = 'E_CONCEPTO_GRANDE';
      e.concepto = c.titulo;
      e.bytes = bytes;
      throw e;
    }
    const previos = actual ? Buffer.byteLength(actual.texto, 'utf8') : 0;
    if (actual && previos + 1 + bytes > tope) {
      partes.push(actual);
      actual = null;
    }
    actual = actual
      ? { texto: actual.texto + '\n' + c.texto, titulo: actual.titulo, conceptos: [...actual.conceptos, c] }
      : { texto: c.texto, titulo: c.titulo, conceptos: [c] };
  }
  if (actual) partes.push(actual);
  return partes;
}

/** La composicion: las partes, por su orden, dan el original. */
export function componer(cuerpos) {
  return cuerpos.join('\n');
}

/**
 * QUITAR LA CABECERA. Si la primera linea no es la cabecera esperada, el
 * error: una parte editada a mano no se puede componer, y componerla en
 * silencio seria publicar un veredicto sobre algo que nadie puede reconstruir.
 */
export function quitarCabecera(texto) {
  const i = texto.indexOf('\n');
  if (i < 0) return texto;
  const primera = texto.slice(0, i);
  if (!CABECERA_RE.test(primera)) {
    const e = new Error('la parte no tiene la cabecera esperada');
    e.codigo = 'E_CABECERA';
    throw e;
  }
  return texto.slice(i + 1);
}

/** La verificacion: el original, y lo que dan las partes. */
export function verificar(original, cuerpos) {
  const esperado = sha(original);
  const obtenido = sha(componer(cuerpos));
  return {
    ok: esperado === obtenido,
    esperado,
    obtenido,
    bytes: Buffer.byteLength(original, 'utf8'),
    partes: cuerpos.length,
  };
}

/** El nombre de la parte N de un archivo. */
export function nombreDeParte(ruta, n, ext) {
  return `${basename(ruta, ext)}.parte-${n}${ext}`;
}

/** Escribe las partes de un archivo en un directorio. Devuelve el manifiesto. */
export function escribirPartes(ruta, dir, tope = TOPE) {
  const ext = extname(ruta);
  const texto = readFileSync(ruta, 'utf8');
  const partes = partir(texto, tope, ext);
  const s = sha(texto);
  mkdirSync(dir, { recursive: true });
  const manifiesto = [];
  partes.forEach((p, i) => {
    const nombre = nombreDeParte(ruta, i + 1, ext);
    writeFileSync(join(dir, nombre), cabecera(i + 1, partes.length, ruta, s) + p.texto, 'utf8');
    manifiesto.push({
      n: i + 1,
      de: partes.length,
      nombre,
      ruta: join(dir, nombre),
      bytes: Buffer.byteLength(p.texto, 'utf8'),
      titulo: p.titulo,
      sha: sha(p.texto),
    });
  });
  return { ruta, sha: s, bytes: Buffer.byteLength(texto, 'utf8'), partes: manifiesto };
}

/** Lee las partes de un directorio, quitando la cabecera de cada una. */
export function leerPartes(dir, ruta) {
  const ext = extname(ruta);
  const nombres = readdirSync(dir)
    .filter((n) => n.startsWith(basename(ruta, ext) + '.parte-') && n.endsWith(ext))
    .sort((a, b) => {
      const na = Number(a.match(/\.parte-(\d+)/)[1]);
      const nb = Number(b.match(/\.parte-(\d+)/)[1]);
      return na - nb;
    });
  return nombres.map((n) => quitarCabecera(readFileSync(join(dir, n), 'utf8')));
}

// ------------------------------------------------------------------ CLI

function main() {
  const args = process.argv.slice(2);
  const ruta = args.find((a) => !a.startsWith('--'));
  if (!ruta) {
    console.error('uso: juez-partes.mjs --plan|--escribir|--componer|--json <archivo> [--dir <dir>]');
    process.exit(2);
  }
  const dirArg = args[args.indexOf('--dir') + 1];
  const dir = dirArg && !dirArg.startsWith('--') ? dirArg : join(dirname(ruta), '.partes');
  const ext = extname(ruta);
  const texto = readFileSync(ruta, 'utf8');

  if (args.includes('--json')) {
    let partes;
    try {
      partes = partir(texto, TOPE, ext);
    } catch (e) {
      console.log(JSON.stringify({ ruta, ok: false, error: e.codigo || 'E_PARTIR', detalle: e.message }));
      process.exit(1);
    }
    console.log(
      JSON.stringify({
        ruta,
        sha: sha(texto),
        bytes: Buffer.byteLength(texto, 'utf8'),
        partes: partes.map((p, i) => ({
          n: i + 1,
          bytes: Buffer.byteLength(p.texto, 'utf8'),
          titulo: p.titulo,
          sha: sha(p.texto),
        })),
      }),
    );
    return;
  }

  if (args.includes('--escribir')) {
    const m = escribirPartes(ruta, dir);
    console.log(`\n=== PARTES PARA EL JUEZ · ${m.ruta} ===\n`);
    console.log(`  ${m.bytes} B en ${m.partes.length} parte(s). sha256 del original: ${m.sha}\n`);
    for (const p of m.partes) {
      console.log(`  ${String(p.bytes).padStart(6)} B  parte ${p.n} de ${p.de}  ${p.titulo}`);
      console.log(`            ${p.ruta}`);
    }
    console.log('');
    return;
  }

  if (args.includes('--componer')) {
    if (!existsSync(dir)) {
      console.error(`\n  NO HAY PARTES QUE COMPONER: ${dir} no existe\n`);
      process.exit(2);
    }
    const cuerpos = leerPartes(dir, ruta);
    const v = verificar(texto, cuerpos);
    console.log(`\n=== COMPOSICION · ${ruta} ===\n`);
    console.log(`  partes: ${v.partes}`);
    console.log(`  sha esperado: ${v.esperado}`);
    console.log(`  sha obtenido: ${v.obtenido}`);
    console.log(v.ok ? '\n  OK: las partes dan el original byte a byte.\n' : '\n  FALLA: las partes NO dan el original.\n');
    if (!v.ok) process.exit(1);
    return;
  }

  // --plan
  const partes = partir(texto, TOPE, ext);
  console.log(`\n=== PLAN DE PARTES · ${ruta} ===\n`);
  console.log(`  ${Buffer.byteLength(texto, 'utf8')} B en ${partes.length} parte(s)\n`);
  for (const [i, p] of partes.entries()) {
    console.log(`  ${String(Buffer.byteLength(p.texto, 'utf8')).padStart(6)} B  parte ${i + 1}  ${p.titulo}`);
  }
  console.log('');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
