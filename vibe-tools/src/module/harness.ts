/**
 * EL HARNESS — "responde en modo X".
 *
 * Le das un modulo compilado y una clase de produccion, y te devuelve la entrega
 * que produce ese modo. Es el ciclo de misiones: uno pide "dame una imagen" y no
 * necesita saber que nodo del grafo la produjo.
 *
 * POR QUE RECHAZA LA AMBIGUEDAD Y NO LA RESUELVE
 * Si dos entregas del modulo producen `image`, elegir la primera es una moneda al
 * aire, y el autor que lo lea no tiene forma de saber que hubo un sorteo. Se
 * devuelve `E_AMBIGUOUS_MODE` con los `nodo:puerto` en el detalle, para que el
 * mismo error que lo dispara diga tambien como arreglarlo.
 *
 * POR QUE NO HAY MODO "EL QUE QUIERA"
 * Pedir el artifact sin decir de que clase seria dejar que el modulo decida por
 * el consumidor, y el consumidor es quien sabe que quiere mostrar. Ademas seria
 * una cuarta forma de compartir que el type system de L0 no conoce.
 *
 * EL CONTEXTO ENTRA POR PARAMETRO Y SE PASA
 * El harness NO define perfiles ni crea contextos: los perfiles de identidad son
 * L3. El contexto del llamador viaja intacto hasta las tools, y el sandbox lo
 * sella en cada `run()` como hacia en L1.
 */

import type { Produces } from '../axes.js';
import type { CompiledModule } from '../graph.js';
import type { ToolContext } from '../context.js';
import type { ToolRegistry } from '../tool.js';
import type { ModuleErrorCode, ModuleOutcome } from './outcome.js';
import { deliveriesOf } from './deliver.js';
import { runModule, type RunModuleOptions } from './run.js';

export interface HarnessAnswer {
  /** `nodo:puerto` de donde salio el valor. */
  readonly at: string;
  readonly produces: Produces;
  readonly value: unknown;
}

export type HarnessResult =
  | { readonly ok: true; readonly answer: HarnessAnswer; readonly run: ModuleOutcome }
  | {
      readonly ok: false;
      readonly code: ModuleErrorCode | 'E_NO_MODE' | 'E_AMBIGUOUS_MODE';
      readonly detail: string;
      readonly run: ModuleOutcome | null;
    };

export type HarnessOptions = RunModuleOptions;

/**
 * Entregas del modulo que producen el modo pedido, en orden de declaracion de
 * sinks. Se separa de `ask` para que se pueda probar sin correr el modulo.
 */
export function deliveriesFor(plan: CompiledModule, run: ModuleOutcome, mode: Produces): HarnessAnswer[] {
  const delivered = deliveriesOf(plan, run.runs);
  const out: HarnessAnswer[] = [];
  for (const ref of plan.module.sinks) {
    const sep = ref.indexOf(':');
    if (sep <= 0) continue;
    const nodeName = ref.slice(0, sep);
    const portName = ref.slice(sep + 1);
    const node = plan.module.nodes.find((n) => n.node === nodeName);
    const port = node?.tool.outputs.find((p) => p.name === portName);
    if (port === undefined || !port.artifact || port.produces !== mode) continue;
    if (!delivered.has(ref)) continue;
    out.push({ at: ref, produces: mode, value: delivered.get(ref) });
  }
  return out;
}

export function ask(
  plan: CompiledModule,
  registry: ToolRegistry,
  ctx: ToolContext,
  mode: Produces,
  opts: HarnessOptions = {},
): HarnessResult {
  const run = runModule(plan, registry, ctx, opts);

  // La corrida se mira PRIMERO. Un modulo que fallo no tiene nada que preguntar,
  // y su error es mas informativo que "no encuentro una entrega de ese modo".
  if (!run.ok) {
    return { ok: false, code: 'E_NODE_FAILED', detail: run.failure?.detail ?? 'la corrida fallo', run };
  }

  const found = deliveriesFor(plan, run, mode);
  if (found.length === 0) {
    return { ok: false, code: 'E_NO_MODE', detail: `ninguna entrega produce ${mode}`, run };
  }
  if (found.length > 1) {
    return {
      ok: false,
      code: 'E_AMBIGUOUS_MODE',
      detail: `${found.length} entregas producen ${mode}: ${found.map((f) => f.at).join(', ')}`,
      run,
    };
  }
  return { ok: true, answer: found[0] as HarnessAnswer, run };
}
