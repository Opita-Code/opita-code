/**
 * CASO CANONICO 1 — el que COMPLETA. EXEC -> RENDER, los dos deterministas.
 *
 * Este es el criterio de exito primario del MVP: si una app de terceros se puede
 * construir, esto se puede construir. Y se construye DENTRO de vibe-tools, sin
 * dependencias, con las tools que salen en la caja.
 *
 * POR QUE NO DRAFT -> RENDER, QUE ERA EL PRIMER BORRADOR
 * Porque R5 lo rechaza: una tool determinista no puede consumir de una
 * estocastica. No es un capricho del validador. Si RENDER dependiera de un draft
 * que cambia cada corrida, RENDER no podria ser determinista, y el artifact
 * entero dejaria de ser un fork reproducible — que es justo lo que un artifact
 * determinista promete. La regla hacia su trabajo antes de que este loop la
 * tocara: los dos casos canonicos que existen hoy son, precisamente, los que R5
 * permite.
 *
 * LOS NODOS ESTAN DECLARADOS AL REVES, A PROPOSITO
 * `dibuja` esta declarado antes que `calcula`, aunque `dibuja` depende de el. Asi
 * el caso canonico ejercita el orden topologico de verdad: si `executionOrder`
 * volviera a ser el orden de declaracion, ESTE caso entregaria el grafo
 * incompleto y el artifact saldria vacio. El caso canonico no necesita un test
 * aparte para el orden: lo usa todos los dias.
 *
 * El puerto de entrada de `calcula` no tiene arista, asi que es un punto de
 * ENTRADA del modulo y el runner lo exige en `entry`.
 */

import type { ModuleDescriptor } from '../contract.js';
import { EXEC_DESCRIPTOR } from '../tools/exec.js';
import { RENDER_DESCRIPTOR } from '../tools/render.js';

export const CANONICO_COMPLETO: ModuleDescriptor = {
  id: 'opita.canonico.completo',
  version: '0.1.0',
  author: 'opita',
  title: 'calcula un valor y lo dibuja',
  nodes: [
    { node: 'dibuja', tool: RENDER_DESCRIPTOR },
    { node: 'calcula', tool: EXEC_DESCRIPTOR },
  ],
  edges: [{ from: 'calcula', fromPort: 'value', to: 'dibuja', toPort: 'value' }],
  sinks: ['dibuja:svg'],
};

export const ENTRADA_COMPLETO = {
  'calcula:expr': '6 * 7',
};
