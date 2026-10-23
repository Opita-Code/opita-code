/**
 * QUE ENTREGA UN MODULO, Y SI LA MAGIA CUMPLIO SU CONTRATO.
 *
 * Preocupacion separada de `outcome.ts`, que define el vocabulario. Aqui se Mira
 * una corrida TERMINADA y se responde a dos preguntas que son distintas y que se
 * hacen en momentos distintos: que entrego el modulo, y si cada tool emitio los
 * puertos que su descriptor prometia.
 *
 * POR QUE IMPORTA QUE LA SEGUNDA EXISTA
 * El validador de L0 lee el descriptor. No lee la magic. Asi que hasta L2 nadie
 * habia comparado los dos lados, y una tool que devuelve menos puertos de los que
 * declara deja un downstream sin entrada sin decir nada: el modulo entregaria un
 * artifact incompleto y el veredicto seria `ok`.
 */

import type { ToolDescriptor, ToolOutput } from '../contract.js';
import type { CompiledModule } from '../graph.js';
import type { NodeRun } from './outcome.js';

/**
 * Puertos que el descriptor DECLARA y la tool NO emitio.
 *
 * Vacio = cumplio. El nombre es negativo a proposito: lo que se busca es la
 * Ausencia, y una funcion que devuelve lo que falta se puede leer sin ambiguedad.
 */
export function unemittedPorts(tool: ToolDescriptor, outputs: readonly ToolOutput[]): string[] {
  return tool.outputs.filter((p) => !outputs.some((o) => o.port === p.name)).map((p) => p.name);
}

/**
 * `nodo:puerto` -> valor, leido de los sinks declarados y de las corridas.
 *
 * Un puerto ausente NO se convierte en `undefined`: eso lo hace indistinguible de
 * "la tool emitio undefined". `unemittedPorts` decide ese caso antes, con un
 * codigo de fallo. Y un sink de un nodo que fallo no entra: el `ok` se consulta
 * por nodo, no por corrida.
 */
export function deliveriesOf(plan: CompiledModule, runs: readonly NodeRun[]): Map<string, unknown> {
  const byNode = new Map(runs.map((r) => [r.node, r] as const));
  const out = new Map<string, unknown>();
  for (const ref of plan.module.sinks) {
    const sep = ref.indexOf(':');
    if (sep <= 0) continue;
    const run = byNode.get(ref.slice(0, sep));
    if (run === undefined || !run.ok) continue;
    for (const o of run.outputs) {
      if (ref.slice(sep + 1) === o.port) out.set(ref, o.value);
    }
  }
  return out;
}