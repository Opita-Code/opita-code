/**
 * LA MAGIA: el codigo que cumple el contrato.
 *
 * El registry es el unico punto donde contrato y codigo se juntan, y ya no es
 * tambien el punto donde se decide que se ejecuta: eso lo hace el sandbox. Aqui
 * solo se resuelve por (id, version) y se delega.
 *
 * NO debe existir ninguna referencia a la memoria en su alcance: no hay handle,
 * ni store, ni repo. El contexto entra por parametro y sale por valor y sellado,
 * y el acceso a I/O entra por el puerto de efectos, que no tiene referencia al
 * host.
 */

import type { ToolDescriptor, ToolOutput } from './contract.js';
import type { ToolContext } from './context.js';
import type { EffectBackend, EffectPort } from './sandbox/effects/port.js';
import { HOSTS, type HostEnvironment } from './sandbox/tier.js';
import { runInSandbox, type SandboxOutcome } from './sandbox/runner.js';

export type { ToolOutput };

export type ToolOutcome =
  | { readonly ok: true; readonly outputs: readonly ToolOutput[] }
  | { readonly ok: false; readonly error: string };

/**
 * La tool recibe tres cosas ortogonales y no puede mezclarlas:
 *   input    los datos
 *   ctx      quien ejecuta
 *   effects  lo que puede hacer
 *
 * Que los efectos sean un parametro y no un campo del contexto es lo que impide
 * que una tool confunda "saber que existe la red" con "poder usarla".
 */
export type ToolImpl = (
  input: Readonly<Record<string, unknown>>,
  ctx: ToolContext,
  effects: EffectPort,
) => ToolOutcome;

export interface RunOptions {
  /** Por defecto el host de cliente: el unico que el MVP ejecuta. */
  readonly env?: HostEnvironment | undefined;
  readonly module?: Uint8Array | undefined;
  readonly backend?: EffectBackend | undefined;
  readonly allowed?: readonly string[] | undefined;
}

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

  run(
    id: string,
    version: string,
    input: Readonly<Record<string, unknown>>,
    ctx: ToolContext,
    opts: RunOptions = {},
  ): SandboxOutcome {
    const binding = this.#byKey.get(this.#key(id, version));
    if (binding === undefined) {
      return {
        ok: false,
        tier: 'T0',
        code: 'E_NOT_BOUND',
        detail: `no resuelta: ${id}@${version}`,
        attempts: [],
      };
    }
    return runInSandbox({
      env: opts.env ?? HOSTS.client,
      binding,
      input,
      ctx,
      module: opts.module,
      backend: opts.backend,
      allowed: opts.allowed,
    });
  }
}
