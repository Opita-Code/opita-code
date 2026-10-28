/**
 * LA COHERENCIA ENTRE LAS PARTES: EL ARTEFACTO Y LA CONTRADICCION.
 *
 * QUE ES. El juez resuelve un artefacto, no un conjunto: "N de N partes en
 * aligned" certifica que CADA parte sostiene lo que decia, y no que las partes
 * no se contradigan entre si (la memoria 1155 lo dice con esas palabras).
 *
 * LA PIEZA DE ARTEFACTO. Para preguntar por la coherencia hay que darle al
 * juez algo que contenga las partes a la vez. Y ese algo es el documento
 * entero: el tope de 4096 B es NUESTRO, no del framework. Medido: un artefacto
 * de 5067 B se juzgo entero, con `artifact_truncated: false`, `aligned` 1.000 y
 * 45,8 s (memoria 1134). El documento recompuesto byte a byte es, por lo
 * tanto, un artefacto que el juez puede ver.
 *
 * LA PIEZA DE CONTRADICCION. Un veredicto que no se puede falsar no sirve:
 * hace falta un documento en el que las partes se contradigan de verdad, para
 * comprobar que el veredicto cambia. Y la contradiccion se construye de forma
 * MECANICA: un numero que aparece en mas de una parte, cambiado en una de
 * ellas. Las dos partes pasan a decir cosas distintas de lo mismo, que es
 * exactamente la incoherencia que se quiere cazar.
 *
 * Y SI NO HAY NUMERO REPETIDO, NO SE INVENTA. Un documento sin un numero
 * compartido entre sus partes no tiene contradiccion numerica que construir, y
 * la funcion lo dice: un experimento que necesita una contradiccion que no
 * existe mide otra cosa.
 *
 * LO QUE NO HACE. No juzga: el veredicto es del juez, y este archivo solo le
 * da el artefacto y el par que hay que comparar. Y no declara que el documento
 * sea coherente: que lo sea, o no, es lo que el juez tiene que responder.
 */

import { readFileSync } from 'node:fs';
import { extname } from 'node:path';
import { pathToFileURL } from 'node:url';

import { componer, partir, sha, TOPE } from './juez-partes.mjs';

/** Un numero con al menos dos cifras: los de una cifra son ruido. */
const NUMERO = /\b\d{2,4}\b/g;

/** El artefacto de coherencia de un documento: el documento entero. */
export function artefactoDeCoherencia(ruta) {
  const texto = readFileSync(ruta, 'utf8');
  const partes = partir(texto, TOPE, extname(ruta));
  const recomposado = componer(partes.map((p) => p.texto));
  return {
    ruta,
    texto,
    bytes: Buffer.byteLength(texto, 'utf8'),
    sha: sha(texto),
    partes: partes.length,
    // Las partes tienen que dar el documento. Si no, el artefacto que se
    // judgea no es el documento, y el veredicto va de otra cosa.
    recomposadoIgual: sha(recomposado) === sha(texto),
  };
}

/**
 * LA CONTRADICCION. Un numero que aparece en mas de una parte, cambiado en
 * la segunda. Devuelve el texto mutado y el numero, o `null` si el documento
 * no tiene material para una contradiccion numerica.
 */
export function contradiccionDe(ruta) {
  const artefacto = artefactoDeCoherencia(ruta);
  if (artefacto.partes < 2) return null;
  const partes = partir(artefacto.texto, TOPE, extname(ruta));

  // Los numeros de cada parte, con su posicion.
  const porParte = partes.map((p) => [...p.texto.matchAll(NUMERO)].map((m) => ({ n: m[0], i: m.index ?? 0 })));

  // El primer numero que aparece en DOS partes distintas.
  let elegido = null;
  for (const { n } of porParte[0]) {
    const otra = porParte.findIndex((lista, indice) => indice > 0 && lista.some((x) => x.n === n));
    if (otra > 0) {
      elegido = { n, parte: otra };
      break;
    }
  }
  if (!elegido) return null;

  // Se cambia en la parte elegida, y solo en la primera aparicion de esa parte.
  const lista = porParte[elegido.parte];
  const copia = [...lista];
  const cambiado = String(Number(elegido.n) + 1);
  copia[0] = { n: elegido.n, i: copia[0].i };
  const textoParte = partes[elegido.parte].texto;
  const posicion = textoParte.indexOf(elegido.n);
  const textoNuevo =
    textoParte.slice(0, posicion) + cambiado + textoParte.slice(posicion + elegido.n.length);
  const partesNuevas = [...partes];
  partesNuevas[elegido.parte] = { ...partes[elegido.parte], texto: textoNuevo };

  return {
    texto: componer(partesNuevas.map((p) => p.texto)),
    numero: elegido.n,
    parte: elegido.parte,
    original: elegido.n,
    cambiado,
  };
}

/**
 * COMO SE USA. El veredicto de coherencia se pide sobre el artefacto entero,
 * con UNA afirmacion: "este documento no se contradice a si mismo". Y el
 * experimento compara el veredicto del documento con el de su version
 * contradicha: si los dos son iguales, el veredicto no mira la coherencia y
 * hay que decirlo.
 */
export const AFIRMACION_DE_COHERENCIA =
  'Este documento no se contradice a si mismo: las partes que lo componen dicen lo mismo unas de otras sobre lo que afirman.';

// ------------------------------------------------------------------ CLI

function main() {
  const args = process.argv.slice(2);
  const ruta = args.find((a) => !a.startsWith('--'));
  if (!ruta) {
    console.error('uso: coherencia.mjs --artefacto|--contradiccion <archivo>');
    process.exit(2);
  }
  const artefacto = artefactoDeCoherencia(ruta);
  console.log(`\n=== ARTEFACTO DE COHERENCIA · ${ruta} ===\n`);
  console.log(`  ${artefacto.bytes} B en ${artefacto.partes} parte(s)`);
  console.log(`  sha256: ${artefacto.sha}`);
  console.log(`  las partes dan el documento: ${artefacto.recomposadoIgual ? 'si' : 'NO'}`);
  console.log(`  afirmacion: ${AFIRMACION_DE_COHERENCIA}\n`);

  if (args.includes('--contradiccion')) {
    const c = contradiccionDe(ruta);
    if (!c) {
      console.log('  SIN CONTRADICCION POSIBLE: el documento no tiene un numero');
      console.log('  compartido entre dos de sus partes. No se inventa uno.\n');
      return;
    }
    console.log(`=== LA CONTRADICCION ===\n`);
    console.log(`  numero: ${c.original} -> ${c.cambiado}, en la parte ${c.parte}`);
    console.log(`  bytes del documento mutado: ${Buffer.byteLength(c.texto, 'utf8')}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
