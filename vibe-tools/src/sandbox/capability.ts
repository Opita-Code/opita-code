/**
 * CAPACIDADES: lo que un sandbox realmente concede.
 *
 * L0 declaro que T0 no puede hacer I/O. Eso era una declaracion, no una garantia:
 * nada laovia. L1 la vuelve mecanismo, y para eso hace falta nombrar las
 * capacidades por separado de los efectos.
 *
 * POR QUE DOS CONCEPTOS Y NO UNO
 *
 *   Efecto      lo que la tool DECLARA en su descriptor. Va en el contrato y lo
 *               lee el validador al publicar.
 *   Capacidad   lo que el sandbox CONCEDE en la ejecucion. La decide el host.
 *
 * Un efecto se deriva a capacidades; el sandbox concede capacidades. Lo que se
 * comprueba en runtime es que las capacidades exigidas esten dentro de las
 * concedidas. Los dos niveles existen porque se pueden desalinear: una tool que
 * declara `read` y un host que no concede `fs` es un rechazo tipado, no un
 * crash ni un permiso silencioso.
 */

import type { Effect, Tier } from '../axes.js';

/** Capacidades nombrables. Todo lo demas no existe como capacidad. */
export const CAPABILITIES = ['net', 'fs', 'process'] as const;
export type Capability = (typeof CAPABILITIES)[number];

export const CAPABILITY_SET: ReadonlySet<string> = new Set<string>(CAPABILITIES);

export function isCapability(v: unknown): v is Capability {
  return typeof v === 'string' && CAPABILITY_SET.has(v);
}

/**
 * Que capacidades exige cada efecto.
 *
 * Total y exhaustiva sobre los 4 efectos. NO configurable, con la misma razon que
 * SHARING en axes.ts: si el mapeo fuera configurable, una tool podria pedir menos
 * de lo que usa y el sandbox la dejaria pasar. Aqui el codigo es el que decide
 * que implica `write`, no el autor del descriptor.
 */
const EFFECT_REQUIRES = {
  none: [],
  read: ['fs'],
  write: ['fs', 'net'],
  process: ['fs', 'net', 'process'],
} as const satisfies Record<Effect, readonly Capability[]>;

/**
 * Que capacidades concede cada tier.
 *
 * T0 no concede NINGUNA. No "pocas": ninguna. Es la definicion del tier.
 * T1 concede red y archivo, nunca proceso: un proceso real exige un kernel que
 * el shim del navegador no tiene, y fingirlo seria una promesa falsa de sandbox.
 * T2 concede todo, porque una microVM tiene kernel.
 */
const TIER_GRANTS = {
  T0: [],
  T1: ['net', 'fs'],
  T2: ['net', 'fs', 'process'],
} as const satisfies Record<Tier, readonly Capability[]>;

export function requiresFor(effect: Effect): readonly Capability[] {
  return EFFECT_REQUIRES[effect];
}

export function grantsFor(tier: Tier): readonly Capability[] {
  return TIER_GRANTS[tier];
}

/** Capacidad que le falta al tier para satisfacer el efecto, o `null` si alcanza. */
export function missingFor(tier: Tier, effect: Effect): Capability | null {
  const granted = grantsFor(tier);
  for (const c of requiresFor(effect)) {
    if (!granted.includes(c)) return c;
  }
  return null;
}

export function effectAllowed(tier: Tier, effect: Effect): boolean {
  return missingFor(tier, effect) === null;
}