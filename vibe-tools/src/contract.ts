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

/**
 * EL PERFIL DE CONTEXTO: el techo que declara la herramienta.
 *
 * QUE ES. El perfil es la CATEGORIA de contexto que la tool puede recibir. Es
 * un techo declarado, no un permiso concedido: la policy concede, y el perfil
 * limita lo que se puede conceder. Las dos cosas existen porque son de
 * naturaleza distinta.
 *
 * POR QUE ES UNA ESCALERA Y NO UNA LISTA. `usage_history` incluye
 * `preferences`: el historial de uso contiene las preferencias, o las permite
 * recomputar. Separarlas daria la sensacion de un permiso mas fino y no lo
 * seria: quien tiene el historial tiene las preferencias. La escala es
 * monótona a proposito, y por eso la comparacion es un `>=` y no una busqueda.
 *
 * POR QUE LA PSICOMETRIA NO ESTA EN LA ESCALERA. El psicometrico es dato
 * sensible (Ley 1581 art. 5) y no se concede por "tener un perfil mas alto":
 * se concede por una FINALIDAD, con el consentimiento de esa finalidad. La
 * spec de boundary lo declaraba como un cuarto valor de la misma union
 * (`psychometric_optin`), y una union no puede decir las dos cosas que una
 * tool de misiones necesita a la vez: historial Y psicometria. Por eso la
 * psicometria es una capa aparte, con su campo, y no un peldaño de la escala.
 */
export type ContextProfile = 'none' | 'preferences' | 'usage_history';

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
  /**
   * El perfil de contexto que esta tool puede recibir. Es el TECHO declarado:
   * aunque la policy conceda mas, el perfil no deja pasar mas.
   */
  readonly context_profile: ContextProfile;
  /**
   * Si esta tool puede recibir psicometria. CAPA SEPARADA: exige que la
   * finalidad este consentida, y el consentimiento de una finalidad no
   * autoriza las otras.
   */
  readonly psychometrics: boolean;
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
