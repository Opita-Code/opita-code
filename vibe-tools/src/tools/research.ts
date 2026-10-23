/**
 * RESEARCH — busqueda. T1, efecto `read`, ESTOCASTICA.
 *
 * ESTA TOOL NO SE PUEDE EJECUTAR EN EL MVP, Y EL MODULO LO DICE
 * Necesita red. T1 concede `net`, asi que el sandbox NO le va a negar nada: le
 * va a devolver `unimplemented`, que es el otro motivo de fallo y no el mismo.
 * Denegar seria mentir sobre por que falla.
 *
 * La diferencia no es academica y es la que L1 construyo para esto:
 *   denied        el sandbox no concede la capacidad  -> el sandbox funciona
 *   unimplemented el sandbox concede la capacidad, no hay transporte -> nadie probo
 * Confundirlos haria creer que la seguridad esta probada cuando lo que falta es
 * el cable. Por eso esta tool PROPAGA la respuesta del puerto en vez de inventar
 * un resultado: si le llega `unimplemented`, ella falla con `unimplemented`.
 *
 * Y por que propaga en vez de devolver un texto de apology: una tool que ante un
 * fallo devuelve algo plausible convierte un hueco de infraestructura en un
 * artifact que parece bueno. El autor veria notas de investigacion y no sabria
 * que no hubo ninguna.
 *
 * EL LECTOR DE URL ES FIJO Y ESTA A LA VISTA
 * Una tool que hace `net(url)` con la url del usuario es un SSRF esperando a que
 * alguien lo pruebe. Este MVP no resuelve URLs de usuario: hay una sola, escrita
 * aqui, y cambiarla es un cambio de contrato visible.
 *
 * NOTA PARA T1: cuando exista el backend real, esta tool seguira siendo
 * ESTOCASTICA por una razon distinta —no hay dos consultas que devuelvan lo
 * mismo—, y por eso sigue declarando `recipe` y no se cachea.
 */

import type { ToolDescriptor } from '../contract.js';
import type { ToolImpl } from '../tool.js';

export const RESEARCH_DESCRIPTOR: ToolDescriptor = {
  id: 'opita.research',
  version: '0.1.0',
  author: 'opita',
  title: 'busca notas sobre un tema',
  determinism: 'stochastic',
  tier: 'T1',
  effect: 'read',
  inputs: [{ name: 'query', produces: 'text', artifact: false }],
  outputs: [{ name: 'notes', produces: 'text', artifact: true }],
};

/** Unico destino. No viene del input: user-controlled fetch es un SSRF. */
export const RESEARCH_ENDPOINT = 'https://duckduckgo.com/html/?q=';

export const RESEARCH_IMPL: ToolImpl = (input, _ctx, effects) => {
  const query = input['query'];
  if (typeof query !== 'string') return { ok: false, error: 'falta el puerto de entrada query' };

  const res = effects.net(RESEARCH_ENDPOINT + encodeURIComponent(query));
  if (!res.ok) {
    // Se propaga el PORQUE del sandbox, no uno propio. `denied` y `unimplemented`
    // llegan intactos, y son cosas distintas.
    return { ok: false, error: `${res.why}: ${res.detail}` };
  }
  return { ok: true, outputs: [{ port: 'notes', value: String(res.value) }] };
};