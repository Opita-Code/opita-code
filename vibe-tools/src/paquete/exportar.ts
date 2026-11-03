/**
 * L4-T6 · EL EXPORT: empaquetar un modulo.
 *
 * QUE ES. La funcion que convierte un modulo en un paquete, y la que convierte
 * un paquete en el texto que viaja. Es la mitad izquierda del ida y vuelta.
 *
 * POR QUE LA HUELLA SE CALCULA SOBRE EL MODULO Y NO SOBRE EL PAQUETE. La
 * huella responde a una pregunta: ¿este contenido es el que se exporto? Si
 * se calculara sobre el paquete, la respuesta incluiria a la propia huella, y
 * habria que decidir que se excluye para no ser circular. Si se calcula sobre
 * el modulo, la respuesta es directa y la regla no tiene excepciones: el
 * sha256 del modulo canonico.
 *
 * POR QUE EL EXPORT NO VALIDA EL MODULO. Exportar y validar son cosas
 * distintas: el export dice "esto es lo que hay", y la validacion dice "esto
 * esta bien". Un modulo invalido se puede exportar (y por eso se puede
 *mandar a alguien para que lo mire), pero no se puede INSTALAR. Que el
 * export no juzgue es lo que permite que la instalacion sea el unico lugar
 * donde se decide si el paquete sirve.
 *
 * POR QUE EL TEXTO ES EL CANONICO. El paquete viaja como texto, y el texto
 * que viaja es el canonico: las claves ordenadas, sin espacios de mas. Dos
 * personas que construyan el mismo modulo en runtimes distintos producen el
 * mismo texto, y por eso pueden comparar huellas. Si el texto fuera "el
 * JSON que salio", la comparacion dependeria de quien serializo.
 */

import { canonicalize } from '../canonical.js';
import { integrityOf, type ModuleDescriptor } from '../contract.js';
import {
  FORMATO_PAQUETE,
  VERSION_FORMATO,
  type Paquete,
} from './formato.js';

/**
 * EMPAQUETAR UN MODULO.
 *
 * DETERMINISTA: el mismo modulo da siempre el mismo paquete y la misma
 * huella. No hay fecha, ni numero de serie, ni nada que dependa del reloj:
 * un paquete que se exporta dos veces tiene que ser el mismo fichero, o la
 * huella deja de ser una identidad.
 */
export function exportarPaquete(modulo: ModuleDescriptor): Paquete {
  return {
    formato: FORMATO_PAQUETE,
    formato_version: VERSION_FORMATO,
    modulo,
    huella: integrityOf(modulo),
  };
}

/**
 * EL PAQUETE COMO TEXTO.
 *
 * Es lo que se escribe en el fichero. El canonico, no un JSON prettificado:
 * el fichero es un artefacto, y su hash tiene que ser el mismo en cualquier
 * parte.
 */
export function serializarPaquete(paquete: Paquete): string {
  return canonicalize(paquete);
}
