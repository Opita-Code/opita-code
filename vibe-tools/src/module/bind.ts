/**
 * LLENAR LOS PUERTOS DE ENTRADA DE UN NODO.
 *
 * Preocupacion propia, separada del runner, porque es la unica parte de la
 * caminata que se puede probar sin registrar una tool ni correr un sandbox.
 *
 * ES LA UNICA QUE PUEDE FALLAR ANTES DE EJECUTAR NADA
 * Un puerto de entrada tiene dos origenes legitimos: una arista que lo alimenta,
 * o la entrada de la corrida, si es un puerto de ENTRADA del modulo. Si no tiene
 * ninguno de los dos, la tool recibiria `undefined` y nadie lo decidio asi.
 *
 * POR QUE NO SE ACEPTA `undefined` COMO DEFAULT
 * Porque es indistinguible de "me lo pasaron en blanco", y el modulo no puede
 * decir cual de las dos cosas pasó. Un autor que quiere un default lo escribe en
 * la tool; aqui no hay ningun default implícito.
 */

import type { Edge, ToolDescriptor } from '../contract.js';

/** `nodo:puerto` de destino -> `nodo:puerto` de origen, para cosear en O(1). */
export function feederIndex(edges: readonly Edge[]): Map<string, string> {
  const m = new Map<string, string>();
  for (const e of edges) m.set(`${e.to}:${e.toPort}`, `${e.from}:${e.fromPort}`);
  return m;
}

export type BindResult =
  | { readonly ok: true; readonly input: Record<string, unknown> }
  | { readonly ok: false; readonly detail: string };

export interface BindSources {
  /** Lo que produjo cada nodo hasta ahora, por `nodo:puerto`. */
  readonly produced: ReadonlyMap<string, unknown>;
  /** Entradas del modulo, por `nodo:puerto`. */
  readonly entry: Readonly<Record<string, unknown>>;
}

/**
 * Costea las entradas de UN nodo. No ejecuta, no valida, no perdona: o devuelve
 * todos los puertos llenos, o dice cual falta.
 */
export function bindInputs(
  node: string,
  tool: ToolDescriptor,
  feeders: ReadonlyMap<string, string>,
  src: BindSources,
): BindResult {
  const input: Record<string, unknown> = {};
  for (const port of tool.inputs) {
    const here = `${node}:${port.name}`;
    const from = feeders.get(here);
    if (from !== undefined) {
      input[port.name] = src.produced.get(from);
    } else if (Object.prototype.hasOwnProperty.call(src.entry, here)) {
      input[port.name] = src.entry[here];
    } else {
      return {
        ok: false,
        detail: `puerto de entrada sin arista y sin valor en la entrada de la corrida: ${here}`,
      };
    }
  }
  return { ok: true, input };
}