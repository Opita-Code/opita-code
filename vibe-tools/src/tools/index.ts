/**
 * LAS CUATRO TOOLS QUE SALEN EN LA CAJA.
 *
 * `EXEC` y `RENDER` son deterministas de T0. `DRAFT` es estocastica de T0, y su
 * variabilidad esta en el input porque T0 no concede entropia (ver `draft.ts`).
 * `RESEARCH` es estocastica de T1 y NO se puede ejecutar en el MVP: T1 concede
 * `net` pero no hay transporte, asi que falla con `unimplemented` y no con
 * `denied`.
 *
 * CUATRO Y NO TRES, Y POR QUE
 * El plan de MVP pedia tres. Con solo esas, el caso canonico end-to-end no se
 * puede completar, porque su tercer nodo es T1 y T1 no tiene transporte.
 * `DRAFT` es la que hace alcanzable la KPI primaria SIN fabricar nada: la
 * estocasticidad es ortogonal al efecto, asi que una tool T0 puede ser
 * estocastica de verdad. Desviacion del plan, declarada.
 *
 * `baseRegistry()` construye un registry NUEVO cada vez. Un registry con las
 * cuatro ya registradas seria estado compartido entre tests, y un test que
 * registra una tool con el mismo id contaminaria al siguiente sin que ninguno
 * de los dos se entere.
 */

import { ToolRegistry } from '../tool.js';
import { EXEC_DESCRIPTOR, EXEC_IMPL } from './exec.js';
import { RENDER_DESCRIPTOR, RENDER_IMPL } from './render.js';
import { DRAFT_DESCRIPTOR, DRAFT_IMPL } from './draft.js';
import { RESEARCH_DESCRIPTOR, RESEARCH_IMPL } from './research.js';

export interface BaseTool {
  readonly descriptor: (typeof EXEC_DESCRIPTOR) & Record<string, unknown>;
  readonly impl: (typeof EXEC_IMPL) & Record<string, unknown>;
}

export const BASE_TOOLS = [
  { descriptor: EXEC_DESCRIPTOR, impl: EXEC_IMPL },
  { descriptor: RENDER_DESCRIPTOR, impl: RENDER_IMPL },
  { descriptor: DRAFT_DESCRIPTOR, impl: DRAFT_IMPL },
  { descriptor: RESEARCH_DESCRIPTOR, impl: RESEARCH_IMPL },
] as const;

export function baseRegistry(): ToolRegistry {
  const r = new ToolRegistry();
  for (const t of BASE_TOOLS) r.register(t.descriptor, t.impl);
  return r;
}

export { EXEC_DESCRIPTOR, EXEC_IMPL, RENDER_DESCRIPTOR, RENDER_IMPL };
export { DRAFT_DESCRIPTOR, DRAFT_IMPL, RESEARCH_DESCRIPTOR, RESEARCH_IMPL };