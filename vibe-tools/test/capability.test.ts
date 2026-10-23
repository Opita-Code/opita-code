/**
 * L1-S1 · El modelo de capacidades.
 *
 * Lo que se verifica aca es que la granularidad nueva de L1 no se contradiga con
 * la regla gruesa que L0 dejo en axes.ts. Son dos capas distintas —una mira el
 * contrato, otra la ejecucion— y por eso justamente tienen que coincidir.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAPABILITIES,
  grantsFor,
  missingFor,
  requiresFor,
  effectAllowed,
  isCapability,
} from '../src/sandbox/capability.js';
import { tierAllows, EFFECTS, TIERS, type Tier } from '../src/axes.js';

test('L1-S1 · T0 no concede ninguna capacidad: no "pocas", ninguna', () => {
  assert.deepEqual(grantsFor('T0'), []);
  assert.equal(effectAllowed('T0', 'none'), true);
  assert.equal(effectAllowed('T0', 'read'), false);
});

test('L1-S1 · T1 concede red y archivo pero nunca proceso', () => {
  assert.deepEqual(grantsFor('T1'), ['net', 'fs']);
  assert.equal(effectAllowed('T1', 'read'), true);
  assert.equal(effectAllowed('T1', 'write'), true);
  assert.equal(effectAllowed('T1', 'process'), false, 'un proceso real exige un kernel');
});

test('L1-S1 · T2 concede todo porque una microVM tiene kernel', () => {
  assert.deepEqual(grantsFor('T2'), ['net', 'fs', 'process']);
  for (const e of EFFECTS) assert.equal(effectAllowed('T2', e), true);
});

test('L1-S1 · escribir exige mas que leer, y ejecutar es lo mas fuerte', () => {
  assert.deepEqual(requiresFor('none'), []);
  assert.deepEqual(requiresFor('read'), ['fs']);
  assert.deepEqual(requiresFor('write'), ['fs', 'net']);
  assert.deepEqual(requiresFor('process'), ['fs', 'net', 'process']);
});

test('L1-S1 · las capacidades nombradas son exactamente tres', () => {
  assert.deepEqual([...CAPABILITIES], ['net', 'fs', 'process']);
  assert.equal(isCapability('net'), true);
  assert.equal(isCapability('gpu'), false);
  assert.equal(isCapability(7), false);
});

test('L1-S1 · los 12 pares (tier, efecto) coinciden con la regla gruesa de L0', () => {
  for (const tier of TIERS) {
    for (const effect of EFFECTS) {
      assert.equal(
        effectAllowed(tier, effect),
        tierAllows(tier, effect),
        `discrepan en ${tier}/${effect}: la regla gruesa y la granular no pueden diferir`,
      );
    }
  }
});

test('L1-S1 · T0 es el unico tier que solo admite el efecto ninguno', () => {
  assert.deepEqual(EFFECTS.filter((e) => effectAllowed('T0', e)), ['none']);
  assert.deepEqual(EFFECTS.filter((e) => effectAllowed('T1', e)), ['none', 'read', 'write']);
  assert.deepEqual(EFFECTS.filter((e) => effectAllowed('T2', e)), ['none', 'read', 'write', 'process']);
});

test('L1-S1 · missingFor dice QUE falta, no solo que falta algo', () => {
  assert.equal(missingFor('T0', 'read'), 'fs');
  assert.equal(missingFor('T0', 'write'), 'fs');
  assert.equal(missingFor('T1', 'process'), 'process');
  assert.equal(missingFor('T2', 'process'), null);
  assert.equal(missingFor('T0', 'none'), null);
});

test('L1-S1 · el efecto mas fuerte exige todo lo que exigen los mas debiles', () => {
  const orden = ['none', 'read', 'write', 'process'] as const;
  for (const [i, masDebilEfecto] of orden.entries()) {
    for (const [j, masFuerteEfecto] of orden.entries()) {
      if (j <= i) continue;
      const masDebil = new Set<string>(requiresFor(masDebilEfecto));
      const masFuerte = new Set<string>(requiresFor(masFuerteEfecto));
      for (const c of masDebil) {
        assert.ok(masFuerte.has(c), `${masFuerteEfecto} es mas fuerte que ${masDebilEfecto} y no exige ${c}`);
      }
    }
  }
});

test('L1-S1 · un tier solo puede conceder capacidades del conjunto nombrado', () => {
  for (const tier of TIERS) {
    for (const c of grantsFor(tier)) assert.ok(isCapability(c), `${tier} concede ${c}, que no es capacidad`);
  }
});

test('L1-S1 · los tres tiers estan en el contrato y la tabla los cubre todos', () => {
  assert.deepEqual([...TIERS], ['T0', 'T1', 'T2']);
  for (const t of TIERS as readonly Tier[]) assert.ok(grantsFor(t) !== undefined);
});
