/**
 * EL VOCABULARIO DE UNA CORRIDA.
 *
 * Preocupacion propia: aqui solo hay DATOS de lo que paso, y la unica factory que
 * los construye. El runner produce estos datos; leerlos —que entrego el modulo,
 * si la tool cumplio su contrato— es `deliver.ts`.
 *
 * POR QUE `NodeRun` EXISTE Y NO BASTA CON EL RESULTADO FINAL
 * Un modulo que falla en el nodo 3 de 5 no es "un modulo que fallo": llego al 2 y
 * se detuvo en el 3. Sin el registro por nodo el autor no sabe que corrio, y
 * `checksRun` de L0 ya habia demostrado que saber CUANTO trabajo se hizo es
 * informacion, no ruido.
 *
 * Y `reused` va por nodo: responde si esa corrida hizo el trabajo o se sirvio de lo
 * que ya estaba. Sin el, dos corridas de duracion distinta son indistinguibles.
 */

import type { ToolDescriptor, ToolOutput } from '../contract.js';
import type { EffectAttempt } from '../sandbox/effects/port.js';
import type { SharePolicy } from './share.js';

export type ModuleErrorCode =
  | 'E_UNBOUND_INPUT'
  | 'E_MISSING_TOOL'
  | 'E_NODE_FAILED'
  | 'E_PORT_NOT_EMITTED'
  | 'E_NOT_COMPILED';

/** Lo que paso en UN nodo. Se acumula aunque el modulo entero falle. */
export interface NodeRun {
  readonly node: string;
  /** `id@version`, como se resolvio en el registry. */
  readonly tool: string;
  readonly kind: SharePolicy['kind'];
  /** El valor se sirvio de la cache en vez de ejecutar la tool. */
  readonly reused: boolean;
  readonly ok: boolean;
  /** Codigo de fallo: el del sandbox, o `E_MISSING_TOOL`. Nulo si ok. */
  readonly code: string | null;
  readonly detail: string | null;
  readonly outputs: readonly ToolOutput[];
  /**
   * Bitacora de intentos de I/O del sandbox, tal cual, tambien en el exito.
   *
   * Viaja con la corrida porque sin ella el limite del modulo pierde la garantia
   * de L1: un modulo entero podria haber intentado salir por la red y el run no
   * tendria donde decirlo. `deniedCount` sobre esto sigue siendo la metrica de
   * exfiltracion, ahora despues de cruzar el modulo.
   */
  readonly attempts: readonly EffectAttempt[];
}

export interface ModuleFailure {
  readonly node: string;
  readonly code: ModuleErrorCode | string;
  readonly detail: string;
}

export interface ModuleOutcome {
  /** Todas las corridas, en orden topologico, hasta donde se llego. */
  readonly runs: readonly NodeRun[];
  /**
   * Entregas del modulo, por `nodo:puerto`.
   *
   * VACIO cuando la corrida fallo. Un modulo que fallo no entrega: devolver
   * entradas a medias seria dejar que un consumidor no distinga "no hay artifact"
   * de "el artifact es este".
   */
  readonly deliveries: ReadonlyMap<string, unknown>;
  readonly failure: ModuleFailure | null;
  /** Si el modulo completo corrio sin fallos. */
  readonly ok: boolean;
}

/** La unica factory de `NodeRun`. */
export function nodeRun(
  name: string,
  tool: ToolDescriptor,
  kind: SharePolicy['kind'],
  reused: boolean,
  ok: boolean,
  code: string | null,
  detail: string | null,
  outputs: readonly ToolOutput[],
  attempts: readonly EffectAttempt[] = [],
): NodeRun {
  return { node: name, tool: `${tool.id}@${tool.version}`, kind, reused, ok, code, detail, outputs, attempts };
}
