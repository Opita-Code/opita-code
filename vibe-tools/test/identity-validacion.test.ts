/**
 * L4-T3 · La puerta: lo que llega de afuera se comprueba antes de entrar.
 *
 * El union discriminado protege en compilacion; aqui se prueba la otra mitad,
 * la que no tiene compilador: un contexto armado a mano, con una clave que no
 * se derivo del tipo, con un campo que no es del tipo, o con un localizador en
 * el perfil anonimo.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { validarIdentidad, IdentidadInvalidaError } from '../src/identity/validacion.js';
import { emptyContext, sealContext, type ToolContext } from '../src/context.js';
import { runInSandbox } from '../src/sandbox/runner.js';
import { HOSTS } from '../src/sandbox/tier.js';
import type { ToolDescriptor, Port } from '../src/contract.js';
import type { ToolImpl } from '../src/tool.js';
import { IDENTIDAD, IDENTIDAD_ANONIMA, IDENTIDAD_EMPRESA } from './identity-fixture.js';

const OUT: Port = { name: 'out', produces: 'text', artifact: true };

/** El cruce que el boundary prohibe: una identidad legal en el mod de la empresa. */
const CRUZADA = {
  kind: 'legal',
  id: 'id-legal',
  projectId: 'identity:org:id-legal',
  kyc: 'simulada',
} as const;

function descriptor(): ToolDescriptor {
  return {
    id: 't',
    version: '1.0.0',
    author: 'a',
    title: 't',
    determinism: 'deterministic',
    tier: 'T0',
    effect: 'none',
    inputs: [],
    outputs: [OUT],
  };
}

test('L4-T3 · una identidad bien formada no tiene motivos', () => {
  assert.deepEqual(validarIdentidad(IDENTIDAD), []);
  assert.deepEqual(validarIdentidad(IDENTIDAD_EMPRESA), []);
  assert.deepEqual(validarIdentidad(IDENTIDAD_ANONIMA), []);
});

test('L4-T3 · una clave que no se derivo del tipo se rechaza', () => {
  assert.deepEqual(validarIdentidad(CRUZADA), ['E_NAMESPACE']);
});

test('L4-T3 · un tipo que no existe se rechaza, y no revienta', () => {
  // `constructor` esta en el prototipo de Object: un filtro con `in` lo deja
  // pasar y despues el runtime usa una funcion como namespace.
  assert.deepEqual(validarIdentidad({ kind: 'constructor', id: 'x', projectId: 'x' }), ['E_NAMESPACE']);
  assert.deepEqual(validarIdentidad(null), ['E_NAMESPACE']);
  assert.deepEqual(validarIdentidad('identity:legal:x'), ['E_NAMESPACE']);
});

test('L4-T3 · un campo que no es del tipo se rechaza', () => {
  // El nombre de la persona legal en la identidad de la empresa es exactamente
  // el cruce que el boundary prohibe.
  const conNombre = { ...IDENTIDAD_EMPRESA, nombreLegal: 'Persona' };
  assert.deepEqual(validarIdentidad(conNombre), ['E_CAMPO_EXTRA']);
});

test('L4-T3 · el anonimo no puede llevar localizadores', () => {
  // A6 = opcion 4: sin psicometria, IP ni dispositivo el perfil es anonimo.
  const conIp = { ...IDENTIDAD_ANONIMA, ip: '203.0.113.7' };
  assert.deepEqual(validarIdentidad(conIp), ['E_ANONIMO_LOCALIZABLE']);
});

test('L4-T3 · el KYC verificado no se acepta sin stack', () => {
  // L4-T2 no existe: no hay quien respalde `verificada`, y declararla seria
  // una mentira publicable.
  const verificada = { ...IDENTIDAD, kyc: 'verificada' };
  assert.deepEqual(validarIdentidad(verificada), ['E_KYC_SIN_STACK']);
  const inventado = { ...IDENTIDAD, kyc: 'aprobada' };
  assert.deepEqual(validarIdentidad(inventado), ['E_KYC_INVALIDO']);
});

test('L4-T3 · la razon social y el nickname no pueden estar vacios', () => {
  assert.deepEqual(validarIdentidad({ ...IDENTIDAD_EMPRESA, razonSocial: '  ' }), ['E_RAZON_SOCIAL_VACIA']);
  assert.deepEqual(validarIdentidad({ ...IDENTIDAD_ANONIMA, nickname: '' }), ['E_NICKNAME_VACIO']);
});

test('L4-T3 · la puerta se cierra: un contexto con identidad invalida no se sella', () => {
  assert.throws(
    () => emptyContext('actor-1', CRUZADA),
    (e: unknown) => e instanceof IdentidadInvalidaError && e.motivos.includes('E_NAMESPACE'),
  );
  assert.throws(
    () =>
      sealContext({
        profile: 'none',
        injected: {},
        identity: CRUZADA,
        actorId: 'actor-1',
        deadlineMs: 10,
      }),
    IdentidadInvalidaError,
  );
});

test('L4-T3 · la tool no corre bajo una identidad invalida', () => {
  let corrio = false;
  const IMPLEMENTA: ToolImpl = () => {
    corrio = true;
    return { ok: true, outputs: [{ port: 'out', value: 'datos' }] };
  };
  const invalida: ToolContext = {
    profile: 'none',
    injected: {},
    identity: CRUZADA,
    actorId: 'a',
    deadlineMs: 1000,
  };
  const r = runInSandbox({
    env: HOSTS.client,
    binding: { descriptor: descriptor(), impl: IMPLEMENTA },
    input: {},
    ctx: invalida,
  });
  assert.equal(r.ok, false, 'una identidad invalida es una precondicion denegada');
  if (!r.ok) {
    assert.equal(r.code, 'E_IDENTITY_INVALID');
    assert.match(r.detail, /E_NAMESPACE/);
  }
  assert.equal(corrio, false, 'la tool no puede llegar a ejecutarse');
});
