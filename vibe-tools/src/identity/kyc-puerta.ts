/**
 * LA PUERTA DEL KYC: la evidencia se comprueba antes de que la identidad
 * entre.
 *
 * POR QUE ESTA SEPARADA DEL MODELO. El modelo dice que es una verificacion y
 * que señales hay; esta dice que se COMPRUEBA. Y son dos cosas que cambian
 * por motivos distintos: el modelo cambia cuando cambia lo que se puede
 * declarar, y la puerta cambia cuando cambia lo que se comprueba. Con las dos
 * en un archivo, un cambio de una se lleva el otro.
 *
 * LO QUE COMPRUEBA, Y CADA COSA POR QUE.
 *   - Que el estado sea uno de los tres. Un estado inventado no es un estado.
 *   - Que `simulada` NO traiga evidencia: si no dice estar verificada, no
 *     tiene por que traer pruebas, y traerlas es llevar de mas.
 *   - Que un estado verificado traiga evidencia. Sin ella no hay quien lo
 *     respalde, y declararla seria una mentira publicable.
 *   - Que la evidencia traiga las señales que ese estado exige: las cuatro
 *     documentales, y la registral para el estado verificada.
 *   - Que el stack y la fecha esten. Un stack sin nombre no es un stack, y una
 *     fecha ilegible no es una fecha.
 *
 * LO QUE NO COMPRUEBA. Que el stack haya hecho lo que dice: eso es la palabra
 * del harness. Aqui se comprueba la forma, no la verdad.
 */

import { senalesQueExige } from './kyc.js';

/** Por que una verificacion no sirve. */
export type MotivoKyc =
  | 'E_KYC_INVALIDO'
  | 'E_KYC_SIN_STACK'
  | 'E_KYC_SIN_SENALES'
  | 'E_KYC_CON_EVIDENCIA';

/** Una fecha es una fecha: el formato ISO, o no es fecha. */
const FECHA = /^\d{4}-\d{2}-\d{2}T/;

/** Los campos que la evidencia puede llevar. */
const CAMPOS_EVIDENCIA = ['senales', 'stack', 'fecha'];

/**
 * LA PUERTA DEL KYC. Devuelve la lista de motivos, no un booleano: un
 * llamador quiere saber todo lo que esta mal.
 */
export function validarKyc(kyc: unknown): MotivoKyc[] {
  if (kyc === null || typeof kyc !== 'object') return ['E_KYC_INVALIDO'];
  const k = kyc as Record<string, unknown>;
  const estado = k['estado'];
  if (estado !== 'simulada' && estado !== 'documental' && estado !== 'verificada') {
    return ['E_KYC_INVALIDO'];
  }
  if (estado === 'simulada') {
    // Sin evidencia. Una identidad que no dice estar verificada no trae pruebas.
    if (k['evidencia'] !== undefined) return ['E_KYC_CON_EVIDENCIA'];
    return [];
  }
  const evidencia = k['evidencia'];
  if (evidencia === null || typeof evidencia !== 'object') return ['E_KYC_SIN_STACK'];
  const e = evidencia as Record<string, unknown>;
  for (const campo of Object.keys(e)) {
    if (!CAMPOS_EVIDENCIA.includes(campo)) return ['E_KYC_INVALIDO'];
  }
  const stack = e['stack'];
  if (typeof stack !== 'string' || stack.trim().length === 0) return ['E_KYC_SIN_STACK'];
  const fecha = e['fecha'];
  if (typeof fecha !== 'string' || !FECHA.test(fecha)) return ['E_KYC_INVALIDO'];
  const senales = e['senales'];
  if (!Array.isArray(senales)) return ['E_KYC_SIN_SENALES'];
  const faltan = senalesQueExige(estado).filter((s) => !senales.includes(s));
  if (faltan.length > 0) return ['E_KYC_SIN_SENALES'];
  return [];
}
