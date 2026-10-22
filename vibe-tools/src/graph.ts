/**
 * VALIDACION DE COMPOSICION — orquestador.
 *
 * El ORDEN de las reglas vive aqui y en ningun otro sitio. Importa: el primer
 * rechazo es el veredicto, y un orden fijo es lo que hace la funcion
 * determinista y por tanto testeable.
 *
 *   R0  nombres sin ':'              rules/identity.ts
 *   R1  sin nodos duplicados         rules/identity.ts
 *   R11 tier admite el efecto        rules/identity.ts
 *   R2  extremos de arista existen   rules/edges.ts
 *   R3  puertos existen              rules/edges.ts
 *   R4  eje 1 coincide               rules/edges.ts
 *   R5  determinista exige entradas  rules/edges.ts
 *   R6  artifact no se compone       rules/edges.ts
 *   R7  sinks existen y son terminal rules/terminals.ts
 *   R8  terminal esta declarado      rules/terminals.ts
 *   R9  el modulo entrega artifact   rules/terminals.ts
 */

import { integrityOf, type ModuleDescriptor, type ToolDescriptor } from './contract.js';
import { ruleNames, ruleNoDuplicates, ruleTierAllowsEffect } from './rules/identity.js';
import { ruleEdges } from './rules/edges.js';
import {
  ruleSinksExist,
  ruleSinksAreTerminal,
  ruleTerminalsDeclared,
  ruleDeliversArtifact,
} from './rules/terminals.js';
import { Checker, type RuleResult, type RuleState } from './rules/types.js';

export interface CompiledModule {
  readonly module: ModuleDescriptor;
  readonly integrity: string;
  /** Orden estable de nodos: el que se ejecutaria en T0. */
  readonly executionOrder: readonly string[];
  /** Cuantas verificaciones corrieron. Sondas de rigor del verificador. */
  readonly checksRun: number;
}

export type Validation =
  | { readonly ok: true; readonly plan: CompiledModule }
  | {
      readonly ok: false;
      readonly code: import('./rules/types.js').RejectCode;
      readonly detail: string;
      readonly at: string | null;
      readonly checksRun: number;
    };

function indexOutEdges(mod: ModuleDescriptor): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of mod.edges) {
    const k = `${e.from}:${e.fromPort}`;
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return m;
}

function indexNodes(mod: ModuleDescriptor): Map<string, ToolDescriptor> {
  const m = new Map<string, ToolDescriptor>();
  for (const n of mod.nodes) m.set(n.node, n.tool);
  return m;
}

export function validate(mod: ModuleDescriptor): Validation {
  const c = new Checker();
  const byId = indexNodes(mod);
  const outEdges = indexOutEdges(mod);
  const state: RuleState = {
    module: mod,
    byId,
    outEdges,
    declared: new Set(mod.sinks),
  };

  // Orden fijo. Cada entrada devuelve o el valor que la siguiente necesita, o el rechazo.
  const pipeline: Array<[string, (s: RuleState, k: Checker) => RuleResult<void>]> = [
    ['R0', ruleNames],
    ['R1', ruleNoDuplicates],
    ['R11', ruleTierAllowsEffect],
    ['R2..R6', ruleEdges],
    ['R7a-c', ruleSinksExist],
    ['R7d', ruleSinksAreTerminal],
    ['R8', ruleTerminalsDeclared],
    ['R9', ruleDeliversArtifact],
  ];

  for (const [id, rule] of pipeline) {
    const r = rule(state, c);
    if (!r.ok) {
      return {
        ok: false,
        code: r.rejection.code,
        detail: `${id}: ${r.rejection.detail}`,
        at: r.rejection.at,
        checksRun: c.total,
      };
    }
  }

  return {
    ok: true,
    plan: {
      module: mod,
      integrity: integrityOf(mod),
      executionOrder: mod.nodes.map((n) => n.node),
      checksRun: c.total,
    },
  };
}

export { REJECT_CODES } from './rules/types.js';
export type { RejectCode } from './rules/types.js';