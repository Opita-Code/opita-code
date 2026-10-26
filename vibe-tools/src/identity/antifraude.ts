/**
 * DONDE LLEGA EL ANTIFRAUDE, Y QUE ES LOCALIZAR A UNA PERSONA.
 *
 * A6 = opcion 4: el antifraude se degrada. El clasificador opera sobre
 * identidades legales, que son pocas y verificables; la empresa y el anonimo
 * quedan fuera de su alcance. Y el flag, cuando exista, es un dato del mod,
 * rectificable y contestable (art. 8), no una inferencia enterrada.
 *
 * EL PRECIO, DICHO EN VOZ ALTA. El perfil anonimo es el punto mas debil del
 * sistema: es el unico que no se puede defender, y es el unico que no deja
 * rastro para defenderse. Eso es una decision del operador, no un defecto de
 * este archivo.
 *
 * LA TABLA ES UNA CONSTANTE, NO UNA CONDICION ESCONDIDA. El alcance del
 * antifraude es una decision, y una decision se lee de un solo lado. Si esto
 * fuera un `if` repartido por el codigo, la pregunta «a quien alcanza» no
 * tendria una respuesta unica.
 *
 * LOCALIZADORES. Para que el perfil anonimo sea anonimo hay que no localizar a
 * la persona, y un localizador es justo eso: psicometria, IP o dispositivo. La
 * lista es explicita y viva: anadir un localizador nuevo es anadirlo aqui, y
 * el validador lo va a rechazar en cuanto llegue al perfil anonimo.
 *
 * LO QUE NO HAY AQUI, Y POR QUE.
 *   - No hay techo de falsos positivos. A7 = T1: la regla ahora, el techo
 *     medido cuando exista el clasificador. Un techo aqui seria un numero
 *     inventado.
 *   - No hay heuristica, ni pesos, ni modelo. Esto declara a quien alcanza el
 *     antifraude; como decide es del clasificador, que todavia no existe.
 */

import type { Identity, IdentityKind } from '../identity.js';

/** Que tipos de identidad quedan bajo el antifraude. */
export const ALCANCE_ANTIFRAUDE: Readonly<Record<IdentityKind, boolean>> = Object.freeze({
  legal: true,
  empresa: false,
  anonimo: false,
});

/** Si el antifraude alcanza a esta identidad. */
export function alcanceAntifraude(identity: Identity): boolean {
  return ALCANCE_ANTIFRAUDE[identity.kind];
}

/** Los campos que localizan a una persona: psicometria, IP y dispositivo. */
export const LOCALIZADORES: readonly string[] = Object.freeze([
  'psicometria',
  'ip',
  'dispositivo',
  'deviceId',
  'fingerprint',
]);
