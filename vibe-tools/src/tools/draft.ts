/**
 * DRAFT — variante de texto. T0, sin efecto, ESTOCASTICA.
 *
 * HALLAZGO DE L2: EN T0 UNA TOOL ESTOCASTICA ES INIMPLEMENTABLE
 * Estocastica de verdad significa que dos corridas con el MISMO input dan
 * salidas distintas, y eso exige una fuente de azar. En T0 no hay ninguna:
 * `Math.random()` es entropia del host, la lista blanca de imports esta vacia
 * por diseno, y el sandbox no concede capacidades. Una tool T0 que sorteara por
 * dentro estaria usando un poder que el tier no le concede, que es exactamente
 * lo que L1 existiria para impedir.
 *
 * Asi que la variabilidad de esta tool esta en el INPUT, no en ella. El `nonce`
 * es parte del input, y el mismo `(topic, nonce)` da siempre el mismo draft.
 * Eso NO la vuelve determinista de hecho: su etiqueta es `stochastic`, y hay una
 * razon de por que esa etiqueta sigue siendo la correcta.
 *
 * POR QUE DECLARAR `stochastic` SI AHORA ES PURA
 * Porque la etiqueta no describe lo que la tool hace HOY, describe COMO SE PUEDE
 * COMPARTIR, y ahi el error va en una sola direccion. Declarar `deterministic`
 * una tool que manana tenga azar es un fallo que se manifiesta tarde y feo: se
 * sirve desde cache un valor que no era funcion del input, y el que lo recibio no
 * tiene forma de saber que no lo era. Declarar `stochastic` una tool que hoy es
 * pura solo cuesta que se ejecute de mas. Sobre-declarar es el error barato.
 *
 * Y si manana esta tool gana una fuente de azar legitima —un T1 con red, un
 * backend— el contrato ya dice `recipe` y el runtime ya la trata como no
 * cacheable. No hay que migrar nada.
 *
 * LA SEMILLA ES UN SHA256, NO UN Math.random
 * Convierte el par en un indice de plantilla. Es determinista, es puro, y es el
 * mismo codigo que ya produce las huellas de los contratos: una sola primitiva
 * para todo lo que depende de bytes.
 */

import { sha256HexOfText } from '../hash.js';
import type { ToolDescriptor } from '../contract.js';
import type { ToolImpl } from '../tool.js';

export const DRAFT_DESCRIPTOR: ToolDescriptor = {
  id: 'opita.draft',
  version: '0.1.0',
  author: 'opita',
  title: 'redacta una variante a partir del tema y un nonce',
  determinism: 'stochastic',
  tier: 'T0',
  effect: 'none',
  inputs: [
    { name: 'topic', produces: 'text', artifact: false },
    { name: 'nonce', produces: 'text', artifact: false },
  ],
  outputs: [{ name: 'draft', produces: 'text', artifact: true }],
};

const OPENERS = [
  'Una forma de mirar {t} es empezar por lo que no cambia.',
  '{t} no se resuelve: se decide, y cada decision deja una cicatriz.',
  'Lo que sigue no es una respuesta sobre {t}, es una pregunta mejor.',
  'Sobre {t}: la parte dificil nunca fue el resultado, fue el criterio.',
  'Hay una version de {t} que cabe en una linea, y no es la que importa.',
];

const CLOSERS = ['', ' Queda pendiente probarlo.', ' Y no por mucho tiempo.', ' Conviene revisarlo.'];

function digest(topic: string, nonce: string): string {
  // Separador NUL: no aparece en texto, asi que ("ab","c") y ("a","bc") no
  // pueden dar la misma semilla. Con un espacio si colisionarian.
  return sha256HexOfText(topic + String.fromCharCode(0) + nonce);
}

export function draft(topic: string, nonce: string): string {
  const d = digest(topic, nonce);
  const opener = OPENERS[parseInt(d.slice(0, 2), 16) % OPENERS.length] as string;
  const closer = CLOSERS[parseInt(d.slice(2, 4), 16) % CLOSERS.length] as string;
  return opener.replace(/{t}/g, topic) + closer;
}

export const DRAFT_IMPL: ToolImpl = (input) => {
  const topic = input['topic'];
  const nonce = input['nonce'];
  if (typeof topic !== 'string' || typeof nonce !== 'string') {
    return { ok: false, error: 'faltan los puertos de entrada topic y nonce' };
  }
  return { ok: true, outputs: [{ port: 'draft', value: draft(topic, nonce) }] };
};