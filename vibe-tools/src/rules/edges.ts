/**
 * Reglas de aristas: R2, R3, R4, R5, R6.
 *
 * Son las que hacen que el type system sea un type system de verdad: deciden si
 * una conexion es siquiera admisible, antes de ejecutar nada. Un error de
 * composicion detectado aqui es barato; detectado en runtime es caro y tardio.
 */

import type { RuleResult, RuleState, Checker } from './types.js';
import { pass, fail } from './types.js';

/** R2..R6 sobre cada arista, en orden. El primer rechazo es el veredicto. */
export function ruleEdges(state: RuleState, c: Checker): RuleResult<void> {
  for (const e of state.module.edges) {
    const src = state.byId.get(e.from);
    c.count();
    if (src === undefined) {
      return fail('E_DANGLING_NODE', `origen inexistente: ${e.from}`, `${e.from}:${e.fromPort}`);
    }
    const dst = state.byId.get(e.to);
    c.count();
    if (dst === undefined) {
      return fail('E_DANGLING_NODE', `destino inexistente: ${e.to}`, `${e.to}:${e.toPort}`);
    }

    const sp = src.outputs.find((p) => p.name === e.fromPort);
    c.count();
    if (sp === undefined) {
      return fail('E_PORT_NOT_FOUND', `puerto de salida inexistente: ${e.from}:${e.fromPort}`, `${e.from}:${e.fromPort}`);
    }
    const dp = dst.inputs.find((p) => p.name === e.toPort);
    c.count();
    if (dp === undefined) {
      return fail('E_PORT_NOT_FOUND', `puerto de entrada inexistente: ${e.to}:${e.toPort}`, `${e.to}:${e.toPort}`);
    }

    // R4: el eje 1 tiene que coincidir. `code` no conecta a `text`.
    c.count();
    if (sp.produces !== dp.produces) {
      return fail(
        'E_AXIS_MISMATCH',
        `${sp.produces} no conecta a ${dp.produces}: ${e.from}:${e.fromPort} -> ${e.to}:${e.toPort}`,
        `${e.to}:${e.toPort}`,
      );
    }

    // R5: una tool determinista solo consume entradas deterministas.
    // La direccion inversa si se permite: lo estocastico puede usar lo determinista.
    c.count();
    if (dst.determinism === 'deterministic' && src.determinism !== 'deterministic') {
      return fail(
        'E_NONDETERMINISTIC_INPUT',
        `${dst.id} es determinista pero consume de ${src.id} que es ${src.determinism}`,
        `${e.to}:${e.toPort}`,
      );
    }

    // R6: un artifact no se compone hacia adentro. El codigo compone, los artifacts terminan.
    c.count();
    if (sp.artifact === true) {
      return fail(
        'E_ARTIFACT_NOT_TERMINAL',
        `${e.from}:${e.fromPort} es artifact y no puede alimentar ${e.to}`,
        `${e.from}:${e.fromPort}`,
      );
    }
  }
  return pass(undefined);
}
