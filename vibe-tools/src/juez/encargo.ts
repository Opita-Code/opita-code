/**
 * L5-T1 · EL ENCARGO: lo que hay que comprobar ANTES de gastar una llamada.
 *
 * Un encargo es la pregunta que se le hace al juez sobre un artefacto: la
 * ruta, la afirmacion central y el tipo de evaluacion. Todo lo que se puede
 * rechazar sin llamar al proveedor se rechaza aqui, porque una llamada que se
 * descarta despues ya costo tokens.
 *
 * QUE SE COMPRUEBA, Y POR QUE CADA COSA.
 *
 *   1. EL AMBITO. Si la ruta no tiene ambito, no hay pregunta que hacer. Se
 *      para; no se adivina la clase del artefacto.
 *   2. EL TIPO DE EVALUACION. El pipeline es de `drift_judge` y de nada mas.
 *      El juez tiene otros trece tipos (brand_match, pii_detect, ...), y
 *      pedirle otro por este camino daria un veredicto que el pipeline no
 *      sabe leer. Un tipo ajeno se rechaza, no se ignora.
 *   3. LAS AFIRMACIONES. Una por parte, porque una parte se juzga contra su
 *      propia pregunta (judge-partes.md). Vacia no es una afirmacion: es una
 *      llamada que el juez neutrara. Con saltos de linea tampoco: el contrato
 *      del juez la pide de un parrafo, y una lista enumerada produce
 *      neutralidad (medido, cinco intentos, cinco formas). Y si pasa del tope
 *      de bytes, el proveedor la trunca.
 *   4. LAS PARTES. Ninguna vacia y ninguna por encima del tope. Una parte que
 *      se pasa no se recorta: se parte por concepto, que es lo que el tope
 *      existe para provocar.
 *
 * EL TOPE DE LA AFIRMACION NO ES INVENTADO. El binding del juez declara
 * `max_hypothesis_bytes` en 4096, y una hipotesis mas larga llega truncada.
 * El valor por defecto lo refleja; el llamador puede pasarlo, porque es
 * configuracion del proyecto y no una garantia del framework.
 *
 * LO QUE ESTE ARCHIVO NO HACE. No parte el artefacto: recibe las partes ya
 * partidas por concepto (`tools/juez-partes.mjs`, que es la unica
 * implementacion de la partida) y solo comprueba su forma.
 */

import { type Ambito } from './ambitos.js';
import { ambitoDe, consensoDe } from './ruta-de-ambito.js';

/** Los tipos de evaluacion que este pipeline sabe leer. Hoy, uno. */
export const EVAL_TYPES_DEL_PIPELINE: readonly string[] = Object.freeze(['drift_judge']);

/** El tope de la hipotesis: refleja `max_hypothesis_bytes` del binding del juez. */
export const TOPE_AFIRMACION = 4096;

export interface Encargo {
  /** La ruta del artefacto, relativa a la raiz del repositorio. */
  readonly ruta: string;
  /**
   * Las afirmaciones, una por parte y en el orden de las partes. Una parte se
   * juzga contra su propia pregunta: pasar la misma a todas convierte el
   * veredicto de un fragmento en ruido.
   */
  readonly afirmaciones: readonly string[];
  /** El tipo de evaluacion. Solo `drift_judge` por este camino. */
  readonly evalType: string;
  /** `alto` sube el consenso a 3 aunque el ambito pida 1. */
  readonly riesgo?: 'normal' | 'alto';
}

export type MotivoDeRechazo =
  | 'sin_ambito'
  | 'eval_type_ajeno'
  | 'afirmacion_vacia'
  | 'afirmacion_multilinea'
  | 'afirmacion_grande';

export type Revision =
  | {
      readonly ok: true;
      readonly ambito: Ambito;
      readonly consenso: number;
      readonly riesgo: 'normal' | 'alto';
    }
  | {
      readonly ok: false;
      readonly motivo: MotivoDeRechazo;
      readonly detalle: string;
    };

const encoder = new TextEncoder();

/** Los bytes UTF-8 de un texto. La misma medida que ve el proveedor. */
export function bytesDe(texto: string): number {
  return encoder.encode(texto).length;
}

function rechazo(motivo: MotivoDeRechazo, detalle: string): Revision {
  return { ok: false, motivo, detalle };
}

/**
 * Revisa el encargo. Si pasa, devuelve el ambito y el consenso ya resueltos:
 * el pipeline no vuelve a consultar la tabla.
 */
export function revisarEncargo(encargo: Encargo, topeAfirmacion: number = TOPE_AFIRMACION): Revision {
  const ambito = ambitoDe(encargo.ruta);
  if (ambito === null) {
    return rechazo(
      'sin_ambito',
      `la ruta ${encargo.ruta} no tiene ambito asignado; se para en vez de adivinar la clase del artefacto`,
    );
  }

  if (!EVAL_TYPES_DEL_PIPELINE.includes(encargo.evalType)) {
    return rechazo(
      'eval_type_ajeno',
      `este pipeline solo lee ${EVAL_TYPES_DEL_PIPELINE.join(', ')}; se pidio ${encargo.evalType}`,
    );
  }

  if (encargo.afirmaciones.length === 0) {
    return rechazo('afirmacion_vacia', 'sin afirmacion no hay nada que el juez pueda sostener');
  }
  for (const [i, afirmacion] of encargo.afirmaciones.entries()) {
    const cual = `la afirmacion de la parte ${i + 1}`;
    if (afirmacion.trim() === '') {
      return rechazo('afirmacion_vacia', `${cual} esta vacia: no hay nada que el juez pueda sostener`);
    }
    if (afirmacion.includes('\n')) {
      return rechazo(
        'afirmacion_multilinea',
        `${cual} va en un parrafo; una lista enumerada produce neutralidad, no entailment`,
      );
    }
    const bytes = bytesDe(afirmacion);
    if (bytes > topeAfirmacion) {
      return rechazo(
        'afirmacion_grande',
        `${cual} mide ${bytes} B y el tope es ${topeAfirmacion} B; el proveedor la truncaria`,
      );
    }
  }

  const riesgo = encargo.riesgo ?? 'normal';
  return { ok: true, ambito, consenso: consensoDe(ambito, riesgo), riesgo };
}
