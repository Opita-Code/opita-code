/**
 * L4-T5 · LAS CATEGORIAS: el vocabulario de lo que se puede conceder.
 *
 * QUE ES. Las tres cosas que una tool puede pedir, y que son de naturaleza
 * distinta, asi que no se mezclan en una sola lista:
 *
 *   1. EL CONTEXTO, por categoria, en una ESCALERA: `none` < `preferences` <
 *      `usage_history`. Una categoria es un grupo de campos que viaja junto, no
 *      un permiso campo por campo: el permiso se concede por categoria, y la
 *      categoria trae lo suyo.
 *   2. LA PSICOMETRIA, que NO esta en la escala. Es dato sensible y se concede
 *      por FINALIDAD, con el consentimiento de esa finalidad.
 *   3. LA ESCRITURA, que tampoco esta en la escala: es otra capacidad, y se
 *      concede o no se concede.
 *
 * POR QUE LA ESCALERA ES MONOTONA. Quien tiene el historial de uso puede
 * recomputar las preferencias: separarlas daria la sensacion de un permiso mas
 * fino y no lo seria. La comparacion es por tanto un `>=` sobre el orden de la
 * escala, y no una busqueda en un conjunto.
 *
 * POR QUE LAS FINALIDADES SON DOS Y NO UNA. El psicometrico se inyecta para
 * una finalidad declarada, y las finalidades son distintas: el
 * consentimiento de "personalizar" NO es el consentimiento de "generar
 * misiones de engagement". Aceptar una no autoriza la otra, y por eso la
 * finalidad viaja con el permiso y se compara una por una.
 *
 * LO QUE NO HACE ESTE ARCHIVO: no concede nada, no denies nada y no sabe quien
 * es la tool. Eso es de la puerta (`puerta.ts`).
 */

import type { ContextProfile } from '../contract.js';

/** La categoria de contexto. Mismo vocabulario que el contrato. */
export type Categoria = ContextProfile;

/**
 * LAS CATEGORIAS CONCEDIBLES: las que llevan datos.
 *
 * `none` no concede nada, asi que no es una categoria que se pueda pedir: es
 * el resultado de una denegacion, y por eso vive en el tipo de la decision
 * denegada y no en el de la decision concedida. Separarlo aqui es lo que
 * permite que el tipo diga que una denegacion NO puede llevar una categoria
 * que concede, y que el compilador lo impida en vez de una disciplina.
 */
export type CategoriaConcedida = Exclude<Categoria, 'none'>;

/**
 * La escala, de menos a mas. EL ORDEN ES EL DATO: la comparacion se hace con
 * el indice, y por eso esta en una constante y no se reordena en cada llamada.
 */
export const ESCALERA: readonly Categoria[] = Object.freeze(['none', 'preferences', 'usage_history']);

/** La finalidad para la que se puede inyectar psicometria. */
export type Finalidad = 'personalizacion' | 'engagement';

/** Las finalidades, en el mismo orden para todos. */
export const FINALIDADES: readonly Finalidad[] = Object.freeze(['personalizacion', 'engagement']);

/**
 * La posicion de una categoria en la escala.
 *
 * UNA CATEGORIA QUE NO ESTA EN LA ESCALERA ES UN ERROR, no un valor bajo. Una
 * tool que declara una categoria que el runtime no conoce tiene un contrato
 * que nadie va a poder cumplir, y dejar que 'inventada' valiera como 'none'
 * convertiria ese error en una denegacion silenciosa: el permiso se negaria
 * por una razon que no es la verdadera.
 */
export function posicion(categoria: Categoria): number {
  const i = ESCALERA.indexOf(categoria);
  if (i < 0) throw new Error(`categoria de contexto desconocida: ${categoria}`);
  return i;
}

/** Si la categoria concedida alcanza a la pedida. */
export function alcanza(concedida: Categoria, pedida: Categoria): boolean {
  return posicion(concedida) >= posicion(pedida);
}

/**
 * La categoria mas alta de las dos. La mas alta manda: conceder historial
 * incluye las preferencias, y conceder preferencias no incluye el historial.
 */
export function mayor(a: Categoria, b: Categoria): Categoria {
  return posicion(a) >= posicion(b) ? a : b;
}

/**
 * La categoria mas baja de las dos.
 *
 * Es la operacion del permiso efectivo: lo que se concede es el mas bajo de
 * los dos techos, el declarado y el concedido. Por eso hace falta, y no solo
 * `mayor`: el techo mas alto seria el que decide, y el techo mas bajo es el
 * que manda.
 */
export function menor(a: Categoria, b: Categoria): Categoria {
  return posicion(a) <= posicion(b) ? a : b;
}

/**
 * EL PERMISO EFECTIVO: lo que una tool puede hacer con la memoria.
 *
 * Es un objeto de datos, y por eso se puede guardar, comparar y auditar. No es
 * una funcion que se consulta: es el resultado de una decision, y la decision
 * dice ademas POR QUE se concedio o se denego.
 */
export interface Permiso {
  /** La categoria de contexto concedida. `none` es no conceder contexto. */
  readonly categoria: Categoria;
  /** Las finalidades para las que hay consentimiento de psicometria. */
  readonly psicometria: readonly Finalidad[];
  /** Si puede escribir en la memoria. */
  readonly escritura: boolean;
}

/**
 * El permiso que no concede nada.
 *
 * Es el punto de partida de TODA tool sin concesion, y por eso esta congelado:
 * si alguien lo mutara, todas las denegaciones posteriores darian lo mismo. Un
 * permiso que se puede cambiar en caliente es un permiso que no se puede
 * auditar.
 */
export const SIN_PERMISO: Permiso = Object.freeze({
  categoria: 'none' as Categoria,
  psicometria: Object.freeze([]) as readonly Finalidad[],
  escritura: false,
});
