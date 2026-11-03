/**
 * L4-T5 · LA POLITICA: las concesiones, y solo las concesiones.
 *
 * QUE ES. La politica es el conjunto de permisos que el operador ha
 * concedido. Es DATO, no logica: se guarda, se versiona y se audita. Y es lo
 * UNICO que concede: si una tool no aparece aqui, no tiene permiso. Esa es la
 * forma que toma el "deny by default" del plan.
 *
 * POR QUE LA CONCESION LLEVA VERSION Y AUTOR, Y NO SOLO EL ID.
 *
 *   - POR ID SOLO: cambiar el codigo de una tool conservaria su permiso. El
 *     permiso se concedio a un binario, no a un nombre, y con el nombre
 *     cualquier version nueva heredaria el permiso de la anterior. El runtime
 *     ya resuelve la magia por (id, version), y el permiso se resuelve igual.
 *   - POR ID Y VERSION, SIN AUTOR: republicar la tool con otro autor
 *     conservaria el permiso. El autor es quien responde por el codigo, y un
 *     permiso no se hereda entre autores: es el caso de "tool de tercero vs.
 *     tool propia" de la spec de boundary (E3).
 *
 * POR QUE LA CONCESION ES EXPLICITA Y NO UNA REGLA DE AUTOR. Una regla del
 * tipo "las tools propias tienen lo que declaran" parece mas comoda, pero
 * convierte el `author` en un interruptor de seguridad: cambiar una palabra
 * en el descriptor amplia los permisos de una tool. Con la concesion
 * explicita, ampliar un permiso es un acto visible en la politica.
 *
 * LO QUE NO HACE ESTE ARCHIVO: no decide, no deniega y no sabe de donde sale
 * la peticion. Eso es de la puerta (`puerta.ts`).
 */

import type { ToolDescriptor } from '../contract.js';
import type { Categoria, Finalidad } from './categorias.js';

/**
 * Una concesion. Es lo que el operador concedio, con su alcance exacto.
 *
 * `categoria` es el TECHO de contexto que se concede. `psicometria` son las
 * finalidades consentidas, y son una lista y no un booleano porque el
 * consentimiento es POR FINALIDAD. `escritura` va aparte porque escribir en la
 * memoria no es una categoria mas de contexto: es otra capacidad.
 */
export interface Concesion {
  /** El id de la tool. */
  readonly herramienta: string;
  /** La version exacta de la tool. */
  readonly version: string;
  /** El autor de la tool. Un permiso no se hereda entre autores. */
  readonly autor: string;
  /** La categoria de contexto concedida, como maximo. */
  readonly categoria: Categoria;
  /** Las finalidades para las que hay consentimiento de psicometria. */
  readonly psicometria: readonly Finalidad[];
  /** Si esta concesion autoriza a escribir en la memoria. */
  readonly escritura: boolean;
}

/**
 * La politica: la lista de concesiones.
 *
 * UNA LISTA VACIA ES UNA POLITICA VALIDA, y es la que hace el deny by
 * default: sin concesiones, ninguna tool tiene permiso. No hace falta un
 * flag "denyAll" que se pueda dejar a false por descuido.
 */
export interface Politica {
  readonly concesiones: readonly Concesion[];
}

/** Una politica que no concede nada. */
export const POLITICA_VACIA: Politica = Object.freeze({
  concesiones: Object.freeze([]) as readonly Concesion[],
});

/**
 * La concesion que aplica a una tool, si hay alguna.
 *
 * LAS TRES CLAVES JUNTAS, Y NO UNA. Con una sola, el permiso se filtraria
 * entre versiones y entre autores, que es justo lo que el permiso no puede
 * hacer. Y si hubiera dos concessions para la misma tool, la primera que
 * aparezca gana: una politica con dos filas para la misma tool esta mal
 * escrita, y esconderlo tomaria la mas generosa.
 */
export function buscarConcesion(
  politica: Politica,
  descriptor: ToolDescriptor,
): Concesion | undefined {
  for (const concesion of politica.concesiones) {
    if (concesion.herramienta !== descriptor.id) continue;
    if (concesion.version !== descriptor.version) continue;
    if (concesion.autor !== descriptor.author) continue;
    return concesion;
  }
  return undefined;
}
