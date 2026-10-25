/**
 * LA IDENTIDAD DE PRUEBA: una sola, compartida.
 *
 * Los tests construyen contextos y todos necesitan una identidad. Declararla
 * aqui, y no en cada archivo, evita que un test use una identidad y otro otra
 * sin que se note: la comparacion tiene que ser sobre la MISMA.
 *
 * Es el stub legal, porque es el unico tipo cuyo comportamiento no depende de
 * una decision pendiente del operador (A5, A6 y A7).
 */

import { identidadStubLegal } from '../src/identity.js';

export const IDENTIDAD = identidadStubLegal('id-legal', 'proyecto-1');
