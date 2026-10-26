/**
 * LA VALIDACION: lo que llega de afuera se comprueba antes de entrar.
 *
 * POR QUE EN RUNTIME. El union discriminado protege en tiempo de compilacion,
 * y esa proteccion se pierde en cuanto el objeto se arma a mano: un contexto
 * se puede construir sin pasar por la fabrica (L4-T1 lo mostro), y ahi el
 * compilador ya no mira. El repositorio no confía en el llamador, y esta es
 * la puerta donde se comprueba.
 *
 * LO QUE SE COMPRUEBA, Y CADA COSA POR QUE.
 *   - La clave se DERIVA del tipo y del id. Si no coincide, una identidad
 *     legal puede estar apuntando al mod de la empresa, y la separacion de
 *     identidades (boundary, seccion 4) se deshace en silencio.
 *   - Cada tipo lleva SOLO sus campos. Un campo que no es del tipo es un dato
 *     que viaja de mas: el nombre de la persona legal en la identidad de la
 *     empresa es el cruce que el boundary prohibe.
 *   - El anonimo NO lleva campos localizadores (A6 = opcion 4).
 *   - El KYC se comprueba con su propia puerta: la evidencia, y que traiga las
 *     señales que el estado exige.
 *
 * LO QUE NO COMPRUEBA. La FORMA, no la verdad: no sabe si el id existe, ni si
 * el nickname viene de un pool cerrado. Eso lo sabe el harness, el unico actor
 * con autoridad de seleccion.
 */

import { CAMPOS_POR_TIPO, namespaceDe, PREFIJOS, type Identity, type IdentityKind } from '../identity.js';
import { LOCALIZADORES } from './antifraude.js';
import { validarKyc, type MotivoKyc } from './kyc-puerta.js';

/** Por que una identidad puede no servir. */
export type MotivoIdentidad =
  | MotivoKyc
  | 'E_NAMESPACE'
  | 'E_CAMPO_EXTRA'
  | 'E_RAZON_SOCIAL_VACIA'
  | 'E_NICKNAME_VACIO'
  | 'E_ANONIMO_LOCALIZABLE';

/**
 * Valida una identidad que llego de afuera. Devuelve la LISTA de motivos, no
 * un booleano: un llamador quiere saber todo lo que esta mal, no solo lo
 * primero que se cruzo.
 */
export function validarIdentidad(candidata: unknown): MotivoIdentidad[] {
  const motivos: MotivoIdentidad[] = [];
  if (candidata === null || typeof candidata !== 'object') return ['E_NAMESPACE'];
  const c = candidata as Record<string, unknown>;
  const kind = c['kind'];
  const id = c['id'];
  if (typeof kind !== 'string' || typeof id !== 'string' || id.length === 0) {
    return ['E_NAMESPACE'];
  }
  // `Object.hasOwn` y no `in`: el prototipo de Object tiene `constructor` y
  // `toString`, y un kind con ese nombre pasaria el filtro sin existir.
  if (!Object.hasOwn(PREFIJOS, kind)) return ['E_NAMESPACE'];
  const k = kind as IdentityKind;

  if (c['projectId'] !== namespaceDe(k, id)) motivos.push('E_NAMESPACE');

  const permitidos = CAMPOS_POR_TIPO[k];
  for (const campo of Object.keys(c)) {
    if (permitidos.includes(campo)) continue;
    if (k === 'anonimo' && LOCALIZADORES.includes(campo)) {
      motivos.push('E_ANONIMO_LOCALIZABLE');
      continue;
    }
    motivos.push('E_CAMPO_EXTRA');
  }

  if (k === 'legal') {
    // El KYC tiene su propia puerta: la evidencia y las señales que exige.
    motivos.push(...validarKyc(c['kyc']));
  }
  if (k === 'empresa') {
    const rs = c['razonSocial'];
    if (typeof rs !== 'string' || rs.trim().length === 0) motivos.push('E_RAZON_SOCIAL_VACIA');
  }
  if (k === 'anonimo') {
    const nick = c['nickname'];
    if (typeof nick !== 'string' || nick.trim().length === 0) motivos.push('E_NICKNAME_VACIO');
  }
  return motivos;
}

/** La identidad no sirve, y estos son los motivos. */
export class IdentidadInvalidaError extends Error {
  readonly motivos: MotivoIdentidad[];
  constructor(motivos: MotivoIdentidad[]) {
    super(`identidad invalida: ${motivos.join(', ')}`);
    this.name = 'IdentidadInvalidaError';
    this.motivos = motivos;
  }
}

/**
 * LA PUERTA: si la identidad no sirve, no se sella. Falla con el motivo y no
 * en silencio: un contexto invalido no llega a existir como contexto de una
 * tool.
 */
export function afirmarIdentidad(identity: Identity): void {
  const motivos = validarIdentidad(identity);
  if (motivos.length > 0) throw new IdentidadInvalidaError(motivos);
}
