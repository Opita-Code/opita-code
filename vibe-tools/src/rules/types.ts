/**
 * Tipos compartidos por las reglas de composicion.
 *
 * Cada archivo de rules/ es una unidad juzgable por el gate: tiene su propio
 * SpecIntent y cabe en un solo chunk. El orden fijo de las reglas vive en
 * graph.ts, el orquestador. Agregar una regla es agregar un archivo y una
 * linea, no editar una funcion de 200 lineas.
 */

import type { ModuleDescriptor, ToolDescriptor } from '../contract.js';

export type RejectCode =
  | 'E_BAD_REF'
  | 'E_DUPLICATE_NODE'
  | 'E_DANGLING_NODE'
  | 'E_PORT_NOT_FOUND'
  | 'E_AXIS_MISMATCH'
  | 'E_NONDETERMINISTIC_INPUT'
  | 'E_ARTIFACT_NOT_TERMINAL'
  | 'E_SINK_NOT_FOUND'
  | 'E_SINK_NOT_TERMINAL'
  | 'E_UNDECLARED_SINK'
  | 'E_NO_ARTIFACT'
  | 'E_TIER_EFFECT'
  | 'E_CYCLE';

export const REJECT_CODES: readonly RejectCode[] = [
  'E_BAD_REF',
  'E_DUPLICATE_NODE',
  'E_DANGLING_NODE',
  'E_PORT_NOT_FOUND',
  'E_AXIS_MISMATCH',
  'E_NONDETERMINISTIC_INPUT',
  'E_ARTIFACT_NOT_TERMINAL',
  'E_SINK_NOT_FOUND',
  'E_SINK_NOT_TERMINAL',
  'E_UNDECLARED_SINK',
  'E_NO_ARTIFACT',
  'E_TIER_EFFECT',
  'E_CYCLE',
];

export interface Rejection {
  readonly code: RejectCode;
  readonly detail: string;
  readonly at: string | null;
}

export type RuleResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly rejection: Rejection };

export function pass<T>(value: T): RuleResult<T> {
  return { ok: true, value };
}

export function fail(code: RejectCode, detail: string, at: string | null = null): RuleResult<never> {
  return { ok: false, rejection: { code, detail, at } };
}

/**
 * Contador de verificaciones. Hace OBSERVABLE el rigor del verificador: el
 * plan compilado lleva cuantas comprobaciones se hicieron, asi que un modulo
 * validado con 4 comprobaciones y otro con 40 se distinguen a simple vista.
 */
export class Checker {
  n = 0;

  count(k = 1): void {
    this.n += k;
  }

  get total(): number {
    return this.n;
  }
}

/** Estado compartido que las rules van construyendo a lo largo del pipeline. */
export interface RuleState {
  readonly module: ModuleDescriptor;
  readonly byId: ReadonlyMap<string, ToolDescriptor>;
  /** `nodo:puerto` -> numero de aristas salientes. */
  readonly outEdges: ReadonlyMap<string, number>;
  /** Sinks ya validados y declarados. Lo consume la regla de no declarar. */
  readonly declared: ReadonlySet<string>;
  /**
   * L2. Orden topologico de ejecucion.
   *
   * Unico campo NO readonly del estado, y es deliberado: lo escribe
   * `rules/order.ts` y lo leen el orquestador y el runner del modulo. Es el unico
   * dato que una regla produce y otra consume, asi que va en el estado y no como
   * valor de retorno que habria que propagar por la tuberia a mano.
   * El binding es mutable, el valor es inmutable: se congela antes de guardarlo.
   */
  order: readonly string[];
}

export type Rule<T = void> = (state: RuleState, c: Checker) => RuleResult<T>;
