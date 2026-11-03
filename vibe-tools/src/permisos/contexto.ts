/**
 * L4-T5 · LA INYECCION: el contexto que llega a la tool.
 *
 * QUE ES. La funcion que construye el contexto de una tool a partir de dos
 * decisiones: la del contexto y la de la psicometria. Y aqui esta lo que hace
 * el deny by default observable: sin decision, no hay contexto con nada.
 *
 * POR QUE SON DOS DECISIONES Y NO UNA. El psicometrico no es una categoria
 * mas: es una capa con su propia finalidad, su propio consentimiento y su
 * propio motivo de denegacion. Meterlo en la misma decision obligaria a
 * inventar un motivo unico para dos negaciones que no se parecen: "no hay
 * permiso de contexto" y "no hay consentimiento para esta finalidad" son
 * cosas distintas, y quien lo depure necesita distinguirlas.
 *
 * POR QUE LA CATEGORIA INCLUYE LAS DE ABAJO. Una categoria es un GRUPO de
 * campos que viaja junto: conceder `usage_history` concede el historial Y las
 * preferencias, porque el historial contiene las preferencias y separarlas
 * daria la sensacion de un permiso mas fino sin serlo. Lo que NO hace es lo
 * contrario: pedir `preferences` con `usage_history` concedido no mete el
 * historial, porque lo concedido es lo que se PIDIO, no el techo.
 *
 * POR QUE LA INYECCION NO ES UN FILTRO. Un filtro quita lo que no debe, y
 * para quitarlo primero hay que tenerlo: el dato entra en el proceso y sale
 * de el. Aqui los campos que no se conceden NI SE COPIAN: no hay copia, no hay
 * memoria intermedia, no hay un instante en el que el dato sensible estuvo en
 * el contexto. Es la diferencia entre "imposible que se filtre" y "improbable".
 *
 * LO QUE NO HACE ESTE ARCHIVO: no lee la memoria, no audita y no escribe. Los
 * campos se los da el harness, que es el unico actor con autoridad de
 * seleccion; y la auditoria de cada inyeccion (spec de boundary, seccion 7) la
 * escribe el harness tambien, porque es quien sabe QUE se inyecto.
 */

import { contextoCon, type ToolContext } from '../context.js';
import type { Identity } from '../identity.js';
import type { DecisionContexto, DecisionPsicometria } from './puerta.js';
import type { CategoriaConcedida } from './categorias.js';

/**
 * Los campos de la memoria, agrupados por categoria.
 *
 * Un grupo por categoria, y no una bolsa de campos: el permiso concede el
 * grupo entero o no concede nada. Un permiso campo por campo parece mas fino
 * y en la practica es una lista de permisos que hay que mantener.
 */
export interface CamposPorCategoria {
  readonly preferencias: Readonly<Record<string, unknown>>;
  readonly historial: Readonly<Record<string, unknown>>;
  readonly psicometria: Readonly<Record<string, unknown>>;
}

/** Los campos de una categoria, tal y como se inyectan. */
function camposDe(categoria: CategoriaConcedida, campos: CamposPorCategoria): Record<string, unknown> {
  switch (categoria) {
    case 'preferences':
      return { ...campos.preferencias };
    case 'usage_history':
      return { ...campos.preferencias, ...campos.historial };
    default:
      // UNA CATEGORIA QUE NO SE PUEDE CONCEDER ES UN ERROR, no un vacio. Si
      // llega aqui, la decision que llego era incoherente, y devolver un
      // contexto vacio la esconderia: el deny by default searia invisible.
      // Falla fuerte, como falla `posicion` con una categoria desconocida.
      throw new Error(`categoria no concedible: ${categoria}`);
  }
}

/**
 * EL CONTEXTO CONCEDIDO: lo que la tool recibe, y nada mas.
 *
 * SI ALGO NO ESTA CONCEDIDO, NO SE INYECTA. El perfil del contexto es la
 * categoria efectivamente concedida, y el objeto `injected` lleva exactamente
 * los campos de esa categoria. El psicometrio solo entra si su decision lo
 * concedio, y entra con su propia decision: aceptar una finalidad no
 * autoriza las otras.
 */
export function contextoPermitido(
  actorId: string,
  identity: Identity,
  contexto: DecisionContexto,
  psicometria: DecisionPsicometria,
  campos: CamposPorCategoria,
  deadlineMs = 5_000,
): ToolContext {
  const inyectado: Record<string, unknown> = contexto.concedido
    ? camposDe(contexto.categoria, campos)
    : {};

  if (psicometria.concedido) {
    inyectado['psicometria'] = { ...campos.psicometria };
  }

  return contextoCon(
    actorId,
    identity,
    contexto.concedido ? contexto.categoria : 'none',
    inyectado,
    deadlineMs,
  );
}
