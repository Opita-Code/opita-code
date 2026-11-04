/**
 * L5-T1 · LA LISTA BLANCA DE BACKEND: que tools pueden correr en T2.
 *
 * QUE ES. El plan lo pide como «check de whitelist de modulos backend», y la
 * pregunta que responde es una sola: un modulo que declara un nodo de tier
 * T2, ¿usa solo las tools que Opita permite en el backend?
 *
 * POR QUE ES UNA LISTA Y NO UNA REGLA. El tier T2 es una microVM con red y
 * con disco: es el unico sitio donde una tool puede tocar un saldo, una
 * vacante o un pago. Si el permiso se derivara de algo que el autor controla
 * (el `author`, el `tier` que declara, el nombre de la tool), publicar seria
 * el acto de concederse el backend. Con una lista explicita, usar el backend
 * es un acto visible: alguien anadio el id a la lista, y queda el rastro.
 *
 * LA LISTA ESTA VACIA, Y ES LO HONESTO. En el MVP no hay microVM: el
 * `HOSTS.backend` de L1 describe una capacidad, no una ejecucion. Una lista
 * con tools de mentira daria la impresion de que hay un backend permitido, y
 * no lo hay. Vacia, cualquier modulo con un nodo T2 se rechaza, y el rechazo
 * dice exactamente que tool falta por decidir.
 *
 * LO QUE ESTA LISTA NO ES. No es el tier del host: que una tool este
 * permitida aqui no significa que el host pueda correrla. Eso lo responde
 * `sandbox/tier.ts` con `supports()`, y son dos preguntas distintas: la
 * politica dice «se permite», la capacidad dice «se puede». Un modulo puede
 * pasar la lista y aun asi no correr en esta maquina, y el runtime lo dice
 * con `missing`, no con un fallo silencioso.
 *
 * LO QUE NO HACE. No mira el efecto de la tool, ni su perfil de contexto, ni
 * sus permisos: eso es de la puerta de L4-T5, que concede por concesion y no
 * por tier. Aqui solo se decide si la tool pertenece al conjunto backend.
 */

import type { ModuleDescriptor } from '../contract.js';

/**
 * Las tools permitidas en el backend. Vacia a proposito: no hay backend.
 * Anadir un id es una decision del operador, y se ve en el diff.
 */
export const WHITELIST_BACKEND: readonly string[] = Object.freeze([]);

export type RevisionWhitelist =
  | {
      readonly ok: true;
      /** Cuantos nodos del modulo declaran T2. Cero es un modulo sin backend. */
      readonly backend: number;
    }
  | {
      readonly ok: false;
      readonly motivo: 'tool_no_permitida';
      /** Las tools que el modulo quiere usar en T2 y la lista no admite. */
      readonly tools: readonly string[];
    };

/**
 * Revisa un modulo contra la lista blanca.
 *
 * Se miran los nodos, no las aristas: un nodo T2 aislado sigue siendo codigo
 * que correria en la microVM, y el grafo puede ser valido sin que el nodo
 * este conectado a nada.
 */
export function revisarWhitelist(
  modulo: ModuleDescriptor,
  permitidas: readonly string[] = WHITELIST_BACKEND,
): RevisionWhitelist {
  const backend = modulo.nodes.filter((n) => n.tool.tier === 'T2');
  const fuera = backend.filter((n) => !permitidas.includes(n.tool.id)).map((n) => n.tool.id);
  if (fuera.length > 0) {
    return { ok: false, motivo: 'tool_no_permitida', tools: [...new Set(fuera)] };
  }
  return { ok: true, backend: backend.length };
}
