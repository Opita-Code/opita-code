import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { sentenciaDenegacion, sentenciaLectura } from '../src/aislamiento/vinculo.js';
import { iniciarPostgres, type Postgres, type Resultado } from './postgres.js';

const AQUI = dirname(fileURLToPath(import.meta.url));
const DB = join(AQUI, '..', '..', 'db');

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

/**
 * Corre una sentencia como la aplicacion: con el vinculo puesto y con el
 * rol de la aplicacion, que es el unico que las politicas miran.
 */
function comoApp(pg: Postgres, proyectoId: string | null, sql: string): Resultado {
  const partes: string[] = [];
  if (proyectoId !== null) partes.push('BEGIN;', `SET LOCAL app.project_id = '${proyectoId}';`);
  partes.push('SET ROLE opita_app;', sql);
  if (proyectoId !== null) partes.push('COMMIT;');
  return pg.exec(partes.join('\n'));
}

/** Las filas que devolvio una sentencia. */
function filas(resultado: Resultado): string[] {
  return resultado.out.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
}

/**
 * Levanta la base, aplica las migraciones y siembra dos proyectos con filas.
 *
 * Y REINTENTA, SOLO SI LA CONEXION FALLA. La migracion no es una asercion: si
 * el servidor se apaga mientras entra, eso no dice nada del aislamiento. Un
 * fallo de SQL de verdad no se reintenta: se falla, y se ve.
 */
async function preparar(pg: Postgres): Promise<void> {
  for (const archivo of ['001_esquema.sql', '002_politicas.sql']) {
    let r = pg.exec(readFileSync(join(DB, archivo), 'utf8'));
    for (let intento = 0; intento < 3 && !r.ok && esFalloDeConexion(r.err); intento++) {
      await new Promise((res) => setTimeout(res, 2000));
      r = pg.exec(readFileSync(join(DB, archivo), 'utf8'));
    }
    assert.equal(r.ok, true, `la migracion ${archivo} debe aplicar: ${r.err}`);
  }
  const semilla = `
    INSERT INTO opita.proyecto (id, nombre) VALUES ('${A}', 'proyecto A'), ('${B}', 'proyecto B');
    INSERT INTO opita.registro (id, project_id, contenido) VALUES
      ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '${A}', '{"n":1}'),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '${B}', '{"n":2}');
  `;
  const r = pg.exec(semilla);
  assert.equal(r.ok, true, `la semilla debe aplicar: ${r.err}`);
}

/** Si lo que fallo es la conexion y no el SQL. */
function esFalloDeConexion(err: string): boolean {
  return /connection|shutting down|could not connect|server closed/i.test(err);
}

test('L4-T4 · el aislamiento real: el acceso cruzado falla en las cuatro operaciones', async (t) => {
  const pg = await iniciarPostgres();
  if (!pg) {
    t.skip('sin docker: el aislamiento RLS no se midio');
    return;
  }
  try {
    await preparar(pg);

    // El acceso propio: funciona, y solo ve lo suyo.
    const propios = comoApp(pg, A, 'SELECT id FROM opita.registro;');
    assert.equal(propios.ok, true, `la lectura propia debe funcionar: ${propios.err}`);
    assert.equal(filas(propios).length, 1, 'el proyecto A solo ve sus filas');

    // Y ahora el acceso cruzado. Las cuatro operaciones, una por una.
    const intentos = [
      {
        operacion: 'leer',
        exito: filas(comoApp(pg, A, `SELECT id FROM opita.registro WHERE project_id = '${B}';`)).length > 0,
      },
      {
        operacion: 'escribir',
        exito: comoApp(pg, A, `INSERT INTO opita.registro (id, project_id, contenido) VALUES (gen_random_uuid(), '${B}', '{}'::jsonb);`).ok,
      },
      {
        operacion: 'actualizar',
        exito: filas(comoApp(pg, A, `UPDATE opita.registro SET contenido = '{"n":9}'::jsonb WHERE project_id = '${B}' RETURNING id;`)).length > 0,
      },
      {
        operacion: 'borrar',
        exito: filas(comoApp(pg, A, `DELETE FROM opita.registro WHERE project_id = '${B}' RETURNING id;`)).length > 0,
      },
    ];

    const exitos = intentos.filter((i) => i.exito);
    assert.equal(
      exitos.length,
      0,
      `el acceso cruzado no puede tener exito: ${exitos.map((e) => e.operacion).join(', ')}`,
    );
    assert.equal(intentos.length, 4, 'se prueban las cuatro operaciones');

    // Y la fila del otro proyecto sigue intacta: no se toco nada.
    const despues = comoApp(pg, A, `SELECT contenido FROM opita.registro WHERE project_id = '${B}';`);
    assert.equal(filas(despues).length, 0, 'la fila del otro proyecto no se alcanza');
    const b = pg.exec(`SELECT contenido FROM opita.registro WHERE project_id = '${B}';`);
    assert.equal(filas(b).length, 1, 'la fila del otro proyecto sigue en su sitio');
  } finally {
    pg.cerrar();
  }
});

test('L4-T4 · sin vinculo no se ve nada: el aislamiento falla cerrado', async (t) => {
  const pg = await iniciarPostgres();
  if (!pg) {
    t.skip('sin docker: el aislamiento RLS no se midio');
    return;
  }
  try {
    await preparar(pg);
    const sinVinculo = comoApp(pg, null, 'SELECT id FROM opita.registro;');
    assert.equal(sinVinculo.ok, true, `la consulta sin vinculo no es un error: ${sinVinculo.err}`);
    assert.equal(filas(sinVinculo).length, 0, 'sin vinculo no hay filas');
  } finally {
    pg.cerrar();
  }
});

test('L4-T4 · una fila propia no se puede mover al proyecto de otro', async (t) => {
  const pg = await iniciarPostgres();
  if (!pg) {
    t.skip('sin docker: el aislamiento RLS no se midio');
    return;
  }
  try {
    await preparar(pg);
    const mover = comoApp(pg, A, `UPDATE opita.registro SET project_id = '${B}' RETURNING id;`);
    assert.equal(mover.ok, false, 'mover una fila al proyecto de otro tiene que fallar');
  } finally {
    pg.cerrar();
  }
});

test('L4-T4 · la auditoria queda escrita, y cada proyecto solo ve su log', async (t) => {
  const pg = await iniciarPostgres();
  if (!pg) {
    t.skip('sin docker: el aislamiento RLS no se midio');
    return;
  }
  try {
    await preparar(pg);

    // Una escritura permitida: la base la audita con su propio disparador.
    const escritura = comoApp(pg, A, `INSERT INTO opita.registro (id, project_id, contenido) VALUES (gen_random_uuid(), '${A}', '{}'::jsonb);`);
    assert.equal(escritura.ok, true, `la escritura propia debe funcionar: ${escritura.err}`);
    const logA = comoApp(pg, A, 'SELECT operacion, resultado FROM opita.acceso_log;');
    assert.equal(logA.ok, true, `la lectura del log debe funcionar: ${logA.err}`);
    assert.ok(
      filas(logA).some((l) => l.includes('permitido')),
      `la escritura permitida tiene que quedar escrita por la base: ${logA.out}`,
    );

    // Una lectura: la audita la aplicacion, porque PostgreSQL no tiene
    // disparadores para SELECT.
    const lectura = pg.exec(sentenciaLectura(A, 'registro', 'leido'));
    assert.equal(lectura.ok, true, `la lectura tiene que quedar registrada: ${lectura.err}`);
    const conLectura = comoApp(pg, A, 'SELECT resultado FROM opita.acceso_log;');
    assert.ok(
      filas(conLectura).some((l) => l.includes('leido')),
      `la lectura tiene que quedar escrita: ${conLectura.out}`,
    );

    // Una denegacion: la escribe la aplicacion, en su propia transaccion,
    // porque la transaccion que fallo se revierte con su contenido.
    const denegacion = sentenciaDenegacion(A, 'registro', 'INSERT', 'denegado');
    const escrita = pg.exec(denegacion);
    assert.equal(escrita.ok, true, `la denegacion debe quedar registrada: ${escrita.err}`);

    const conDenegacion = comoApp(pg, A, 'SELECT resultado FROM opita.acceso_log;');
    assert.ok(
      filas(conDenegacion).some((l) => l.includes('denegado')),
      `la denegacion tiene que quedar escrita: ${conDenegacion.out}`,
    );

    // Y el log de A no es un canal lateral: B no lo ve.
    const logB = comoApp(pg, B, 'SELECT resultado FROM opita.acceso_log;');
    assert.equal(
      filas(logB).filter((l) => l.includes('denegado')).length,
      0,
      'el log de un proyecto no se ve desde otro',
    );
  } finally {
    pg.cerrar();
  }
});
