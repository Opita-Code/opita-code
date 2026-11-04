/**
 * L6-T1 · LA VALIDACION: lo que se comprueba ANTES de publicar.
 *
 * QUE ES. Tres capas, y son de naturaleza distinta, asi que van separadas:
 *
 *   1. LA HUELLA. El descriptor tiene que ser el que se publico. Va primero
 *      porque validar las reglas de un contenido alterado es medir otra cosa:
 *      si alguien cambio el modulo por el camino, la pregunta relevante no es
 *      si el modulo es valido, sino si es el que te mandaron. Este es el orden
 *      que ya usa `paquete/instalar.ts`.
 *   2. LAS REGLAS. Un modulo tiene que ser un modulo (las 11 reglas de L0) y una
 *      tool suelta tiene que entregar algo y no prometer lo que su tier no
 *      sostiene.
 *   3. LA LISTA BLANCA. Un modulo que declara un nodo T2 solo corre con las
 *      tools que la plataforma permite en backend. Hoy la lista esta VACIA a
 *      proposito, asi que hoy no se publica un modulo con backend: y el rechazo
 *      dice que tool falta por decidir, que es informacion, no un fallo.
 *
 * Y LA CUARTA COSA, QUE NO ES UNA VALIDACION: las afirmaciones.
 *
 *   Una parte se juzga contra su propia afirmacion, asi que el numero de
 *   afirmaciones tiene que ser el numero de partes. Es la misma regla que L5
 *   aplica en el pipeline, y el mismo motivo: pasar la misma afirmacion a
 *   todas las partes produce deriva FALSA.
 *
 * LO QUE ESTE ARCHIVO NO HACE. No llama al juez: el veredicto llega de L5 y
 * lo aplica `publicar.ts`. Aqui solo se produce la `Solicitud`, que es la
 * pregunta con su artefacto, lista para el pipeline.
 */

import { deliveries, integrityOf, type ToolDescriptor } from '../contract.js';
import { tierAllows } from '../axes.js';
import { validate } from '../graph.js';
import type { RejectCode } from '../rules/types.js';
import { revisarWhitelist } from '../juez/whitelist.js';
import type { Encargo } from '../juez/encargo.js';
import { esModulo, type Entrada } from './entrada.js';
import { partesDe, type ParteDelManifiesto } from './manifiesto.js';

export type Rechazo =
  | { readonly motivo: 'huella_distinta'; readonly detalle: string }
  | { readonly motivo: 'modulo_invalido'; readonly codigo: RejectCode; readonly detalle: string }
  | { readonly motivo: 'herramienta_invalida'; readonly detalle: string }
  | { readonly motivo: 'tool_no_permitida'; readonly tools: readonly string[] }
  | { readonly motivo: 'afirmaciones_por_parte'; readonly detalle: string }
  | { readonly motivo: 'afirmacion_vacia'; readonly detalle: string };

export type Validacion =
  | { readonly ok: true; readonly partes: readonly ParteDelManifiesto[] }
  | { readonly ok: false; readonly rechazo: Rechazo };

/**
 * Una tool suelta tiene que poder sostenerse sola.
 *
 * Dos cosas, y las dos son de contrato, no de runtime:
 *   - TIENE QUE ENTREGAR ALGO. Una tool sin salida entregable no es una
 *     unidad de descubrimiento: no hay nada que el usuario pueda pedir.
 *   - SU TIER TIENE QUE SOSTENER SU EFECTO. Una tool T0 que declara red es un
 *     error de contrato, y `axes.ts` dice que se rechaza AL PUBLICAR. Aqui es
 *     donde se publica.
 */
function problemaDeTool(tool: ToolDescriptor): string | null {
  if (deliveries(tool).length === 0) {
    return 'la tool no entrega ninguna salida entregable: no hay nada que descubrir';
  }
  if (!tierAllows(tool.tier, tool.effect)) {
    return `el tier ${tool.tier} no sostiene el efecto ${tool.effect}`;
  }
  return null;
}

/**
 * Valida una entrada contra todo lo que se puede comprobar sin gastar una
 * llamada al juez.
 *
 * El orden de las comprobaciones es fijo, y el primero que falla es el
 * veredicto: es el mismo principio que ordena las reglas de L0.
 */
export function validarEntrada(entrada: Entrada): Validacion {
  const huella = integrityOf(entrada.descriptor);
  if (huella !== entrada.huella) {
    return {
      ok: false,
      rechazo: {
        motivo: 'huella_distinta',
        detalle: `el descriptor canonico produce ${huella} y la entrada declara ${entrada.huella}`,
      },
    };
  }

  if (esModulo(entrada.descriptor)) {
    const reglas = validate(entrada.descriptor);
    if (!reglas.ok) {
      return {
        ok: false,
        rechazo: { motivo: 'modulo_invalido', codigo: reglas.code, detalle: reglas.detail },
      };
    }
    const lista = revisarWhitelist(entrada.descriptor);
    if (!lista.ok) {
      return {
        ok: false,
        rechazo: { motivo: 'tool_no_permitida', tools: lista.tools },
      };
    }
  } else {
    const problema = problemaDeTool(entrada.descriptor);
    if (problema !== null) {
      return { ok: false, rechazo: { motivo: 'herramienta_invalida', detalle: problema } };
    }
  }

  const partes = partesDe(entrada);
  if (partes.length !== entrada.afirmaciones.length) {
    return {
      ok: false,
      rechazo: {
        motivo: 'afirmaciones_por_parte',
        detalle: `el manifiesto tiene ${partes.length} parte(s) y hay ${entrada.afirmaciones.length} afirmacion(es): una parte, una afirmacion`,
      },
    };
  }
  for (const [i, afirmacion] of entrada.afirmaciones.entries()) {
    if (afirmacion.trim() === '') {
      return {
        ok: false,
        rechazo: {
          motivo: 'afirmacion_vacia',
          detalle: `la afirmacion de la parte ${i + 1} esta vacia: no hay nada que el juez pueda sostener`,
        },
      };
    }
  }

  return { ok: true, partes };
}

/** La pregunta para el juez, con su artefacto. */
export interface Solicitud {
  readonly encargo: Encargo;
  readonly partes: readonly ParteDelManifiesto[];
}

/**
 * La solicitud de publicacion: el encargo de L5 y las partes del manifiesto.
 *
 * La `ruta` la da quien publica, y es la ruta del FICHERO del manifiesto: el
 * ambito lo saca L5 de la ruta (L5-T3), y el marketplace no lo decide. Una
 * ruta sin ambito es una PARADA en L5, y aqui se ve antes de gastar la
 * llamada.
 *
 * El riesgo es `alto` porque publicar el trabajo de OTRO es el caso de riesgo
 * alto del pipeline: lo que se publica llega a mas gente que lo que se
 * valida. El consenso lo resuelve L5 con la tabla de ambitos.
 */
export function solicitudDe(entrada: Entrada, ruta: string): Solicitud {
  return {
    encargo: {
      ruta,
      afirmaciones: [...entrada.afirmaciones],
      evalType: 'drift_judge',
      riesgo: 'alto',
    },
    partes: partesDe(entrada),
  };
}
