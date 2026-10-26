/**
 * LAS TRES IDENTIDADES: EL MODELO.
 *
 * QUE ES. Una identidad es a quien pertenece la memoria de la que sale el
 * dato inyectado. No es quien ejecuta (eso es `actorId`, el actor) ni es la
 * persona: es el proyecto de memoria del que sale el contexto.
 *
 * POR QUE UN UNION. Los tres tipos son legal, empresa y anonimo, y estan
 * decididos. No son tres campos de una misma forma: cada uno lleva lo que el
 * otro no lleva, y el que no lo lleva no debe poderllo. El union hace que eso
 * sea un error de compilacion y no una disciplina.
 *
 *   - LEGAL: el yo real. KYC simulada hasta que haya stack (L4-T2).
 *   - EMPRESA: la organizacion. Su mod y su razon social (D6).
 *   - ANONIMO: el perfil sin nombre. Un nickname y nada mas.
 *
 * LA CLAVE SE DERIVA, NO SE PASA. Cada tipo tiene su prefijo (`identity:legal:`,
 * `identity:org:`, `identity:anon:`, del documento legal seccion 3.1), y la
 * clave se construye con el tipo y el id. Antes `projectId` era una cadena
 * libre del llamador, y una identidad legal podia apuntar al mod de la
 * empresa: la separacion se deshacia en la construccion, no en el uso.
 *
 * LO QUE NO HACE: no verifica de donde salio un dato (eso es del harness), no
 * decide el KYC real, y no conoce a la persona.
 */

export type IdentityKind = 'legal' | 'empresa' | 'anonimo';

/**
 * Que se sabe del KYC. `simulada` es lo unico que el runtime puede respaldar:
 * no hay stack de KYC (L4-T2), y decir `verificada` sin stack seria una
 * mentira publicable. El segundo valor existe para que el validador distinga
 * «estado desconocido» de «estado que nadie respalda todavia».
 */
export type KycEstado = 'simulada' | 'verificada';

/** Los prefijos de proyecto. Del documento legal, seccion 3.1. */
export const PREFIJOS: Readonly<Record<IdentityKind, string>> = Object.freeze({
  legal: 'identity:legal',
  empresa: 'identity:org',
  anonimo: 'identity:anon',
});

/** La identidad legal: el yo real, con su KYC. */
export interface IdentidadLegal {
  readonly kind: 'legal';
  readonly id: string;
  /** La clave de aislamiento. Derivada: `identity:legal:<id>`. */
  readonly projectId: string;
  readonly kyc: KycEstado;
}

/**
 * La identidad de empresa: la organizacion. Solo lleva la razon social; el
 * RUT, los roles y el organigrama (D6) viven en el mod de la empresa, y ese mod
 * no se inyecta entero.
 *
 * Y NO lleva el rol de quien opera: el rol llega como ASERCION verificada,
 * nunca como contexto (T11). Si fuera contexto, una tool de la empresa sabria
 * quien es el dueno.
 */
export interface IdentidadEmpresa {
  readonly kind: 'empresa';
  readonly id: string;
  /** La clave de aislamiento. Derivada: `identity:org:<id>`. */
  readonly projectId: string;
  readonly razonSocial: string;
}

/**
 * La identidad anonima: el perfil que no se pega al nombre legal.
 *
 * NO TIENE NINGUN CAMPO LOCALIZADOR, y eso es una decision, no un olvido:
 * A6 = opcion 4, para que el perfil sea anonimo hay que no localizar a la
 * persona. El precio: el perfil anonimo es el punto mas debil del sistema.
 */
export interface IdentidadAnonimo {
  readonly kind: 'anonimo';
  readonly id: string;
  /** La clave de aislamiento. Derivada: `identity:anon:<id>`. */
  readonly projectId: string;
  /** Del pool cerrado. Inmutable y nunca reciclado. */
  readonly nickname: string;
}

export type Identity = IdentidadLegal | IdentidadEmpresa | IdentidadAnonimo;

/** Los campos que cada tipo puede llevar. Lo que no esta, no viaja. */
export const CAMPOS_POR_TIPO: Readonly<Record<IdentityKind, readonly string[]>> = Object.freeze({
  legal: Object.freeze(['kind', 'id', 'projectId', 'kyc']),
  empresa: Object.freeze(['kind', 'id', 'projectId', 'razonSocial']),
  anonimo: Object.freeze(['kind', 'id', 'projectId', 'nickname']),
});

/** La clave de aislamiento de una identidad: la construye el tipo, no el llamador. */
export function namespaceDe(kind: IdentityKind, id: string): string {
  return `${PREFIJOS[kind]}:${id}`;
}
