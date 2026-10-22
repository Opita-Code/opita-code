import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PRODUCES,
  DETERMINISM,
  SHARING,
  sharingOf,
  isProduces,
  isDeterminism,
  tierAllows,
  type Produces,
  type Determinism,
} from '../src/axes.js';

test('L0-T2 · el eje 1 tiene 6 valores y son los documentados', () => {
  assert.deepEqual([...PRODUCES], ['code', 'text', 'image', 'video', 'audio', 'multimodal']);
});

test('L0-T2 · el eje 2 tiene 3 valores', () => {
  assert.deepEqual([...DETERMINISM], ['deterministic', 'stochastic', 'stateful']);
});

test('L0-T2 · determinista se comparte como mutacion', () => {
  assert.equal(sharingOf('deterministic'), 'mutation');
});

test('L0-T2 · estocastica se comparte como receta', () => {
  assert.equal(sharingOf('stochastic'), 'recipe');
});

test('L0-T2 · con-estado no se comparte', () => {
  assert.equal(sharingOf('stateful'), 'none');
});

test('L0-T2 · la derivacion eje2 -> forma de compartir es total e inyectiva', () => {
  const seen = new Set<string>();
  for (const d of DETERMINISM) {
    const s = sharingOf(d);
    assert.ok(s.length > 0, `sin forma de compartir para ${d}`);
    assert.ok(!seen.has(s), `colision de sharing: ${d} y ${seen.has(s) ? s : ''} -> ${s}`);
    seen.add(s);
  }
  assert.equal(seen.size, DETERMINISM.length);
});

test('L0-T2 · la tabla SHARING coincide con la derivacion expuesta', () => {
  for (const d of DETERMINISM) assert.equal(SHARING[d], sharingOf(d));
});

test('L0-T2 · los guards de enum rechazan lo que no es del enum', () => {
  assert.equal(isProduces('code'), true);
  assert.equal(isProduces('CODE'), false);
  assert.equal(isProduces('binary'), false);
  assert.equal(isProduces(undefined), false);
  assert.equal(isDeterminism('stochastic'), true);
  assert.equal(isDeterminism('aleatorio'), false);
  assert.equal(isDeterminism(7), false);
});

test('L0-T1 · T0 no admite ningun efecto de I/O', () => {
  assert.equal(tierAllows('T0', 'none'), true);
  assert.equal(tierAllows('T0', 'read'), false);
  assert.equal(tierAllows('T0', 'write'), false);
  assert.equal(tierAllows('T0', 'process'), false);
});

test('L0-T1 · T1 admite red pero no proceso pesado', () => {
  assert.equal(tierAllows('T1', 'none'), true);
  assert.equal(tierAllows('T1', 'read'), true);
  assert.equal(tierAllows('T1', 'write'), true);
  assert.equal(tierAllows('T1', 'process'), false);
});

test('L0-T1 · T2 lo admite todo', () => {
  for (const e of ['none', 'read', 'write', 'process'] as const) {
    assert.equal(tierAllows('T2', e), true);
  }
});

test('L0-T2 · ejemplo de contrato tipado: una tool por combinacion valida', () => {
  const combos: Array<[Determinism, Produces]> = [];
  for (const d of DETERMINISM) for (const p of PRODUCES) combos.push([d, p]);
  assert.equal(combos.length, 18, '3 clases de determinismo x 6 clases de produccion');
});