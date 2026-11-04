/**
 * L6-T2 · LA LICENCIA DE DISTRIBUCION.
 *
 * QUE ES. El acuerdo por el que algo se publica en el catalogo. Y tiene una
 * forma, con tres partes:
 *
 *   LO QUE EL AUTOR CONCEDE   distribuir, y aparecer en el catalogo.
 *   LO QUE LA PLATAFORMA RESERVA  suspender y retirar lo publicado.
 *   LO QUE NO PASA              la propiedad. No se transfiere.
 *
 * POR QUE LA PROPIEDAD NO SE TRANSFIERE, Y POR QUE SE DICE EN LA LICENCIA.
 *
 *   El autor es dueño de su codigo desde que escribe el prompt. Publicar es
 *   MOSTRARLO, no entregarlo. Una licencia que callara esto se prestaria a
 *   que alguien lo creyera, y el que lo creyera publicaria su trabajo pensando
 *   que lo vendia. Por eso la transferencia es un campo con un solo valor
 *   posible: `ninguna`. No es una opcion que el autor pueda negociar: es lo
 *   que la licencia ES.
 *
 * POR QUE LAS RESERVAS SON DE LA PLATAFORMA Y NO DEL AUTOR.
 *
 *   Un catalogo sin Suspension es un catalogo que no puede quitar lo que no
 *   cumple. Y quitar no es confiscar: mientras la entrada esta publicada, el
 *   autor sigue siendo el autor, y el `autor` de la entrada no cambia ni
 *   cuando se retira. Lo que se retira es la DISTRIBUCION, no la autoria.
 *
 * POR QUE LA LICENCIA LA PONE LA PLATAFORMA Y LA ACEPTA EL AUTOR.
 *
 *   Si el autor escribiera la licencia, el catalogo publicariaterms que cada
 *   autor se inventa, y dejarian de ser comparables: dos entradas con
 *   condiciones distintas no se pueden listar juntas. Los terminos son de la
 *   plataforma y se aceptan: por eso el paso del flujo se llama ACEPTAR y no
 *   FIRMAR.
 *
 * LO QUE ESTE ARCHIVO NO HACE. No suspende, no retira y no publica: eso es
 * `publicar.ts`. Aqui solo esta el papel y su comprobacion.
 */

/** Lo que el autor concede al publicar. */
export const CONCESIONES = ['distribuir', 'mostrar'] as const;

/** Lo que la plataforma se reserva sobre lo publicado. */
export const RESERVAS = ['suspender', 'retirar'] as const;

/** La unica transferencia posible. No es un campo que se pueda cambiar. */
export const TRANSFERENCIA = 'ninguna' as const;

export type Concesion = (typeof CONCESIONES)[number];
export type Reserva = (typeof RESERVAS)[number];

/** La licencia de distribucion, con sus terminos y su propietario. */
export interface LicenciaDeDistribucion {
  /** La version de los terminos. Cambian los terminos, cambia la version. */
  readonly version: string;
  /** El dueno del codigo. El mismo que el `autor` de la entrada. */
  readonly propietario: string;
  readonly transferencia: typeof TRANSFERENCIA;
  readonly concede: readonly Concesion[];
  readonly reserva: readonly Reserva[];
}

/** La version de los terminos. Cambia cuando cambian los terminos. */
export const VERSION_DE_LICENCIA = '1.0.0';

/** La licencia canonica, para un propietario. */
export function licenciaDe(propietario: string): LicenciaDeDistribucion {
  return {
    version: VERSION_DE_LICENCIA,
    propietario,
    transferencia: TRANSFERENCIA,
    concede: [...CONCESIONES],
    reserva: [...RESERVAS],
  };
}

export type ComprobacionDeLicencia =
  | { readonly ok: true }
  | { readonly ok: false; readonly detalle: string };

/**
 * Comprueba que una licencia es la que la plataforma emite y que es de este
 * autor.
 *
 * Falla fuerte y nombra lo que falta: una licencia a medio camino (concede pero
 * no reserva, o con la transferencia cambiada) es una licencia que parece
 * valida y no lo es, y el error tiene que decir cual de las dos cosas fallo.
 */
export function comprobarLicencia(
  licencia: LicenciaDeDistribucion,
  propietario: string,
): ComprobacionDeLicencia {
  if (licencia.propietario !== propietario) {
    return {
      ok: false,
      detalle: `la licencia es de ${licencia.propietario} y la entrada es de ${propietario}`,
    };
  }
  if (licencia.transferencia !== TRANSFERENCIA) {
    return {
      ok: false,
      detalle: `la licencia transfiere la propiedad (${licencia.transferencia}): la distribucion no transfiere la propiedad`,
    };
  }
  for (const concesion of CONCESIONES) {
    if (!licencia.concede.includes(concesion)) {
      return { ok: false, detalle: `la licencia no concede ${concesion}` };
    }
  }
  for (const reserva of RESERVAS) {
    if (!licencia.reserva.includes(reserva)) {
      return { ok: false, detalle: `la licencia no reserva ${reserva}` };
    }
  }
  return { ok: true };
}
