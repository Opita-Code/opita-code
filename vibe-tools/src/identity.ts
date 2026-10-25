/**
 * LA IDENTIDAD: bajo que datos corre una tool.
 *
 * QUE ES. Una identidad es a quien pertenece la memoria de la que sale el
 * dato inyectado. No es quien ejecuta (eso es `actorId`, que es el actor: una
 * persona, una app, una empresa) ni es la persona: es el proyecto de memoria
 * del que sale el contexto.
 *
 * POR QUE EXISTE. En L0-L3 el runtime ejecutaba tools sin saber de quien era
 * el dato que les llegaba: `actorId` era una cadena y nada más. Eso no alcanza
 * para la exigencia del boundary: «el contexto inyectado NUNCA cruza
 * identidades». Sin la identidad en el contexto, esa regla no se puede
 * escribir en ninguna parte, porque no hay con qué compararla.
 *
 * POR QUE TRES TIPOS Y POR QUE UN SOLO STUB. Los tres tipos son legal,
 * empresa y anonimo, y estan decididos. Lo que NO esta decidido son tres
 * cosas del operador (A5, A6 y A7), y dos de ellas (el caso de la empresa con
 * rol verificado, E10, y el techo del antifraude) no se pueden escribir sin
 * ellas. Por eso este archivo trae SOLO el stub legal: el unico tipo cuyo
 * comportamiento no depende de una decision pendiente.
 *
 * LO QUE ESTE ARCHIVO NO HACE, Y POR QUE.
 *   - No verifica de donde salio un dato. Eso es del harness, que es el unico
 *     actor con autoridad de seleccion (boundary, seccion 2). Aqui lo que se
 *     hace es llevar la identidad de forma que no se pueda cambiar en vuelo.
 *   - No decide el KYC real. El stub dice `simulada`, y decir `verificada` sin
 *     KYC seria una mentira que se puede publicar.
 *   - No conoce a la persona. Que dos identidades sean de la misma persona lo
 *     sabe el harness; el runtime solo ve identificadores.
 */

export type IdentityKind = 'legal' | 'empresa' | 'anonimo';

/** Que se sabe del KYC. `simulada` es lo unico honesto hasta que haya stack. */
export type KycEstado = 'simulada' | 'verificada';

export interface Identity {
  /** Identificador de la identidad. No es el de la persona. */
  readonly id: string;
  readonly kind: IdentityKind;
  /**
   * La clave de aislamiento: el proyecto de memoria del que sale el dato.
   * Es la MISMA clave que usa el mod de dark-memory, y por eso es la que
   * separa una identidad de otra.
   */
  readonly projectId: string;
  readonly kyc: KycEstado;
}

/**
 * EL STUB: una identidad legal con el KYC simulado.
 *
 * Suficiente para una persona con su propio mod: lo que hace falta para que
 * el harness sepa de que proyecto leer, y para que el runtime pueda sellar la
 * identidad junto con el contexto.
 */
export function identidadStubLegal(id: string, projectId: string): Identity {
  return Object.freeze({ id, kind: 'legal', projectId, kyc: 'simulada' });
}

/**
 * DOS IDENTIDADES SON LA MISMA cuando coinciden las tres cosas que la
 * definen. El tipo no basta: `legal` con otro `projectId` es otro mod, y dos
 * ids distintos son dos identidades aunque se llamen igual.
 */
export function mismaIdentidad(a: Identity, b: Identity): boolean {
  return a.id === b.id && a.kind === b.kind && a.projectId === b.projectId;
}
