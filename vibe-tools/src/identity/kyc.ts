/**
 * EL KYC: los tres estados de la verificacion, y la evidencia que los respalda.
 *
 * QUE ES. La verificacion de una identidad legal tiene tres estados, y cada
 * uno dice QUE se comprobo:
 *   - SIMULADA: no se comprobo nada. Es con el que nace una identidad, y el
 *     unico que el runtime puede respaldar sin evidencia.
 *   - DOCUMENTAL: se comprobo el documento, hubo liveness, se cotejo el rostro
 *     y se corrio el screening. Son las cuatro señales que el stack libre
 *     cubre (L4-T2), y es lo que la decision A1 autoriza a publicar.
 *   - VERIFICADA: las cuatro de antes y la registral, que solo existe con un
 *     contrato con el registro oficial.
 *
 * POR QUE LA EVIDENCIA ES UN UNION. Un estado sin evidencia seria una cadena
 * libre, y cualquiera podria subirlo a mano: la puerta no tendria nada que
 * mirar. Con la evidencia al lado, el compilador obliga a que un estado
 * verificado la traiga, y la puerta comprueba que traiga las señales que ese
 * estado exige.
 *
 * LO QUE NO COMPRUEBA. La FORMA, no la verdad: que el stack haya hecho lo que
 * dice es la palabra del harness, y el runtime no lo sabe. Lo que si comprueba
 * es que el estado y las señales no se contradigan entre si.
 */

/** Las señales que el stack libre cubre (L4-T2, decision A1). */
export type SenalKyc = 'documento' | 'liveness' | 'cotejo' | 'screening' | 'registral';

/** Los estados de la verificacion. */
export type KycEstado = 'simulada' | 'documental' | 'verificada';

/** Las cuatro señales documentales, en orden fijo. */
export const SENALES_DOCUMENTALES: readonly SenalKyc[] = Object.freeze([
  'documento',
  'liveness',
  'cotejo',
  'screening',
]);

/** La evidencia: que se comprobo, quien lo comprobo y cuando. */
export interface EvidenciaKyc {
  readonly senales: readonly SenalKyc[];
  readonly stack: string;
  readonly fecha: string;
}

/**
 * LA VERIFICACION, COMO UNION. `simulada` no lleva evidencia: no hay nada que
 * mostrar. Los otros dos estados la llevan porque sin ella no hay respaldo, y
 * una identidad que dice estar verificada sin evidencia es una mentira
 * publicable.
 */
export type VerificacionKyc =
  | { readonly estado: 'simulada' }
  | { readonly estado: 'documental'; readonly evidencia: EvidenciaKyc }
  | { readonly estado: 'verificada'; readonly evidencia: EvidenciaKyc };

/** Las señales que un estado exige. `verificada` exige ademas la registral. */
export function senalesQueExige(estado: 'documental' | 'verificada'): readonly SenalKyc[] {
  if (estado === 'verificada') return Object.freeze([...SENALES_DOCUMENTALES, 'registral']);
  return SENALES_DOCUMENTALES;
}

/**
 * LA EVIDENCIA, COPIADA Y CONGELADA. Copia y no congelacion: congelar el
 * objeto del llamador le dejaria a el un objeto congelado que no pidio. Y
 * copiada por dentro tambien: el array de señales es un objeto mas, y
 * congelar solo la superficie dejaria las señales mutables.
 */
export function congelarEvidencia(evidencia: EvidenciaKyc): EvidenciaKyc {
  return Object.freeze({
    senales: Object.freeze([...evidencia.senales]),
    stack: evidencia.stack,
    fecha: evidencia.fecha,
  });
}
