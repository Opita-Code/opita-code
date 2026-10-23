/**
 * Reglas de terminales: R7, R8, R9.
 *
 * Estas tres son el contrato canonico entero: *el codigo compone, los artifacts
 * terminan*. R7 exige que lo declarado sea terminal, R8 exige que lo terminal
 * este declarado, y R9 impide que exista un modulo que no entrega nada a un
 * humano. Juntas cierran el grafo: no queda ni una salida sin destino declarado
 * ni un modulo que se quede en un segmento suelto.
 */

import { outputPort } from '../contract.js';
import { parseRef } from '../contract.js';
import type { RuleResult, RuleState, Checker } from './types.js';
import { pass, fail } from './types.js';

/** R7a-c: todo sink declarado debe parsear y apuntar a un nodo y puerto reales. */
export function ruleSinksExist(state: RuleState, c: Checker): RuleResult<void> {
  for (const s of state.module.sinks) {
    c.count();
    const ref = parseRef(s);
    if (ref === null) {
      return fail('E_SINK_NOT_FOUND', `referencia de sink invalida: "${s}"`, s);
    }
    const tool = state.byId.get(ref.node);
    if (tool === undefined) {
      return fail('E_SINK_NOT_FOUND', `sink sobre nodo inexistente: "${s}"`, s);
    }
    if (outputPort(tool, ref.port) === undefined) {
      return fail('E_SINK_NOT_FOUND', `sink sobre puerto inexistente: "${s}"`, s);
    }
  }
  return pass(undefined);
}

/** R7d: un sink no puede tener aristas salientes. Si las tiene, no es terminal. */
export function ruleSinksAreTerminal(state: RuleState, c: Checker): RuleResult<void> {
  for (const s of state.module.sinks) {
    c.count();
    const salientes = state.outEdges.get(s) ?? 0;
    if (salientes > 0) {
      return fail('E_SINK_NOT_TERMINAL', `sink "${s}" tiene ${salientes} arista(s) saliente(s)`, s);
    }
  }
  return pass(undefined);
}

/** R8: toda salida sin arista saliente debe estar declarada como sink. */
export function ruleTerminalsDeclared(state: RuleState, c: Checker): RuleResult<void> {
  for (const n of state.module.nodes) {
    for (const p of n.tool.outputs) {
      c.count();
      const ref = `${n.node}:${p.name}`;
      if ((state.outEdges.get(ref) ?? 0) === 0 && !state.declared.has(ref)) {
        return fail('E_UNDECLARED_SINK', `salida terminal "${ref}" no declarada como sink`, ref);
      }
    }
  }
  return pass(undefined);
}

/** R9: el modulo debe entregar al menos un artifact. */
export function ruleDeliversArtifact(state: RuleState, c: Checker): RuleResult<void> {
  let artifacts = 0;
  for (const s of state.module.sinks) {
    const ref = parseRef(s);
    if (ref === null) continue;
    const tool = state.byId.get(ref.node);
    if (tool === undefined) continue;
    const port = outputPort(tool, ref.port);
    if (port !== undefined && port.artifact === true) artifacts++;
  }
  c.count();
  if (artifacts === 0) {
    return fail('E_NO_ARTIFACT', 'el modulo no entrega ningun artifact');
  }
  return pass(undefined);
}
