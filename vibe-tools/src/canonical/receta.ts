/**
 * CASO CANONICO 2 — una RECETA. Un solo nodo, `DRAFT`, y entrega texto.
 *
 * El caso 1 demuestra que el grafo se camina. Este demuestra que la segunda mitad
 * del type system tambien se camina: el Sharing de L0, que hasta ahora no hacia
 * NADA, decidiendo si el valor se reusa o se vuelve a calcular.
 *
 * POR QUE UN SOLO NODO
 * Porque R5 impide encadenar una receta hacia un nodo determinista, y la unica
 * tool T0 que consume texto y es determinista es RENDER. Un caso canonico con
 * receta T0 tiene que quedarse corto, y quedarse corto es la consecuencia
 * correcta de las reglas de L0, no una carencia que este loop tapara.
 *
 * LO QUE DEMUESTRA
 * Que dos corridas con el MISMO par (topic, nonce) dan el mismo texto, y que dos
 * nonces distintos dan textos distintos. La variabilidad esta en el input porque
 * en T0 no hay otra fuente, y por eso DRAFT se declara `recipe`: no se cachea,
 * se ejecuta siempre, aunque hoy su salida sea una funcion pura del input.
 */

import type { ModuleDescriptor } from '../contract.js';
import { DRAFT_DESCRIPTOR } from '../tools/draft.js';

export const CANONICO_RECETA: ModuleDescriptor = {
  id: 'opita.canonico.receta',
  version: '0.1.0',
  author: 'opita',
  title: 'redacta una variante',
  nodes: [{ node: 'redacta', tool: DRAFT_DESCRIPTOR }],
  edges: [],
  sinks: ['redacta:draft'],
};

export const ENTRADA_RECETA = {
  'redacta:topic': 'la memoria como nucleo',
  'redacta:nonce': 'n1',
};
