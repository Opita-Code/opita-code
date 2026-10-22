import test from 'node:test';
import assert from 'node:assert/strict';

import { canonicalize, CanonicalError } from '../src/canonical.js';
import { sha256HexOfText } from '../src/hash.js';
import {
  integrityOf,
  deliveries,
  inputPort,
  outputPort,
  parseRef,
  type Port,
  type ToolDescriptor,
} from '../src/contract.js';

const encoder = new TextEncoder();

function shaRef(bytes: number[]): string {
  return sha256HexOfText(String.fromCharCode(...bytes));
}

// ---------------------------------------------------------------------------
// sha256: vectores NIST conocidos. Si esto falla, la huella de integridad de
// todo el marketplace no sirve.
// ---------------------------------------------------------------------------

test('L0-T1 · sha256 del vector canonico de cadena vacia', () => {
  assert.equal(
    sha256HexOfText(''),
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  );
});

test('L0-T1 · sha256 del vector "abc"', () => {
  assert.equal(
    sha256HexOfText('abc'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
  );
});

test('L0-T1 · sha256 del vector de 56 bytes (bloque + padding multiple)', () => {
  assert.equal(
    sha256HexOfText('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
    '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
  );
});

test('L0-T1 · sha256 cruza muchos bloques (longitudes de borde)', async () => {
  const { createHash } = await import('node:crypto');
  for (const len of [54, 55, 56, 57, 63, 64, 65, 119, 120, 121, 1000]) {
    const msg = 'a'.repeat(len);
    assert.equal(
      sha256HexOfText(msg),
      createHash('sha256').update(msg).digest('hex'),
      `longitud ${len}`,
    );
  }
});

test('L0-T1 · sha256 de 1 byte', async () => {
  const { createHash } = await import('node:crypto');
  assert.equal(shaRef([0x61]), createHash('sha256').update('a').digest('hex'));
});

test('L0-T1 · sha256 de UTF-8 multibyte coincide con Node crypto', async () => {
  const { createHash } = await import('node:crypto');
  const samples = ['hola ñandú', '🛠️ vibe-tools', 'a'.repeat(55), 'b'.repeat(56), 'c'.repeat(119)];
  for (const s of samples) {
    const expected = createHash('sha256').update(s, 'utf8').digest('hex');
    assert.equal(sha256HexOfText(s), expected, `divergencia en: ${JSON.stringify(s.slice(0, 12))}`);
  }
  assert.ok(encoder.encode('a').length === 1);
});

// ---------------------------------------------------------------------------
// Canonicalizacion
// ---------------------------------------------------------------------------

test('L0-T1 · canonicalize ordena claves y es insensible al orden de insercion', () => {
  assert.equal(canonicalize({ b: 1, a: 2 }), canonicalize({ a: 2, b: 1 }));
  assert.equal(canonicalize({ b: 1, a: 2 }), '{"a":2,"b":1}');
});

test('L0-T1 · canonicalize ordena claves en profundidad', () => {
  const x = canonicalize({ z: { y: 1, x: 2 }, a: [{ b: 1, a: 0 }] });
  assert.equal(x, '{"a":[{"a":0,"b":1}],"z":{"x":2,"y":1}}');
});

test('L0-T1 · canonicalize respeta el orden de los arreglos (es semantico)', () => {
  assert.notEqual(canonicalize([1, 2]), canonicalize([2, 1]));
});

test('L0-T1 · canonicalize es punto fijo de su propia forma ordenada', () => {
  // No es idempotente como funcion: canonicalize devuelve una CADENA, y
  // canonicalizar esa cadena la vuelve a escapar. La propiedad que importa es
  // que la forma ordenada ya no cambia al volver a canonizar.
  const v = { m: 1, a: [{ q: 'x', b: true }], n: null };
  const once = canonicalize(v);
  assert.equal(canonicalize(JSON.parse(once)), once);
});

test('L0-T1 · canonicalize escapa strings como JSON', () => {
  assert.equal(canonicalize('a"b\n'), '"a\\"b\\n"');
});

test('L0-T1 · canonicalize rechaza lo no canonizable', () => {
  assert.throws(() => canonicalize(Number.NaN), CanonicalError);
  assert.throws(() => canonicalize(Number.POSITIVE_INFINITY), CanonicalError);
  assert.throws(() => canonicalize(10n), CanonicalError);
  assert.throws(() => canonicalize(() => 1), CanonicalError);
});

test('L0-T1 · canonicalize omite undefined en objetos pero conserva null', () => {
  assert.equal(canonicalize({ a: undefined, b: 1 }), '{"b":1}');
  assert.equal(canonicalize({ a: null }), '{"a":null}');
});

// ---------------------------------------------------------------------------
// Integridad
// ---------------------------------------------------------------------------

const port = (name: string, produces: Port['produces'], artifact = false): Port => ({
  name,
  produces,
  artifact,
});

const tool = (over: Partial<ToolDescriptor> = {}): ToolDescriptor => ({
  id: 'exec',
  version: '0.1.0',
  author: 'opita',
  title: 'Ejecuta codigo',
  determinism: 'deterministic',
  tier: 'T0',
  effect: 'none',
  inputs: [port('prompt', 'text')],
  outputs: [port('out', 'code')],
  ...over,
});

test('L0-T1 · el mismo descriptor da el mismo hash', () => {
  assert.equal(integrityOf(tool()), integrityOf(tool()));
});

test('L0-T1 · un descriptor con claves en otro orden da el mismo hash', () => {
  const a = { id: 'x', version: '1.0.0', determinism: 'deterministic' };
  const b = { determinism: 'deterministic', version: '1.0.0', id: 'x' };
  assert.equal(integrityOf(a), integrityOf(b));
});

test('L0-T1 · cambiar cualquier campo cambia el hash', () => {
  const base = integrityOf(tool());
  const variants: ToolDescriptor[] = [
    tool({ version: '0.1.1' }),
    tool({ determinism: 'stochastic' }),
    tool({ tier: 'T1' }),
    tool({ effect: 'read' }),
    tool({ outputs: [port('out', 'text')] }),
    tool({ outputs: [port('other', 'code')] }),
    tool({ inputs: [] }),
  ];
  for (const v of variants) {
    assert.notEqual(integrityOf(v), base, `hash colision en ${canonicalize(v).slice(0, 80)}`);
  }
});

test('L0-T1 · el hash tiene 64 hexes', () => {
  assert.match(integrityOf(tool()), /^[0-9a-f]{64}$/);
});

test('L0-T1 · el hash del descriptor es sensible al orden de los puertos', () => {
  const p1 = port('a', 'text');
  const p2 = port('b', 'code');
  assert.notEqual(
    integrityOf(tool({ inputs: [p1, p2] })),
    integrityOf(tool({ inputs: [p2, p1] })),
  );
});

// ---------------------------------------------------------------------------
// Lecturas derivadas
// ---------------------------------------------------------------------------

test('L0-T1 · deliveries solo devuelve los puertos artifact', () => {
  const t = tool({ outputs: [port('code', 'code'), port('html', 'text', true), port('rep', 'text')] });
  assert.deepEqual(
    deliveries(t).map((p) => p.name),
    ['html'],
  );
});

test('L0-T1 · inputPort y outputPort distinguen direccion', () => {
  const t = tool({ inputs: [port('same', 'text')], outputs: [port('same', 'code')] });
  assert.equal(inputPort(t, 'same')?.produces, 'text');
  assert.equal(outputPort(t, 'same')?.produces, 'code');
  assert.equal(inputPort(t, 'nope'), undefined);
  assert.equal(outputPort(t, 'nope'), undefined);
});

test('L0-T1 · parseRef separa nodo:puerto y rechaza referencias ambiguas', () => {
  assert.deepEqual(parseRef('a:b'), { node: 'a', port: 'b' });
  assert.deepEqual(parseRef('node:port'), { node: 'node', port: 'port' });
  assert.equal(parseRef(':b'), null);
  assert.equal(parseRef('a:'), null);
  assert.equal(parseRef('ab'), null);
  assert.equal(parseRef('a:b:c'), null);
});