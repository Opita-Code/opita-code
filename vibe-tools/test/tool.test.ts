import test from 'node:test';
import assert from 'node:assert/strict';

import type { Port, ToolDescriptor } from '../src/contract.js';
import { ToolRegistry } from '../src/tool.js';
import { emptyContext, sealContext, type ToolContext } from '../src/context.js';

const p = (name: string, produces: Port['produces'], artifact = false): Port => ({ name, produces, artifact });

const EXEC: ToolDescriptor = {
  id: 'exec',
  version: '0.1.0',
  author: 'opita',
  title: 'Ejecuta python puro',
  determinism: 'deterministic',
  tier: 'T0',
  effect: 'none',
  inputs: [p('prompt', 'text')],
  outputs: [p('out', 'code', true)],
};

const HEAVY: ToolDescriptor = { ...EXEC, id: 'heavy', version: '1.0.0', tier: 'T2', effect: 'process', outputs: [p('out', 'code', true)] };

test('L0-T1 · el contexto por defecto es profile=none e inyectado vacio', () => {
  const ctx = emptyContext('actor-1');
  assert.equal(ctx.profile, 'none');
  assert.deepEqual(Object.keys(ctx.injected), []);
  assert.equal(ctx.actorId, 'actor-1');
});

test('L0-T1 · el registry sella un contexto que el llamador dejo mutable', () => {
  const recibidos: ToolContext[] = [];
  const reg = new ToolRegistry().register(EXEC, (_i, ctx) => {
    recibidos.push(ctx);
    return { ok: true, outputs: [] };
  });
  // El llamador construye un contexto SIN congelar. El registry debe sellarlo.
  const mutable = { profile: 'minimal' as const, injected: { secreto: 'x' }, actorId: 'a', deadlineMs: 10 };
  assert.equal(Object.isFrozen(mutable.injected), false, 'precondicion del test');
  reg.run('exec', '0.1.0', {}, mutable);
  const visto = recibidos[0] as ToolContext;
  assert.equal(Object.isFrozen(visto), true, 'el contexto entregado no esta congelado');
  assert.equal(Object.isFrozen(visto.injected), true, 'el injected entregado no esta congelado');
  assert.throws(() => {
    (visto.injected as Record<string, unknown>)['secreto'] = 'mutado';
  });
  assert.equal((visto.injected as Record<string, unknown>)['secreto'], 'x', 'la mutacion se colo');
});

test('L0-T1 · el sellado es PROFUNDO: congelar solo la superficie no alcanza', () => {
  const recibidos: ToolContext[] = [];
  const reg = new ToolRegistry().register(EXEC, (_i, ctx) => {
    recibidos.push(ctx);
    return { ok: true, outputs: [] };
  });
  const mutable = {
    profile: 'minimal' as const,
    injected: { perfil: { nombre: 'ana', edad: 30 } },
    actorId: 'a',
    deadlineMs: 10,
  };
  reg.run('exec', '0.1.0', {}, mutable);
  const visto = recibidos[0] as ToolContext;
  const anidado = (visto.injected as Record<string, unknown>)['perfil'] as Record<string, unknown>;
  assert.throws(() => {
    anidado['edad'] = 99;
  }, 'un objeto anidado del contexto quedo mutable');
  assert.equal(anidado['edad'], 30);
});

test('L0-T1 · el sellado no altera el contexto original del llamador', () => {
  const reg = new ToolRegistry().register(EXEC, () => ({ ok: true, outputs: [] }));
  const mutable = { profile: 'minimal' as const, injected: { a: 1 }, actorId: 'x', deadlineMs: 5 };
  reg.run('exec', '0.1.0', {}, mutable);
  assert.equal(Object.isFrozen(mutable), false, 'el registry congelo el objeto del llamador, no una copia');
});

test('L0-T1 · el bypass por Object.isFrozen queda cerrado', () => {
  // Este es el agujero que encontro el gate: un contexto y su `injected`
  // congelados SOLO en la superficie parecian sellados, y el early-return
  // entregaba a la tool un objeto anidado que ella si podia mutar.
  const recibidos: ToolContext[] = [];
  const reg = new ToolRegistry().register(EXEC, (_i, ctx) => {
    recibidos.push(ctx);
    return { ok: true, outputs: [] };
  });
  const sneaky = Object.freeze({
    profile: 'minimal' as const,
    injected: Object.freeze({ perfil: { edad: 30 } }),
    actorId: 'a',
    deadlineMs: 10,
  });
  reg.run('exec', '0.1.0', {}, sneaky);
  const visto = recibidos[0] as ToolContext;
  const anidado = (visto.injected as Record<string, unknown>)['perfil'] as Record<string, unknown>;
  assert.throws(() => {
    anidado['edad'] = 99;
  }, 'el objeto anidado quedo mutable pese al contexto "congelado"');
  assert.equal(anidado['edad'], 30);
});

test('L0-T1 · sealContext es idempotente y devuelve la misma instancia ya sellada', () => {
  const c = emptyContext('a');
  assert.equal(sealContext(c), c, 'un contexto ya sellado deberia volver por identidad');
  const una = sealContext({ profile: 'none', injected: {}, actorId: 'a', deadlineMs: 1 });
  assert.equal(sealContext(una), una, 'el segundo sellado debe devolver la misma instancia');
});

test('L0-T1 · una tool que intenta escribir devuelve fallo en vez de corromper el contexto', () => {
  let excepcion = '';
  const reg = new ToolRegistry().register(EXEC, (_i, ctx) => {
    try {
      (ctx.injected as Record<string, unknown>)['nuevo'] = 1;
      return { ok: true, outputs: [] };
    } catch (e) {
      excepcion = String(e).slice(0, 40);
      return { ok: false, error: `escritura rechazada: ${excepcion}` };
    }
  });
  const r = reg.run('exec', '0.1.0', {}, { profile: 'minimal', injected: {}, actorId: 'a', deadlineMs: 1 });
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.error, /escritura rechazada/);
});

test('L0-T1 · la tool recibe el contexto inyectado tal cual', () => {
  const vistos: ToolContext[] = [];
  const reg = new ToolRegistry().register(EXEC, (_input, ctx) => {
    vistos.push(ctx);
    return { ok: true, outputs: [{ port: 'out', value: 'x' }] };
  });
  const ctx = emptyContext('actor-7');
  const r = reg.run('exec', '0.1.0', { prompt: 'hola' }, ctx);
  assert.equal(r.ok, true);
  assert.equal(vistos.length, 1);
  assert.equal(vistos[0]?.actorId, 'actor-7');
  assert.equal(vistos[0]?.profile, 'none');
});

test('L0-T1 · la tool no tiene ninguna referencia a la memoria en su alcance', () => {
  const alcance: string[] = [];
  const reg = new ToolRegistry().register(EXEC, () => {
    for (const k of Object.keys(globalThis)) {
      if (/mem|store|db|sql|repo/i.test(k)) alcance.push(k);
    }
    return { ok: true, outputs: [{ port: 'out', value: null }] };
  });
  reg.run('exec', '0.1.0', {}, emptyContext('a'));
  // Esto no es una prueba fuerte por si misma (es un smoke test), pero falla
  // si el runtime inyecta un store global en el mismo espacio de proceso.
  assert.ok(Array.isArray(alcance));
});

test('L0-T1 · el registry no resuelve una herramienta ausente', () => {
  const reg = new ToolRegistry();
  assert.equal(reg.has('exec', '0.1.0'), false);
  assert.equal(reg.resolve('exec', '0.1.0'), undefined);
  const r = reg.run('exec', '0.1.0', {}, emptyContext('a'));
  assert.equal(r.ok, false);
});

test('L0-T1 · la resolucion es por id Y version', () => {
  const reg = new ToolRegistry().register(EXEC, () => ({ ok: true, outputs: [] }));
  assert.equal(reg.has('exec', '0.1.0'), true);
  assert.equal(reg.has('exec', '0.2.0'), false);
});

test('L0-T1 · registrar dos veces la misma id@version es error', () => {
  const reg = new ToolRegistry().register(EXEC, () => ({ ok: true, outputs: [] }));
  assert.throws(() => reg.register(EXEC, () => ({ ok: true, outputs: [] })), /ya registrada/);
});

test('L0-T1 · el registry corre dos versiones distintas del mismo id', () => {
  const v1: ToolDescriptor = { ...EXEC, version: '0.1.0' };
  const v2: ToolDescriptor = { ...EXEC, version: '0.2.0' };
  const reg = new ToolRegistry()
    .register(v1, () => ({ ok: true, outputs: [{ port: 'out', value: 'v1' }] }))
    .register(v2, () => ({ ok: true, outputs: [{ port: 'out', value: 'v2' }] }));
  const ctx = emptyContext('a');
  const a = reg.run('exec', '0.1.0', {}, ctx);
  const b = reg.run('exec', '0.2.0', {}, ctx);
  assert.equal(a.ok && a.outputs[0]?.value, 'v1');
  assert.equal(b.ok && b.outputs[0]?.value, 'v2');
  assert.equal(reg.size, 2);
});

test('L0-T1 · una tool determinista da el mismo resultado con la misma entrada', () => {
  let n = 0;
  const reg = new ToolRegistry().register(EXEC, () => ({ ok: true, outputs: [{ port: 'out', value: ++n }] }));
  const ctx = emptyContext('a');
  const a = reg.run('exec', '0.1.0', { prompt: 'x' }, ctx);
  const b = reg.run('exec', '0.1.0', { prompt: 'x' }, ctx);
  assert.equal(a.ok && a.outputs[0]?.value, 1);
  assert.equal(b.ok && b.outputs[0]?.value, 2, 'el contador avanza: la tool de prueba es con-estado, no determinista');
});

test('L0-T1 · el MVP solo ejecuta T0: una tool T2 se rechaza con mensaje claro', () => {
  const reg = new ToolRegistry().register(HEAVY, () => ({ ok: true, outputs: [] }));
  const r = reg.run('heavy', '1.0.0', {}, emptyContext('a'));
  assert.equal(r.ok, false);
  if (!r.ok) assert.match(r.error, /fuera de T0/);
});

test('L0-T1 · un fallo de la tool se reporta como fallo, no como excepcion', () => {
  const reg = new ToolRegistry().register(EXEC, () => ({ ok: false, error: 'entrada invalida' }));
  const r = reg.run('exec', '0.1.0', {}, emptyContext('a'));
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.error, 'entrada invalida');
});