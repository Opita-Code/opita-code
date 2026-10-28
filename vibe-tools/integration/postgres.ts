/**
 * L4-T4 · UN POSTGRES DE VERDAD, PARA MEDIR EL AISLAMIENTO.
 *
 * QUE ES. El aislamiento se mide contra la base real: una politica que no se
 * ha ejecutado en un Postgres no esta comprobada, esta escrita. Este modulo
 * levanta un Postgres de usar y tirar, aplica las migraciones y ejecuta
 * sentencias, sin dependencias: el cliente es el `psql` que ya viene dentro
 * de la imagen, y se llama con `docker exec`.
 *
 * POR QUE ESTA FUERA DE `test/`. El runner de mutacion corre la suite de
 * `dist/test` una vez por mutante, y son 190 mutantes: levantar un contenedor
 * 190 veces no es una suite, es una espera. La suite de integracion va en su
 * propia carpeta, y `npm test` corre las dos.
 *
 * LO QUE NO HACE: no deja nada en la maquina. El contenedor se borra al
 * terminar, y si Docker no esta, esto no se mide y lo dice.
 */

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const IMAGEN = 'postgres:16-alpine';
const PASSWORD = 'postgres';
const BASE = 'opita';

/** El resultado de una sentencia: si paso, que salio y que fallo. */
export interface Resultado {
  readonly ok: boolean;
  readonly out: string;
  readonly err: string;
}

/** Un Postgres de usar y tirar. */
export interface Postgres {
  /** Ejecuta una sentencia y devuelve su salida. */
  exec(sql: string): Resultado;
  /** Lo borra todo. */
  cerrar(): void;
}

/**
 * Corre un comando de docker.
 *
 * Se usa `spawnSync` y no `execFileSync` a proposito: `execFileSync` solo
 * devuelve stdout, y el stderr se pierde cuando el comando sale con 0. El log
 * de Postgres va al stderr, asi que con `execFileSync` la cuenta de arranques
 * salia siempre en cero.
 */
function docker(args: string[], input?: string): Resultado {
  const r = spawnSync('docker', args, {
    input,
    encoding: 'utf8',
    timeout: 180000,
    windowsHide: true,
  });
  const out = r.stdout ?? '';
  const err = r.stderr ?? '';
  if (r.error) return { ok: false, out, err: String(r.error).slice(0, 200) };
  return { ok: r.status === 0, out, err };
}

/** Si hay un motor de Docker al que hablar. */
export function hayDocker(): boolean {
  const r = docker(['info', '--format', '{{.ServerVersion}}']);
  return r.ok && r.out.trim().length > 0;
}

/**
 * Levanta un Postgres y espera a que este listo.
 *
 * Devuelve `null` si no hay Docker: la prueba se salta y lo dice, porque un
 * aislamiento que no se midio no es un aislamiento comprobado.
 *
 * Y si HAY Docker pero el Postgres no llega, esto LANZA: no se salta. Un salto
 * con Docker presente esconderia un fallo de infraestructura, y el aislamiento
 * quedaria sin medir sin que nadie lo notara.
 */
export async function iniciarPostgres(): Promise<Postgres | null> {
  if (!hayDocker()) return null;
  const nombre = `opita-pg-${randomUUID().slice(0, 8)}`;
  const arranque = docker([
    'run', '-d', '--rm',
    '--name', nombre,
    '-e', `POSTGRES_PASSWORD=${PASSWORD}`,
    '-e', `POSTGRES_DB=${BASE}`,
    IMAGEN,
  ]);
  if (!arranque.ok) {
    throw new Error(`no pude levantar el Postgres: ${arranque.err.slice(0, 200)}`);
  }

  // LA ESPERA, Y POR QUE NO BASTA UNA.
  //
  // Durante el arranque, Postgres levanta un servidor TEMPORAL para crear la
  // base y lo apaga enseguida. A ese servidor se le puede preguntar tanto
  // `pg_isready` como un `SELECT 1`: los dos responden bien, y al minuto
  // siguiente el siguiente comando se encuentra con "the database system is
  // shutting down". Por eso la seña de que el servidor DE VERDAD esta arriba
  // es doble: que el log del contenedor diga "ready to accept connections" dos
  // veces (la del temporal y la del real), y que una consulta entre.
  let listo = false;
  let ultimo = '';
  for (let intento = 0; intento < 90 && !listo; intento++) {
    const avisos = docker(['logs', nombre]);
    // El log del contenedor va a stderr, y el helper separa stdout de stderr:
    // por eso se cuentan los dos. Si se mira solo uno, la cuenta sale cero y
    // la espera no termina nunca.
    const arranques = ((avisos.out + avisos.err).match(/ready to accept connections/g) ?? []).length;
    const consulta = docker(['exec', nombre, 'psql', '-U', 'postgres', '-d', BASE, '-t', '-A', '-c', 'SELECT 1']);
    listo = arranques >= 2 && consulta.ok && consulta.out.trim() === '1';
    if (!listo) {
      ultimo = `${arranques} arranque(s) en el log; ${consulta.err || consulta.out}`.trim();
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
  if (!listo) {
    docker(['rm', '-f', nombre]);
    throw new Error(`el Postgres no acepto conexiones: ${ultimo.slice(0, 200)}`);
  }

  return {
    exec(sql: string): Resultado {
      // `-q` quita las etiquetas de comando (BEGIN, SET, COMMIT): lo que sale
      // es solo lo que devuelven las consultas. Sin eso, el test contaria
      // "BEGIN" como una fila.
      return docker(
        ['exec', '-i', nombre, 'psql', '-U', 'postgres', '-d', BASE, '-v', 'ON_ERROR_STOP=1', '-q', '-t', '-A', '-f', '-'],
        sql,
      );
    },
    cerrar(): void {
      docker(['rm', '-f', nombre]);
    },
  };
}
