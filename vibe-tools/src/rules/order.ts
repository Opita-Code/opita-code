/**
 * ORDEN DE EJECUCION — R10.
 *
 * El grafo validado no es un plan: es una forma. `executionOrder` en L0 era
 * `mod.nodes.map(...)`, o sea el orden en que el AUTOR escribio el descriptor.
 * Eso no dice nada sobre que se puede correr antes que que.
 *
 * Aqui se calcula el unico orden que si lo dice: todo nodo va despues de los
 * que lo alimentan.
 *
 * POR QUE ESTA EN rules/ Y NO EN graph.ts
 *  Porque es una regla como las otras, con su codigo de rechazo y su lugar en la
 *  tabla. Agregarla como una funcion mas dentro del orquestador seria lo
 *  contrario de lo que hizo L0 al partir `graph.ts` en `rules/*`: un archivo por
 *  preocupacion, caben en un chunk, y se juzgan por separado.
 *
 * POR QUE VA DESPUES DE LAS ARISTAS Y ANTES DE LAS TERMINALES
 *  Es el unico orden donde el codigo de rechazo le dice al autor la VERDAD. Un
 *  ciclo no tiene terminal: si esta regla corriera al final, R7d cortaria primero
 *  con E_SINK_NOT_TERMINAL y el autor leeria "este sink no es terminal" en vez de
 *  "tienes un ciclo". Sintoma y causa raiz dan codigos distintos, y dar el
 *  sintoma esconde el problema.
 *
 * EL DESEMPATE ES EL ORDEN DE DECLARACION, Y NO UNA SEGUNDA CLAVE
 *  Puede haber varios nodos listos a la vez, y hay que elegir. Elegir por nombre
 *  agregaria una clave de orden que el autor no escribio y que el sandbox no
 *  puede verificar; elegir por el orden del descriptor usa la informacion que el
 *  autor SI escribio, y hace que el plan sea funcion del descriptor y nada mas.
 *  Sin esa segunda clave, dos implementaciones del mismo algoritmo dan el mismo
 *  plan, que es lo que hace el plan reproducible.
 */

import { fail, pass, type Checker, type RuleResult, type RuleState } from './types.js';

export function ruleOrderable(state: RuleState, c: Checker): RuleResult<void> {
  const mod = state.module;
  const names = mod.nodes.map((n) => n.node);

  // Predecesores DISTINTOS por nodo. Un nodo puede recibir tres puertos del mismo
  // upstream, y eso es un solo predecesor: contar aristas en vez de predecesores
  // haria que ese nodo nunca llegara a estar listo.
  const preds = new Map<string, Set<string>>();
  const succ = new Map<string, string[]>();
  for (const n of names) {
    preds.set(n, new Set());
    succ.set(n, []);
  }
  for (const e of mod.edges) {
    // `?.` es seguro porque R2 ya comprobo que los dos extremos existen. No es
    // tolerancia a basura: es que la regla que lo comprueba corrio antes.
    preds.get(e.to)?.add(e.from);
    succ.get(e.from)?.push(e.to);
  }

  const remaining = new Map<string, Set<string>>();
  for (const n of names) remaining.set(n, new Set(preds.get(n)!));

  const placed: string[] = [];
  const done = new Set<string>();

  // Barrido en orden de declaracion: el primer listo gana. Son pocos nodos, y el
  // barrido compra un desempate obviamente determinista sin una clave extra.
  while (placed.length < names.length) {
    let pick: string | null = null;
    for (const n of names) {
      c.count();
      if (done.has(n)) continue;
      if (remaining.get(n)!.size === 0) {
        pick = n;
        break;
      }
    }
    if (pick === null) break;
    done.add(pick);
    placed.push(pick);
    for (const s of succ.get(pick)!) remaining.get(s)!.delete(pick);
  }

  if (placed.length !== names.length) {
    // Lo que se reporta es lo que NO se pudo ordenar, que es el ciclo MAS todo lo
    // que depende de el. Se dice asi a proposito: reportar "el ciclo" y entregar
    // el remanente seria mentir por la forma, y un autor que busca un nodo que no
    // esta en el ciclo pierde la confianza en el mensaje.
    const stuck = names.filter((n) => !done.has(n));
    return fail(
      'E_CYCLE',
      `no se puede ordenar: ${placed.length} de ${names.length} nodos; ` +
        `${stuck.length} quedan en un ciclo o dependen de uno: ${stuck.join(', ')}`,
      stuck[0] ?? null,
    );
  }

  state.order = Object.freeze(placed);
  return pass(undefined);
}