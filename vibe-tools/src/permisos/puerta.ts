/**
 * L4-T5 · LA PUERTA: quien decide, y dice por que.
 *
 * QUE ES. El unico sitio donde se concede o se deniega. Y no es una funcion
 * que devuelve un booleano: es una decision con MOTIVO, porque una denegacion
 * sin motivo no se puede depurar, ni auditar, ni discutir con quien la pidio.
 *
 * LAS TRES PREGUNTAS, Y POR QUE SON TRES.
 *
 *   1. CONTEXTO: que categoria de memoria puede leer esta tool.
 *   2. PSICOMETRIA: para que finalidad puede leer el psicometrico. Es una
 *      pregunta aparte porque el psicometrico es dato sensible (Ley 1581 art.
 *      5) y se concede por finalidad, no por altura de perfil. Aceptar el
 *      consentimiento de una finalidad NO es aceptar el de la otra.
 *   3. ESCRITURA: si puede escribir en la memoria. Es una capacidad distinta,
 *      no una categoria mas: escribir no es "leer mas".
 *
 * LOS DOS TECHOS. Hay dos limites, y son de naturaleza distinta, y por eso los
 * dos se aplican:
 *
 *   - EL TECHO DECLARADO (el perfil que la tool declara en su contrato): es lo
 *     que la tool dice que necesita. Aunque la politica conceda mas, el perfil
 *     no deja pasar mas. Es el test de minimalidad de la spec de boundary.
 *   - LA CONCESION (lo que el operador concedio): es lo que se puede dar.
 *
 * El permiso efectivo es el mas bajo de los dos. Y si no hay concesion, no
 * hay permiso: ese es el deny by default del plan, y no necesita ningun flag
 * que se pueda dejar puesto por descuido.
 *
 * POR QUE LAS DECISIONES SON UNIONES Y NO UN TIPO UNICO. Una decision que
 * puede decir `concedido: false` y `categoria: 'usage_history'` a la vez es
 * una decision que puede mentir. Y el codigo que la consume tendria que
 * defenderse de las dos formas, y la segunda taparia a la primera: dos
 * defensas que se tapan no se pueden medir. Por eso cada decision es una
 * union discriminada por `concedido`: denegar LLEVA el `none` de la categoria
 * en el tipo, y un error de compilacion donde antes habia una disciplina.
 *
 * LO QUE NO HACE ESTE ARCHIVO: no lee la memoria, no la inyecta y no la
 * escribe. Decide; aplicar la decision es del harness (`contexto.ts` inyecta,
 * y el harness aplica las mutaciones).
 */

import type { ToolDescriptor } from '../contract.js';
import {
  alcanza,
  FINALIDADES,
  menor,
  SIN_PERMISO,
  type CategoriaConcedida,
  type Finalidad,
  type Permiso,
} from './categorias.js';
import { buscarConcesion, type Politica } from './politica.js';

/** Por que se concede o se deniega. */
export type MotivoPermiso =
  /** Concedido. */
  | 'E_CONCEDIDO'
  /** No hay concesion para esta tool: el deny by default. */
  | 'E_SIN_CONCESION'
  /** La tool no declara ese perfil: el techo declarado. */
  | 'E_TECHO_DECLARADO'
  /** La categoria pedida no esta en lo concedido. */
  | 'E_CATEGORIA_NO_CONCEDIDA'
  /** La tool no declara que pueda recibir psicometria. */
  | 'E_PSICOMETRIA_NO_DECLARADA'
  /** Esa finalidad no esta consentida. */
  | 'E_FINALIDAD_NO_CONSENTIDA'
  /** La escritura no esta concedida. */
  | 'E_ESCRITURA_NO_CONCEDIDA';

/** El motivo de una denegacion. */
export type MotivoDenegado = Exclude<MotivoPermiso, 'E_CONCEDIDO'>;

/**
 * LA DECISION SOBRE EL CONTEXTO.
 *
 * Concedida lleva la categoria concedida PARA ESTA PETICION, y no el techo
 * entero: el techo servido tal cual filtraria de mas, porque una tool a la que
 * se le pide `preferences` y tiene `usage_history` concedido no puede
 * recibir el historial solo por tener permiso para el. Lo que se pidio es lo
 * que se lleva.
 */
export type DecisionContexto =
  | {
      readonly concedido: true;
      readonly motivo: 'E_CONCEDIDO';
      readonly categoria: CategoriaConcedida;
    }
  | {
      readonly concedido: false;
      readonly motivo: MotivoDenegado;
      readonly categoria: 'none';
    };

/** LA DECISION SOBRE LA PSICOMETRIA: la finalidad, o nada. */
export type DecisionPsicometria =
  | {
      readonly concedido: true;
      readonly motivo: 'E_CONCEDIDO';
      readonly finalidad: Finalidad;
    }
  | {
      readonly concedido: false;
      readonly motivo: MotivoDenegado;
      readonly finalidad: null;
    };

/** LA DECISION SOBRE LA ESCRITURA. */
export type DecisionEscritura =
  | { readonly concedido: true; readonly motivo: 'E_CONCEDIDO' }
  | { readonly concedido: false; readonly motivo: MotivoDenegado };

/**
 * EL PERMISO EFECTIVO: el mas bajo de los dos techos.
 *
 * El techo declarado limita la concesion, y no al reves: una tool que declara
 * `none` no recibe historial porque se le conceda, aunque la politica lo de.
 */
export function permisoDe(descriptor: ToolDescriptor, politica: Politica): Permiso {
  const concesion = buscarConcesion(politica, descriptor);
  if (concesion === undefined) return SIN_PERMISO;
  return Object.freeze({
    categoria: menor(concesion.categoria, descriptor.context_profile),
    psicometria: descriptor.psychometrics
      ? Object.freeze(concesion.psicometria.filter((f) => FINALIDADES.includes(f)))
      : Object.freeze([]),
    escritura: concesion.escritura,
  });
}

/**
 * PIDE CONTEXTO: que categoria de memoria puede leer esta tool.
 *
 * El orden de los motivos importa, porque el motivo es la respuesta: si no hay
 * concesion, esa es la verdad; si la hay pero la tool no declara el perfil, el
 * techo declarado es la verdad; y si declara el perfil pero no esta concedido,
 * lo que falta es la concesion. Decir "no hay concesion" cuando lo que falta es
 * el perfil declarado manda a la persona a cambiar el sitio equivocado.
 */
export function pedirContexto(
  descriptor: ToolDescriptor,
  politica: Politica,
  pedida: CategoriaConcedida,
): DecisionContexto {
  const concesion = buscarConcesion(politica, descriptor);
  if (concesion === undefined) return { concedido: false, motivo: 'E_SIN_CONCESION', categoria: 'none' };
  if (!alcanza(descriptor.context_profile, pedida)) {
    return { concedido: false, motivo: 'E_TECHO_DECLARADO', categoria: 'none' };
  }
  const permiso = permisoDe(descriptor, politica);
  if (!alcanza(permiso.categoria, pedida)) {
    return { concedido: false, motivo: 'E_CATEGORIA_NO_CONCEDIDA', categoria: 'none' };
  }
  return { concedido: true, motivo: 'E_CONCEDIDO', categoria: pedida };
}

/**
 * PIDE PSICOMETRIA: para que finalidad.
 *
 * EL TECHO DECLARADO PRIMERO: una tool que no declara psicometria no la
 * recibe aunque el consentimiento exista, porque el perfil declarado es lo que
 * la tool dice que necesita. Y despues el consentimiento, que es POR
 * FINALIDAD: la finalidad pedida tiene que estar en la lista consentida, y
 * estar consentida otra no sirve.
 */
export function pedirPsicometria(
  descriptor: ToolDescriptor,
  politica: Politica,
  finalidad: Finalidad,
): DecisionPsicometria {
  const concesion = buscarConcesion(politica, descriptor);
  if (concesion === undefined) return { concedido: false, motivo: 'E_SIN_CONCESION', finalidad: null };
  if (!descriptor.psychometrics) {
    return { concedido: false, motivo: 'E_PSICOMETRIA_NO_DECLARADA', finalidad: null };
  }
  if (!concesion.psicometria.includes(finalidad)) {
    return { concedido: false, motivo: 'E_FINALIDAD_NO_CONSENTIDA', finalidad: null };
  }
  return { concedido: true, motivo: 'E_CONCEDIDO', finalidad };
}

/** PIDE ESCRITURA: si esta tool puede escribir en la memoria. */
export function pedirEscritura(
  descriptor: ToolDescriptor,
  politica: Politica,
): DecisionEscritura {
  const concesion = buscarConcesion(politica, descriptor);
  if (concesion === undefined) return { concedido: false, motivo: 'E_SIN_CONCESION' };
  if (!concesion.escritura) return { concedido: false, motivo: 'E_ESCRITURA_NO_CONCEDIDA' };
  return { concedido: true, motivo: 'E_CONCEDIDO' };
}
