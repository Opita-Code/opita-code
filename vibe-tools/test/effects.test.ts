/**
 * L1-S2 · El puerto de efectos.
 *
 * Lo que se verifica aca es una sola cosa, y es la garantia dinamica del loop:
 * el puerto denegado NO tiene referencia al host. No es un permiso revocado, es
 * la ausencia de poder, y por eso una tool que ignora el resultado del deniego
 * tampoco escapa.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { createPort, sealedPort } from '../src/sandbox/effects/create.js';
import type { EffectResult } from '../src/sandbox/effects/port.js';

test('L1-S2 · bajo T0 las tres operaciones se deniegan', () => {
  const p = createPort('T0');
  assert.equal(p.net('https://x.dev').ok, false);
  assert.equal(p.fs('read', '/etc/passwd').ok, false);
  assert.equal(p.proc(['ls']).ok, false);
});

test('L1-S2 · el deniego dice la capacidad y por que', () => {
  const r: EffectResult = createPort('T0').net('https://x.dev');
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.why, 'denied');
    assert.equal(r.capability, 'net');
    assert.match(r.detail, /T0 no concede net/);
  }
});

test('L1-S2 · denegado y no implementado son fallos distintos', () => {
  const denied = createPort('T0').fs('write', '/tmp/x', 'dato');
  const unimplemented = createPort('T1').fs('write', '/tmp/x', 'dato');
  assert.equal(denied.ok, false);
  assert.equal(unimplemented.ok, false);
  if (!denied.ok && !unimplemented.ok) {
    assert.equal(denied.why, 'denied', 'T0 no lo concede');
    assert.equal(unimplemented.why, 'unimplemented', 'T1 lo concede pero el MVP no tiene backend');
  }
});

test('L1-S2 · con backend, T1 puede hacer red', () => {
  const p = createPort('T1', { net: () => ({ status: 200 }) });
  const r = p.net('https://api.example');
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.value, { status: 200 });
});

test('L1-S2 · con backend, T1 igual no puede lanzar procesos', () => {
  const p = createPort('T1', { proc: () => 'nunca' });
  const r = p.proc(['rm', '-rf', '/']);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.why, 'denied');
});

test('L1-S2 · T2 con backend si puede lanzar procesos', () => {
  const p = createPort('T2', { proc: () => 'salida' });
  assert.equal(p.proc(['echo', 'hola']).ok, true);
});

test('L1-S2 · el backend nunca se invoca si el sandbox no concede la capacidad', () => {
  let llamado = false;
  const p = createPort('T0', {
    net: () => {
      llamado = true;
      return 'filtrado';
    },
  });
  const r = p.net('https://x.dev');
  assert.equal(r.ok, false);
  assert.equal(llamado, false, 'el deniego ocurre antes de tocar el backend');
});

test('L1-S2 · todo intento queda registrado, concedido o no', () => {
  const p = createPort('T2', { net: () => 1, proc: () => 2 });
  p.net('a');
  p.proc(['b']);
  p.fs('read', '/c');
  assert.deepEqual(
    p.attempts.map((a) => `${a.capability}:${a.op.split(' ')[0]}`),
    ['net:net', 'process:proc', 'fs:fs'],
  );
  assert.deepEqual(p.attempts.map((a) => a.granted), [true, true, true]);
});

test('L1-S2 · un intento denegado queda registrado como denegado', () => {
  const p = createPort('T0');
  p.net('a');
  p.net('b');
  assert.equal(p.attempts.length, 2);
  assert.deepEqual(p.attempts.map((a) => a.granted), [false, false]);
});

test('L1-S2 · la bitacora es inmutable: ni el array ni sus entradas', () => {
  const p = createPort('T0');
  p.net('a');
  const copia = p.attempts as unknown as { granted: boolean }[];
  assert.throws(() => {
    copia[0]!.granted = true;
  });
  assert.equal(p.attempts[0]?.granted, false);
  assert.notEqual(p.attempts, copia);
});

test('L1-S2 · el puerto sellado es T0 y no trae backend', () => {
  const p = sealedPort();
  assert.deepEqual([...p.granted], []);
  assert.equal(p.net('x').ok, false);
});

test('L1-S2 · lo concedido se anuncia y no se confunde con lo permitido', () => {
  assert.deepEqual([...sealedPort().granted], []);
  assert.deepEqual([...createPort('T1').granted], ['net', 'fs']);
  assert.deepEqual([...createPort('T2').granted], ['net', 'fs', 'process']);
});
