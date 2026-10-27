/**
 * L4-T4 · AISLAMIENTO LOGICO: EL VINCULO.
 *
 * QUE ES. El lado de la aplicacion del aislamiento: como se le dice a la base
 * de datos que proyecto esta conectado, y como se deja escrito cuando la base
 * rechaza algo.
 *
 * LA REGLA QUE IMPORTA. El vinculo se fija con `SET LOCAL`, no con `SET`: local
 * es de la transaccion. Con `SET`, el proyecto conectado se queda pegado a la
 * sesion, y la siguiente transaccion -que puede ser de otro- hereda el
 * proyecto anterior. Un `SET` ahi es una fuga silenciosa, y por eso el modulo
 * solo produce `SET LOCAL` y la sentencia completa lleva el `BEGIN`.
 *
 * POR QUE EL VINCULO ES UN UUID Y NO LA CLAVE DE LA IDENTIDAD. Son dos cosas:
 * la clave de la identidad (`identity:legal:<id>`) nombra al proyecto de
 * memoria en el runtime, y el UUID es la fila que lo representa en la base.
 * Que uno se derive del otro es trabajo de la capa de arriba; este modulo no
 * lo inventa.
 *
 * LO QUE NO HACE: no abre la conexion, no ejecuta nada y no autoriza. Autoriza
 * es L4-T5. Y no cifra: el cifrado y la rotacion son la condicion 2 del
 * aislamiento legal, y no se pueden desde aqui.
 */

/** Por que un vinculo no sirve. */
export type MotivoVinculo = 'E_VINCULO_INVALIDO' | 'E_VINCULO_SIN_PROYECTO';

/** El ajuste de sesion que lee la politica de la base. */
export const AJUSTE_VINCULO = 'app.project_id';

/**
 * Un UUID, y solo un UUID. La politica de la base castea el ajuste a uuid, y
 * un valor que no castea deja la sesion en error: el vinculo tiene que estar
 * bien ANTES de tocar la base, no despues.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Si el valor es un UUID. */
export function esUuid(valor: unknown): boolean {
  return typeof valor === 'string' && UUID.test(valor);
}

/**
 * Valida un vinculo. Devuelve la lista de motivos, no un booleano: un
 * llamador quiere saber todo lo que esta mal.
 */
export function validarVinculo(proyectoId: unknown): MotivoVinculo[] {
  if (proyectoId === undefined || proyectoId === null || proyectoId === '') {
    return ['E_VINCULO_SIN_PROYECTO'];
  }
  if (!esUuid(proyectoId)) {
    return ['E_VINCULO_INVALIDO'];
  }
  return [];
}

/**
 * El vinculo: la sentencia que abre la transaccion y dice que proyecto esta
 * conectado.
 *
 * El `BEGIN` va dentro, porque `SET LOCAL` sin transaccion no dura nada: la
 * sentencia se aplicaria a la transaccion implicita y se perderia al
 * terminar la sentencia.
 */
export function sentenciaVinculo(proyectoId: string): string {
  const motivos = validarVinculo(proyectoId);
  if (motivos.length > 0) {
    throw new Error(`el vinculo de proyecto no sirve: ${motivos.join(', ')}`);
  }
  return `BEGIN;\nSET LOCAL ${AJUSTE_VINCULO} = '${proyectoId}';`;
}

/** Como se cierra la transaccion del vinculo. */
export const CIERRE_VINCULO = 'COMMIT;';

/**
 * El registro de una denegacion.
 *
 * POR QUE ESTA EN SU PROPIA TRANSACCION. Cuando la base rechaza una
 * escritura, la transaccion se aborta: y con ella se aborta todo lo que se
 * habia escrito en ella, incluido el registro de la denegacion. Un log que se
 * pierde con el error no sirve como prueba de nada. Por eso la denegacion se
 * escribe despues, en su propia transaccion, y por eso la sentencia lleva su
 * propio `BEGIN` y su propio `COMMIT`.
 *
 * Y EL `motivo` VA EN EL RESULTADO. Un log que dice "denegado" sin decir por
 * que es un log que no se puede usar.
 */
export function sentenciaDenegacion(
  proyectoId: string,
  recurso: string,
  operacion: string,
  motivo: string,
): string {
  const motivos = validarVinculo(proyectoId);
  if (motivos.length > 0) {
    throw new Error(`el vinculo de proyecto no sirve: ${motivos.join(', ')}`);
  }
  const partes = [
    `BEGIN;`,
    `INSERT INTO opita.acceso_log (project_id, recurso, operacion, resultado)`,
    `VALUES ('${proyectoId}', '${escapar(recurso)}', '${escapar(operacion)}', '${escapar(motivo)}');`,
    `COMMIT;`,
  ];
  return partes.join('\n');
}

/**
 * El registro de una lectura.
 *
 * POR QUE LA LECTURA LA AUDITA LA APLICACION Y NO LA BASE. PostgreSQL no
 * admite disparadores para SELECT, y el filtrado de la RLS es silencioso: una
 * lectura que el motor oculta no deja rastro en la base. Si la auditoria de
 * las lecturas fuera de la base, la lectura que no ocurrio y la que si se
 * verian igual. Por eso la escribe la aplicacion, que si sabe que se pidio.
 */
export function sentenciaLectura(
  proyectoId: string,
  recurso: string,
  resultado: string,
): string {
  const motivos = validarVinculo(proyectoId);
  if (motivos.length > 0) {
    throw new Error(`el vinculo de proyecto no sirve: ${motivos.join(', ')}`);
  }
  const partes = [
    `BEGIN;`,
    `INSERT INTO opita.acceso_log (project_id, recurso, operacion, resultado)`,
    `VALUES ('${proyectoId}', '${escapar(recurso)}', 'SELECT', '${escapar(resultado)}');`,
    CIERRE_VINCULO,
  ];
  return partes.join('\n');
}

/**
 * Escapa una cadena para meterla en una sentencia. Los recursos y las
 * operaciones los escribe la aplicacion, pero un log que se puede inyectar
 * desde un nombre de recurso es un log que se puede falsear.
 */
function escapar(texto: string): string {
  return texto.replace(/'/g, "''");
}
