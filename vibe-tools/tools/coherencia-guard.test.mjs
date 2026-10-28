/**
 * L5 · LA COHERENCIA DETERMINISTA: las constantes declaradas.
 *
 * Lo que se prueba aqui es lo que un guard puede comprobar sin leer ideas:
 * que una declaracion del tope que no es el tope se nota, y que un tamano
 * historico NO se confunde con una declaracion del tope.
 *
 * Lo que NO se prueba aqui, y por que: que el juez detecte una contradiccion
 * entre partes. Eso se midio aparte (dos formulaciones de la afirmacion, el
 * veredicto no se movio) y el veredicto no es de este repositorio.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { ANCLA_TOPE, revisar } from './coherencia-guard.mjs';

const TOPE = 4096;

/** Una declaracion del tope correcta. */
test('L5 · una declaracion del tope correcta coincide', () => {
  const r = revisar('El tope son 4096 B por artefacto juzgable.', TOPE);
  assert.equal(r.comparadas, 1);
  assert.equal(r.malas.length, 0, 'una declaracion del tope que si coincide no es un fallo');
});

test('L5 · un tope que no es el tope se nota, con su linea', () => {
  const texto = 'primera linea\n\nEl tope de 4097 B es nuestro, no del framework.';
  const r = revisar(texto, TOPE);
  assert.equal(r.comparadas, 1);
  assert.equal(r.malas.length, 1, 'el numero que no es el tope tiene que ser un hallazgo');
  assert.equal(r.malas[0].numero, 4097);
  assert.equal(r.malas[0].esperado ?? TOPE, TOPE);
  assert.equal(r.malas[0].linea, 3, 'la linea es la del numero, no la del principio');
});

test('L5 · un tamaño historico NO es una declaracion del tope', () => {
  // "El README en 4249 B" es el tamano que tuvo un archivo. Sin ancla, no es
  // una afirmacion sobre el tope, y si el guard lo tomara, cada registro
  // historico seria un falso positivo.
  const texto = '3. **El README en 4249 B.** El tope son 4096.';
  const r = revisar(texto, TOPE);
  assert.equal(r.comparadas, 1, 'solo la declaracion del tope se compara');
  assert.equal(r.malas.length, 0, 'el 4249 no es el tope y no es un fallo');
});

test('L5 · un numero sin ancla no se compara', () => {
  const r = revisar('SeZmiden 5067 B y el veredicto tardo 45,8 s.', TOPE);
  assert.equal(r.comparadas, 0, 'un artefacto de 5067 B es un dato historico');
  assert.equal(r.malas.length, 0);
});

test('L5 · un texto sin numeros da cero comparaciones, y lo dice', () => {
  const r = revisar('Un documento sin cifras no tiene nada que contrastar.', TOPE);
  assert.equal(r.comparadas, 0);
  assert.equal(r.malas.length, 0);
});

test('L5 · el ancla cubre las cinco formas en que se nombra el tope', () => {
  const formas = [
    'El tope son 4096 B.',
    'El limite de 4096 del gate.',
    'ningun artefacto juzgable pasa de 4096 B.',
    'ningun artefacto juzgable supera 4096 bytes.',
    '0 exceden los 4096 B',
  ];
  for (const f of formas) {
    const r = revisar(f, TOPE);
    assert.equal(r.comparadas, 1, `no se comparo: ${f}`);
    assert.equal(r.malas.length, 0, `falso positivo en: ${f}`);
  }
});

test('L5 · el ancla NO se dispara con las palabras que no son del tope', () => {
  const r = revisar('El indice tiene 45 filas y el archivo 4249 bytes.', TOPE);
  assert.equal(r.comparadas, 0, 'ni "filas" ni un tamaño sin ancla son el tope');
});

test('L5 · el ancla es una expresion regular, y se puede auditar', () => {
  assert.ok(ANCLA_TOPE instanceof RegExp, 'tiene que ser una expresion regular');
  assert.ok(ANCLA_TOPE.flags.includes('g'), 'tiene que ser global, para ver todas las apariciones');
});
