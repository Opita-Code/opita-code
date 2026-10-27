/**
 * L5 · LAS PARTES QUE VE EL JUEZ: partir por concepto y recomponer el completo.
 *
 * Lo que se prueba aqui es la promesa de la decision del operador (2026-10-27):
 * la partida es solo para el juez, el documento se queda entero en el repo, y
 * las partes se recomponen en el original byte a byte. Si eso no se sostiene,
 * el veredicto se estaria aplicando a algo que nadie puede reconstruir.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  TOPE,
  partir,
  componer,
  verificar,
  conceptosDe,
  quitarCabecera,
  escribirPartes,
  leerPartes,
  cabecera,
  sha,
} from './juez-partes.mjs';

/** Un documento de N secciones, con la prosa que hace falta para que pese. */
function documento(secciones, relleno = 40) {
  const partes = [];
  for (let i = 0; i < secciones; i++) {
    partes.push(`## Seccion ${i + 1}\n`);
    partes.push(`${'palabra '.repeat(relleno)}\n`);
  }
  return partes.join('\n');
}

test('L5 · un documento se parte en conceptos, y los conceptos son las secciones', () => {
  const texto = documento(3);
  const conceptos = conceptosDe(texto, '.md');
  assert.equal(conceptos.length, 3);
  assert.ok(conceptos[0].titulo.startsWith('Seccion 1'));
});

test('L5 · las partes se recomponen en el original, byte a byte', () => {
  const texto = documento(4);
  const partes = partir(texto, TOPE, '.md');
  const v = verificar(texto, partes.map((p) => p.texto));
  assert.equal(v.ok, true, 'las partes tienen que dar el original');
  assert.equal(v.esperado, v.obtenido);
});

test('L5 · un documento grande se parte en varias partes, y ninguna pasa del tope', () => {
  const texto = documento(40, 60);
  assert.ok(Buffer.byteLength(texto, 'utf8') > TOPE * 3, 'el documento tiene que pesar');
  const partes = partir(texto, TOPE, '.md');
  assert.ok(partes.length > 1, 'un documento que no cabe se parte');
  for (const p of partes) {
    assert.ok(Buffer.byteLength(p.texto, 'utf8') <= TOPE, 'ninguna parte pasa del tope');
  }
  assert.equal(verificar(texto, partes.map((p) => p.texto)).ok, true);
});

test('L5 · un concepto que solo no cabe no se amputa: el script falla y lo dice', () => {
  const texto = `## Seccion enorme\n\n${'palabra '.repeat(2000)}\n`;
  assert.throws(
    () => partir(texto, TOPE, '.md'),
    (e) => e.codigo === 'E_CONCEPTO_GRANDE',
  );
});

test('L5 · una parte alterada no se compone en el original', () => {
  const texto = documento(20, 60);
  const partes = partir(texto, TOPE, '.md').map((p) => p.texto);
  assert.ok(partes.length > 1, 'el documento tiene que partirse en varias partes');
  partes[1] = partes[1].replace('palabra', 'PESADO');
  assert.equal(verificar(texto, partes).ok, false, 'una parte cambiada tiene que delatarlo');
});

test('L5 · una parte sin cabecera no se puede componer', () => {
  assert.throws(
    () => quitarCabecera('esto no es una parte\n'),
    (e) => e.codigo === 'E_CABECERA',
  );
});

test('L5 · la recomposicion es exacta con CRLF, con tildes y con salto final', () => {
  const casos = [
    '## Uno\r\n\r\nCon acentos: ñ, á, é, ü, ¿?\r\n\r\n## Dos\r\n\r\nMás texto.\r\n',
    '## Uno\n\nSin salto final',
    '## Uno\n\n',
    'Preámbulo sin título\n\n## Uno\n\ncuerpo\n',
  ];
  for (const texto of casos) {
    const partes = partir(texto, TOPE, '.md');
    assert.equal(verificar(texto, partes.map((p) => p.texto)).ok, true, `falla con ${JSON.stringify(texto.slice(0, 20))}`);
  }
});

test('L5 · el codigo se parte por declaraciones de nivel superior', () => {
  const texto = [
    '/**',
    ' * El modulo.',
    ' */',
    "import { a } from './a.js';",
    '',
    'export const uno = 1;',
    '',
    'export function dos() {',
    '  return 2;',
    '}',
    '',
  ].join('\n');
  const conceptos = conceptosDe(texto, '.ts');
  assert.ok(conceptos.length >= 2, 'cada export es un concepto');
  assert.equal(verificar(texto, partir(texto, TOPE, '.ts').map((p) => p.texto)).ok, true);
});

test('L5 ·Property · para muchos documentos, componer(partir(x)) es x', () => {
  // La promesa es general, no de un ejemplo: se prueba sobre una familia.
  for (let n = 1; n <= 12; n++) {
    const texto = documento(n, n * 7);
    const partes = partir(texto, TOPE, '.md');
    assert.equal(componer(partes.map((p) => p.texto)), texto, `falla con ${n} secciones`);
  }
});

test('L5 · las partes se escriben en disco y se leen de vuelta, y dan el original', () => {
  const dir = mkdtempSync(join(tmpdir(), 'partes-'));
  try {
    const ruta = join(dir, 'doc.md');
    const texto = documento(6);
    writeFileSync(ruta, texto, 'utf8');
    const m = escribirPartes(ruta, join(dir, 'salida'));
    assert.equal(m.partes.length, 1);
    const cuerpos = leerPartes(join(dir, 'salida'), ruta);
    assert.equal(verificar(texto, cuerpos).ok, true);
    const primera = readFileSync(m.partes[0].ruta, 'utf8');
    assert.ok(primera.startsWith('<!-- parte 1 de 1'), 'la parte declara de donde sale');
    assert.ok(primera.includes(sha(texto)), 'la cabecera lleva el sha del original');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('L5 · la cabecera de una parte lleva su numero, su total y el sha del original', () => {
  const c = cabecera(2, 5, 'docs/x.md', 'a'.repeat(64));
  assert.match(c, /^<!-- parte 2 de 5 · docs\/x\.md · sha256 a{64} -->\n$/);
});
