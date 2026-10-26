import test from 'node:test';
import assert from 'node:assert/strict';

import { PREFIJOS, namespaceDe } from '../src/identity.js';
import { mismaIdentidad } from '../src/identity/operaciones.js';
import { identidadAnonima, identidadEmpresa, identidadLegal } from '../src/identity/operaciones.js';
import { ALCANCE_ANTIFRAUDE, alcanceAntifraude } from '../src/identity/antifraude.js';
import { emptyContext, sealContext } from '../src/context.js';
import { IDENTIDAD, IDENTIDAD_ANONIMA, IDENTIDAD_EMPRESA } from './identity-fixture.js';

/** Una identidad sin congelar, como la haria un llamador que no pasa por la fabrica. */
type IdentidadEditable = { -readonly [K in keyof (typeof IDENTIDAD)]: (typeof IDENTIDAD)[K] };

test('L4-T1 · el stub es una identidad legal con el KYC simulado', () => {
  const id = identidadLegal('id-1');
  assert.equal(id.kind, 'legal');
  assert.equal(id.kyc.estado, 'simulada');
  assert.equal(id.projectId, 'identity:legal:id-1');
});

test('L4-T1 · el KYC del stub es simulado, y no verificado', () => {
  // La distincion importa: un estado verificado sin evidencia seria una
  // mentira publicable. Si este test falla, alguien subio el estado a mano.
  assert.notEqual(identidadLegal('id-1').kyc.estado, 'documental');
  assert.notEqual(identidadLegal('id-1').kyc.estado, 'verificada');
});

test('L4-T1 · el contexto lleva la identidad, y el contexto vacio tambien', () => {
  const ctx = emptyContext('actor-1', IDENTIDAD);
  // Se compara por valor y no por referencia: el contexto guarda una COPIA
  // sellada de la identidad, y eso es lo que se prueba en los dos tests de
  // abajo.
  assert.deepEqual(ctx.identity, IDENTIDAD);
  assert.equal(ctx.identity.projectId, 'identity:legal:id-legal');
});

test('L4-T1 · la identidad sellada esta congelada: la tool no cambia la clave', () => {
  const ctx = sealContext(emptyContext('actor-1', IDENTIDAD));
  assert.equal(Object.isFrozen(ctx.identity), true);
  assert.throws(() => {
    (ctx.identity as { projectId: string }).projectId = 'proyecto-ajeno';
  });
  assert.equal(ctx.identity.projectId, 'identity:legal:id-legal');
});

test('L4-T1 · sellar copia la identidad: mutar el original no cambia el contexto', () => {
  // Una identidad sin congelar, como la haria un llamador que no paso por
  // la fabrica. El contexto sellado tiene que ser suyo y no una ventana al
  // objeto del llamador.
  const mutable: IdentidadEditable = {
    id: 'id-2',
    kind: 'legal',
    projectId: 'identity:legal:id-2',
    kyc: { estado: 'simulada' },
  };
  const ctx = sealContext(emptyContext('actor-1', mutable));
  mutable.projectId = 'identity:org:id-2';
  assert.equal(ctx.identity.projectId, 'identity:legal:id-2');
});

test('L4-T1 · el camino rapido tambien copia la identidad', () => {
  // `emptyContext` marca su resultado como sellado, asi que `sealContext` no
  // lo vuelve a tocar. Si la copia no estuviera ahi, la clave de aislamiento
  // quedaria en la mano del llamador.
  const mutable: IdentidadEditable = {
    id: 'id-4',
    kind: 'legal',
    projectId: 'identity:legal:id-4',
    kyc: { estado: 'simulada' },
  };
  const ctx = emptyContext('actor-1', mutable);
  mutable.projectId = 'identity:org:id-4';
  assert.equal(ctx.identity.projectId, 'identity:legal:id-4');
  assert.equal(Object.isFrozen(ctx.identity), true);
});

test('L4-T1 · sellar no congela el objeto del llamador', () => {
  const mutable: IdentidadEditable = {
    id: 'id-3',
    kind: 'legal',
    projectId: 'identity:legal:id-3',
    kyc: { estado: 'simulada' },
  };
  sealContext(emptyContext('actor-1', mutable));
  assert.equal(Object.isFrozen(mutable), false, 'sellar congelo el objeto del llamador, no una copia');
});

test('L4-T1 · sellar un contexto ARMADO A MANO tambien sella la identidad', () => {
  // Este es el otro camino: un contexto que no viene de `emptyContext` no
  // esta en el WeakSet de los sellados, y `sealContext` lo tiene que sellar
  // entero. Sin este test, la identidad de esa ruta no la miraba nadie.
  const mutable: IdentidadEditable = {
    id: 'id-5',
    kind: 'legal',
    projectId: 'identity:legal:id-5',
    kyc: { estado: 'simulada' },
  };
  const ctx = sealContext({
    profile: 'minimal' as const,
    injected: {},
    identity: mutable,
    actorId: 'actor-1',
    deadlineMs: 10,
  });
  assert.equal(Object.isFrozen(ctx.identity), true);
  mutable.projectId = 'identity:org:id-5';
  assert.equal(ctx.identity.projectId, 'identity:legal:id-5');
  assert.equal(Object.isFrozen(mutable), false, 'sellar congelo el objeto del llamador, no una copia');
});

test('L4-T1 · dos identidades son la misma solo si coinciden las tres cosas', () => {
  const a = identidadLegal('id-1');
  assert.equal(mismaIdentidad(a, identidadLegal('id-1')), true);
  assert.equal(mismaIdentidad(a, identidadLegal('id-2')), false, 'otro id es otra identidad');
  assert.equal(mismaIdentidad(a, identidadEmpresa('id-1', 'Comercializadora del Norte S.A.S.')), false, 'otro tipo es otra identidad');
});

test('L4-T3 · las tres identidades son tres tipos, no tres campos', () => {
  // Lo que el union hace en compilacion, aqui se comprueba en runtime: cada
  // identidad lleva SOLO lo suyo. El nombre de la persona legal no cabe en la
  // identidad de la empresa, y el nickname no cabe en la legal.
  assert.deepEqual(Object.keys(IDENTIDAD).sort(), ['id', 'kind', 'kyc', 'projectId']);
  assert.deepEqual(Object.keys(IDENTIDAD_EMPRESA).sort(), ['id', 'kind', 'projectId', 'razonSocial']);
  assert.deepEqual(Object.keys(IDENTIDAD_ANONIMA).sort(), ['id', 'kind', 'nickname', 'projectId']);
  assert.equal('nombreLegal' in IDENTIDAD_EMPRESA, false);
  assert.equal('nickname' in IDENTIDAD, false);
});

test('L4-T3 · la clave de aislamiento se deriva del tipo y del id', () => {
  assert.equal(namespaceDe('legal', 'x'), 'identity:legal:x');
  assert.equal(namespaceDe('empresa', 'x'), 'identity:org:x');
  assert.equal(namespaceDe('anonimo', 'x'), 'identity:anon:x');
  assert.equal(PREFIJOS.empresa, 'identity:org');
  // El mismo id en los tres tipos son tres mods distintos: ese es el punto.
  assert.equal(
    new Set([identidadLegal('x').projectId, identidadEmpresa('x', 'Norte S.A.S.').projectId, identidadAnonima('x', 'Lince Gris').projectId]).size,
    3,
  );
});

test('L4-T3 · el antifraude solo alcanza a la identidad legal', () => {
  // A6 = opcion 4: el antifraude se degrada, y el precio es que el perfil
  // anonimo es el punto mas debil del sistema.
  assert.equal(alcanceAntifraude(IDENTIDAD), true);
  assert.equal(alcanceAntifraude(IDENTIDAD_EMPRESA), false);
  assert.equal(alcanceAntifraude(IDENTIDAD_ANONIMA), false);
  assert.equal(Object.isFrozen(ALCANCE_ANTIFRAUDE), true);
});

test('L4-T3 · el nickname del anonimo es inmutable', () => {
  assert.equal(Object.isFrozen(IDENTIDAD_ANONIMA), true);
  assert.throws(() => {
    (IDENTIDAD_ANONIMA as { nickname: string }).nickname = 'otro';
  });
  assert.equal(IDENTIDAD_ANONIMA.nickname, 'Lince Gris');
});

test('L4-T3 · la empresa y el anonimo no son la identidad legal de nadie', () => {
  // El nombre publico del dueno (E-ARC-4) NO es un campo de la identidad de
  // empresa: es un cruce DECLARADO de publicacion, y meterlo en la identidad
  // lo volveria un cruce de contexto, que es el que el boundary prohibe.
  assert.equal('nombrePublicoDueno' in IDENTIDAD_EMPRESA, false);
  assert.equal('rol' in IDENTIDAD_EMPRESA, false, 'el rol llega como asercion verificada, no como contexto');
});
