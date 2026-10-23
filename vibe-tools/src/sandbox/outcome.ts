/**
 * EL VEREDICTO DEL SANDBOX, y su bitacora de intentos.
 *
 * Antes vivia dentro de `runner.ts`. Se separo porque el veredicto y la caminata
 * son dos preocupaciones: `runner.ts` decide SI se ejecuta, y este archivo decide
 * QUE se devuelve cuando ya se decidio. El motivo real fue el tope del gate —el
 * archivo estaba en 4149 B— pero la frontera es legitima por si misma.
 *
 * NO es una refactorizacion cosmetics: el campo `attempts` de la rama de exito es
 * de L2, y su ausencia en L1 era un defecto. Ver `L2-hallazgos.md`.
 */

import type { Capability } from './capability.js';
import type { Tier } from '../axes.js';
import type { EffectAttempt } from './effects/port.js';
import type { ToolOutput } from '../contract.js';

export type SandboxErrorCode =
  | 'E_NOT_BOUND'
  | 'E_HOST_UNSUPPORTED'
  | 'E_MODULE_DENIED'
  | 'E_EFFECT_DENIED'
  | 'E_TOOL_ERROR';

export type SandboxOutcome =
  | {
      readonly ok: true;
      readonly tier: Tier;
      readonly granted: readonly Capability[];
      readonly outputs: readonly ToolOutput[];
      /**
       * Intentos de I/O. Tambien en el exito: antes solo los llevaba el fallo, y
       * una traza que solo existe cuando algo va mal no es una traza.
       */
      readonly attempts: readonly EffectAttempt[];
    }
  | {
      readonly ok: false;
      readonly tier: Tier;
      readonly code: SandboxErrorCode;
      readonly detail: string;
      readonly attempts: readonly EffectAttempt[];
    };

/** El veredicto cuando algo se rechaza, con su bitacora de intentos. */
export function fail(
  tier: Tier,
  code: SandboxErrorCode,
  detail: string,
  attempts: readonly EffectAttempt[] = [],
): SandboxOutcome {
  return { ok: false, tier, code, detail, attempts };
}

/** Cuantos intentos denegados hubo. Es el KPI de exfiltracion del loop. */
export function deniedCount(outcome: SandboxOutcome): number {
  return outcome.ok ? 0 : outcome.attempts.filter((a) => !a.granted).length;
}