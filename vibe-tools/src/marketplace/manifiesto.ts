/**
 * L6-T1 · EL MANIFIESTO: lo que el juez va a leer.
 *
 * QUE ES. El artefacto de una publicacion. No es el codigo de la tool (que no
 * viaja: la magia se resuelve por `(id, version)` en el registry) ni una prosa
 * que escribe el autor (que seria juzgarse a si mismo). Es la DECLARACION de
 * la tool: lo que dice hacer, con que determinismo, en que tier, que pide y
 * que entrega.
 *
 * POR QUE UN NODO POR PARTE.
 *
 *   L5 necesita una afirmacion por parte, porque una parte se juzga contra SU
 *   propia pregunta. Un modulo con tres nodos son tres afirmaciones: "este
 *   nodo calcula", "este nodo busca", "este nodo entrega". Si las tres
 *   afirmaciones fueran una sola, el juez compararia un fragmento contra la
 *   pregunta del modulo entero, y ya se midio que eso produce deriva FALSA:
 *   tres documentos correctos salieron `drift_detected`.
 *
 * POR QUE EL TEXTO ES HECHO Y NO PROSA.
 *
 *   El manifiesto no dice "este nodo redacta una variante": eso lo dice la
 *   AFIRMACION, que es la pregunta. El manifiesto dice lo que el descriptor
 *   declara: puertos, tipos, tier, efecto, contexto. Si las dos partes se
 *   mezclaran, el juez estaria comparando una frase con si misma.
 *
 * POR QUE LA PARTE ES UN NODO Y NO UN PUERTO.
 *
 *   El puerto es la unidad minima de contrato, pero un puerto no es una
 *   unidad de COMPORTAMIENTO: "produce texto" no es una afirmacion que se
 *   pueda sostener ni refutar. El nodo es la unidad que hace algo, y es la
 *   que el autor puede afirmar.
 *
 * LO QUE ESTE ARCHIVO NO HACE. No juzga, no valida y no escribe en disco: el
 * manifiesto es texto, y el transporte (L5) es quien se lo entrega al juez.
 */

import { sha256HexOfText } from '../hash.js';
import type { Port, ToolDescriptor } from '../contract.js';
import { esModulo, type Entrada } from './entrada.js';

/** Una parte del manifiesto, con su texto y su medida. */
export interface ParteDelManifiesto {
  /** El numero de parte, desde 1. */
  readonly n: number;
  readonly titulo: string;
  readonly texto: string;
  readonly bytes: number;
  /** sha256 del texto de la parte. */
  readonly sha: string;
}

function puertoDe(p: Port): string {
  return `${p.name}:${p.produces}${p.artifact ? ' (entregable)' : ''}`;
}

function puertoDeEntrada(p: Port): string {
  return `${p.name}:${p.produces}`;
}

/**
 * La declaracion de una tool, en texto.
 *
 * Los puertos van en el orden del descriptor, no ordenados: el orden de los
 * puertos ES parte del descriptor (lo dice `contract.ts`), y reordenar aqui
 * haria que el manifiesto no describiera el descriptor que se publico.
 */
export function describirTool(tool: ToolDescriptor, nombre: string): string {
  const lineas = [
    nombre,
    `  tool: ${tool.id}@${tool.version}`,
    `  autor: ${tool.author}`,
    `  determinismo: ${tool.determinism}`,
    `  tier: ${tool.tier}`,
    `  efecto: ${tool.effect}`,
    `  contexto: ${tool.context_profile}`,
    `  psicometria: ${tool.psychometrics ? 'si' : 'no'}`,
    `  entradas: ${tool.inputs.map(puertoDeEntrada).join(', ') || 'ninguna'}`,
    `  salidas: ${tool.outputs.map(puertoDe).join(', ') || 'ninguna'}`,
  ];
  return lineas.join('\n');
}

/**
 * Las partes del manifiesto de una entrada.
 *
 * Un modulo da una parte por nodo, en el orden de declaracion del descriptor.
 * Una tool atomica da una sola parte. El numero de partes es el numero de
 * afirmaciones que tiene que traer la entrada.
 */
export function partesDe(entrada: Entrada): readonly ParteDelManifiesto[] {
  const crudos: { titulo: string; texto: string }[] = [];
  if (esModulo(entrada.descriptor)) {
    for (const nodo of entrada.descriptor.nodes) {
      crudos.push({ titulo: nodo.node, texto: describirTool(nodo.tool, `nodo ${nodo.node}`) });
    }
  } else {
    crudos.push({ titulo: entrada.descriptor.id, texto: describirTool(entrada.descriptor, 'tool') });
  }
  return crudos.map((c, i) => ({
    n: i + 1,
    titulo: c.titulo,
    texto: c.texto,
    bytes: new TextEncoder().encode(c.texto).length,
    sha: sha256HexOfText(c.texto),
  }));
}
