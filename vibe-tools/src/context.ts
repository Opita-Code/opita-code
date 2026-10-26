/**
 * EL CONTEXTO: la unica puerta entre el harness y una tool.
 *
 * En L0 el perfil por defecto es `none` y el contexto es opaco. Ampliar esto
 * (perfiles, separacion de identidades, mutation_request) son L3 y L4: L3
 * escribio la regla de que el contexto no cruza identidades, y L4 metio la
 * identidad en el contexto.
 *
 * Lo que YA es regla en L0: la inmutabilidad. No se confia en el llamador.
 *
 * L4 AGREGA LA IDENTIDAD. El contexto lleva la identidad bajo la que corre,
 * y es OBLIGATORIA: un contexto sin identidad no tiene de que mod leer, y sin
 * esa clave la separacion de identidades no se puede escribir. No es un
 * campo mas: es la que hace que «el contexto inyectado nunca cruza
 * identidades» tenga algo contra lo que compararse.
 */

import type { Identity } from './identity.js';
import { afirmarIdentidad } from './identity/validacion.js';

export type ContextProfile = 'none' | 'minimal';

export interface ToolContext {
  readonly profile: ContextProfile;
  /** Contexto ya recortado. En `none` siempre esta vacio. */
  readonly injected: Readonly<Record<string, unknown>>;
  /** Identidad logica de quien ejecuta. No es la identidad legal. */
  readonly actorId: string;
  /** Bajo que identidad corre. Es la clave de aislamiento del mod. */
  readonly identity: Identity;
  readonly deadlineMs: number;
}

/** Contextos ya sellados. Da identidad estable en el camino rapido. */
const sealed = new WeakSet<object>();

export function emptyContext(actorId: string, identity: Identity, deadlineMs = 5_000): ToolContext {
  afirmarIdentidad(identity);
  const ctx = Object.freeze({
    profile: 'none',
    injected: Object.freeze({}),
    actorId,
    identity: Object.freeze({ ...identity }),
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
 * LA IDENTIDAD TAMBIEN, Y EN COPIA. Congelar la superficie del contexto no
 * congela lo que hay dentro: `identity` es un objeto, y con un
 * `Object.freeze` de superficie seguia mutable. Eso no es un detalle: la
 * `projectId` de la identidad es la clave de aislamiento, y si una tool
 * puede cambiarla despues de que el harness decidio el contexto, la
 * separacion de identidades se deshace en vuelo. Por eso la identidad se
 * sella en COPIA: congelar el objeto del llamador lo dejaria a el con un
 * objeto congelado que no pidio, y mutarlo despues no tocaria el contexto.
 *
 * Y EL CAMINO RAPIDO TAMBIEN. `emptyContext` marca su resultado como sellado,
 * asi que `sealContext` lo devuelve sin tocarlo. Sin la copia ahi, el contexto
 * que nace en el camino rapido llevaria la identidad del llamador sin
 * congelar, y la clave de aislamiento quedaria en su mano.
 *
 * El camino rapido usa un WeakSet, NO `Object.isFrozen`. `Object.isFrozen` solo
 * mira la superficie: un `injected` congelado que contiene un objeto anidado
 * mutable pasa el chequeo y se escapaba del sellado profundo por completo.
 */
export function sealContext(ctx: ToolContext): ToolContext {
  if (sealed.has(ctx)) return ctx;
  afirmarIdentidad(ctx.identity);
  const out = Object.freeze({
    ...ctx,
    injected: Object.freeze(deepFreeze({ ...ctx.injected })),
    identity: Object.freeze({ ...ctx.identity }),
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
