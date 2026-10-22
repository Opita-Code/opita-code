/**
 * QUE PUEDE OFRECER UN HOST.
 *
 * El descriptor declara el tier que una tool necesita. El host declara lo que
 * tiene. Lo que importa no es elegir el tier mas alto, sino responder a una
 * pregunta mas aburrida: ¿este host alcanza para correr esto?
 *
 * Por que no "elige el mejor tier disponible": porque el tier no se elige por
 * conveniencia, lo declara la tool. Una tool T0 tiene que correr en T0 aunque el
 * host pueda con T2, por dos razones. La primera es que T2 tiene kernel y T0 no,
 * asi que un T2 corrido como T0sfreudaria garantias que no existen. La segunda es
 * que el tier va en la huella del artefacto: si corria en el host mas potente, la
 * reproducibilidad del artifact dependeria de la maquina de quien lo comparta.
 *
 * T2 NO REQUIERE WASM NI SHIM
 *
 * Una microVM corre su propio kernel y su propio runtime. Exigirle ademas las
 * capacidades del navegador seria alinear dos arquitecturas que no se parecen.
 */

import type { Tier } from '../axes.js';

export type HostFeature = 'wasm' | 'shim' | 'memfs' | 'microvm';

export interface HostEnvironment {
  readonly wasm: boolean;
  /** Shim de red con allowlist de dominios. */
  readonly shim: boolean;
  /** Sistema de archivos virtual. */
  readonly memfs: boolean;
  readonly microvm: boolean;
}

/**
 * Que exige cada tier del host. Total y no configurable, por la misma razon que
 * el resto de tablas del runtime: si el requisito fuera ajustable, el sandbox
 * seria tan fuerte como el ajuste.
 */
const TIER_REQUIRES = {
  T0: ['wasm'],
  T1: ['wasm', 'shim', 'memfs'],
  T2: ['microvm'],
} as const satisfies Record<Tier, readonly HostFeature[]>;

export type TierSupport =
  | { readonly ok: true; readonly tier: Tier }
  | { readonly ok: false; readonly tier: Tier; readonly missing: readonly HostFeature[] };

export function requiresFor(tier: Tier): readonly HostFeature[] {
  return TIER_REQUIRES[tier];
}

export function has(env: HostEnvironment, feature: HostFeature): boolean {
  return env[feature];
}

export function supports(env: HostEnvironment, tier: Tier): TierSupport {
  const missing = TIER_REQUIRES[tier].filter((f) => !env[f]);
  return missing.length === 0 ? { ok: true, tier } : { ok: false, tier, missing };
}

/** El tier mas alto que el host puede sostener, o `null` si no sostiene ninguno. */
export function highest(env: HostEnvironment): Tier | null {
  const order: readonly Tier[] = ['T2', 'T1', 'T0'];
  for (const tier of order) {
    const s = supports(env, tier);
    if (s.ok) return tier;
  }
  return null;
}

/**
 * Hosts de referencia, para pruebas y para documentar el MVP con honestidad.
 *
 * `client` es el unico que el MVP considera ejecutable. Los otros dos existen
 * para poder ejercitar la POLITICA completa sin tener Pyodide, WebContainers ni
 * Firecracker: si el modelo de capacidades no se puede probar con un host falso,
 * no se puede probar en absoluto.
 */
export const HOSTS = {
  client: { wasm: true, shim: false, memfs: false, microvm: false },
  clientFull: { wasm: true, shim: true, memfs: true, microvm: false },
  backend: { wasm: false, shim: false, memfs: false, microvm: true },
  none: { wasm: false, shim: false, memfs: false, microvm: false },
} as const satisfies Record<string, HostEnvironment>;

export type HostName = keyof typeof HOSTS;