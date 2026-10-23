import test from 'node:test';
import assert from 'node:assert/strict';

import type { Edge, ModuleDescriptor, ModuleNode, Port, ToolDescriptor } from '../src/contract.js';
import { validate, REJECT_CODES, type RejectCode } from '../src/graph.js';

// ---------------------------------------------------------------------------
// Biblioteca de herramientas de prueba
// ---------------------------------------------------------------------------

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

const EXEC = mk({
  id: 'exec',
  determinism: 'deterministic',
  inputs: [p('prompt', 'text')],
  outputs: [p('out', 'code')],
});

const LINT = mk({
  id: 'lint',
  determinism: 'deterministic',
  inputs: [p('src', 'code')],
  outputs: [p('code', 'code'), p('report', 'text')],
});

const RENDER = mk({
  id: 'render',
  determinism: 'deterministic',
  inputs: [p('src', 'code')],
  outputs: [p('html', 'text', true)],
});

const RESEARCH = mk({
  id: 'research',
  determinism: 'stochastic',
  tier: 'T1',
  effect: 'read',
  inputs: [p('q', 'text')],
  outputs: [p('notes', 'text')],
});

const STAMP = mk({
  id: 'stamp',
  determinism: 'deterministic',
  inputs: [p('t', 'code')],
  outputs: [p('out', 'code', true)],
});

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

/** Modulo valido de referencia: exec -> lint -> render + research. */
function validModule(): ModuleDescriptor {
  return mod(
    [node('a', EXEC), node('b', LINT), node('c', RENDER), node('d', RESEARCH)],
    [
      e('a', 'out', 'b', 'src'),
      e('b', 'code', 'c', 'src'),
      e('b', 'report', 'd', 'q'),
    ],
    ['c:html', 'd:notes'],
  );
}

function expectReject(m: ModuleDescriptor, code: RejectCode, detailContains?: string): void {
  const v = validate(m);
  assert.equal(v.ok, false, `se esperaba rechazo ${code}, se obtuvo ${v.ok ? 'ok' : v.code}`);
  if (v.ok) return;
  assert.equal(v.code, code, `codigo esperado ${code}, obtenido ${v.code} (${v.detail})`);
  assert.ok(REJECT_CODES.includes(v.code), `codigo fuera del union: ${v.code}`);
  if (detailContains !== undefined) {
    assert.ok(v.detail.includes(detailContains), `detalle "${v.detail}" no contiene "${detailContains}"`);
  }
  assert.ok(typeof v.checksRun === 'number' && v.checksRun > 0, 'checksRun debe contar verificaciones');
}

// ---------------------------------------------------------------------------
// Modulo valido
// ---------------------------------------------------------------------------

test('L0-T3 · el modulo de referencia es valido', () => {
  const v = validate(validModule());
  assert.equal(v.ok, true, v.ok ? '' : `${v.code}: ${v.detail}`);
});

test('L0-T3 · el plan compilado expone orden de ejecucion e integridad', () => {
  const v = validate(validModule());
  if (!v.ok) assert.fail('se esperaba ok');
  assert.deepEqual(v.plan.executionOrder, ['a', 'b', 'c', 'd']);
  assert.match(v.plan.integrity, /^[0-9a-f]{64}$/);
  assert.ok(v.plan.checksRun > 20, `checksRun=${v.plan.checksRun}`);
});

test('L0-T3 · la validacion es determinista: mismo modulo, mismo veredicto', () => {
  const m = validModule();
  const first = JSON.stringify(validate(m));
  for (let i = 0; i < 5; i++) assert.equal(JSON.stringify(validate(m)), first);
});

// ---------------------------------------------------------------------------
// R0 · nombres
// ---------------------------------------------------------------------------

test('L0-T3 R0 · un id de nodo con dos puntos es referencia invalida', () => {
  expectReject(mod([node('a:b', STAMP)], [], ['a:b:out']), 'E_BAD_REF');
});

test('L0-T3 R0 · un nombre de puerto con dos puntos es referencia invalida', () => {
  const bad = mk({ id: 'x', outputs: [p('out:roto', 'code', true)] });
  expectReject(mod([node('a', bad)], [], ['a:out:roto']), 'E_BAD_REF');
});

// ---------------------------------------------------------------------------
// R1 · duplicados
// ---------------------------------------------------------------------------

test('L0-T3 R1 · dos nodos con el mismo id se rechazan', () => {
  expectReject(mod([node('a', STAMP), node('a', STAMP)], [], ['a:out']), 'E_DUPLICATE_NODE', 'duplicado');
});

// ---------------------------------------------------------------------------
// R2 · extremos colgantes
// ---------------------------------------------------------------------------

test('L0-T3 R2 · arista desde nodo inexistente', () => {
  expectReject(
    mod([node('a', STAMP), node('b', LINT)], [e('fantasma', 'out', 'b', 'src')], ['a:out']),
    'E_DANGLING_NODE',
    'fantasma',
  );
});

test('L0-T3 R2 · arista hacia nodo inexistente', () => {
  expectReject(
    mod([node('a', EXEC), node('b', STAMP)], [e('a', 'out', 'fantasma', 'src')], ['b:out']),
    'E_DANGLING_NODE',
    'fantasma',
  );
});

// ---------------------------------------------------------------------------
// R3 · puertos
// ---------------------------------------------------------------------------

test('L0-T3 R3 · puerto de salida inexistente', () => {
  expectReject(
    mod([node('a', EXEC), node('b', LINT)], [e('a', 'fantasma', 'b', 'src')], ['b:code', 'b:report']),
    'E_PORT_NOT_FOUND',
  );
});

test('L0-T3 R3 · puerto de entrada inexistente', () => {
  expectReject(
    mod([node('a', EXEC), node('b', LINT)], [e('a', 'out', 'b', 'fantasma')], ['b:code', 'b:report']),
    'E_PORT_NOT_FOUND',
  );
});

// ---------------------------------------------------------------------------
// R4 · eje 1 debe coincidir
// ---------------------------------------------------------------------------

test('L0-T3 R4 · code no conecta a un puerto text', () => {
  expectReject(
    mod([node('a', EXEC), node('b', RESEARCH)], [e('a', 'out', 'b', 'q')], ['b:notes']),
    'E_AXIS_MISMATCH',
    'code no conecta a text',
  );
});

test('L0-T3 R4 · text si conecta a text', () => {
  const t = mk({ id: 'gen', inputs: [p('q', 'text')], outputs: [p('out', 'text')] });
  const v = validate(mod([node('a', t), node('b', RESEARCH)], [e('a', 'out', 'b', 'q')], ['a:out', 'b:notes']));
  // falla por R8/R9, no por R4: basta con que el codigo NO sea E_AXIS_MISMATCH
  if (!v.ok) assert.notEqual(v.code, 'E_AXIS_MISMATCH');
});

// ---------------------------------------------------------------------------
// R5 · determinismo
// ---------------------------------------------------------------------------

test('L0-T3 R5 · una tool determinista no puede consumir de una estocastica', () => {
  expectReject(
    mod([node('a', RESEARCH), node('b', mk({ id: 'j', inputs: [p('notes', 'text')], outputs: [p('out', 'code', true)] }) )],
      [e('a', 'notes', 'b', 'notes')],
      ['b:out'],
    ),
    'E_NONDETERMINISTIC_INPUT',
    'stochastic',
  );
});

test('L0-T3 R5 · una tool determinista si puede consumir de otra determinista', () => {
  const v = validate(mod([node('a', EXEC), node('b', STAMP)], [e('a', 'out', 'b', 't')], ['b:out']));
  assert.equal(v.ok, true, v.ok ? '' : `${v.code}: ${v.detail}`);
});

test('L0-T3 R5 · una tool estocastica si puede consumir de una determinista', () => {
  const v = validate(validModule());
  assert.equal(v.ok, true, v.ok ? '' : `${v.code}: ${v.detail}`);
});

// ---------------------------------------------------------------------------
// R6 · el artifact termina
// ---------------------------------------------------------------------------

test('L0-T3 R6 · un artifact no alimenta otro nodo', () => {
  expectReject(
    mod([node('a', STAMP), node('b', LINT)], [e('a', 'out', 'b', 'src')], ['b:code', 'b:report']),
    'E_ARTIFACT_NOT_TERMINAL',
    'no puede alimentar',
  );
});

test('L0-T3 R6 · el caso canonico: el artifact de render es terminal y no se compone', () => {
  const v = validate(validModule());
  assert.equal(v.ok, true);
});

// ---------------------------------------------------------------------------
// R7 · sinks
// ---------------------------------------------------------------------------

test('L0-T3 R7 · sink mal formado', () => {
  expectReject(mod([node('a', STAMP)], [], ['sin_dos_puntos']), 'E_SINK_NOT_FOUND');
});

test('L0-T3 R7 · sink sobre nodo inexistente', () => {
  expectReject(mod([node('a', STAMP)], [], ['fantasma:out']), 'E_SINK_NOT_FOUND');
});

test('L0-T3 R7 · sink sobre puerto inexistente', () => {
  expectReject(mod([node('a', STAMP)], [], ['a:fantasma']), 'E_SINK_NOT_FOUND');
});

test('L0-T3 R7 · sink que tiene arista saliente', () => {
  expectReject(
    mod([node('a', EXEC), node('b', STAMP)], [e('a', 'out', 'b', 't')], ['a:out', 'b:out']),
    'E_SINK_NOT_TERMINAL',
    'arista(s) saliente(s)',
  );
});

// ---------------------------------------------------------------------------
// R8 · salidas terminales sin declarar
// ---------------------------------------------------------------------------

test('L0-T3 R8 · una salida terminal no declarada como sink se rechaza', () => {
  expectReject(
    mod([node('a', STAMP), node('b', RENDER)], [], ['b:html']),
    'E_UNDECLARED_SINK',
    'a:out',
  );
});

test('L0-T3 R8 · declarar todas las terminales corrige el rechazo', () => {
  const v = validate(mod([node('a', STAMP), node('b', RENDER)], [], ['a:out', 'b:html']));
  assert.equal(v.ok, true, v.ok ? '' : `${v.code}: ${v.detail}`);
});

// ---------------------------------------------------------------------------
// R9 · el modulo entrega algo
// ---------------------------------------------------------------------------

test('L0-T3 R9 · un modulo sin ningun artifact se rechaza', () => {
  const texto = mk({ id: 'txt', inputs: [p('q', 'text')], outputs: [p('out', 'text')] });
  expectReject(mod([node('a', texto)], [], ['a:out']), 'E_NO_ARTIFACT');
});

test('L0-T3 R9 · un unico artifact como sink es suficiente', () => {
  const v = validate(mod([node('a', RENDER)], [], ['a:html']));
  assert.equal(v.ok, true, v.ok ? '' : `${v.code}: ${v.detail}`);
});

// ---------------------------------------------------------------------------
// R11 · tier y efecto
// ---------------------------------------------------------------------------

test('L0-T3 R11 · T0 con efecto de red es contrato invalido', () => {
  const naughty = mk({ id: 'net', tier: 'T0', effect: 'read', outputs: [p('out', 'text', true)] });
  expectReject(mod([node('a', naughty)], [], ['a:out']), 'E_TIER_EFFECT');
});

test('L0-T3 R11 · T0 sin efecto es valido', () => {
  const pure = mk({ id: 'pure', tier: 'T0', effect: 'none', outputs: [p('out', 'text', true)] });
  const v = validate(mod([node('a', pure)], [], ['a:out']));
  assert.equal(v.ok, true, v.ok ? '' : `${v.code}: ${v.detail}`);
});

// ---------------------------------------------------------------------------
// Orden de reglas
// ---------------------------------------------------------------------------

test('L0-T3 · con varios defectos gana el de la regla mas temprano', () => {
  // R0 (nombre malo) y R1 (duplicado) y R2 (arista colgante) a la vez.
  const roto = mod(
    [node('a:b', STAMP), node('a:b', STAMP), node('z', LINT)],
    [e('fantasma', 'out', 'z', 'src')],
    ['z:code', 'z:report'],
  );
  const v = validate(roto);
  if (v.ok) assert.fail('se esperaba rechazo');
  assert.equal(v.code, 'E_BAD_REF');
});

test('L0-T3 · ningun rechazo escapa del union de codigos', () => {
  const casos: ModuleDescriptor[] = [
    mod([], [], []),
    mod([node('a', STAMP)], [], []),
    mod([node('a', STAMP)], [e('a', 'x', 'a', 'y')], ['a:out']),
    mod([node('a', STAMP), node('b', STAMP)], [], ['a:out', 'b:out']),
    mod([node('a', EXEC), node('b', RESEARCH)], [e('a', 'out', 'b', 'q')], ['a:out']),
  ];
  for (const c of casos) {
    const v = validate(c);
    if (!v.ok) assert.ok(REJECT_CODES.includes(v.code), `fuera del union: ${v.code}`);
  }
});
