/**
 * CONTRATOS SON DATOS.
 *
 * Un descriptor es JSON puro: sin funciones, sin referencias, sin estado.
 * Eso es lo que lo hace publicable, versionable, hasheable y portable entre
 * T0 (WASM), Lambda y Firecracker sin reescribir nada.
 *
 * La magia (el codigo que corre la herramienta) vive aparte, resuelta por
 * (id, version). El contrato es la promesa; el codigo es su cumplimiento.
 */

import type { Determinism, Effect, Produces, Tier } from './axes.js';
import { canonicalize } from './canonical.js';
import { sha256HexOfText } from './hash.js';

/** Puerto de una herramienta. El eje 1 vive aqui. */
export interface Port {
  readonly name: string;
  readonly produces: Produces;
  /** `true` afirma que esta salida ES el entregable del modulo. No puede alimentar otro nodo. */
  readonly artifact: boolean;
}

/** Descriptor de herramienta. Serializable. Inmutable. */
export interface ToolDescriptor {
  readonly id: string;
  readonly version: string;
  readonly author: string;
  readonly title: string;
  /** Eje 2. De aqui sale mutacion vs receta vs nada. */
  readonly determinism: Determinism;
  readonly tier: Tier;
  readonly effect: Effect;
  readonly inputs: readonly Port[];
  readonly outputs: readonly Port[];
}

/** Arista del grafo de composicion: puerto de salida -> puerto de entrada. */
export interface Edge {
  readonly from: string;
  readonly fromPort: string;
  readonly to: string;
  readonly toPort: string;
}

export interface ModuleNode {
  readonly node: string;
  readonly tool: ToolDescriptor;
}

/** Descriptor de modulo. Serializable. Inmutable. */
export interface ModuleDescriptor {
  readonly id: string;
  readonly version: string;
  readonly author: string;
  readonly title: string;
  readonly nodes: readonly ModuleNode[];
  readonly edges: readonly Edge[];
  /** Referencias `nodo:puerto` que terminan el grafo. */
  readonly sinks: readonly string[];
}

/**
 * Huella de integridad de un contrato. Mismo descriptor -> mismo hash,
 * en cualquier runtime. Distinto descriptor -> distinto hash.
 *
 * Nota de alcance: el orden de los puertos ES parte del descriptor.
 * Reordenar puertos produce otro descriptor y otro hash. Es intencional: la
 * huella identifica el descriptor tal cual es, no su equivalencia semantica.
 */
export function integrityOf(value: unknown): string {
  return sha256HexOfText(canonicalize(value));
}

/**
 * Lo que una herramienta devuelve por un puerto.
 *
 * Vive en el contrato y no en la magia porque es dato: el plan de una corrida
 * tiene que poder describirse sin el codigo que la produjo.
 */
export interface ToolOutput {
  readonly port: string;
  readonly value: unknown;
}

/** Puertos que el modulo entrega a un humano. Debe haber al menos uno. */
export function deliveries(tool: ToolDescriptor): Port[] {
  return tool.outputs.filter((p) => p.artifact);
}

export function inputPort(tool: ToolDescriptor, name: string): Port | undefined {
  return tool.inputs.find((p) => p.name === name);
}

export function outputPort(tool: ToolDescriptor, name: string): Port | undefined {
  return tool.outputs.find((p) => p.name === name);
}

export function parseRef(ref: string): { node: string; port: string } | null {
  const i = ref.indexOf(':');
  if (i <= 0 || i === ref.length - 1) return null;
  const node = ref.slice(0, i);
  const port = ref.slice(i + 1);
  if (port.includes(':')) return null;
  return { node, port };
}
