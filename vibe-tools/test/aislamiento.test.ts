import test from 'node:test';
import assert from 'node:assert/strict';

import {
  AJUSTE_VINCULO,
  esUuid,
  sentenciaDenegacion,
  sentenciaLectura,
  sentenciaVinculo,
  validarVinculo,
} from '../src/aislamiento/vinculo.js';

const A = '11111111-1111-4111-8111-111111111111';

test('L4-T4 · el vinculo se fija con SET LOCAL y abre su transaccion', () => {
  const sentencia = sentenciaVinculo(A);
  // `SET LOCAL` es de la transaccion; `SET` se pegaria a la sesion, y la
  // siguiente transaccion heredaria el proyecto anterior.
  assert.ok(sentencia.includes(`SET LOCAL ${AJUSTE_VINCULO} = '${A}'`), 'el vinculo se fija con SET LOCAL');
  assert.ok(!sentencia.includes(`SET ${AJUSTE_VINCULO}`), 'el vinculo no se fija con SET');
  assert.ok(sentencia.startsWith('BEGIN;'), 'el vinculo abre su transaccion');
});

test('L4-T4 · un vinculo que no es un uuid no produce sentencia', () => {
  assert.throws(() => sentenciaVinculo('no-es-un-uuid'), /E_VINCULO_INVALIDO/);
  assert.throws(() => sentenciaVinculo(''), /E_VINCULO_SIN_PROYECTO/);
});

test('L4-T4 · el motivo de un vinculo que falta y de uno que es invalido son distintos', () => {
  assert.deepEqual(validarVinculo(''), ['E_VINCULO_SIN_PROYECTO']);
  assert.deepEqual(validarVinculo(undefined), ['E_VINCULO_SIN_PROYECTO']);
  assert.deepEqual(validarVinculo('no-es-un-uuid'), ['E_VINCULO_INVALIDO']);
  assert.deepEqual(validarVinculo(A), []);
});

test('L4-T4 · la denegacion lleva su propia transaccion y su motivo', () => {
  const sentencia = sentenciaDenegacion(A, 'registro', 'INSERT', 'rechazado por la politica');
  // Su propia transaccion: la que fallo se revierte con su contenido, y un
  // log que se pierde con el error no sirve como prueba.
  assert.ok(sentencia.includes('BEGIN;'), 'la denegacion abre su transaccion');
  assert.ok(sentencia.includes('COMMIT;'), 'la denegacion cierra su transaccion');
  assert.ok(sentencia.includes('INSERT INTO opita.acceso_log'), 'la denegacion se escribe en el log');
  assert.ok(sentencia.includes('rechazado por la politica'), 'el motivo queda en el registro');
});

test('L4-T4 · un vinculo invalido no produce sentencia de denegacion', () => {
  assert.throws(() => sentenciaDenegacion('nope', 'registro', 'INSERT', 'x'), /E_VINCULO_INVALIDO/);
});

test('L4-T4 · un recurso con comilla no inyecta en el log', () => {
  const sentencia = sentenciaDenegacion(A, "registro'; DROP TABLE opita.proyecto; --", 'INSERT', 'x');
  // El texto sigue ahi, dentro del literal: lo que no puede pasar es que la
  // comilla cierre el valor y lo que sigue se vuelva sentencia.
  assert.ok(!sentencia.includes("registro'; DROP"), 'la comilla inyectada no cierra el valor');
  assert.ok(sentencia.includes("registro''; DROP TABLE"), 'la comilla se duplica');
});

test('L4-T4 · la lectura se audita con su operacion, su resultado y su transaccion', () => {
  const sentencia = sentenciaLectura(A, 'registro', 'leido');
  assert.ok(sentencia.includes("'SELECT'"), 'la lectura dice que operacion es');
  assert.ok(sentencia.includes("'leido'"), 'la lectura dice como quedo');
  assert.ok(sentencia.includes('BEGIN;'), 'la lectura abre su transaccion');
  assert.ok(sentencia.includes('COMMIT;'), 'la lectura cierra su transaccion');
});

test('L4-T4 · el resultado de la lectura tambien se escapa', () => {
  const sentencia = sentenciaLectura(A, 'registro', "con'comilla");
  assert.ok(!sentencia.includes("'con'comilla'"), 'la comilla del resultado no cierra el valor');
  assert.ok(sentencia.includes("'con''comilla'"), 'la comilla se duplica');
});

test('L4-T4 · un vinculo invalido no produce sentencia de lectura', () => {
  assert.throws(() => sentenciaLectura('nope', 'registro', 'leido'), /E_VINCULO_INVALIDO/);
});

test('L4-T4 · un uuid se reconoce y una cadena cualquiera no', () => {
  assert.equal(esUuid(A), true);
  assert.equal(esUuid('11111111-1111-4111-8111-11111111111'), false, 'un caracter de menos no es un uuid');
  assert.equal(esUuid('zzzzzzzz-1111-4111-8111-111111111111'), false, 'un caracter que no es hexadecimal no es un uuid');
  assert.equal(esUuid(123), false, 'un numero no es un uuid');
});

test('L4-T4 · para muchos proyectos, la sentencia es siempre la misma forma', () => {
  // La forma exacta es lo que la base lee: un uuid de mas o de menos cambia
  // el numero de filas que el motor ve.
  for (let i = 0; i < 16; i++) {
    const id = `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
    assert.equal(sentenciaVinculo(id), `BEGIN;\nSET LOCAL ${AJUSTE_VINCULO} = '${id}';`);
  }
});
