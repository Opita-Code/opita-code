/**
 * EJE 1 — QUE PRODUCE (vive en el puerto)
 * EJE 2 — CLASE DE DETERMINISMO (vive en la herramienta)
 *
 * El eje 1 esta en el puerto porque la composicion se comprueba puerto a puerto.
 * El eje 2 esta en la herramienta porque la regla de compartir (mutacion vs receta)
 * es una propiedad de la herramienta completa, no de un puerto suelto.
 */

/** Eje 1: que produce un puerto. */
export const PRODUCES = ['code', 'text', 'image', 'video', 'audio', 'multimodal'] as const;
export type Produces = (typeof PRODUCES)[number];

/** Eje 2: clase de determinismo de una herramienta. */
export const DETERMINISM = ['deterministic', 'stochastic', 'stateful'] as const;
export type Determinism = (typeof DETERMINISM)[number];

/**
 * Como se comparte una herramienta, derivado del eje 2.
 * Total y exhaustiva: los 3 valores de eje 2 tienen exactamente 1 forma de compartirse.
 * No es configurable — si lo fuera, el determinismo podria mentir.
 */
export const SHARING = {
  deterministic: 'mutation',
  stochastic: 'recipe',
  stateful: 'none',
} as const satisfies Record<Determinism, string>;

export type Sharing = (typeof SHARING)[Determinism];

export const SHARINGS = ['mutation', 'recipe', 'none'] as const;

export function sharingOf(determinism: Determinism): Sharing {
  return SHARING[determinism];
}

export function isProduces(v: unknown): v is Produces {
  return typeof v === 'string' && (PRODUCES as readonly string[]).includes(v);
}

export function isDeterminism(v: unknown): v is Determinism {
  return typeof v === 'string' && (DETERMINISM as readonly string[]).includes(v);
}

/**
 * Tiers de sandbox. Solo T0 es ejecutable en el MVP; T1 y T2 se declaran aqui
 * para que el contrato ya los exprese desde el dia uno.
 * T0 = WASM puro en cliente, sin I/O, sin red.
 * T1 = WASM + shim de red con allowlist de dominios.
 * T2 = microVM (Firecracker) para backend real.
 */
export const TIERS = ['T0', 'T1', 'T2'] as const;
export type Tier = (typeof TIERS)[number];

/**
 * T0 no puede hacer I/O. Una herramienta T0 que declare un efecto de red es un
 * error de contrato, no un error de runtime: se rechaza al publicar.
 */
export const EFFECTS = ['none', 'read', 'write', 'process'] as const;
export type Effect = (typeof EFFECTS)[number];

/** Invariante dura del tier T0: efecto ninguno. */
export function tierAllows(tier: Tier, effect: Effect): boolean {
  if (effect === 'none') return true;
  if (tier === 'T0') return false;
  if (tier === 'T1') return effect !== 'process';
  return true;
}
