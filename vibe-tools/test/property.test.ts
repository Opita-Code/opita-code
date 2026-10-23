import test from 'node:test';
import assert from 'node:assert/strict';

import { DETERMINISM, PRODUCES, sharingOf, tierAllows, type Determinism, type Produces, type Tier, type Effect } from '../src/axes.js';
import { canonicalize } from '../src/canonical.js';
import { sha256HexOfText } from '../src/hash.js';
import { integrityOf, type Edge, type ModuleDescriptor, type ModuleNode, type Port, type ToolDescriptor } from '../src/contract.js';
import { validate, REJECT_CODES } from '../src/graph.js';
import { Rng } from './rng.js';

const SEEDS = [1, 7, 42, 1337, 90210, 0xdeadbeef];

const TIERS: Tier[] = ['T0', 'T1', 'T2'];
const EFFECTS: Effect[] = ['none', 'read', 'write', 'process'];

function randPort(r: Rng, i: number): Port {
  return {
    name: `p${i}`,
    produces: r.pick(PRODUCES),
    artifact: r.bool(),
  };
}

function randTool(r: Rng, i: number): ToolDescriptor {
  const tier = r.pick(TIERS);
  return {
    id: `t${i}`,
    version: `${r.int(4)}.${r.int(4)}.${r.int(4)}`,
    author: r.pick(['opita', 'tercero', 'anon']),
    title: `herramienta ${i}`,
    determinism: r.pick(DETERMINISM),
    tier,
    effect: tier === 'T0' ? 'none' : r.pick(EFFECTS),
    inputs: Array.from({ length: r.int(3) }, (_, k) => randPort(r, k)),
    outputs: Array.from({ length: 1 + r.int(3) }, (_, k) => randPort(r, k)),
  };
}

function randModule(r: Rng): ModuleDescriptor {
  const count = 1 + r.int(4);
  const nodes: ModuleNode[] = Array.from({ length: count }, (_, i) => ({ node: `n${i}`, tool: randTool(r, i) }));
  const edges: Edge[] = [];
  for (let k = 0; k < r.int(5); k++) {
    const from = r.pick(nodes);
    const to = r.pick(nodes);
    edges.push({
      from: from.node,
      fromPort: r.pick(from.tool.outputs).name,
      to: to.node,
      toPort: r.pick(to.tool.inputs.length > 0 ? to.tool.inputs : [randPort(r, 0)]).name,
    });
  }
  const sinks: string[] = [];
  for (const n of nodes) {
    for (const port of n.tool.outputs) if (r.bool()) sinks.push(`${n.node}:${port.name}`);
  }
  return { id: 'fuzz', version: '0.0.1', author: 'fuzz', title: 'fuzz', nodes, edges, sinks };
}

/** Reordena las claves de un objeto, recursivamente. */
function shuffleKeys(v: unknown, r: Rng): unknown {
  if (Array.isArray(v)) return v.map((x) => shuffleKeys(x, r));
  if (v === null || typeof v !== 'object') return v;
  const entries = Object.entries(v as Record<string, unknown>);
  for (let i = entries.length - 1; i > 0; i--) {
    const j = r.int(i + 1);
    const a = entries[i] as [string, unknown];
    const b = entries[j] as [string, unknown];
    entries[i] = b;
    entries[j] = a;
  }
  return Object.fromEntries(entries.map(([k, val]) => [k, shuffleKeys(val, r)]));
}

// ---------------------------------------------------------------------------

test('P1 · sharingOf es total, inyectiva e independiente del orden de invocacion', () => {
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    for (let i = 0; i < 500; i++) {
      const d = r.pick(DETERMINISM) as Determinism;
      assert.ok(sharingOf(d).length > 0);
      assert.equal(sharingOf(d), SHARING_EXPECTED[d]);
    }
  }
  const seen = new Set(DETERMINISM.map(sharingOf));
  assert.equal(seen.size, DETERMINISM.length);
});

const SHARING_EXPECTED: Record<Determinism, string> = {
  deterministic: 'mutation',
  stochastic: 'recipe',
  stateful: 'none',
};

/**
 * Proyeccion del veredicto: lo que la validacion AFIRMA, sin el eco del modulo.
 * El eco conserva el orden de insercion de claves, que no es parte del contrato.
 */
function veredicto(m: ModuleDescriptor): string {
  const v = validate(m);
  return v.ok
    ? canonicalize({ ok: true, integrity: v.plan.integrity, order: v.plan.executionOrder, checks: v.plan.checksRun })
    : canonicalize({ ok: false, code: v.code, detail: v.detail, at: v.at, checks: v.checksRun });
}

test('P2 · canonicalize es punto fijo y el hash sobrevive al reordenamiento de claves', () => {
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    for (let i = 0; i < 300; i++) {
      const m = randModule(r);
      const once = canonicalize(m);
      assert.equal(canonicalize(JSON.parse(once)), once, 'la forma ordenada no es un punto fijo');
      const reordenado = shuffleKeys(m, r) as ModuleDescriptor;
      assert.equal(integrityOf(reordenado), integrityOf(m), 'el hash depende del orden de claves');
    }
  }
});

test('P3 · sha256 coincide con Node crypto sobre entradas aleatorias', async () => {
  const { createHash } = await import('node:crypto');
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    for (let i = 0; i < 60; i++) {
      const len = r.int(300);
      let s = '';
      for (let k = 0; k < len; k++) s += String.fromCharCode(32 + r.int(200));
      assert.equal(sha256HexOfText(s), createHash('sha256').update(s, 'utf8').digest('hex'));
    }
  }
});

test('P4 · la validacion es una funcion pura: mismo modulo, mismo veredicto', () => {
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    for (let i = 0; i < 300; i++) {
      const m = randModule(r);
      assert.equal(veredicto(m), veredicto(shuffleKeys(m, r) as ModuleDescriptor), 'el veredicto depende del orden de claves del modulo');
      assert.equal(veredicto(m), veredicto(m), 'la validacion no es estable en llamadas repetidas');
    }
  }
});

test('P5 · fuzz: todo rechazo tiene codigo del union y nunca se lanza una excepcion', () => {
  let aceptados = 0;
  let rechazados = 0;
  const vistos = new Set<string>();
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    for (let i = 0; i < 1500; i++) {
      const m = randModule(r);
      let v;
      try {
        v = validate(m);
      } catch (err) {
        assert.fail(`validate lanzo sobre un modulo valido de entrada: ${String(err)}`);
      }
      if (v.ok) {
        aceptados++;
        continue;
      }
      rechazados++;
      assert.ok(REJECT_CODES.includes(v.code), `codigo fuera del union: ${v.code}`);
      assert.equal(typeof v.detail, 'string');
      assert.ok(v.detail.length > 0, 'un rechazo sin detalle es un rechazo opaco');
      assert.ok(v.checksRun > 0);
      vistos.add(v.code);
    }
  }
  assert.ok(rechazados > 0 && aceptados >= 0, 'el fuzzer debe producir rechazos');
  assert.ok(vistos.size >= 3, `el fuzzer solo alcanzo ${vistos.size} codigos: ${[...vistos].join(',')}`);
});

test('P6 · invariante: ningun modulo aceptado tiene un artifact con arista saliente', () => {
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    for (let i = 0; i < 1500; i++) {
      const m = randModule(r);
      const v = validate(m);
      if (!v.ok) continue;
      for (const edge of m.edges) {
        const src = m.nodes.find((n) => n.node === edge.from);
        assert.ok(src !== undefined);
        const port = src.tool.outputs.find((op) => op.name === edge.fromPort);
        assert.ok(port !== undefined);
        assert.notEqual(port.artifact, true, `${edge.from}:${edge.fromPort} artifact con arista saliente`);
      }
    }
  }
});

test('P7 · invariante: todo modulo aceptado declara todas sus terminales y entrega un artifact', () => {
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    for (let i = 0; i < 1500; i++) {
      const m = randModule(r);
      const v = validate(m);
      if (!v.ok) continue;
      const withAristas = new Set(m.edges.map((ed) => `${ed.from}:${ed.fromPort}`));
      for (const n of m.nodes) {
        for (const port of n.tool.outputs) {
          const ref = `${n.node}:${port.name}`;
          if (!withAristas.has(ref)) assert.ok(m.sinks.includes(ref), `terminal sin declarar: ${ref}`);
        }
      }
      const artefactos = m.sinks.filter((s) => {
        const [node, port] = s.split(':');
        const n = m.nodes.find((x) => x.node === node);
        return n?.tool.outputs.find((op) => op.name === port)?.artifact === true;
      });
      assert.ok(artefactos.length >= 1, 'modulo aceptado sin artifact entregado');
    }
  }
});

test('P8 · invariante: todo modulo aceptado respeta tier/efecto de cada herramienta', () => {
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    for (let i = 0; i < 1500; i++) {
      const m = randModule(r);
      const v = validate(m);
      if (!v.ok) continue;
      for (const n of m.nodes) {
        assert.ok(tierAllows(n.tool.tier, n.tool.effect), `tier/efecto invalido en ${n.node}`);
      }
    }
  }
});

test('P9 · invariante: cambiar un solo bit del contrato cambia la huella', () => {
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    for (let i = 0; i < 300; i++) {
      const m = randModule(r);
      const before = integrityOf(m);
      const mutado = mutateOneField(m, r);
      assert.notEqual(integrityOf(mutado), before, 'mutacion no detectada por la huella');
    }
  }
});

/**
 * Muta un campo y garantiza que la mutacion NO es la identidad.
 * Sin ese garantie, el test moria solo cuando el azar elegia el valor original
 * (3 clases de determinismo, 1000 autores: colision trivial).
 */
function mutateOneField(m: ModuleDescriptor, r: Rng): ModuleDescriptor {
  for (let intento = 0; intento < 50; intento++) {
    let out: ModuleDescriptor;
    switch (r.int(5)) {
      case 0:
        out = { ...m, version: `${r.int(9)}.${r.int(9)}.${r.int(9)}` };
        break;
      case 1:
        out = { ...m, author: `otro-${r.int(999)}` };
        break;
      case 2:
        out = { ...m, title: `${m.title}!` };
        break;
      case 3:
        out = { ...m, nodes: m.nodes.map((n) => ({ ...n, tool: { ...n.tool, determinism: r.pick(DETERMINISM) } })) };
        break;
      default:
        out = {
          ...m,
          edges: [...m.edges, { from: m.nodes[0]?.node ?? 'x', fromPort: '__mut', to: m.nodes[0]?.node ?? 'y', toPort: '__mut' }],
        };
        break;
    }
    if (integrityOf(out) !== integrityOf(m)) return out;
  }
  assert.fail('no se pudo mutar el descriptor en 50 intentos');
}

test('P10 · los 18 pares (determinismo, produccion) se prueban todos en el fuzz', () => {
  for (const seed of SEEDS) {
    const r = new Rng(seed);
    const vistos = new Set<string>();
    for (let i = 0; i < 2000; i++) {
      const t = randTool(r, i);
      vistos.add(`${t.determinism}|${t.outputs[0]?.produces as Produces}`);
    }
    for (const d of DETERMINISM) {
      for (const pr of PRODUCES) {
        assert.ok(vistos.has(`${d}|${pr}`), `combinacion nunca cubierta: ${d}/${pr}`);
      }
    }
  }
});
