/**
 * L5 · LA COHERENCIA ENTRE LAS PARTES: el artefacto y la contradiccion.
 *
 * Lo que se prueba aqui es lo que se puede medir sin el juez: que el
 * artefacto es el documento entero, byte a byte, y que la contradiccion
 * construida es una contradiccion de verdad entre dos partes.
 *
 * Lo que NO se prueba aqui, y por que: que el juez detecte la contradiccion.
 * Eso es una llamada al proveedor, y se mide aparte (el experimento). Un test
 * que mira al proveedor cuando el proveedor no esta no mide: falla por el
 * quota, y el fallo no dice nada de la coherencia.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  AFIRMACION_DE_COHERENCIA,
  artefactoDeCoherencia,
  contradiccionDe,
} from './coherencia.mjs';
import { partir, sha, TOPE } from './juez-partes.mjs';

const SALTO = String.fromCharCode(10);

/** Un documento de N secciones, con un numero repetido entre las partes. */
function documento(secciones, relleno = 200) {
  const partes = [];
  for (let i = 0; i < secciones; i++) {
    partes.push(`## Seccion ${i + 1}${SALTO}`);
    partes.push(`${'palabra '.repeat(relleno)}${SALTO}`);
    partes.push(`La cifra es 4242 y aqui se repite.${SALTO}`);
  }
  return partes.join(SALTO);
}

/** Escribe un documento en un temporal y devuelve su ruta. */
function temporal(doc) {
  const dir = mkdtempSync(join(tmpdir(), 'coherencia-'));
  const ruta = join(dir, 'doc.md');
  writeFileSync(ruta, doc, 'utf8');
  return { dir, ruta };
}

test('L5 · el artefacto de coherencia es el documento entero, byte a byte', () => {
  const { dir, ruta } = temporal(documento(4));
  try {
    const a = artefactoDeCoherencia(ruta);
    assert.equal(a.recomposadoIgual, true, 'las partes tienen que dar el documento');
    assert.equal(a.sha, sha(a.texto));
    assert.ok(a.partes >= 2, 'el documento tiene que partirse');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('L5 · los bytes son bytes: con tildes, un caracter no es un byte', () => {
  // Un texto con acentos y enye: cada caracter de esos ocupa dos bytes en
  // UTF-8. Un guard que cuenta caracteres en vez de bytes deja pasar el
  // presupuesto sin querer.
  const conTildes = `## Una${SALTO}${SALTO}` + 'nñoá áááá '.repeat(50);
  const { dir, ruta } = temporal(conTildes);
  try {
    const a = artefactoDeCoherencia(ruta);
    assert.ok(a.bytes > a.texto.length, 'con tildes, los bytes son mas que los caracteres');
    assert.equal(a.bytes, Buffer.byteLength(a.texto, 'utf8'));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('L5 · el artefacto es MAS GRANDE que el tope: no es el juez de una parte', () => {
  const { dir, ruta } = temporal(documento(4));
  try {
    const a = artefactoDeCoherencia(ruta);
    assert.ok(a.bytes > TOPE, 'el artefacto tiene que exceder el tope de una parte');
    assert.ok(a.partes >= 2, 'y tiene que tener mas de una parte');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('L5 · la contradiccion cambia un numero que aparece en dos partes', () => {
  const { dir, ruta } = temporal(documento(4));
  try {
    const c = contradiccionDe(ruta);
    assert.notEqual(c, null, 'el documento tiene material: el numero esta repetido');
    assert.equal(c.numero, '4242');
    assert.equal(c.original, '4242');
    assert.notEqual(c.cambiado, c.original, 'el numero tiene que cambiar');
    assert.ok(c.parte >= 1, 'el cambio tiene que estar en una parte distinta de la primera');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('L5 · la contradiccion hace que las partes digan cosas distintas', () => {
  const { dir, ruta } = temporal(documento(4));
  try {
    const c = contradiccionDe(ruta);
    assert.notEqual(c, null);
    const antes = partir(readFileSync(ruta, 'utf8'), TOPE, '.md');
    const despues = partir(c.texto, TOPE, '.md');
    assert.equal(antes.length, despues.length, 'la mutacion no parte el documento distinto');
    const parteAntes = antes[c.parte].texto;
    const parteDespues = despues[c.parte].texto;
    assert.notEqual(parteAntes, parteDespues, 'la parte mutada tiene que ser distinta');
    assert.ok(parteDespues.includes(c.cambiado), 'la parte mutada dice el numero nuevo');
    assert.ok(parteAntes.includes(c.original), 'la parte original dice el numero viejo');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('L5 · la contradiccion deja un documento que sigue componiendose entero', () => {
  const { dir, ruta } = temporal(documento(4));
  try {
    const c = contradiccionDe(ruta);
    assert.notEqual(c, null);
    const partes = partir(c.texto, TOPE, '.md');
    const recomposado = partes.map((p) => p.texto).join(SALTO);
    assert.equal(sha(recomposado), sha(c.texto), 'el mutado tambien se compone entero');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('L5 · un documento sin numero repetido NO tiene contradiccion, y se dice', () => {
  const dir = mkdtempSync(join(tmpdir(), 'coherencia-'));
  try {
    const ruta = join(dir, 'doc.md');
    const texto = ['## Una', 'palabra '.repeat(60), '## Dos', 'otra cosa '.repeat(60)].join(SALTO);
    writeFileSync(ruta, texto, 'utf8');
    assert.equal(contradiccionDe(ruta), null, 'sin numero repetido no hay contradiccion que inventar');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('L5 · un documento de una parte sola no tiene contradiccion', () => {
  const { dir, ruta } = temporal(`## Una${SALTO}${SALTO}` + 'palabra '.repeat(10));
  try {
    assert.equal(contradiccionDe(ruta), null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('L5 · la afirmacion de coherencia es UNA, y no enumera partes', () => {
  assert.ok(AFIRMACION_DE_COHERENCIA.length > 40, 'tiene que decir algo');
  assert.equal((AFIRMACION_DE_COHERENCIA.match(/\n/g) ?? []).length, 0, 'una sola linea');
});
