import test from 'node:test';
import assert from 'node:assert/strict';

import { identidadStubLegal, mismaIdentidad, type Identity } from '../src/identity.js';
import { emptyContext, sealContext } from '../src/context.js';
import { IDENTIDAD } from './identity-fixture.js';

/** Una identidad sin congelar, como la haria un llamador que no pasa por la fabrica. */
type IdentidadEditable = { -readonly [K in keyof Identity]: Identity[K] };

test('L4-T1 · el stub es una identidad legal con el KYC simulado', () => {
  const id = identidadStubLegal('id-1', 'proyecto-1');
  assert.equal(id.kind, 'legal');
  assert.equal(id.kyc, 'simulada');
  assert.equal(id.projectId, 'proyecto-1');
});

test('L4-T1 · el KYC del stub es simulado, y no verificado', () => {
  // La distincion importa: `verificada` sin stack de KYC seria una mentira
  // publicable. Si este test falla, alguien subio el estado a mano.
  assert.notEqual(identidadStubLegal('id-1', 'proyecto-1').kyc, 'verificada');
});

test('L4-T1 · el contexto lleva la identidad, y el contexto vacio tambien', () => {
  const ctx = emptyContext('actor-1', IDENTIDAD);
  // Se compara por valor y no por referencia: el contexto guarda una COPIA
  // sellada de la identidad, y eso es lo que se prueba en los dos tests de
  // abajo.
  assert.deepEqual(ctx.identity, IDENTIDAD);
  assert.equal(ctx.identity.projectId, 'proyecto-1');
});

test('L4-T1 · la identidad sellada esta congelada: la tool no cambia la clave', () => {
  const ctx = sealContext(emptyContext('actor-1', IDENTIDAD));
  assert.equal(Object.isFrozen(ctx.identity), true);
  assert.throws(() => {
    (ctx.identity as { projectId: string }).projectId = 'proyecto-ajeno';
  });
  assert.equal(ctx.identity.projectId, 'proyecto-1');
});

test('L4-T1 · sellar copia la identidad: mutar el original no cambia el contexto', () => {
  // Una identidad sin congelar, como la haria un llamador que no paso por
  // la fabrica. El contexto sellado tiene que ser suyo y no una ventana al
  // objeto del llamador.
  const mutable: IdentidadEditable = { id: 'id-2', kind: 'legal', projectId: 'proyecto-2', kyc: 'simulada' };
  const ctx = sealContext(emptyContext('actor-1', mutable));
  mutable.projectId = 'proyecto-ajeno';
  assert.equal(ctx.identity.projectId, 'proyecto-2');
});

test('L4-T1 · el camino rapido tambien copia la identidad', () => {
  // `emptyContext` marca su resultado como sellado, asi que `sealContext` no
  // lo vuelve a tocar. Si la copia no estuviera ahi, la clave de aislamiento
  // quedaria en la mano del llamador.
  const mutable: IdentidadEditable = { id: 'id-4', kind: 'legal', projectId: 'proyecto-4', kyc: 'simulada' };
  const ctx = emptyContext('actor-1', mutable);
  mutable.projectId = 'proyecto-ajeno';
  assert.equal(ctx.identity.projectId, 'proyecto-4');
  assert.equal(Object.isFrozen(ctx.identity), true);
});

test('L4-T1 · sellar no congela el objeto del llamador', () => {
  const mutable: IdentidadEditable = { id: 'id-3', kind: 'legal', projectId: 'proyecto-3', kyc: 'simulada' };
  sealContext(emptyContext('actor-1', mutable));
  assert.equal(Object.isFrozen(mutable), false, 'sellar congelo el objeto del llamador, no una copia');
});

test('L4-T1 · sellar un contexto ARMADO A MANO tambien sella la identidad', () => {
  // Este es el otro camino: un contexto que no viene de `emptyContext` no
  // esta en el WeakSet de los sellados, y `sealContext` lo tiene que sellar
  // entero. Sin este test, la identidad de esa ruta no la miraba nadie.
  const mutable: IdentidadEditable = { id: 'id-5', kind: 'legal', projectId: 'proyecto-5', kyc: 'simulada' };
  const ctx = sealContext({
    profile: 'minimal' as const,
    injected: {},
    identity: mutable,
    actorId: 'actor-1',
    deadlineMs: 10,
  });
  assert.equal(Object.isFrozen(ctx.identity), true);
  mutable.projectId = 'proyecto-ajeno';
  assert.equal(ctx.identity.projectId, 'proyecto-5');
  assert.equal(Object.isFrozen(mutable), false, 'sellar congelo el objeto del llamador, no una copia');
});

test('L4-T1 · dos identidades son la misma solo si coinciden las tres cosas', () => {
  const a = identidadStubLegal('id-1', 'proyecto-1');
  assert.equal(mismaIdentidad(a, identidadStubLegal('id-1', 'proyecto-1')), true);
  assert.equal(mismaIdentidad(a, identidadStubLegal('id-1', 'proyecto-2')), false, 'otro proyecto es otro mod');
  assert.equal(mismaIdentidad(a, identidadStubLegal('id-2', 'proyecto-1')), false, 'otro id es otra identidad');
  assert.equal(
    mismaIdentidad(a, { id: 'id-1', kind: 'empresa', projectId: 'proyecto-1', kyc: 'simulada' }),
    false,
    'otro tipo es otra identidad',
  );
});
