/**
 * Reglas de identidad: R0, R1, R11.
 *
 * Las tres contestan la misma pregunta de fondo — ¿esto es siquiera un modulo
 * identificable? — asi que van juntas. Corre elPrimero, antes de que cualquier
 * regla intente interpretar aristas o sinks.
 */

import { tierAllows } from '../axes.js';
import type { RuleResult, RuleState } from './types.js';
import { pass, fail } from './types.js';
import type { Checker } from './types.js';
import type { ToolDescriptor } from '../contract.js';

/** R0: los ids de nodo y los nombres de puerto no pueden contener ':'. */
export function ruleNames(state: RuleState, c: Checker): RuleResult<void> {
  for (const n of state.module.nodes) {
    c.count();
    if (n.node.includes(':') || n.node.length === 0) {
      return fail('E_BAD_REF', `id de nodo invalido: "${n.node}"`);
    }
    for (const p of [...n.tool.inputs, ...n.tool.outputs]) {
      c.count();
      if (p.name.includes(':') || p.name.length === 0) {
        return fail('E_BAD_REF', `nombre de puerto invalido: "${p.name}" en ${n.node}`, n.node);
      }
    }
  }
  return pass(undefined);
}

/**
 * R1: no puede haber dos nodos con el mismo id.
 *
 * Cuenta los ids por su cuenta y NO consulta `state.byId`. El orquestador ya
 * pre-indexa los nodos, asi que un duplicado esta colapsado en el indice y R1
 * no lo veria nunca: rechazaria todos los modulos, no solo los duplicados.
 */
export function ruleNoDuplicates(state: RuleState, c: Checker): RuleResult<void> {
  const seen = new Set<string>();
  for (const n of state.module.nodes) {
    c.count();
    if (seen.has(n.node)) {
      return fail('E_DUPLICATE_NODE', `nodo duplicado: "${n.node}"`, n.node);
    }
    seen.add(n.node);
  }
  return pass(undefined);
}

/** R11: el tier declarado debe admitir el efecto declarado. T0 solo admite `none`. */
export function ruleTierAllowsEffect(state: RuleState, c: Checker): RuleResult<void> {
  for (const n of state.module.nodes) {
    c.count();
    const t: ToolDescriptor = n.tool;
    if (!tierAllows(t.tier, t.effect)) {
      return fail(
        'E_TIER_EFFECT',
        `herramienta ${t.id} declara tier ${t.tier} con efecto "${t.effect}"`,
        n.node,
      );
    }
  }
  return pass(undefined);
}
