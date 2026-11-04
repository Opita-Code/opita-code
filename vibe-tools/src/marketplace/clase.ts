/**
 * L6-T4 · EL DISTINTIVO: mutation o recipe.
 *
 * QUE ES. El eje 2 ya sabia esto desde L0: una tool determinista se comparte
 * como mutacion (fork identico, es tuyo) y una estocastica solo como receta
 * (cada corrida da otra cosa). En el catalogo ese distintivo es lo que el
 * usuario ve, asi que tiene que vivir en la entrada y no solo en el
 * descriptor.
 *
 * POR QUE SE USA EL VOCABULARIO DE `axes.ts` Y NO UNO PROPIO.
 *
 *   `SHARING` ya dice `deterministic -> mutation`, `stochastic -> recipe` y
 *   `stateful -> none`. Traducirlo a "mutacion" y "receta" anadiria una capa
 *   donde un valor puede dejar de ser el que es. Una palabra, un valor: el
 *   distintivo del catalogo y el eje 2 son la misma cosa con dos caras.
 *
 * POR QUE UN MODULO NO TIENE UN EJE 2 PROPIO.
 *
 *   El eje 2 es de la TOOL. Un modulo es un grafo, y cada nodo tiene el suyo.
 *   El modulo no puede declarar un determinismo que no es suyo: lo tendria que
 *   inventar, y un determinismo inventado es una mentira con forma de dato.
 *
 * POR QUE GANA EL MAS RESTRICTIVO.
 *
 *   Un modulo con un nodo estocastico NO es un fork identico: dos corridas
 *   tuyas dan resultados distintos. Uno con un nodo con estado tampoco: su
 *   salida depende de lo que paso antes. Decir "mutation" ahi seria una promesa
 *   que el modulo no puede cumplir, y el distintivo ES una promesa. Por eso el
 *   orden es none, luego recipe, luego mutation, y el mas restrictivo gana.
 *
 * LO QUE ESTE ARCHIVO NO HACE. No juzga si el modulo es bueno, ni si vale la
 * pena, ni si el autor tiene derecho a publicar: eso son otras preguntas, y
 * cada una tiene su archivo.
 */

import { sharePolicy } from '../module/share.js';
import type { Determinism } from '../axes.js';
import type { ModuleDescriptor } from '../contract.js';

/** El distintivo. Las mismas tres palabras que el eje 2. */
export type Clase = 'mutation' | 'recipe' | 'none';

/** La clase de una tool, derivada del eje 2. Nunca se declara: se deriva. */
export function claseDeTool(determinismo: Determinism): Clase {
  return sharePolicy(determinismo).kind;
}

/**
 * La clase de un modulo: la de sus nodos, y gana el mas restrictivo.
 *
 * Un modulo sin nodos no es un modulo: eso lo rechaza la validacion de L0. Aqui
 * un modulo sin nodos sale `mutation`, que es la clase menos restrictiva, y no
 * es un accidento: sin nodos no hay nada que restrinja.
 */
export function claseDeModulo(modulo: ModuleDescriptor): Clase {
  let clase: Clase = 'mutation';
  for (const nodo of modulo.nodes) {
    const delNodo = claseDeTool(nodo.tool.determinism);
    if (delNodo === 'none') return 'none';
    if (delNodo === 'recipe') clase = 'recipe';
  }
  return clase;
}
