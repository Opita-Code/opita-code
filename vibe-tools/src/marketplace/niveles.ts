/**
 * L6-T5 · LOS DOS NIVELES: modulos y tools atomicas.
 *
 * QUE ES. Se publican dos cosas: un MODULO (un grafo de tools) y una TOOL
 * ATOMICA (una sola pieza). Y el modulo es la unidad PRINCIPAL de
 * descubrimiento: es lo que la gente busca, porque un modulo es un flujo
 * terminado y una tool suelta es una pieza.
 *
 * POR QUE SE PUBLICAN LOS DOS Y NO SOLO UNO.
 *
 *   Una tool atomica es lo que se reutiliza: el modulo "escribir Python en
 *   modo X" se arma en segundos si otra persona ya publico las tres tools que
 *   necesita. Por eso los dos niveles existen: el modulo es el PRODUCTO y la
 *   tool es el LADRILLO. Publicar solo los dos seria una decision sobre lo
 *   que la gente busca, y esa decision la tomaba el marketplace antes de
 *   existir.
 *
 * POR QUE UNA TOOL PUEDE APARECER DENTRO DE UN MODULO.
 *
 *   Los dos niveles no son dos worlds: el modulo USA tools. Un modulo
 *   publicado lleva sus tools dentro (sus nodos), y la tool atomica es la
 *   misma pieza cuando se publica sola. Por eso `herramientasDe` no busca
 *   "la tool que corresponde" en un registro aparte: mira los NODOS del
 *   modulo, que es donde la tool esta de verdad.
 *
 * POR QUE EL DESCUBRIMIENTO DEVUELVE MODULOS Y NO TOOLS.
 *
 *   El plan dice que el modulo es la unidad principal de descubrimiento, y eso
 *   es una decision de producto. `descubrimiento` es la funcion que la
 *   aplica, y si mañana se cambia, se cambia aqui y no en el sitio donde se
 *   pinta.
 *
 * LO QUE ESTE ARCHIVO NO HACE. No decide que se publica ni en que orden: eso
 * es el pin (`pin.ts`) y el catalogo (`catalogo.ts`). Aqui solo hay niveles.
 */

import { esModulo, type Entrada, type Nivel } from './entrada.js';

/** Las entradas de un nivel. */
export function porNivel(entradas: readonly Entrada[], nivel: Nivel): readonly Entrada[] {
  return entradas.filter((e) => (esModulo(e.descriptor) ? 'modulo' : 'tool') === nivel);
}

/** Los modulos publicados. */
export function modulos(entradas: readonly Entrada[]): readonly Entrada[] {
  return porNivel(entradas, 'modulo');
}

/** Las tools atomicas publicadas. */
export function herramientas(entradas: readonly Entrada[]): readonly Entrada[] {
  return porNivel(entradas, 'tool');
}

/**
 * Lo que el usuario descubre: los modulos.
 *
 * No es un alias de `modulos` por casualidad: es ladecision de producto, y
 * por eso tiene nombre propio. Si el dia de manana el descubrimiento cambia,
 * el cambio esta en esta linea y en ningun otro sitio.
 */
export function descubrimiento(entradas: readonly Entrada[]): readonly Entrada[] {
  return modulos(entradas);
}

/**
 * Las tools que usa un modulo: las de sus nodos.
 *
 * Se deduplican por `(id, version)`: un modulo puede usar la misma tool en dos
 * nodos, y el usuario que descubre el modulo no necesita verla dos veces. La
 * deduplicacion es del `Map`, no de un filtro aparte: dos defensas del mismo
 * invariante sobran, y la mutacion destapo que la segunda no hacia nada.
 */
export function herramientasDe(entrada: Entrada): readonly { id: string; version: string }[] {
  if (!esModulo(entrada.descriptor)) return [];
  const vistas = new Map<string, { id: string; version: string }>();
  for (const nodo of entrada.descriptor.nodes) {
    vistas.set(`${nodo.tool.id}@${nodo.tool.version}`, { id: nodo.tool.id, version: nodo.tool.version });
  }
  return [...vistas.values()];
}
