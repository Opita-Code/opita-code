/**
 * L6-T3 · EL PIN: las tres propias siempre de primero.
 *
 * QUE ES. Una regla del catalogo, no una preferencia de orden y no una
 * decoracion: las entradas propias ocupan las primeras posiciones, SIEMPRE,
 * sin excepcion y sin rotacion.
 *
 * POR QUE LAS PROPIAS LAS DECIDE LA PLATAFORMA Y NO EL AUTOR.
 *
 *   Si el autor pudiera declarar su entrada como propia, publicar seria el
 *   acto de concederse el pin, y el pin dejaria de significar nada: seria un
 *   campo de texto que dice "yo primero". Por eso las propias son un conjunto
 *   que la plataforma declara, y una entrada de un tercero no puede
 *   auto-declarse propia ni aunque lo pida.
 *
 * POR QUE NO HAY ROTACION.
 *
 *   Rotar es cambiar el orden con el tiempo. Un catalogo que rota tiene que
 *   enseñar a la gente a buscar, y el lugar de una cosa es informacion: que
 *   la tercera propia sea la tercera SIEMPRE significa que el sitio tiene un
 *   orden, y un orden que cambia es ruido. Sin rotacion, el orden relativo de
 *   las propias es el de publicacion y no se toca.
 *
 * POR QUE EL RESTO SE ORDENA POR SECUENCIA Y NO POR NOMBRE.
 *
 *   La secuencia es el numero de publicacion: un dato que el catalogo emite y
 *   que nadie escribe a mano. Ordenar por nombre seria ordenar por algo que
 *   el autor eligio, y entonces "quien se publica primero" seria "quien se
 *   llama primero". Con la secuencia, el orden es el de llegada, que es el
 *   unico que no se puede manipular.
 *
 * LO QUE ESTE ARCHIVO NO HACE. No decide cuales son las tres propias: eso es
 * decision de la plataforma y llega como conjunto de ids. Aqui solo esta la
 * regla.
 */

import type { Entrada } from './entrada.js';

/** El conjunto de entradas que la plataforma declara propias. */
export type Propias = readonly string[];

/** Si una entrada es propia. Lo decide el conjunto, no la entrada. */
export function esPropia(entrada: Entrada, propias: Propias): boolean {
  return propias.includes(entrada.id);
}

/**
 * El listado con el pin aplicado.
 *
 * Primero se ordena por secuencia (el numero de publicacion) y despues se
 * parte en dos bloques: las propias y los terceros. El reparto respeta el
 * orden de la secuencia dentro de cada bloque, asi que el orden relativo de
 * las propias es el de publicacion y no depende de esta funcion.
 *
 * El `sort` de JavaScript es estable, asi que dos entradas con la misma
 * secuencia (que no puede pasar: el catalogo las numera) conservarian el
 * orden de entrada. No es una regla, es una propiedad del lenguaje.
 *
 * Las entradas que no estan publicadas (o que estan suspendidas o retiradas)
 * no se listan: el catalogo es lo que se puede usar, no lo que existio.
 */
export function listarConPin(entradas: readonly Entrada[], propias: Propias): readonly Entrada[] {
  const visibles = entradas
    .filter((e) => e.estado === 'publicado')
    .sort((a, b) => (a.secuencia ?? 0) - (b.secuencia ?? 0));
  const propiasVisibles = visibles.filter((e) => esPropia(e, propias));
  const deTerceros = visibles.filter((e) => !esPropia(e, propias));
  return [...propiasVisibles, ...deTerceros];
}
