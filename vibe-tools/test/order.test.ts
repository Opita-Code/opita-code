import test from 'node:test';
import assert from 'node:assert/strict';

import type { Edge, ModuleDescriptor, ModuleNode, Port, ToolDescriptor } from '../src/contract.js';
import { validate, REJECT_CODES, type RejectCode } from '../src/graph.js';

/**
 * R10 — orden topologico.
 *
 * El.test de L0 que afirma `executionOrder === ['a','b','c','d']` NO prueba nada
 * de esto: en ese modulo el orden de declaracion ya era topologico, asi que
 * devolver `mod.nodes.map(...)` — que es lo que hacia L0 — daba el mismo
 * resultado. Estos casos parten el orden de declaracion del orden topologico a
 * proposito, que es la unica forma de que un test tenga dientes aqui.
 */

const p = (name: string, produces: Port['produces'], artifact = false): Port => ({
  name,
  produces,
  artifact,
});

const mk = (over: Partial<ToolDescriptor>): ToolDescriptor => ({
  id: 'tool',
  version: '0.1.0',
  author: 'opita',
  title: 't',
  determinism: 'deterministic',
  tier: 'T0',
  effect: 'none',
  inputs: [],
  outputs: [],
  ...over,
});

/** Tool generica: toma texto, devuelve texto. Reutilizable en cualquier nodo. */
const GEN = mk({
  id: 'gen',
  inputs: [p('in', 'text')],
  outputs: [p('out', 'text')],
});

/** La misma, pero su salida es el entregable del modulo. Va al final. */
const GEN_END = mk({ ...GEN, id: 'genend', outputs: [p('out', 'text', true)] });

const e = (from: string, fromPort: string, to: string, toPort: string): Edge => ({
  from,
  fromPort,
  to,
  toPort,
});

const node = (n: string, tool: ToolDescriptor): ModuleNode => ({ node: n, tool });

function mod(nodes: ModuleNode[], edges: Edge[], sinks: string[]): ModuleDescriptor {
  return { id: 'm', version: '0.1.0', author: 'opita', title: 'mod', nodes, edges, sinks };
}

/**
 * Cadena de `n` nodos donde cada uno alimenta al siguiente, DECLARADA AL REVES.
 * El ultimo nodo entrega el artifact, asi que el modulo pasa R0..R9 y lo unico
 * que puede rechazarlo es R10.
 */
function reversedChain(n: number): ModuleDescriptor {
  const names: string[] = Array.from({ length: n }, (_, i) => `n${i}`);
  const last = names[names.length - 1] as string;
  const nodes = names.map((name, i) => node(name, i === n - 1 ? GEN_END : GEN));
  const edges: Edge[] = [];
  for (let i = 0; i + 1 < names.length; i++) {
    edges.push(e(names[i] as string, 'out', names[i + 1] as string, 'in'));
  }
  // Declaration order is the REVERSE of the dependency chain.
  return mod(nodes.reverse(), edges, [`${last}:out`]);
}

function orderOf(m: ModuleDescriptor): readonly string[] {
  const v = validate(m);
  if (!v.ok) assert.fail(`se esperaba ok, se obtuvo ${v.code}: ${v.detail}`);
  return v.plan.executionOrder;
}

function expectReject(m: ModuleDescriptor, code: RejectCode, detailContains?: string): string {
  const v = validate(m);
  assert.equal(v.ok, false, `se esperaba rechazo ${code}, se obtuvo ${v.ok ? 'ok' : v.code}`);
  if (v.ok) return '';
  assert.equal(v.code, code, `codigo esperado ${code}, obtenido ${v.code} (${v.detail})`);
  assert.ok(REJECT_CODES.includes(v.code), `codigo fuera del union: ${v.code}`);
  if (detailContains !== undefined) {
    assert.ok(v.detail.includes(detailContains), `detalle "${v.detail}" no contiene "${detailContains}"`);
  }
  return v.detail;
}

// ---------------------------------------------------------------------------
// El orden es topologico, no de declaracion
// ---------------------------------------------------------------------------

test('L2-S1 · el orden topologico NO es el orden de declaracion', () => {
  // Declarado n2, n1, n0. La cadena real es n0 -> n1 -> n2.
  const m = reversedChain(3);
  assert.deepEqual(m.nodes.map((n) => n.node), ['n2', 'n1', 'n0'], 'precondicion del test');
  assert.deepEqual(orderOf(m), ['n0', 'n1', 'n2']);
});

test('L2-S1 · una cadena larga declarada al reves se ordena completa', () => {
  assert.deepEqual(orderOf(reversedChain(6)), ['n0', 'n1', 'n2', 'n3', 'n4', 'n5']);
});

test('L2-S1 · el orden es una permutacion: ningún nodo se pierde ni se repite', () => {
  const m = reversedChain(5);
  const order = orderOf(m);
  assert.equal(new Set(order).size, order.length, 'no debe haber repetidos');
  assert.deepEqual([...order].sort(), m.nodes.map((n) => n.node).sort());
});

test('L2-S1 · todo nodo va despues de TODOS los que lo alimentan', () => {
  // Rombo: a -> b, a -> c, b -> d, c -> d. El unico invariante que importa.
  const m = mod(
    [node('a', GEN), node('b', GEN), node('c', GEN), node('d', GEN_END)],
    [e('a', 'out', 'b', 'in'), e('a', 'out', 'c', 'in'), e('b', 'out', 'd', 'in'), e('c', 'out', 'd', 'in')],
    ['d:out'],
  );
  const order = orderOf(m);
  const at = (name: string): number => order.indexOf(name);
  assert.ok(at('a') < at('b') && at('a') < at('c'), 'a antes de sus dos');
  assert.ok(at('b') < at('d') && at('c') < at('d'), 'd despues de los dos que lo alimentan');
});

// ---------------------------------------------------------------------------
// El desempate
// ---------------------------------------------------------------------------

test('L2-S1 · entre nodos listos gana el orden de DECLARACION, no el nombre', () => {
  // zzz y aaa no tienen relacion. Si el desempate fuera alfabetico, ganaria aaa.
  // R8 exige declarar TODO puerto terminal, asi que los dos son sinks.
  const m = mod([node('zzz', GEN), node('aaa', GEN_END)], [], ['zzz:out', 'aaa:out']);
  assert.deepEqual(orderOf(m), ['zzz', 'aaa'], 'debe seguir la declaracion');
});

test('L2-S1 · el mismo grafo declarado al reves da el reves: el desempate es el descriptor', () => {
  const m = mod([node('aaa', GEN), node('zzz', GEN_END)], [], ['aaa:out', 'zzz:out']);
  assert.deepEqual(orderOf(m), ['aaa', 'zzz']);
});

test('L2-S1 · el desempate no sacrifica la topologia: los listos se intercalan bien', () => {
  // a -> b. c es independiente. Declaration [a, b, c]: a listo, c listo, gana a.
  const m = mod(
    [node('a', GEN), node('b', GEN), node('c', GEN_END)],
    [e('a', 'out', 'b', 'in')],
    ['b:out', 'c:out'],
  );
  assert.deepEqual(orderOf(m), ['a', 'b', 'c']);
});

test('L2-S1 · N nodos independentes salen en orden de declaracion', () => {
  const names = ['e', 'd', 'c', 'b', 'a'];
  const nodes = names.map((n, i) => node(n, i === names.length - 1 ? GEN_END : GEN));
  const m = mod(nodes, [], names.map((n) => `${n}:out`));
  assert.deepEqual(orderOf(m), names);
});

// ---------------------------------------------------------------------------
// Ciclos
// ---------------------------------------------------------------------------

test('L2-S1 · un ciclo se rechaza con E_CYCLE, no con el codigo de terminal', () => {
  // a -> b -> a, y a -> c para que exista un terminal y el modulo sea valido
  // por lo demas. Sin esa salida, R7d cortaria primero con otro codigo y el
  // autor nunca veria que lo que tiene es un ciclo.
  const m = mod(
    [node('a', GEN), node('b', GEN), node('c', GEN_END)],
    [e('a', 'out', 'b', 'in'), e('b', 'out', 'a', 'in'), e('a', 'out', 'c', 'in')],
    ['c:out'],
  );
  const detail = expectReject(m, 'E_CYCLE');
  assert.ok(detail.includes('a') && detail.includes('b'), `debe nombrar el ciclo: ${detail}`);
});

test('L2-S1 · un ciclo puro se reporta como E_CYCLE y no como SINK_NOT_TERMINAL', () => {
  // Sin ninguna salida, a y b son mutuamente inalcanzables desde un terminal.
  const m = mod(
    [node('a', GEN), node('b', GEN)],
    [e('a', 'out', 'b', 'in'), e('b', 'out', 'a', 'in')],
    ['a:out'],
  );
  const detail = expectReject(m, 'E_CYCLE');
  assert.ok(!detail.includes('SINK'), `no debe parecer un problema de sink: ${detail}`);
});

test('L2-S1 · un lazo sobre uno mismo es un ciclo', () => {
  const m = mod([node('a', GEN)], [e('a', 'out', 'a', 'in')], ['a:out']);
  expectReject(m, 'E_CYCLE', 'a');
});

test('L2-S1 · el detalle dice que incluye a los que DEPENDEN del ciclo, y los incluye', () => {
  // a <-> b, y c se alimenta de b. c NO esta en el ciclo, pero tampoco se
  // puede ordenar. El detalle lo nombra y ADMITE que no es el ciclo, porque un
  // autor buscando el nodo culpable debe encontrarlos a todos.
  const m = mod(
    [node('a', GEN), node('b', GEN), node('c', GEN_END)],
    [e('a', 'out', 'b', 'in'), e('b', 'out', 'a', 'in'), e('b', 'out', 'c', 'in')],
    ['c:out'],
  );
  const detail = expectReject(m, 'E_CYCLE');
  assert.ok(detail.includes('a') && detail.includes('b') && detail.includes('c'), `debe nombrar los tres: ${detail}`);
  assert.ok(
    detail.includes('dependen de uno'),
    `debe admitir que el conjunto incluye dependientes: ${detail}`,
  );
});

test('L2-S1 · el nodo no ordenable va en el campo `at`', () => {
  const m = mod(
    [node('a', GEN), node('b', GEN), node('c', GEN_END)],
    [e('a', 'out', 'b', 'in'), e('b', 'out', 'a', 'in'), e('a', 'out', 'c', 'in')],
    ['c:out'],
  );
  const v = validate(m);
  assert.equal(v.ok, false);
  if (v.ok) return;
  assert.equal(v.at, 'a', 'at debe ser el primer no ordenable en orden de declaracion');
});

test('L2-S1 · el detalle dice cuantos de cuantos nodos se pudieron ordenar', () => {
  const m = mod(
    [node('a', GEN), node('b', GEN), node('c', GEN_END)],
    [e('a', 'out', 'b', 'in'), e('b', 'out', 'a', 'in'), e('a', 'out', 'c', 'in')],
    ['c:out'],
  );
  expectReject(m, 'E_CYCLE', '0 de 3');
});

// ---------------------------------------------------------------------------
// Predecesores distintos
// ---------------------------------------------------------------------------

test('L2-S1 · dos puertos del mismo upstream cuentan como UN predecesor', () => {
  // Si se contasen ARISTAS en vez de predecesores, `z` tendria grado de entrada 2
  // y nunca llegaria a estar listo: el modulo valido se rechazaria con E_CYCLE.
  const z = mk({ id: 'z', inputs: [p('i1', 'text'), p('i2', 'text')], outputs: [p('out', 'text', true)] });
  const m = mod([node('a', GEN), node('z', z)], [e('a', 'out', 'z', 'i1'), e('a', 'out', 'z', 'i2')], ['z:out']);
  assert.deepEqual(orderOf(m), ['a', 'z']);
});

test('L2-S1 · un modulo sin aristas es un conjunto de nodos y se ordena', () => {
  const m = mod([node('solo', GEN_END)], [], ['solo:out']);
  assert.deepEqual(orderOf(m), ['solo']);
});

test('L2-S1 · E_CYCLE esta en el union y en la lista de codigos', () => {
  assert.ok(REJECT_CODES.includes('E_CYCLE'), 'E_CYCLE debe estar en REJECT_CODES');
  assert.equal(new Set(REJECT_CODES).size, REJECT_CODES.length, 'el union no debe tener repetidos');
});

test('L2-S1 · el orden topologico es determinista: 20 corridas, mismo plan', () => {
  const m = reversedChain(5);
  const first = JSON.stringify(orderOf(m));
  for (let i = 0; i < 20; i++) assert.equal(JSON.stringify(orderOf(m)), first);
});

test('L2-S1 · R10 cuenta sus comprobaciones: el orden es trabajo, no un map', () => {
  const tres = validate(reversedChain(3));
  const seis = validate(reversedChain(6));
  assert.ok(tres.ok && seis.ok);
  if (!tres.ok || !seis.ok) return;
  assert.ok(
    seis.plan.checksRun > tres.plan.checksRun,
    `mas nodos deben ser mas comprobaciones: ${tres.plan.checksRun} vs ${seis.plan.checksRun}`,
  );
});