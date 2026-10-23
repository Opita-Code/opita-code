import test from 'node:test';
import assert from 'node:assert/strict';

import type { ModuleDescriptor } from '../src/contract.js';
import { validate } from '../src/graph.js';
import { emptyContext } from '../src/context.js';
import { ToolRegistry } from '../src/tool.js';
import { HOSTS } from '../src/sandbox/tier.js';
import { runModule } from '../src/module/run.js';
import { ask, deliveriesFor } from '../src/module/harness.js';
import { ValueStore } from '../src/module/share.js';
import { CANONICO_COMPLETO, ENTRADA_COMPLETO } from '../src/canonical/completo.js';
import { CANONICO_RECETA, ENTRADA_RECETA } from '../src/canonical/receta.js';
import { CANONICO_INVESTIGACION, ENTRADA_INVESTIGACION } from '../src/canonical/investigacion.js';
import { baseRegistry, EXEC_DESCRIPTOR, EXEC_IMPL, RENDER_DESCRIPTOR } from '../src/tools/index.js';

const ctx = emptyContext('INV-1');

function planOf(m: ModuleDescriptor) {
  const v = validate(m);
  if (!v.ok) assert.fail(`modulo invalido: ${v.code} ${v.detail}`);
  return v.plan;
}

const completo = () => planOf(CANONICO_COMPLETO);
const receta = () => planOf(CANONICO_RECETA);
const investigacion = () => planOf(CANONICO_INVESTIGACION);

// ---------------------------------------------------------------------------
// CASO CANONICO 1 — el que completa: EXEC -> RENDER, ambos deterministas
// ---------------------------------------------------------------------------

test('L2-S10 · el caso canonico se valida y compila dentro de vibe-tools', () => {
  assert.deepEqual(completo().executionOrder, ['calcula', 'dibuja']);
});

test('L2-S10 · el caso canonico declara los nodos al reves, a proposito', () => {
  // Si executionOrder volviera al orden de declaracion, el grafo se ejecutaria al
  // reves y el artifact saldria vacio. El caso canonico DEBERIA fallar asi.
  assert.deepEqual(CANONICO_COMPLETO.nodes.map((n) => n.node), ['dibuja', 'calcula']);
});

test('L2-S10 · el caso canonico CORRE entero y entrega un SVG', () => {
  const run = runModule(completo(), baseRegistry(), ctx, { entry: ENTRADA_COMPLETO });
  assert.equal(run.ok, true, run.failure?.detail ?? '');
  assert.deepEqual(run.runs.map((r) => r.node), ['calcula', 'dibuja']);
  const svg = run.deliveries.get('dibuja:svg');
  assert.ok(typeof svg === 'string' && svg.startsWith('<svg'), `no es un SVG: ${String(svg)}`);
  assert.ok(svg.includes('>42</text>'), `el SVG deberia contener el 42 de 6*7: ${String(svg)}`);
});

test('L2-S10 · distintas expresiones dan distintos artifacts', () => {
  const a = runModule(completo(), baseRegistry(), ctx, { entry: ENTRADA_COMPLETO });
  const b = runModule(completo(), baseRegistry(), ctx, {
    entry: { 'calcula:expr': '1+1' },
  });
  assert.notEqual(a.deliveries.get('dibuja:svg'), b.deliveries.get('dibuja:svg'));
  assert.ok(String(b.deliveries.get('dibuja:svg')).includes('>2</text>'));
});

test('L2-S10 · los dos nodos corrieron sin pedir ninguna capacidad', () => {
  const run = runModule(completo(), baseRegistry(), ctx, { entry: ENTRADA_COMPLETO });
  for (const r of run.runs) {
    assert.equal(r.attempts.length, 0, `${r.node} intento I/O: ${JSON.stringify(r.attempts)}`);
    assert.equal(r.ok, true);
  }
});

test('L2-S10 · el caso canonico es determinista: 5 corridas, mismo artifact', () => {
  const primero = runModule(completo(), baseRegistry(), ctx, { entry: ENTRADA_COMPLETO });
  for (let i = 0; i < 5; i++) {
    const otra = runModule(completo(), baseRegistry(), ctx, { entry: ENTRADA_COMPLETO });
    assert.equal(otra.deliveries.get('dibuja:svg'), primero.deliveries.get('dibuja:svg'));
  }
});

// ---------------------------------------------------------------------------
// CASO CANONICO 2 — una receta
// ---------------------------------------------------------------------------

test('L2-S10 · el caso de receta valida, corre y entrega texto', () => {
  const run = runModule(receta(), baseRegistry(), ctx, { entry: ENTRADA_RECETA });
  assert.equal(run.ok, true, run.failure?.detail ?? '');
  const texto = run.deliveries.get('redacta:draft');
  assert.ok(typeof texto === 'string' && texto.length > 0);
  assert.ok(texto.includes('la memoria como nucleo'), `debe mencionar el tema: ${String(texto)}`);
});

test('L2-S6 · una receta NO se reusa: dos corridas, dos ejecuciones', () => {
  const store = new ValueStore();
  const a = runModule(receta(), baseRegistry(), ctx, { entry: ENTRADA_RECETA, store });
  const b = runModule(receta(), baseRegistry(), ctx, { entry: ENTRADA_RECETA, store });
  assert.equal(a.runs[0]?.kind, 'recipe');
  assert.equal(b.runs[0]?.kind, 'recipe');
  assert.equal(a.runs[0]?.reused, false);
  assert.equal(b.runs[0]?.reused, false, 'una receta se ejecuta siempre, aunque hoy sea pura');
});

test('L2-S6 · la receta da lo MISMO con el mismo nonce: la variabilidad esta en el input', () => {
  const a = runModule(receta(), baseRegistry(), ctx, { entry: ENTRADA_RECETA });
  const b = runModule(receta(), baseRegistry(), ctx, { entry: ENTRADA_RECETA });
  assert.equal(a.deliveries.get('redacta:draft'), b.deliveries.get('redacta:draft'));
});

test('L2-S6 · nonces distintos dan borradores distintos', () => {
  const vistos = new Set<string>();
  for (let n = 0; n < 20; n++) {
    const run = runModule(receta(), baseRegistry(), ctx, {
      entry: { ...ENTRADA_RECETA, 'redacta:nonce': `n${n}` },
    });
    vistos.add(String(run.deliveries.get('redacta:draft')));
  }
  assert.ok(vistos.size > 1, `20 nonces deberian dar mas de un borrador: ${vistos.size}`);
});

// ---------------------------------------------------------------------------
// CASO CANONICO 3 — el que NO completa, y por que ese es el resultado correcto
// ---------------------------------------------------------------------------

test('L2-S10 · con el host de cliente, el caso dice E_HOST_UNSUPPORTED', () => {
  const run = runModule(investigacion(), baseRegistry(), ctx, { entry: ENTRADA_INVESTIGACION });
  assert.equal(run.ok, false);
  assert.equal(run.failure?.node, 'busca');
  assert.equal(run.failure?.code, 'E_NODE_FAILED');
  assert.equal(run.runs.at(-1)?.code, 'E_HOST_UNSUPPORTED');
});

test('L2-S10 · con un host que SOSTIENE T1, el motivo es unimplemented y no denied', () => {
  const run = runModule(investigacion(), baseRegistry(), ctx, {
    entry: ENTRADA_INVESTIGACION,
    env: HOSTS.clientFull,
  });
  assert.equal(run.ok, false);
  const ultimo = run.runs.at(-1);
  assert.equal(ultimo?.node, 'busca');
  assert.equal(ultimo?.code, 'E_TOOL_ERROR');
  assert.match(String(ultimo?.detail), /unimplemented/, `debe decir unimplemented: ${ultimo?.detail}`);
  assert.doesNotMatch(String(ultimo?.detail), /^denied/, 'denied seria mentir sobre por que falla');
});

test('L2-S10 · el intento de red quedo REGISTRADO y concedido', () => {
  const run = runModule(investigacion(), baseRegistry(), ctx, {
    entry: ENTRADA_INVESTIGACION,
    env: HOSTS.clientFull,
  });
  const intentos = run.runs.at(-1)?.attempts ?? [];
  assert.equal(intentos.length, 1, `debe haber un intento: ${JSON.stringify(intentos)}`);
  assert.equal(intentos[0]?.capability, 'net');
  assert.equal(intentos[0]?.granted, true, 'el sandbox CONCEDIO net: lo que falta es el transporte');
});

test('L2-S10 · denegados siguen siendo 0: fallar no es intentar salir', () => {
  const run = runModule(investigacion(), baseRegistry(), ctx, {
    entry: ENTRADA_INVESTIGACION,
    env: HOSTS.clientFull,
  });
  const total = run.runs.reduce((n, r) => n + r.attempts.filter((a) => !a.granted).length, 0);
  assert.equal(total, 0, 'no hubo exfiltracion; hubo un cable que falta');
});

test('L2-S10 · la corrida parcial queda registrada: EXEC si corrio, y eso se ve', () => {
  const run = runModule(investigacion(), baseRegistry(), ctx, {
    entry: ENTRADA_INVESTIGACION,
    env: HOSTS.clientFull,
  });
  assert.deepEqual(run.runs.map((r) => r.node), ['calcula', 'busca']);
  assert.equal(run.runs[0]?.ok, true);
  assert.equal(run.runs[0]?.outputs[0]?.value, '42', 'EXEC corrio antes de que el grafo se detuviera');
});

test('L2-S10 · un modulo que fallo NO entrega: las entregas van vacias', () => {
  const run = runModule(investigacion(), baseRegistry(), ctx, {
    entry: ENTRADA_INVESTIGACION,
    env: HOSTS.clientFull,
  });
  assert.equal(run.ok, false);
  assert.equal(run.deliveries.size, 0, 'entregar a medias seria indistinguible de no tener artifact');
});

test('L2-S10 · el harness propaga el fallo del modulo antes de buscar el modo', () => {
  const r = ask(investigacion(), baseRegistry(), ctx, 'text', {
    entry: ENTRADA_INVESTIGACION,
    env: HOSTS.clientFull,
  });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.code, 'E_NODE_FAILED');
  assert.ok(r.run !== null, 'el run viaja con el error: sin el no se sabe donde se detuvo');
});

// ---------------------------------------------------------------------------
// El harness: modo X
// ---------------------------------------------------------------------------

test('L2-S5 · el harness responde en modo X con el nodo:puerto de origen', () => {
  const r = ask(completo(), baseRegistry(), ctx, 'image', { entry: ENTRADA_COMPLETO });
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.answer.at, 'dibuja:svg');
  assert.equal(r.answer.produces, 'image');
  assert.ok(String(r.answer.value).startsWith('<svg'));
});

test('L2-S5 · pedir un modo que nadie entrega es E_NO_MODE, no un artifact cualquiera', () => {
  const r = ask(completo(), baseRegistry(), ctx, 'video', { entry: ENTRADA_COMPLETO });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.code, 'E_NO_MODE');
});

test('L2-S5 · dos entregas del mismo modo se rechazan en vez de sortearse', () => {
  const m: ModuleDescriptor = {
    ...CANONICO_COMPLETO,
    nodes: [...CANONICO_COMPLETO.nodes, { node: 'dibuja2', tool: RENDER_DESCRIPTOR }],
    edges: [
      ...CANONICO_COMPLETO.edges,
      { from: 'calcula', fromPort: 'value', to: 'dibuja2', toPort: 'value' },
    ],
    sinks: ['dibuja:svg', 'dibuja2:svg'],
  };
  const r = ask(planOf(m), baseRegistry(), ctx, 'image', { entry: ENTRADA_COMPLETO });
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.equal(r.code, 'E_AMBIGUOUS_MODE');
  assert.match(r.detail, /dibuja:svg/);
  assert.match(r.detail, /dibuja2:svg/, 'el error dice cuales son: si no no se puede arreglar');
});

test('L2-S5 · `deliveriesFor` se puede probar sin correr el modulo', () => {
  const run = runModule(completo(), baseRegistry(), ctx, { entry: ENTRADA_COMPLETO });
  assert.equal(deliveriesFor(completo(), run, 'image').length, 1);
  assert.equal(deliveriesFor(completo(), run, 'video').length, 0);
});

// ---------------------------------------------------------------------------
// Entradas
// ---------------------------------------------------------------------------

test('L2-S4 · un puerto de entrada sin valor es E_UNBOUND_INPUT, no un undefined', () => {
  const run = runModule(completo(), baseRegistry(), ctx, { entry: {} });
  assert.equal(run.ok, false);
  assert.equal(run.failure?.code, 'E_UNBOUND_INPUT');
  assert.match(String(run.failure?.detail), /calcula:expr/);
  assert.equal(run.runs.length, 0, 'no se ejecuto nada: el fallo es previo');
});

test('L2-S4 · una tool que no esta registrada es E_MISSING_TOOL, no una excepcion', () => {
  const run = runModule(completo(), new ToolRegistry(), ctx, { entry: ENTRADA_COMPLETO });
  assert.equal(run.ok, false);
  assert.equal(run.failure?.code, 'E_MISSING_TOOL');
  assert.equal(run.runs.length, 0);
});

test('L2-S4 · una tool que no emite un puerto declarado se detecta: E_PORT_NOT_EMITTED', () => {
  // El descriptor de RENDER declara `svg`. Esta magia devuelve la nada.
  const r = new ToolRegistry();
  r.register(EXEC_DESCRIPTOR, EXEC_IMPL);
  r.register(RENDER_DESCRIPTOR, () => ({ ok: true, outputs: [] }));

  const run = runModule(completo(), r, ctx, { entry: ENTRADA_COMPLETO });
  assert.equal(run.ok, false);
  assert.equal(run.failure?.node, 'dibuja');
  assert.equal(run.failure?.code, 'E_PORT_NOT_EMITTED');
  assert.match(String(run.failure?.detail), /svg/, 'el detalle dice que puerto falta');
  assert.equal(run.deliveries.size, 0, 'un artifact incompleto no se entrega');
});

// ---------------------------------------------------------------------------
// Mutacion vs receta, en la corrida
// ---------------------------------------------------------------------------

test('L2-S6 · una tool mutation se REUSA: la segunda corrida no ejecuta', () => {
  const store = new ValueStore();
  const a = runModule(completo(), baseRegistry(), ctx, { entry: ENTRADA_COMPLETO, store });
  const b = runModule(completo(), baseRegistry(), ctx, { entry: ENTRADA_COMPLETO, store });
  assert.equal(a.runs[0]?.reused, false, 'la primera vez no hay nada que reusar');
  assert.equal(b.runs[0]?.reused, true, 'la segunda vez se sirve de la cache');
  assert.equal(b.runs[0]?.kind, 'mutation');
});

test('L2-S6 · los dos nodos mutation se reusan: el reuso es por tool+input, no por corrida', () => {
  const store = new ValueStore();
  runModule(completo(), baseRegistry(), ctx, { entry: ENTRADA_COMPLETO, store });
  const b = runModule(completo(), baseRegistry(), ctx, { entry: ENTRADA_COMPLETO, store });
  assert.equal(b.runs[0]?.reused, true, 'EXEC: mismo input, mismo valor');
  assert.equal(b.runs[1]?.reused, true, 'RENDER tambien: su input es "42", y "42" no cambio');
});

test('L2-S6 · cambiar la entrada invalida el reuso', () => {
  const store = new ValueStore();
  runModule(completo(), baseRegistry(), ctx, { entry: ENTRADA_COMPLETO, store });
  const b = runModule(completo(), baseRegistry(), ctx, { entry: { 'calcula:expr': '1+1' }, store });
  assert.equal(b.runs[0]?.reused, false, 'otra expresion, otra huella');
  assert.ok(String(b.deliveries.get('dibuja:svg')).includes('>2</text>'));
});
