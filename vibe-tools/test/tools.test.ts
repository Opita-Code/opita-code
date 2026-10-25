import test from 'node:test';
import assert from 'node:assert/strict';

import { EXEC_DESCRIPTOR, EXEC_IMPL, RENDER_DESCRIPTOR, RENDER_IMPL } from '../src/tools/index.js';
import { DRAFT_DESCRIPTOR, DRAFT_IMPL, draft } from '../src/tools/draft.js';
import { RESEARCH_DESCRIPTOR, RESEARCH_IMPL, RESEARCH_ENDPOINT } from '../src/tools/research.js';
import { escapeXml, renderSvg } from '../src/tools/render.js';
import { baseRegistry } from '../src/tools/index.js';
import { emptyContext } from '../src/context.js';
import { HOSTS } from '../src/sandbox/tier.js';
import { IDENTIDAD } from './identity-fixture.js';

// ---------------------------------------------------------------------------
// Los descriptores dicen la verdad
// ---------------------------------------------------------------------------

test('L2-S6 · EXEC es T0 sin efecto y determinista', () => {
  assert.equal(EXEC_DESCRIPTOR.tier, 'T0');
  assert.equal(EXEC_DESCRIPTOR.effect, 'none');
  assert.equal(EXEC_DESCRIPTOR.determinism, 'deterministic');
});

test('L2-S6 · RENDER produce `image` y lo que entrega ES una imagen', () => {
  assert.equal(RENDER_DESCRIPTOR.outputs[0]?.produces, 'image');
  const out = renderSvg('hola');
  assert.ok(out.startsWith('<svg') && out.endsWith('</svg>'));
});

test('L2-S6 · DRAFT es estocastica y T0: etiqueta recipe, sin I/O', () => {
  assert.equal(DRAFT_DESCRIPTOR.tier, 'T0');
  assert.equal(DRAFT_DESCRIPTOR.effect, 'none');
  assert.equal(DRAFT_DESCRIPTOR.determinism, 'stochastic');
});

test('L2-S6 · RESEARCH es T1 y lee: por eso T0 la rechazaria', () => {
  assert.equal(RESEARCH_DESCRIPTOR.tier, 'T1');
  assert.equal(RESEARCH_DESCRIPTOR.effect, 'read');
  assert.equal(RESEARCH_DESCRIPTOR.determinism, 'stochastic');
});

// ---------------------------------------------------------------------------
// EXEC
// ---------------------------------------------------------------------------

test('L2-S6 · EXEC respects la precedencia', () => {
  for (const [expr, want] of [
    ['2+3*4', '14'],
    ['(2+3)*4', '20'],
    ['10-2-3', '5'],
    ['2*3+4*5', '26'],
    ['100/5/2', '10'],
  ] as const) {
    const r = EXEC_IMPL({ expr }, emptyContext('t', IDENTIDAD), undefined as never);
    assert.equal(r.ok, true, `${expr}: ${r.ok ? '' : r.error}`);
    if (!r.ok) return;
    assert.equal(r.outputs[0]?.value, want, expr);
  }
});

test('L2-S6 · EXEC maneja el menos unario y los espacios', () => {
  const r = EXEC_IMPL({ expr: '  -3 + - (2) ' }, emptyContext('t', IDENTIDAD), undefined as never);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.outputs[0]?.value, '-5');
});

test('L2-S6 · EXEC NO redondea: el valor es el exacto de IEEE754', () => {
  const r = EXEC_IMPL({ expr: '0.1+0.2' }, emptyContext('t', IDENTIDAD), undefined as never);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.outputs[0]?.value, '0.30000000000000004');
});

test('L2-S6 · EXEC falla con un mensaje, nunca con una excepcion', () => {
  for (const expr of ['', '1+', '((1)', '1 2', '1/0', 'a+b', '*3', '1++']) {
    const r = EXEC_IMPL({ expr }, emptyContext('t', IDENTIDAD), undefined as never);
    assert.equal(r.ok, false, `deberia fallar: ${JSON.stringify(expr)}`);
    if (r.ok) continue;
    assert.equal(typeof r.error, 'string');
    assert.ok(r.error.length > 0);
  }
});

test('L2-S6 · EXEC dice "division por cero", que es distinto de "expresion invalida"', () => {
  const r = EXEC_IMPL({ expr: '1/0' }, emptyContext('t', IDENTIDAD), undefined as never);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.match(r.error, /division por cero/);
});

test('L2-S6 · EXEC sin puerto de entrada no inventa nada', () => {
  const r = EXEC_IMPL({}, emptyContext('t', IDENTIDAD), undefined as never);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.match(r.error, /expr/);
});

test('L2-S6 · EXEC es determinista 10/10', () => {
  const outs = new Set<string>();
  for (let i = 0; i < 10; i++) {
    const r = EXEC_IMPL({ expr: '2*(3+4)' }, emptyContext('t', IDENTIDAD), undefined as never);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    outs.add(String(r.outputs[0]?.value));
  }
  assert.deepEqual([...outs], ['14']);
});
// ---------------------------------------------------------------------------
// RENDER: el escapado es la frontera
// ---------------------------------------------------------------------------

test('L2-S6 · escapeXml cubre los cinco que XML necesita', () => {
  assert.equal(escapeXml('&'), '&amp;');
  assert.equal(escapeXml('<'), '&lt;');
  assert.equal(escapeXml('>'), '&gt;');
  assert.equal(escapeXml('"'), '&quot;');
  assert.equal(escapeXml("'"), '&apos;');
});

test('L2-S6 · el ampersand se escapa PRIMERO: si no, el escapado se escapa a si mismo', () => {
  // El bug clasico: si `&` se reemplazara despues de `<`, "<" ya pasaria a "&lt;"
  // y el & de "&lt;" se volveria "&amp;lt;". Un texto legitimo se corromperia.
  assert.equal(escapeXml('<'), '&lt;');
  assert.doesNotMatch(escapeXml('<'), /&amp;lt;/);
});

test('L2-S6 · un texto con markup queda como TEXTO, no como markup', () => {
  const svg = renderSvg('<script>alert(1)</script>');
  assert.doesNotMatch(svg, /<script/, 'el script no puede entrar al documento');
  assert.ok(svg.includes('&lt;script&gt;'), 'tiene que estar a la vista, escapado');
});

test('L2-S6 · una comilla no rompe el atributo del SVG', () => {
  const svg = renderSvg('" onload="x()');
  assert.doesNotMatch(svg, /" onload="x/, 'no se puede cerrar el atributo');
  assert.ok(svg.includes('&quot;'));
});

test('L2-S6 · el ancho sigue al texto: dos textos distintos, dos SVG distintos', () => {
  const corto = renderSvg('a');
  const largo = renderSvg('a'.repeat(200));
  assert.notEqual(corto, largo);
  assert.ok(Number(/width="(\d+)"/.exec(largo)?.[1] ?? 0) > Number(/width="(\d+)"/.exec(corto)?.[1] ?? 0));
});

test('L2-S6 · las lineas multiples se renderizan en varias lineas de texto', () => {
  const svg = renderSvg('uno\ndos\ntres');
  assert.equal(svg.match(/<text /g)?.length, 3);
  assert.ok(/height="104"/.test(svg), '3 lineas de 24 mas 16 de padding arriba y abajo');
});

test('L2-S6 · RENDER es determinista 10/10', () => {
  const outs = new Set<string>();
  for (let i = 0; i < 10; i++) outs.add(renderSvg('a <b> &c'));
  assert.equal(outs.size, 1);
});

test('L2-S6 · RENDER sin puerto de entrada no inventa nada', () => {
  const r = RENDER_IMPL({}, emptyContext('t', IDENTIDAD), undefined as never);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.match(r.error, /value/);
});

// ---------------------------------------------------------------------------
// DRAFT: la variabilidad esta en el input
// ---------------------------------------------------------------------------

test('L2-S6 · el mismo par (topic, nonce) da el mismo borrador 10/10', () => {
  const outs = new Set<string>();
  for (let i = 0; i < 10; i++) outs.add(draft('tema', 'n1'));
  assert.equal(outs.size, 1, 'si T0 diese entropia, esto daria 10 valores distintos');
});

test('L2-S6 · nonces distintos dan borradores distintos', () => {
  const vistos = new Set<string>();
  for (let n = 0; n < 40; n++) vistos.add(draft('tema', `n${n}`));
  assert.ok(vistos.size >= 5, `40 nonces deberían dar varios borradores: ${vistos.size}`);
});

test('L2-S6 · el tema y el nonce no se pueden confundir por un separador', () => {
  // Sin separador, ("ab","c") y ("a","bc") darian la misma semilla.
  assert.notEqual(draft('ab', 'c'), draft('a', 'bc'));
});

test('L2-S6 · el borrador menciona el tema', () => {
  assert.ok(draft('el cielo', 'x').includes('el cielo'));
});

test('L2-S6 · DRAFT sin puertos de entrada falla en vez de improvisar', () => {
  const r = DRAFT_IMPL({ topic: 'x' }, emptyContext('t', IDENTIDAD), undefined as never);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.match(r.error, /nonce/);
});

// ---------------------------------------------------------------------------
// RESEARCH: propaga el motivo del sandbox
// ---------------------------------------------------------------------------

test('L2-S9 · RESEARCH propaga `unimplemented`, no lo disfraza de exito', () => {
  const out = baseRegistry().run('opita.research', '0.1.0', { query: 'x' }, emptyContext('t', IDENTIDAD), {
    env: HOSTS.clientFull,
  });
  assert.equal(out.ok, false);
  if (out.ok) return;
  assert.equal(out.code, 'E_TOOL_ERROR');
  assert.match(out.detail, /unimplemented/);
});

test('L2-S9 · el intento queda registrado como CONCEDIDO: lo que falta es el transporte', () => {
  const out = baseRegistry().run('opita.research', '0.1.0', { query: 'x' }, emptyContext('t', IDENTIDAD), {
    env: HOSTS.clientFull,
  });
  assert.equal(out.ok, false);
  if (out.ok) return;
  assert.equal(out.attempts.length, 1);
  assert.equal(out.attempts[0]?.granted, true);
  assert.equal(out.attempts[0]?.capability, 'net');
});

test('L2-S9 · con el host de cliente el motivo es que el host no sostiene T1', () => {
  const out = baseRegistry().run('opita.research', '0.1.0', { query: 'x' }, emptyContext('t', IDENTIDAD));
  assert.equal(out.ok, false);
  if (out.ok) return;
  assert.equal(out.code, 'E_HOST_UNSUPPORTED');
});

test('L2-S9 · con un backend, RESEARCH funciona: lo unico que faltaba era el transporte', () => {
  // Esta es la prueba del TODO bloqueante de L1, por el lado bueno: en cuanto hay
  // transporte, la tool funciona y el sandbox no molesta. El problema NUNCA fue
  // la politica; fue que no hay cable.
  const vistas: string[] = [];
  const out = baseRegistry().run('opita.research', '0.1.0', { query: 'memoria' }, emptyContext('t', IDENTIDAD), {
    env: HOSTS.clientFull,
    backend: { net: (u: string) => { vistas.push(u); return 'notas'; } },
  });
  assert.equal(out.ok, true, out.ok ? '' : `${out.code}: ${out.detail}`);
  assert.equal(out.outputs[0]?.value, 'notas');
  assert.equal(vistas.length, 1);
});

test('L2-S9 · el endpoint NO sale del input: la query se codifica y se anade al final', () => {
  // Un fetch cuya URL arma el usuario es un SSRF esperando que alguien lo pruebe.
  const vistas: string[] = [];
  baseRegistry().run('opita.research', '0.1.0', { query: '../../etc/passwd' }, emptyContext('t', IDENTIDAD), {
    env: HOSTS.clientFull,
    backend: { net: (u: string) => { vistas.push(u); return ''; } },
  });
  assert.equal(vistas[0], `${RESEARCH_ENDPOINT}..%2F..%2Fetc%2Fpasswd`);
  assert.ok(vistas[0]?.startsWith(RESEARCH_ENDPOINT), 'la URL la pone la tool, no el input');
  assert.ok(RESEARCH_ENDPOINT.startsWith('https://'));
});

test('L2-S9 · RESEARCH con T1 pero sin query no sale a la red', () => {
  const r = RESEARCH_IMPL({}, emptyContext('t', IDENTIDAD), undefined as never);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.match(r.error, /query/);
});
