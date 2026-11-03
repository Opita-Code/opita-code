/**
 * L4-T6 · LA INSTALACION: lo que se hace con un paquete que viene de fuera.
 *
 * QUE ES. El unico camino por el que un paquete entra en el runtime. Y hace
 * tres cosas, en este orden: mira que la forma sea la de este formato,
 * comprueba que el contenido no haya cambiado, y valida el modulo con las
 * reglas de composicion.
 *
 * EL ORDEN, Y POR QUE ESTE.
 *
 *   1. LA FORMA. Un paquete con un campo que no existe, o de otro formato, o
 *      de otra version de formato, no se mira: no se sabe que reglas se le
 *      aplican.
 *   2. LA HUELLA. Dice si el contenido es el que se exporto. Va antes que las
 *      reglas porque validar reglas de un contenido alterado es medir otra
 *      cosa: si alguien cambio el modulo por el camino, la pregunta relevante
 *      no es si el modulo es valido, sino si es el que te mandaron.
 *   3. LAS REGLAS. El modulo tiene que ser un modulo: nodos que no se
 *      repiten, aristas que apuntan a puertos que existen, sinks que son
 *      terminales. Un grafo invalido no se ejecuta.
 *
 * LO QUE INSTALAR NO HACE, Y ES LO IMPORTANTE.
 *
 *   INSTALAR NO CONCEDE NINGUN PERMISO.
 *
 * El paquete declara lo que sus tools necesitan (el techo de cada una), pero
 * declararlo no es obtenerlo: conceder es un acto del operador, por la puerta
 * de L4-T5, con su motivo y su registro. Por eso la instalacion devuelve una
 * politica VACIA, y no "la politica que hubiera": la politica que sale de
 * instalar un paquete es siempre la misma, y es la de no tener nada.
 *
 * Y no es una disciplina: es la forma del resultado. No hay ningun camino por
 * el que instalar devuelva una politica con concesiones, de modo que la
 * pregunta "¿este paquete tiene permisos?" no tiene caso: no los tiene, y
 * desde el tipo se ve.
 *
 * ESTE ES EL CASO E6 Y T5 DEL BOUNDARY. Un `.opitapack` malicioso instalado no
 * puede pedir contexto: sus tools no tienen concesion, y la puerta lo dice
 * con su motivo. Y no puede escribir: la escritura tambien es una concesion,
 * y tampoco la tiene.
 *
 * LO QUE LA INSTALACION NO HACE.
 *
 *   - NO RESUELVE EL CODIGO DE LAS TOOLS. La magia se resuelve por (id,
 *     version) en el registry; el paquete lleva la promesa.
 *   - NO ESCRIBE NADA EN NINGUN SITIO. Instalar es una operacion pura: mira
 *     un paquete y devuelve el modulo, las peticiones y la politica. Quien
 *     lo guarda en disco es el harness, que es quien sabe donde vive.
 */

import { integrityOf } from '../contract.js';
import { validate } from '../graph.js';
import { POLITICA_VACIA, type Politica } from '../permisos/politica.js';
import {
  peticionesDe,
  validarPaquete,
  type MotivoPaquete,
  type Paquete,
  type Peticion,
} from './formato.js';

/**
 * EL RESULTADO DE INSTALAR.
 *
 * Es el modulo instalado con su politica y sus peticiones, o el motivo por el
 * que no se instalo. Un motivo, no un `false`: quien instala necesita saber
 * que hacer, y "no se instalo" no dice si hay que rehacerlo o abandonarlo.
 */
export type Instalacion =
  | {
      readonly ok: true;
      /** El modulo, ya validado. */
      readonly modulo: Paquete['modulo'];
      /** El orden topologico que las reglas calcularon. */
      readonly orden: readonly string[];
      /**
       * LA POLITICA DEL PAQUETE INSTALADO: SIEMPRE VACIA.
       *
       * Instalar no concede. La politica sale de instalar una cosa, y esa
       * cosa es "nada". Conceder es del operador, y su politica es suya.
       */
      readonly politica: Politica;
      /** Lo que el paquete pide, derivado de sus tools. */
      readonly peticiones: readonly Peticion[];
    }
  | { readonly ok: false; readonly motivo: MotivoPaquete; readonly detalle: string };

/**
 * INSTALAR UN PAQUETE.
 *
 * El paquete entra como `unknown` a proposito: viene de un fichero, y el
 * compilador no ha visto nunca ese objeto. Todo lo que se acepta de fuera
 * entra por aqui, y sale o con el modulo o con el motivo.
 */
export function instalarPaquete(candidato: unknown): Instalacion {
  const forma = validarPaquete(candidato);
  if (!forma.ok) {
    return { ok: false, motivo: forma.motivo, detalle: forma.detalle };
  }
  const paquete = forma.paquete;

  const huella = integrityOf(paquete.modulo);
  if (huella !== paquete.huella) {
    return {
      ok: false,
      motivo: 'E_HUELPA',
      detalle: `la huella declarada ${paquete.huella} no es la del contenido ${huella}`,
    };
  }

  const validacion = validate(paquete.modulo);
  if (!validacion.ok) {
    return {
      ok: false,
      motivo: 'E_MODULO_INVALIDO',
      detalle: `${validacion.code}: ${validacion.detail}`,
    };
  }

  return {
    ok: true,
    modulo: validacion.plan.module,
    orden: validacion.plan.executionOrder,
    politica: POLITICA_VACIA,
    peticiones: peticionesDe(paquete),
  };
}
