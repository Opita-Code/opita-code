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

import { execFileSync } from 'node:child_process';
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

/** Corre un comando de docker. */
function docker(args: string[], input?: string): Resultado {
  try {
    const out = execFileSync('docker', args, {
      input,
      encoding: 'utf8',
      timeout: 180000,
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true,
    });
    return { ok: true, out: String(out), err: '' };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return { ok: false, out: err.stdout ?? '', err: err.stderr ?? String(e) };
  }
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
  if (!arranque.ok) return null;

  // Postgres tarda unos segundos en aceptar conexiones. Se espera a que lo
  // diga el propio motor, no a que pase un rato.
  let listo = false;
  for (let intento = 0; intento < 60 && !listo; intento++) {
    const r = docker(['exec', nombre, 'pg_isready', '-U', 'postgres']);
    listo = r.ok;
    if (!listo) await new Promise((res) => setTimeout(res, 1000));
  }
  if (!listo) {
    docker(['rm', '-f', nombre]);
    return null;
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
