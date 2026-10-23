/**
 * CASO CANONICO 3 — el que NO completa, y por que eso es el resultado correcto.
 * EXEC (T0, determinista) -> RESEARCH (T1, estocastica).
 *
 * Este es el caso que se sube al marketplace, y aqui NO corre. Y no se disfraza de
 * que corre: se detiene en `busca` con el motivo exacto, y el motivo tiene dos
 * formas distintas segun el host, y las dos importan.
 *
 *   host de cliente (el default)  -> E_HOST_UNSUPPORTED  el host no sostiene T1
 *   host con T1 (clientFull)      -> E_TOOL_ERROR, y el detalle dice
 *                                     `unimplemented`: T1 concede net y no hay
 *                                     transporte
 *
 * La diferencia NO es un detalle de implementacion. `E_HOST_UNSUPPORTED` dice que
 * el entorno esta mal; `unimplemented` dice que el sandbox concede el poder y
 * nadie probo el cable. Solo el segundo revela el TODO bloqueante de L1, y por eso
 * los dos casos se prueban.
 *
 * LO QUE ESTE CASO DEMUESTRA Y NO SE PUEDE DEMOSTRAR DE OTRA FORMA
 * Que la cadena de L1 sobrevive al cruce del modulo: el intento de red queda
 * registrado con `granted: true` —o sea, el sandbox CONCEDIO la capacidad— y aun
 * asi la corrida falla. Un modulo que se detuviera sin decir por que, o que
 * devolviera notas inventadas, seria peor que un modulo que no existe.
 *
 * Y que `deniedCount` sigue siendo 0: no hubo exfiltracion. Fallar no es lo mismo
 * que intentar salir.
 *
 * RENDER NO esta en esta cadena, y no por forgotten: R5 prohibe que un nodo
 * determinista consuma de uno estocastico, y `busca` es estocastica.
 */

import type { ModuleDescriptor } from '../contract.js';
import { EXEC_DESCRIPTOR } from '../tools/exec.js';
import { RESEARCH_DESCRIPTOR } from '../tools/research.js';

export const CANONICO_INVESTIGACION: ModuleDescriptor = {
  id: 'opita.canonico.investigacion',
  version: '0.1.0',
  author: 'opita',
  title: 'calcula y investiga',
  nodes: [
    { node: 'calcula', tool: EXEC_DESCRIPTOR },
    { node: 'busca', tool: RESEARCH_DESCRIPTOR },
  ],
  edges: [{ from: 'calcula', fromPort: 'value', to: 'busca', toPort: 'query' }],
  sinks: ['busca:notes'],
};

export const ENTRADA_INVESTIGACION = {
  'calcula:expr': '6 * 7',
};
