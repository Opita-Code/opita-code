/**
 * EL RUNNER: donde las dos capas se juntan.
 *
 * Estatica:  el binario WASM no importa nada. Se comprueba ANTES de ejecutar.
 * Dinamica: la tool recibe un puerto de efectos sin referencia al host.
 *
 * Cada capa sola es insuficiente: una tool correcta en un host engañado no la
 * protege la estatica, y la dinamica no protege al modulo.
 *
 * UN INTENTO DENEGADO FALLA LA EJECUCION INCLUSO SI LA TOOL DEVUELVIO EXITO
 *
 * Una tool que intento exfiltrar y no lo logro no es una tool que funciono. Si se
 * aceptara su resultado, el siguiente paso seria probar con otro puerto, y el
 * sandbox seria el obstaculo en lugar de la garantia. El intento es la senal.
 *
 * El veredicto y su bitacora viven en `outcome.ts`. Aqui solo esta la caminata.
 */

import { createPort } from './effects/create.js';
import type { EffectAttempt, EffectBackend } from './effects/port.js';
import { supports, type HostEnvironment } from './tier.js';
import { scanWasm, T0_ALLOWED } from './wasm/scan.js';
import type { ToolOutcome, ToolImpl } from '../tool.js';
import type { ToolDescriptor } from '../contract.js';
import { sealContext, type ToolContext } from '../context.js';
import { fail, type SandboxOutcome } from './outcome.js';

export {
  deniedCount,
  fail,
  type SandboxErrorCode,
  type SandboxOutcome,
} from './outcome.js';

export interface Binding {
  readonly descriptor: ToolDescriptor;
  readonly impl: ToolImpl;
}

export interface RunRequest {
  readonly env: HostEnvironment;
  readonly binding: Binding;
  readonly input: Readonly<Record<string, unknown>>;
  readonly ctx: ToolContext;
  /** Binario para la capa estatica. Sin el, T0 se protege en runtime. */
  readonly module?: Uint8Array | undefined;
  readonly backend?: EffectBackend | undefined;
  readonly allowed?: readonly string[] | undefined;
}

export function runInSandbox(req: RunRequest): SandboxOutcome {
  const { descriptor, impl } = req.binding;
  const tier = descriptor.tier;

  // Capa 1, estatica: el binario no entra si pide algo.
  if (req.module !== undefined) {
    const verdict = scanWasm(req.module, req.allowed ?? T0_ALLOWED);
    if (!verdict.ok) {
      const first = verdict.violations[0];
      return fail(tier, 'E_MODULE_DENIED', `${first?.code}: ${first?.detail}`);
    }
  }

  // El host tiene que alcanzar para este tier.
  const support = supports(req.env, tier);
  if (!support.ok) {
    return fail(tier, 'E_HOST_UNSUPPORTED', `el host no sostiene ${tier}: falta ${support.missing.join(', ')}`);
  }

  // Capa 2, dinamica: puerto sin referencia al host.
  const port = createPort(tier, req.backend ?? {});
  const outcome: ToolOutcome = impl(req.input, sealContext(req.ctx), port);

  const denegados = port.attempts.filter((a) => !a.granted);
  if (denegados.length > 0) {
    const primero = denegados[0] as EffectAttempt;
    return fail(
      tier,
      'E_EFFECT_DENIED',
      `${tier} no concede ${primero.capability}: la tool intento ${primero.op}`,
      port.attempts,
    );
  }
  if (!outcome.ok) {
    return fail(tier, 'E_TOOL_ERROR', outcome.error, port.attempts);
  }
  return {
    ok: true,
    tier,
    granted: port.granted,
    outputs: outcome.outputs,
    attempts: port.attempts,
  };
}
