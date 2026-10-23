/**
 * EJECUTAR UN MODULO — la caminata.
 *
 * El plan de L0 era un documento. Este archivo lo camina. Cada paso esta en otro
 * lado: llenar puertos en `bind.ts`, que se reusa en `share.ts`, y el vocabulario
 * en `outcome.ts`. Aqui solo queda el ORDEN, que no se puede sacar.
 *
 * LA SECUENCIA: llenar -> reusar -> resolver -> correr -> coseer.
 *   Llenar antes que resolver: un puerto sin valor es error del autor, y no tiene
 *   sentido descubrir despues que la tool no esta registrada. Reusar antes que
 *   resolver: el reuso es decision sobre la CORRIDA, no sobre la disponibilidad.
 */

import type { ToolContext } from '../context.js';
import type { RunOptions, ToolRegistry } from '../tool.js';
import { bindInputs, feederIndex } from './bind.js';
import { nodeRun, type ModuleFailure, type ModuleOutcome, type NodeRun } from './outcome.js';
import { deliveriesOf, unemittedPorts } from './deliver.js';
import { cachedOutputs, shareKey, sharePolicy, ValueStore } from './share.js';

export interface RunModuleOptions extends RunOptions {
  /** Entradas del modulo por `nodo:puerto`. Los nodos sin arista de entrada van aqui. */
  readonly entry?: Readonly<Record<string, unknown>> | undefined;
  /** Cache de valores `mutation`. Si no se pasa, el runner crea una vacia. */
  readonly store?: ValueStore | undefined;
}

export function runModule(
  plan: import('../graph.js').CompiledModule,
  registry: ToolRegistry,
  ctx: ToolContext,
  opts: RunModuleOptions = {},
): ModuleOutcome {
  const mod = plan.module;
  const store = opts.store ?? new ValueStore();
  const feeders = feederIndex(mod.edges);
  const produced = new Map<string, unknown>();
  const runs: NodeRun[] = [];
  let failure: ModuleFailure | null = null;

  for (const name of plan.executionOrder) {
    const nd = mod.nodes.find((n) => n.node === name);
    if (nd === undefined) {
      failure = { node: name, code: 'E_NOT_COMPILED', detail: 'nodo sin descriptor' };
      break;
    }
    const { tool } = nd;
    const policy = sharePolicy(tool.determinism);

    const bound = bindInputs(name, tool, feeders, { produced, entry: opts.entry ?? {} });
    if (!bound.ok) {
      failure = { node: name, code: 'E_UNBOUND_INPUT', detail: bound.detail };
      break;
    }

    // La huella solo se calcula si la politica la va a usar. Para `none` no sirve:
    // sus salidas dependen del estado, no del input.
    const key = policy.cache || policy.comparable ? shareKey(tool.id, tool.version, bound.input) : null;
    const cached = cachedOutputs(policy, store, key);
    if (cached !== null) {
      for (const o of cached) produced.set(`${name}:${o.port}`, o.value);
      runs.push(nodeRun(name, tool, policy.kind, true, true, null, null, cached, []));
      continue;
    }

    if (!registry.has(tool.id, tool.version)) {
      failure = { node: name, code: 'E_MISSING_TOOL', detail: `no resuelta: ${tool.id}@${tool.version}` };
      break;
    }
    const outcome = registry.run(tool.id, tool.version, bound.input, ctx, opts);

    if (!outcome.ok) {
      runs.push(nodeRun(name, tool, policy.kind, false, false, outcome.code, outcome.detail, [], outcome.attempts));
      failure = { node: name, code: 'E_NODE_FAILED', detail: `${tool.id}@${tool.version}: ${outcome.detail}` };
      break;
    }

    // La tool cumplio o no su propio contrato: aqui se cruzan las dos mitades.
    const missing = unemittedPorts(tool, outcome.outputs);
    if (missing.length > 0) {
      failure = { node: name, code: 'E_PORT_NOT_EMITTED', detail: `${tool.id}@${tool.version} no emitio: ${missing.join(', ')}` };
      break;
    }

    if (key !== null) store.record(key, outcome.outputs, policy);
    for (const o of outcome.outputs) produced.set(`${name}:${o.port}`, o.value);
    runs.push(nodeRun(name, tool, policy.kind, false, true, null, null, outcome.outputs, outcome.attempts));
  }

  return {
    runs,
    deliveries: failure === null ? deliveriesOf(plan, runs) : new Map<string, unknown>(),
    failure,
    ok: failure === null,
  };
}
