/**
 * EL VOCABULARIO DEL PUERTO DE EFECTOS.
 *
 * Una tool nunca toca `fetch`, ni `fs`, ni `process`. Recibe un puerto y ese es
 * todo lo que ve. La garantia dinamica del sandbox se sostiene en un hecho
 * estructural, no en una promesa:
 *
 *   EL PUERTO DENEGADO NO CONTIENE NINGUNA REFERENCIA AL HOST.
 *
 * No hay socket, ni file handle, ni process object que extraer. Denegar no es
 * revocar un permiso: es la ausencia de poder. Por eso una tool que IGNORA el
 * resultado del deniego tampoco escapa, caso que un "permission denied" clasico
 * no cubre: si solo se negara la llamada pero el objeto existiera, con ignorar el
 * retorno bastaria.
 *
 * `denied` y `unimplemented` estan separados a proposito. Denegado es el sandbox
 * funcionando; no implementado es el sandbox sin transporte. Confundirlos haria
 * creer que el sandbox funciona cuando en realidad nadie lo probo.
 */

import type { Capability } from '../capability.js';
import type { Tier } from '../../axes.js';

/** Por que una operacion no produjo valor. */
export type DenialKind =
  /** El sandbox no concede esa capacidad. No habria implementacion que la diera. */
  | 'denied'
  /** El sandbox concede la capacidad, pero el MVP no tiene backend. */
  | 'unimplemented';

export type EffectResult =
  | { readonly ok: true; readonly value: unknown }
  | {
      readonly ok: false;
      readonly why: DenialKind;
      readonly capability: Capability;
      readonly detail: string;
    };

/** Un intento registrado en la bitacora. Congelado: el rastro no se edita. */
export interface EffectAttempt {
  readonly capability: Capability;
  readonly op: string;
  readonly granted: boolean;
}

export interface EffectPort {
  /** Capacidades que este sandbox concede. Es informacion, no permiso. */
  readonly granted: readonly Capability[];
  net(url: string): EffectResult;
  fs(op: 'read' | 'write', path: string, body?: string): EffectResult;
  proc(argv: readonly string[]): EffectResult;
  /** Bitacora de todo lo intentado, en orden. */
  readonly attempts: readonly EffectAttempt[];
}

/**
 * Backend opcional. En el MVP no hay ninguno real: T1 y T2 tienen politica pero
 * no transporte.
 */
export interface EffectBackend {
  net?(url: string): unknown;
  fs?(op: 'read' | 'write', path: string, body?: string): unknown;
  proc?(argv: readonly string[]): unknown;
}

export type PortTier = Tier;
