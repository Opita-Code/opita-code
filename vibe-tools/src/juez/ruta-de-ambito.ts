/**
 * L5-T3 · DE UNA RUTA A SU AMBITO: la resolucion.
 *
 * La tabla de lo que mide cada clase vive en `ambitos.ts`. Aqui vive la otra
 * mitad: que ruta pertenece a que clase, y cuantas muestras pide.
 *
 * POR QUE ESTA SEPARADO DE LA TABLA. Son dos conceptos y el juez los ve como
 * dos partes: la tabla dice QUE mide cada clase, la resolucion dice CUAL le
 * toca a una ruta. Un archivo que juntaba las dos pasaba del tope de 4096 B
 * en un solo concepto, y el tope no se sube: se parte por concepto.
 *
 * UNA RUTA ABSOLUTA NO SE ADIVINA, y no hace falta una rama que lo diga: la
 * tabla es relativa, y una ruta absoluta empieza por `/` o por una letra de
 * unidad, asi que no puede empezar por `vibe-tools/src/`. La rama que habia
 * era una segunda defensa del mismo invariante, y la mutacion la destapo:
 * sobrevivia porque el prefijo ya la cubria. Se quedo la defensa que se puede
 * medir.
 */

import { DEFINICIONES, type Ambito } from './ambitos.js';

/** Las raices que se reconocen por prefijo. El orden no importa: no se solapan. */
const RAICES: readonly (readonly [string, Ambito])[] = [
  ['vibe-tools/src/', 'codigo'],
  ['vibe-tools/db/', 'sql'],
  ['docs/arquitectura/loops/', 'documento'],
  ['docs/avances/', 'avance'],
  ['docs/canal/', 'canal'],
];

/**
 * Los archivos sueltos que no viven bajo una raiz. Son los mismos que el
 * guard de presupuesto mide uno por uno, y por eso se reconocen aqui: si un
 * archivo suelto nuevo entra al conjunto juzgable, su ambito se decide a
 * mano, no por parecido.
 */
const SUELTOS: Readonly<Record<string, Ambito>> = Object.freeze({
  'README.md': 'superficie',
  'STATUS.md': 'superficie',
  'vibe-tools/README.md': 'superficie',
  'docs/como-verificar.md': 'superficie',
  'docs/controles.md': 'superficie',
  'docs/canal.md': 'canal',
  'docs/avances.md': 'avance',
  'CONTRIBUTING.md': 'superficie',
  'SECURITY.md': 'superficie',
  'CODE_OF_CONDUCT.md': 'superficie',
  '.github/workflows/ci.yml': 'superficie',
  '.github/workflows/estado.yml': 'superficie',
  '.github/workflows/release.yml': 'superficie',
});

/** Normaliza una ruta relativa: separador, prefijo `./` y barras repetidas. */
function normalizar(ruta: string): string {
  return ruta.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/{2,}/g, '/');
}

/**
 * El ambito de una ruta, o `null` si esta no tiene uno.
 *
 * `null` NO es "no se juzga": es "este pipeline no sabe como juzgarla", y el
 * pipeline lo trata como una parada. La lista de lo que no se juzga vive en
 * `tools/gate-budget.mjs`, con su motivo escrito.
 */
export function ambitoDe(ruta: string): Ambito | null {
  const r = normalizar(ruta);
  const suelto = SUELTOS[r];
  if (suelto !== undefined) return suelto;
  for (const [prefijo, ambito] of RAICES) {
    if (r.startsWith(prefijo) && r.length > prefijo.length) return ambito;
  }
  return null;
}

/** El consenso que pide un ambito, y el que pide el riesgo alto. */
export function consensoDe(ambito: Ambito, riesgo: 'normal' | 'alto'): number {
  return riesgo === 'alto' ? 3 : DEFINICIONES[ambito].consenso;
}
