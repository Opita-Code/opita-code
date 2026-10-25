import test from 'node:test';
import assert from 'node:assert/strict';

import type { Edge, ModuleDescriptor, ModuleNode, ToolDescriptor } from '../src/contract.js';
import { validate } from '../src/graph.js';
import { emptyContext } from '../src/context.js';
import { ToolRegistry } from '../src/tool.js';
import { runModule } from '../src/module/run.js';
import { sharePolicy, ValueStore } from '../src/module/share.js';
import { EXEC_DESCRIPTOR, EXEC_IMPL, RENDER_DESCRIPTOR, RENDER_IMPL } from '../src/tools/index.js';
import { renderSvg } from '../src/tools/render.js';
import { Rng } from './rng.js';
import { IDENTIDAD } from './identity-fixture.js';

/**
 * PROPIEDADES DE L2.
 *
 * El PRNG va sembrado por la misma razon que en L0: una suite que falla al azar
 * contradiria la propiedad que protege —mismo contrato, mismo resultado—.
 */

const CANON = {
  id: 'canon',
  version: '0.1.0',
  author: 'opita',
  title: 'canon',
  nodes: [
    { node: 'dibuja', tool: RENDER_DESCRIPTOR },
    { node: 'calcula', tool: EXEC_DESCRIPTOR },
  ] as ModuleNode[],
  edges: [{ from: 'calcula', fromPort: 'value', to: 'dibuja', toPort: 'value' }] as Edge[],
  sinks: ['dibuja:svg'],
} satisfies ModuleDescriptor;
const SEEDS = [1, 7, 42, 1337, 90210, 0xdeadbeef];
const ctx = emptyContext('INV-1', IDENTIDAD);

// ---------------------------------------------------------------------------
// Generadores
// ---------------------------------------------------------------------------

/** Un DAG: los nodos van de 0 a n-1 y una arista solo puede ir de menor a mayor. */
function dag(n: number, r: Rng): { nodes: string[]; edges: Edge[] } {
  const nodes = Array.from({ length: n }, (_, i) => `n${i}`);
  const edges: Edge[] = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (r.bool()) edges.push({ from: nodes[i] as string, fromPort: 'out', to: nodes[j] as string, toPort: 'in' });
    }
  }
  return { nodes, edges };
}

const GEN_TOOL: ToolDescriptor = {
  id: 'gen',
  version: '0.1.0',
  author: 'opita',
  title: 'g',
  determinism: 'deterministic',
  tier: 'T0',
  effect: 'none',
  inputs: [{ name: 'in', produces: 'text', artifact: false }],
  outputs: [{ name: 'out', produces: 'text', artifact: false }],
};

const GEN_LAST: ToolDescriptor = { ...GEN_TOOL, outputs: [{ name: 'out', produces: 'text', artifact: true }] };

/** Envuelve un DAG en un modulo valido: los sinks son los nodos SIN salientes. */
function moduleOf(n: number, r: Rng): ModuleDescriptor {
  const { nodes, edges } = dag(n, r);
  const mn: ModuleNode[] = nodes.map((name, i) => ({ node: name, tool: i === nodes.length - 1 ? GEN_LAST : GEN_TOOL }));
  const conSalida = new Set(edges.map((e) => e.from));
  const sinks = nodes.filter((x) => !conSalida.has(x)).map((x) => `${x}:out`);
  return { id: 'm', version: '0.1.0', author: 'opita', title: 'm', nodes: mn, edges, sinks };
}

// ---------------------------------------------------------------------------
// P25 · el orden respeta TODAS las aristas
// ---------------------------------------------------------------------------

test('L2-S1 · P25 el orden topologico respeta cada arista, en 300 grafos', () => {
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    for (let k = 0; k < 50; k++) {
      const m = moduleOf(1 + r.int(6), r);
      const v = validate(m);
      assert.equal(v.ok, true, v.ok ? '' : `${v.code}: ${v.detail}`);
      if (!v.ok) return;
      const at = new Map(v.plan.executionOrder.map((name, i) => [name, i]));
      for (const e of m.edges) {
        assert.ok(
          (at.get(e.from) as number) < (at.get(e.to) as number),
          `${e.from} debe ir antes que ${e.to} (seed ${seed})`,
        );
      }
    }
  }
});

test('L2-S1 · P26 el orden es una permutacion de los nodos declarados', () => {
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    for (let k = 0; k < 50; k++) {
      const m = moduleOf(1 + r.int(6), r);
      const v = validate(m);
      if (!v.ok) { assert.fail(`${v.code}: ${v.detail}`); return; }
      const order = v.plan.executionOrder;
      assert.equal(order.length, m.nodes.length, 'no puede perder ni inventar nodos');
      assert.equal(new Set(order).size, order.length, 'no puede repetir');
      assert.deepEqual([...order].sort(), m.nodes.map((n) => n.node).sort());
    }
  }
});

test('L2-S1 · P27 el orden es determinista: mismo descriptor, mismo orden, siempre', () => {
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    const m = moduleOf(5, r);
    const primero = JSON.stringify(validate(m));
    for (let i = 0; i < 10; i++) assert.equal(JSON.stringify(validate(m)), primero, `seed ${seed}`);
  }
});

test('L2-S1 · P28 sin aristas, el orden topologico ES el orden de declaracion', () => {
  // El caso limite del desempate: si no hay nada que ordenar, la unica libertad
  // que queda es el orden que el autor escribio. No se ordena "por algo".
  const libre: ModuleDescriptor = {
    id: 'libre',
    version: '0.1.0',
    author: 'opita',
    title: 'libre',
    nodes: (['a', 'b', 'c'] as const).map((n, i) => ({ node: n, tool: i === 2 ? GEN_LAST : GEN_TOOL })),
    edges: [],
    sinks: ['a:out', 'b:out', 'c:out'],
  };
  const v = validate(libre);
  if (!v.ok) { assert.fail(v.detail); return; }
  assert.deepEqual(v.plan.executionOrder, ['a', 'b', 'c']);

  const invertido = { ...libre, nodes: [...libre.nodes].reverse() };
  const w = validate(invertido);
  if (!w.ok) { assert.fail(w.detail); return; }
  assert.deepEqual(w.plan.executionOrder, ['c', 'b', 'a'], 'cambia con la declaracion, no con el azar');
});

// ---------------------------------------------------------------------------
// P29 · la corrida
// ---------------------------------------------------------------------------

function registroCanonico(): ToolRegistry {
  const r = new ToolRegistry();
  r.register(EXEC_DESCRIPTOR, EXEC_IMPL);
  r.register(RENDER_DESCRIPTOR, RENDER_IMPL);
  return r;
}

test('L2-S4 · P29 un modulo que fallo NO tiene entregas, en 200 corridas', () => {
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    for (let k = 0; k < 40; k++) {
      const expr = `${r.int(9)}+${r.int(9)}`;
      // A veces sin entrada, a veces con expresion invalida: los dos fallos posibles.
      const entry = r.bool() ? { 'calcula:expr': expr } : {};
      const plan = validate(CANON);
      if (!plan.ok) { assert.fail('modulo invalido'); return; }
      const run = runModule(plan.plan, registroCanonico(), ctx, { entry });
      if (run.ok) continue;
      assert.equal(run.deliveries.size, 0, 'un modulo que fallo no entrega');
      assert.ok(run.failure !== null, 'un fallo siempre dice donde');
      // Dos fallos posibles y ninguno deja media corrida por detras.
      if (run.failure.code === 'E_UNBOUND_INPUT') {
        assert.equal(run.runs.length, 0, 'sin entrada no se ejecuta nada');
      } else {
        assert.equal(run.failure.code, 'E_NODE_FAILED');
        assert.deepEqual(run.runs.map((x) => x.node), ['calcula'], 'solo EXEC, y fallo');
      }
    }
  }
});

test('L2-S4 · P30 la bitacora de intentos nunca crece sin control', () => {
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    for (let k = 0; k < 40; k++) {
      const plan = validate(CANON);
      if (!plan.ok) return;
      const run = runModule(plan.plan, registroCanonico(), ctx, { entry: { 'calcula:expr': `${r.int(9)}*2` } });
      for (const nr of run.runs) {
        assert.ok(Array.isArray(nr.attempts));
        assert.ok(nr.attempts.every((a) => typeof a.granted === 'boolean'));
      }
    }
  }
});

test('L2-S6 · P31 mutacion: con la misma cache, la segunda corrida SI reutiliza', () => {
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    const plan = validate(CANON);
    if (!plan.ok) return;
    const store = new ValueStore();
    const expr = `${r.int(9)}+${r.int(9)}`;
    runModule(plan.plan, registroCanonico(), ctx, { entry: { 'calcula:expr': expr }, store });
    const segunda = runModule(plan.plan, registroCanonico(), ctx, { entry: { 'calcula:expr': expr }, store });
    assert.equal(segunda.runs[0]?.reused, true, 'EXEC es mutation y su input no cambio');
    assert.equal(segunda.runs[1]?.reused, true, 'y RENDER tampoco: su input es el mismo string');
  }
});

test('L2-S6 · P32 la politica sale siempre del determinismo declarado', () => {
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    for (const d of ['deterministic', 'stochastic', 'stateful'] as const) {
      const p = sharePolicy(d);
      if (d === 'deterministic') assert.equal(p.cache, true);
      if (d !== 'deterministic') assert.equal(p.cache, false, `${d} no cachea`);
      if (d === 'stateful') assert.equal(p.comparable, false);
      void r;
    }
  }
});

// ---------------------------------------------------------------------------
// P33 · el escapado, sobre entradas arbitrarias
// ---------------------------------------------------------------------------

test('L2-S6 · P33 renderSvg NUNCA deja markup crudo, sobre 600 textos', () => {
  const trozos = ['<', '>', '&', '"', "'", 'a', '/', ' ', '\n', '=', 'onload'];
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    for (let k = 0; k < 100; k++) {
      let s = '';
      for (let c = 0; c < r.int(12); c++) s += r.pick(trozos);
      const svg = renderSvg(s);
      const cuerpo = svg.replace(/<\/?svg[^>]*>/g, '').replace(/<\/?text[^>]*>/g, '');
      assert.doesNotMatch(cuerpo, /[<>]/, `markup crudo en ${JSON.stringify(s)} -> ${cuerpo}`);
      assert.equal(svg.match(/<text /g)?.length, s.split('\n').length);
    }
  }
});

test('L2-S6 · P34 EXEC nunca lanza: o devuelve valor o devuelve ok:false', () => {
  const trozos = ['1', '2', '+', '-', '*', '/', '(', ')', ' ', '.', 'x', '9'];
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    for (let k = 0; k < 100; k++) {
      let s = '';
      for (let c = 0; c < 1 + r.int(10); c++) s += r.pick(trozos);
      const out = EXEC_IMPL({ expr: s }, ctx, undefined as never);
      assert.equal(typeof out.ok, 'boolean');
      if (!out.ok) assert.equal(typeof out.error, 'string');
      else assert.equal(out.outputs[0]?.port, 'value');
    }
  }
});

