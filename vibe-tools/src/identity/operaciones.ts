/**
 * LAS OPERACIONES SOBRE IDENTIDADES: construir una, copiarla y compararla.
 *
 * TRES CONSTRUCTORES Y UNA REGLA: la identidad sale CONGELADA. No hay forma de
 * mutarla en vuelo, y el runtime no depende de que el llamador se porte: la
 * clave de aislamiento no se puede cambiar despues de que el harness decidio
 * el contexto.
 *
 * LA FABRICA DE LA LEGAL. Antes no aceptaba un KYC: sin stack (L4-T2) el
 * runtime no podia respaldar ningun estado mas, y un parametro suelto seria
 * una puerta para subirlo a mano. Ahora hay tres fabricas, y las tres exigen la
 * evidencia que les corresponde: la que nace simulada, la documental (las
 * cuatro señales del stack libre, decision A1) y la verificada (que ademas
 * trae la señal registral, un contrato con el registro oficial). La evidencia
 * se copia y se congela aqui, y la puerta la comprueba.
 */

import {
  namespaceDe,
  type IdentidadAnonimo,
  type IdentidadEmpresa,
  type IdentidadLegal,
  type Identity,
} from '../identity.js';
import { congelarEvidencia, type EvidenciaKyc } from './kyc.js';

/** La identidad legal. Sin evidencia: el KYC arranca simulado. */
export function identidadLegal(id: string): IdentidadLegal {
  return Object.freeze({
    kind: 'legal',
    id,
    projectId: namespaceDe('legal', id),
    kyc: Object.freeze({ estado: 'simulada' } as const),
  });
}

/** La identidad legal con verificacion documental: las cuatro señales libres. */
export function identidadLegalDocumental(id: string, evidencia: EvidenciaKyc): IdentidadLegal {
  return Object.freeze({
    kind: 'legal',
    id,
    projectId: namespaceDe('legal', id),
    kyc: Object.freeze({ estado: 'documental', evidencia: congelarEvidencia(evidencia) } as const),
  });
}

/** La identidad legal verificada: las cuatro señales y la registral. */
export function identidadLegalVerificada(id: string, evidencia: EvidenciaKyc): IdentidadLegal {
  return Object.freeze({
    kind: 'legal',
    id,
    projectId: namespaceDe('legal', id),
    kyc: Object.freeze({ estado: 'verificada', evidencia: congelarEvidencia(evidencia) } as const),
  });
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
 * LA IDENTIDAD, COPIADA POR DENTRO. La identidad es un objeto, y ahora lleva
 * otro objeto dentro: la evidencia. Copiarla en la superficie no basta, porque
 * una tool podria mutar las señales del KYC despues de que el harness decidio
 * el contexto. Se copia en cascada y se congela, y el objeto del llamador
 * sigue siendo suyo: es su objeto, y mutarlo despues no toca el contexto.
 */
export function copiarIdentidad(identity: Identity): Identity {
  if (identity.kind !== 'legal') return Object.freeze({ ...identity });
  const kyc = identity.kyc;
  if (kyc.estado === 'simulada') {
    return Object.freeze({ ...identity, kyc: Object.freeze({ ...kyc }) });
  }
  return Object.freeze({
    ...identity,
    kyc: Object.freeze({ ...kyc, evidencia: congelarEvidencia(kyc.evidencia) }),
  });
}

/**
 * DOS IDENTIDADES SON LA MISMA cuando coinciden las tres cosas que las
 * definen. El tipo no basta: `legal` con otra clave es otro mod, y dos ids
 * distintos son dos identidades.
 */
export function mismaIdentidad(a: Identity, b: Identity): boolean {
  return a.id === b.id && a.kind === b.kind && a.projectId === b.projectId;
}
