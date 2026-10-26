/**
 * L4-T2 · La verificacion de la identidad legal: los tres estados y la
 * evidencia que los respalda (decision A1).
 *
 * Lo que se prueba aqui es la parte que el compilador no puede: un KYC armado
 * a mano, con un estado que no existe, con una evidencia a medias, o con una
 * señal que falta. Y el congelado: la evidencia es un objeto dentro de la
 * identidad, y una tool no puede cambiar las señales en vuelo.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { validarIdentidad, IdentidadInvalidaError } from '../src/identity/validacion.js';
import { validarKyc } from '../src/identity/kyc-puerta.js';
import { SENALES_DOCUMENTALES, senalesQueExige, type EvidenciaKyc } from '../src/identity/kyc.js';
import {
  copiarIdentidad,
  identidadLegal,
  identidadLegalDocumental,
  identidadLegalVerificada,
} from '../src/identity/operaciones.js';
import { emptyContext, sealContext } from '../src/context.js';
import { IDENTIDAD, IDENTIDAD_DOCUMENTAL } from './identity-fixture.js';

/** Las cuatro señales del stack libre, con su stack y su fecha. */
const EVIDENCIA: EvidenciaKyc = {
  senales: ['documento', 'liveness', 'cotejo', 'screening'],
  stack: 'stack-libre-1',
  fecha: '2026-10-26T12:00:00Z',
};

test('L4-T2 · la identidad documental se acepta con sus cuatro señales', () => {
  assert.deepEqual(validarIdentidad(IDENTIDAD_DOCUMENTAL), []);
  assert.equal(IDENTIDAD_DOCUMENTAL.kyc.estado, 'documental');
});

test('L4-T2 · cada estado exige sus señales, y son las medidas', () => {
  assert.deepEqual(
    [...senalesQueExige('documental')],
    ['documento', 'liveness', 'cotejo', 'screening'],
  );
  assert.deepEqual(
    [...senalesQueExige('verificada')],
    ['documento', 'liveness', 'cotejo', 'screening', 'registral'],
  );
  assert.deepEqual([...SENALES_DOCUMENTALES], [...senalesQueExige('documental')]);
});

test('L4-T2 · la verificada sin la señal registral no es verificada', () => {
  // La señal registral no es libre (L4-T2): es un contrato con el registro
  // oficial. Sin ella, el estado que se declara no se sostiene.
  const sinRegistral = identidadLegalVerificada('id-x', EVIDENCIA);
  assert.deepEqual(validarIdentidad(sinRegistral), ['E_KYC_SIN_SENALES']);
  const conRegistral = identidadLegalVerificada('id-x', {
    ...EVIDENCIA,
    senales: [...EVIDENCIA.senales, 'registral'],
  });
  assert.deepEqual(validarIdentidad(conRegistral), []);
});

test('L4-T2 · sin stack no hay quien respalde el estado', () => {
  assert.deepEqual(validarKyc({ estado: 'documental' }), ['E_KYC_SIN_STACK']);
  assert.deepEqual(
    validarKyc({ estado: 'documental', evidencia: { ...EVIDENCIA, stack: '  ' } }),
    ['E_KYC_SIN_STACK'],
  );
});

test('L4-T2 · un estado que no existe no es un estado', () => {
  assert.deepEqual(validarKyc({ estado: 'aprobada' }), ['E_KYC_INVALIDO']);
  assert.deepEqual(validarKyc(null), ['E_KYC_INVALIDO']);
  assert.deepEqual(validarKyc('simulada'), ['E_KYC_INVALIDO']);
});

test('L4-T2 · una evidencia con un campo de más, o con una fecha ilegible, no vale', () => {
  assert.deepEqual(
    validarKyc({ estado: 'documental', evidencia: { ...EVIDENCIA, extra: 1 } }),
    ['E_KYC_INVALIDO'],
  );
  assert.deepEqual(
    validarKyc({ estado: 'documental', evidencia: { ...EVIDENCIA, fecha: 'ayer' } }),
    ['E_KYC_INVALIDO'],
  );
  assert.deepEqual(
    validarKyc({
      estado: 'documental',
      evidencia: { ...EVIDENCIA, senales: 'documentolivenesscotejoscreening' },
    }),
    ['E_KYC_SIN_SENALES'],
  );
});

test('L4-T2 · la que dice no estar verificada no trae pruebas', () => {
  assert.deepEqual(validarKyc({ estado: 'simulada' }), []);
  assert.deepEqual(validarKyc({ estado: 'simulada', evidencia: EVIDENCIA }), ['E_KYC_CON_EVIDENCIA']);
});

test('L4-T2 · la evidencia sale congelada, por dentro', () => {
  const id = identidadLegalDocumental('id-x', EVIDENCIA);
  assert.equal(Object.isFrozen(id), true);
  assert.equal(Object.isFrozen(id.kyc), true);
  const kyc = id.kyc;
  if (kyc.estado === 'simulada') return;
  assert.equal(Object.isFrozen(kyc.evidencia), true);
  assert.equal(Object.isFrozen(kyc.evidencia.senales), true);
  assert.throws(() => {
    (kyc.evidencia.senales as string[]).push('registral');
  });
  assert.equal(kyc.evidencia.senales.length, 4);
});

test('L4-T2 · copiar la identidad copia la evidencia, y no congela lo del llamador', () => {
  const copia = copiarIdentidad(IDENTIDAD_DOCUMENTAL);
  const original = IDENTIDAD_DOCUMENTAL.kyc;
  assert.equal(copia.kind, 'legal');
  if (copia.kind !== 'legal' || original.estado === 'simulada') return;
  const copiaKyc = copia.kyc;
  if (copiaKyc.estado === 'simulada') return;
  assert.notEqual(copiaKyc.evidencia, original.evidencia, 'la evidencia se copia, no se comparte');
  assert.equal(Object.isFrozen(copiaKyc.evidencia), true);
});

test('L4-T2 · sellar copia la evidencia por dentro, y el llamador conserva lo suyo', () => {
  const evidencia = {
    senales: ['documento', 'liveness', 'cotejo', 'screening'] as const,
    stack: 'stack-libre-1',
    fecha: '2026-10-26T12:00:00Z',
  };
  const mutable = {
    kind: 'legal' as const,
    id: 'id-6',
    projectId: 'identity:legal:id-6',
    kyc: { estado: 'documental' as const, evidencia },
  };
  const ctx = sealContext(emptyContext('actor-1', mutable));
  assert.equal(ctx.identity.kind, 'legal');
  if (ctx.identity.kind !== 'legal') return;
  const kyc = ctx.identity.kyc;
  if (kyc.estado !== 'simulada') {
    assert.equal(Object.isFrozen(kyc.evidencia.senales), true);
  }
  assert.equal(Object.isFrozen(evidencia), false, 'sellar congelo la evidencia del llamador');
});

test('L4-T2 · un KYC a medias no sella el contexto', () => {
  const aMedias = {
    ...IDENTIDAD,
    kyc: { estado: 'documental', evidencia: { ...EVIDENCIA, senales: ['documento'] } },
  } as const;
  assert.throws(
    () => emptyContext('actor-1', aMedias),
    (e: unknown) => e instanceof IdentidadInvalidaError && e.motivos.includes('E_KYC_SIN_SENALES'),
  );
});

test('L4-T2 · la identidad sin verificar sigue siendo la que el runtime respalda', () => {
  // Lo que A1 NO cambio: una identidad sin evidencia no se puede declarar
  // verificada. El stub sigue siendo simulado, y con la misma evidencia.
  assert.equal(identidadLegal('id-x').kyc.estado, 'simulada');
  assert.deepEqual(validarIdentidad(identidadLegal('id-x')), []);
});
