/**
 * EL CONTEXTO: la unica puerta entre el harness y una tool.
 *
 * En L0 el perfil por defecto es `none` y el contexto es opaco. Ampliar esto
 * (perfiles, separacion de identidades, mutation_request) es L3.
 *
 * Lo que YA es regla en L0: la inmutabilidad. No se confia en el llamador.
 */

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