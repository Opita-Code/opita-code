/**
 * LAS IDENTIDADES DE PRUEBA: una de cada tipo.
 *
 * Los tests construyen contextos y todos necesitan una identidad. Declararlas
 * aqui, y no en cada archivo, evita que un test use una identidad y otro otra
 * sin que se note: la comparacion tiene que ser sobre la MISMA.
 *
 * Las tres son de los tres tipos, y las tres con su namespace DERIVADO: el
 * fixture tiene que ser valido, porque el runtime no sella un contexto con una
 * identidad que no lo es, y un fixture invalido haria que los tests de la
 * puerta midieran otra cosa.
 */

import { identidadAnonima, identidadEmpresa, identidadLegal } from '../src/identity/operaciones.js';

export const IDENTIDAD = identidadLegal('id-legal');
export const IDENTIDAD_EMPRESA = identidadEmpresa('id-empresa', 'Comercializadora del Norte S.A.S.');
export const IDENTIDAD_ANONIMA = identidadAnonima('id-anonimo', 'Lince Gris');
