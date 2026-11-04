/**
 * L6-T1 · EL FLUJO DE PUBLICACION: crear, validar, licenciar, publicar.
 *
 * QUE ES. Cuatro pasos y una maquina de estados. Cada paso tiene un
 * precondito, y el precondito es el paso anterior:
 *
 *   creado -> validado -> juzgado -> licenciado -> publicado
 *
 * Y despues, sobre lo publicado, dos salidas que son de la plataforma:
 *
 *   publicado -> suspendido -> retirado
 *
 * POR QUE LOS PASOS NO SE PUEDEN SALTAR.
 *
 *   Publicar sin validar es publicar lo que sea. Publicar sin licencia es
 *   publicar sin que el autor sepa que se publica. Publicar sin veredicto es
 *   publicar sin que nadie haya mirado. Cada salto es una puerta que se
 *   puede saltar, y una puerta que se puede saltar no es una puerta: por eso
 *   el paso incorrecto devuelve un error con el estado que falta, en vez de
 *   hacer lo que se pueda.
 *
 * POR QUE `validado` Y `juzgado` SON DOS ESTADOS Y NO UNO.
 *
 *   Fallan por razones distintas y se corrigen distinto: una entrada que no
 *   pasa las reglas se arregla cambiando el modulo, y una entrada que el juez
 *   no aprueba se arregla cambiando lo que AFIRMA o lo que HACE. Confundirlas
 *   haria que un fallo de codigo se reportara como un veredicto del juez, que
 *   es justo el rumor que este runtime no quiere sembrar.
 *
 * POR QUE EL VEREDICTO TIENE QUE SER DE ESTA ENTRADA.
 *
 *   El veredicto viene con las partes que el juez miró: su numero y su sha.
 *   Si la entrada cambio despues, ese veredicto ya no habla de esto. Es la
 *   misma regla que L5 aplica en el pipeline (una medida de otro sha es un
 *   fallo del que llama, no un juicio sobre el artefacto), y aqui se aplica en
 *   la frontera: un veredicto ajeno es un ERROR, no un "publicar".
 *
 * POR QUE SUSPENDER Y RETIRAR NO CAMBIAN EL AUTOR.
 *
 *   Lo que se retira es la distribucion, no la autoria. El `autor` de la
 *   entrada es el mismo antes y despues, y por eso el paso no lo toca: si
 *   quitar una publicacion fuera cambiar el dueno, la plataforma estaria
 *   confiscando trabajo, y eso no es lo que dice la licencia.
 */

import type { Publicacion } from '../juez/pipeline.js';
import { comprobarLicencia, type LicenciaDeDistribucion } from './licencia.js';
import { partesDe } from './manifiesto.js';
import type { Entrada, Estado } from './entrada.js';
import { validarEntrada, type Rechazo } from './validar.js';

export type MotivoDelFlujo =
  | 'estado_invalido'
  | 'validacion_fallida'
  | 'veredicto_de_otra_entrada'
  | 'veredicto_no_publica'
  | 'licencia_invalida';

export type ResultadoDelFlujo =
  | { readonly ok: true; readonly entrada: Entrada }
  | { readonly ok: false; readonly motivo: MotivoDelFlujo; readonly detalle: string };

function fallo(motivo: MotivoDelFlujo, detalle: string): ResultadoDelFlujo {
  return { ok: false, motivo, detalle };
}

/** El paso que se esperaba, para el error de estado. */
function exige(entrada: Entrada, esperado: Estado): ResultadoDelFlujo | null {
  if (entrada.estado === esperado) return null;
  return fallo(
    'estado_invalido',
    `la entrada esta en ${entrada.estado} y este paso pide ${esperado}`,
  );
}

function conEstado(entrada: Entrada, estado: Estado, extra: Partial<Entrada> = {}): Entrada {
  return { ...entrada, ...extra, estado };
}

/**
 * VALIDAR. La comprobacion determinista: huella, reglas, lista blanca y
 * afirmaciones. De `creado` a `validado`.
 */
export function validar(entrada: Entrada): ResultadoDelFlujo {
  const precondition = exige(entrada, 'creado');
  if (precondition !== null) return precondition;
  const revision = validarEntrada(entrada);
  if (!revision.ok) {
    return fallo('validacion_fallida', `${revision.rechazo.motivo}: ${detalleDe(revision.rechazo)}`);
  }
  return { ok: true, entrada: conEstado(entrada, 'validado') };
}

/** El detalle de un rechazo, con la parte que lo caracteriza. */
function detalleDe(rechazo: Rechazo): string {
  switch (rechazo.motivo) {
    case 'modulo_invalido':
      return `${rechazo.codigo}: ${rechazo.detalle}`;
    case 'tool_no_permitida':
      return `la lista blanca no admite ${rechazo.tools.join(', ')}`;
    default:
      return rechazo.detalle;
  }
}

/**
 * JUZGAR. El veredicto del juez. De `validado` a `juzgado`.
 *
 * Solo `publicar` publica: `corregir` y `parar` se quedan aqui, con la accion
 * que el pipeline le pidio al operador. El motivo del veredicto no se tira: se
 * devuelve, porque quien publica tiene que saber que corregir.
 */
export function juzgar(entrada: Entrada, publicacion: Publicacion): ResultadoDelFlujo {
  const precondition = exige(entrada, 'validado');
  if (precondition !== null) return precondition;

  const propias = partesDe(entrada);
  if (publicacion.partes.length !== propias.length) {
    return fallo(
      'veredicto_de_otra_entrada',
      `el veredicto tiene ${publicacion.partes.length} parte(s) y el manifiesto tiene ${propias.length}`,
    );
  }
  for (const parte of propias) {
    const juzgada = publicacion.partes.find((p) => p.n === parte.n);
    if (juzgada === undefined || juzgada.sha !== parte.sha) {
      return fallo(
        'veredicto_de_otra_entrada',
        `la parte ${parte.n} se juzgo con sha ${juzgada?.sha ?? 'desconocida'} y el manifiesto dice ${parte.sha}`,
      );
    }
  }

  if (publicacion.decision !== 'publicar') {
    return fallo(
      'veredicto_no_publica',
      `el juez decidio ${publicacion.decision}: ${publicacion.accion}`,
    );
  }
  return { ok: true, entrada: conEstado(entrada, 'juzgado') };
}

/**
 * ACEPTAR LA LICENCIA. De `juzgado` a `licenciado`.
 *
 * La licencia la pone la plataforma y la acepta el autor: por eso el paso se
 * llama aceptar y no firmar. La comprobacion es que sea la licencia canonica
 * y que sea de este autor.
 */
export function aceptarLicencia(
  entrada: Entrada,
  licencia: LicenciaDeDistribucion,
): ResultadoDelFlujo {
  const precondition = exige(entrada, 'juzgado');
  if (precondition !== null) return precondition;
  const comprobacion = comprobarLicencia(licencia, entrada.autor);
  if (!comprobacion.ok) {
    return fallo('licencia_invalida', comprobacion.detalle);
  }
  return { ok: true, entrada: conEstado(entrada, 'licenciado') };
}

/**
 * PUBLICAR. De `licenciado` a `publicado`.
 *
 * La secuencia la pone el catalogo: es el numero de publicacion, y es lo que
 * ordena el listado. No lo decide quien publica.
 */
export function publicar(entrada: Entrada, secuencia: number): ResultadoDelFlujo {
  const precondition = exige(entrada, 'licenciado');
  if (precondition !== null) return precondition;
  return { ok: true, entrada: conEstado(entrada, 'publicado', { secuencia }) };
}

/**
 * SUSPENDER. Lo publicado deja de servirse, pero sigue visible y con su
 * motivo. Solo la plataforma puede: es una de las reservas de la licencia.
 */
export function suspender(entrada: Entrada, motivo: string): ResultadoDelFlujo {
  const precondition = exige(entrada, 'publicado');
  if (precondition !== null) return precondition;
  if (motivo.trim() === '') {
    return fallo('estado_invalido', 'una suspension sin motivo no es una suspension: es una extincion');
  }
  return { ok: true, entrada: conEstado(entrada, 'suspendido', { motivo }) };
}

/**
 * RETIRAR. Lo publicado desaparece del catalogo.
 *
 * El autor no cambia: lo que se retira es la distribucion, no la autoria.
 */
export function retirar(entrada: Entrada, motivo: string): ResultadoDelFlujo {
  if (entrada.estado !== 'publicado' && entrada.estado !== 'suspendido') {
    return fallo('estado_invalido', `una entrada en ${entrada.estado} no se puede retirar`);
  }
  if (motivo.trim() === '') {
    return fallo('estado_invalido', 'una retirada sin motivo no es una retirada: es un borrado');
  }
  return { ok: true, entrada: conEstado(entrada, 'retirado', { motivo }) };
}
