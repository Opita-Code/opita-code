import test from 'node:test';
import assert from 'node:assert/strict';

import { shareKey, sharePolicy, ValueStore, cachedOutputs } from '../src/module/share.js';

// ---------------------------------------------------------------------------
// La politica: derivada, no configurable
// ---------------------------------------------------------------------------

test('L2-S3 · la politica sale del eje 2, no de un parametro', () => {
  assert.deepEqual(sharePolicy('deterministic'), { kind: 'mutation', cache: true, comparable: true });
  assert.deepEqual(sharePolicy('stochastic'), { kind: 'recipe', cache: false, comparable: true });
  assert.deepEqual(sharePolicy('stateful'), { kind: 'none', cache: false, comparable: false });
});

test('L2-S3 · recipe y none NO son lo mismo: none tampoco se puede comparar', () => {
  const recipe = sharePolicy('stochastic');
  const none = sharePolicy('stateful');
  assert.notEqual(recipe.kind, none.kind);
  assert.equal(recipe.cache, none.cache, 'ninguno de los dos cachea');
  assert.notEqual(
    recipe.comparable,
    none.comparable,
    'comparar dos corridas de una tool con estado no dice nada: el estado cambio',
  );
});

test('L2-S3 · mutation es la unica que cachea', () => {
  const cacheables = (['deterministic', 'stochastic', 'stateful'] as const).filter(
    (d) => sharePolicy(d).cache,
  );
  assert.deepEqual(cacheables, ['deterministic']);
});

test('L2-S3 · la politica no se puede pasar como argumento', () => {
  // Si `cache` fuera un parametro, un llamador podria cachear una receta.
  // El unico `cache` de la superficie es una propiedad de SharePolicy.
  assert.equal(sharePolicy.length, 1, 'sharePolicy toma exactamente el determinismo');
});

// ---------------------------------------------------------------------------
// La clave
// ---------------------------------------------------------------------------

test('L2-S3 · la clave es un sha256, no texto concatenado', () => {
  const k = shareKey('opita.exec', '0.1.0', { expr: '1+1' });
  assert.match(k, /^[0-9a-f]{64}$/, 'longitud fija: no se puede fabricar una colision por separador');
});

test('L2-S3 · tool, version e input entran en la clave', () => {
  const input = { expr: '1+1' };
  assert.notEqual(shareKey('a', '1', input), shareKey('b', '1', input), 'id');
  assert.notEqual(shareKey('a', '1', input), shareKey('a', '2', input), 'version');
  assert.notEqual(shareKey('a', '1', input), shareKey('a', '1', { expr: '1+2' }), 'input');
});

test('L2-S3 · el orden de las claves del input no cambia la clave', () => {
  assert.equal(shareKey('a', '1', { x: 1, y: 2 }), shareKey('a', '1', { y: 2, x: 1 }));
});

test('L2-S3 · un separador inyectado no puede colisionar dos inputs distintos', () => {
  // El ataque clasico: con clave de texto, estos dos darian la misma.
  assert.notEqual(shareKey('a', '1', ['x', 'y']), shareKey('a', '1', ['xy']));
  assert.notEqual(shareKey('a:1', 'x', {}), shareKey('a', '1:x', {}));
});

// ---------------------------------------------------------------------------
// La cache
// ---------------------------------------------------------------------------

test('L2-S3 · la cache solo escribe desde una politica que lo permite', () => {
  const s = new ValueStore();
  assert.equal(s.record('k', 'v', sharePolicy('deterministic')), true);
  assert.equal(s.record('k2', 'v', sharePolicy('stochastic')), false, 'una receta no se cachea');
  assert.equal(s.record('k3', 'v', sharePolicy('stateful')), false, 'una tool con estado tampoco');
  assert.equal(s.size, 1);
});

test('L2-S3 · `cachedOutputs` NO devuelve lo que hay en cache si la politica prohibe', () => {
  // El valor esta ahi a proposito: la pregunta no es "esta el valor?" sino
  // "puede este valor servirse?".
  const s = new ValueStore();
  const key = 'k';
  s.record(key, [{ port: 'out', value: 1 }], sharePolicy('deterministic'));
  assert.deepEqual(cachedOutputs(sharePolicy('deterministic'), s, key), [{ port: 'out', value: 1 }]);
  assert.equal(cachedOutputs(sharePolicy('stochastic'), s, key), null);
  assert.equal(cachedOutputs(sharePolicy('stateful'), s, key), null);
});

test('L2-S3 · sin clave no hay cache que consultar', () => {
  const s = new ValueStore();
  s.record('k', [{ port: 'out', value: 1 }], sharePolicy('deterministic'));
  assert.equal(cachedOutputs(sharePolicy('deterministic'), s, null), null);
});

test('L2-S3 · una clave ausente no se confunde con un valor ausente', () => {
  const s = new ValueStore();
  assert.equal(s.has('nada'), false);
  assert.equal(s.lookup('nada'), undefined);
  s.record('k', undefined, sharePolicy('deterministic'));
  assert.equal(s.has('k'), true, 'un undefined cacheado sigue estando: hay entrada');
  assert.equal(s.has('k'), true, 'y no se confunde con no haberlo buscado');
});

test('L2-S3 · la cache se puede vaciar sin dejar basura', () => {
  const s = new ValueStore();
  s.record('a', 1, sharePolicy('deterministic'));
  s.clear();
  assert.equal(s.size, 0);
  assert.equal(cachedOutputs(sharePolicy('deterministic'), s, 'a'), null);
});