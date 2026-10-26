/**
 * LAS OPERACIONES SOBRE IDENTIDADES: construir una, y compararla.
 *
 * TRES CONSTRUCTORES Y UNA REGLA: la identidad sale CONGELADA. No hay forma de
 * mutarla en vuelo, y el runtime no depende de que el llamador se porte: la
 * clave de aislamiento no se puede cambiar despues de que el harness decidio
 * el contexto.
 *
 * LA FABRICA DE LA LEGAL NO ACEPTA UN KYC. Sin stack de KYC (L4-T2) el runtime
 * no puede respaldar ningun estado mas, y un parametro seria una puerta para
 * subirlo a mano. Cuando exista el stack, el KYC verificado llegara con su
 * verificador, no con un argumento.
 */

import {
  namespaceDe,
  type IdentidadAnonimo,
  type IdentidadEmpresa,
  type IdentidadLegal,
  type Identity,
} from '../identity.js';

/** La identidad legal. El KYC arranca simulado. */
export function identidadLegal(id: string): IdentidadLegal {
  return Object.freeze({ kind: 'legal', id, projectId: namespaceDe('legal', id), kyc: 'simulada' });
}

/** La identidad de empresa. */
export function identidadEmpresa(id: string, razonSocial: string): IdentidadEmpresa {
  return Object.freeze({ kind: 'empresa', id, projectId: namespaceDe('empresa', id), razonSocial });
}

/** La identidad anonima. El nickname viene del pool cerrado, ya asignado. */
export function identidadAnonima(id: string, nickname: string): IdentidadAnonimo {
  return Object.freeze({ kind: 'anonimo', id, projectId: namespaceDe('anonimo', id), nickname });
}

/**
 * DOS IDENTIDADES SON LA MISMA cuando coinciden las tres cosas que las
 * definen. El tipo no basta: `legal` con otra clave es otro mod, y dos ids
 * distintos son dos identidades.
 */
export function mismaIdentidad(a: Identity, b: Identity): boolean {
  return a.id === b.id && a.kind === b.kind && a.projectId === b.projectId;
}
