/**
 * LA MAGIA: el codigo que cumple el contrato.
 *
 * El registry no conoce la memoria. No hay handle, ni store, ni repo en su
 * alcance. El contexto entra por parametro, ya recortado por el harness, y sale
 * por valor y sellado.
 */

import type { ToolDescriptor } from './contract.js';
import { sealContext, type ToolContext } from './context.js';

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