/**
 * LA MAGIA (L0-T1, cierre)
 *
 * El contrato es el descriptor de `contract.ts`. La magia es esto: el codigo que
 * cumple ese contrato, resuelto por (id, version).
 *
 * El registry no conoce la memoria. El contexto entra por parametro, ya
 * recortado por el harness, y sale por valor. Una tool no puede leer la memoria
 * porque no hay ninguna referencia a ella en su alcance.
 *
 * Ampliar esto (perfiles, separacion de identidades, mutation_request) es L3.
 * En L0 el perfil por defecto es `none` y el contexto es opaco.
 */

import type { ToolDescriptor } from './contract.js';

export type ContextProfile = 'none' | 'minimal';

export interface ToolContext {
  readonly profile: ContextProfile;
  /** Contexto ya recortado. En `none` siempre esta vacio. */
  readonly injected: Readonly<Record<string, unknown>>;
  /** Identidad logica de quien ejecuta. No es la identidad legal. */
  readonly actorId: string;
  readonly deadlineMs: number;
}

/** Contextos ya sellados. Da identidad estable en el camino rapido. */
const sealed = new WeakSet<object>();

export function emptyContext(actorId: string, deadlineMs = 5_000): ToolContext {
  const ctx = Object.freeze({
    profile: 'none',
    injected: Object.freeze({}),
    actorId,
    deadlineMs,
  }) as ToolContext;
  sealed.add(ctx);
  return ctx;
}

/**
 * Sella el contexto antes de handing it a una tool.
 *
 * Congelar SOLO en `emptyContext` era una convencion, no una garantia: cualquier
 * llamador podia construir un ToolContext con `injected` mutable y pasarlo a
 * `run()`, y la tool lo mutaba. La inmutabilidad del contexto es una regla del
 * boundary (L3), asi que se aplica aqui y no se confia en el llamador.
 *
 * Sellado PROFUNDO, no superficial: sin esto una tool podia mutar un objeto
 * anidado del contexto inyectado.
 *
 * El camino rapido usa un WeakSet, NO `Object.isFrozen`. `Object.isFrozen` solo
 * mira la superficie: un `injected` congelado que contiene un objeto anidado
 * mutable pasa el chequeo y se escapaba del sellado profundo por completo.
 */
export function sealContext(ctx: ToolContext): ToolContext {
  if (sealed.has(ctx)) return ctx;
  const out = Object.freeze({
    ...ctx,
    injected: Object.freeze(deepFreeze({ ...ctx.injected })),
  }) as ToolContext;
  sealed.add(out);
  return out;
}

function deepFreeze<T>(v: T): T {
  if (v === null || typeof v !== 'object') return v;
  if (Object.isFrozen(v)) return v;
  Object.freeze(v);
  for (const k of Object.keys(v as Record<string, unknown>)) {
    deepFreeze((v as Record<string, unknown>)[k]);
  }
  return v;
}

export interface ToolOutput {
  readonly port: string;
  readonly value: unknown;
}

export type ToolOutcome =
  | { readonly ok: true; readonly outputs: readonly ToolOutput[] }
  | { readonly ok: false; readonly error: string };

export type ToolImpl = (input: Readonly<Record<string, unknown>>, ctx: ToolContext) => ToolOutcome;

interface Binding {
  readonly descriptor: ToolDescriptor;
  readonly impl: ToolImpl;
}

export class ToolRegistry {
  readonly #byKey = new Map<string, Binding>();

  #key(id: string, version: string): string {
    return `${id}@${version}`;
  }

  register(descriptor: ToolDescriptor, impl: ToolImpl): this {
    const k = this.#key(descriptor.id, descriptor.version);
    if (this.#byKey.has(k)) throw new Error(`herramienta ya registrada: ${k}`);
    this.#byKey.set(k, { descriptor, impl });
    return this;
  }

  has(id: string, version: string): boolean {
    return this.#byKey.has(this.#key(id, version));
  }

  resolve(id: string, version: string): ToolDescriptor | undefined {
    return this.#byKey.get(this.#key(id, version))?.descriptor;
  }

  get size(): number {
    return this.#byKey.size;
  }

  run(id: string, version: string, input: Readonly<Record<string, unknown>>, ctx: ToolContext): ToolOutcome {
    const binding = this.#byKey.get(this.#key(id, version));
    if (binding === undefined) return { ok: false, error: `no resuelta: ${id}@${version}` };
    if (binding.descriptor.tier !== 'T0') {
      return { ok: false, error: `fuera de T0: ${id}@${version} pide tier ${binding.descriptor.tier}` };
    }
    return binding.impl(input, sealContext(ctx));
  }
}