import test from 'node:test';
import assert from 'node:assert/strict';

import type { Edge, ModuleDescriptor, Port, ToolDescriptor } from '../src/contract.js';
import { emptyContext } from '../src/context.js';
import { validate } from '../src/graph.js';
import { sha256Hex } from '../src/hash.js';
import { deliveriesOf } from '../src/module/deliver.js';
import { nodeRun } from '../src/module/outcome.js';
import { runModule } from '../src/module/run.js';
import { Checker } from '../src/rules/types.js';
import { deniedCount, runInSandbox } from '../src/sandbox/runner.js';
import { HOSTS } from '../src/sandbox/tier.js';
import { byteAt, readName, varUint } from '../src/sandbox/wasm/binary.js';
import { parseImports } from '../src/sandbox/wasm/imports.js';
import { readStructure } from '../src/sandbox/wasm/structure.js';
import { ToolRegistry } from '../src/tool.js';
import { draft } from '../src/tools/draft.js';
import { renderSvg } from '../src/tools/render.js';
import { IDENTIDAD } from './identity-fixture.js';
import {
  importEntry,
  importSection,
  limits,
  moduleWithImports,
  str,
  wasm,
} from './wasm-builder.js';

const p = (name: string, produces: Port['produces'], artifact = false): Port => ({
  name,
  produces,
  artifact,
});

function descriptor(over: Partial<ToolDescriptor> = {}): ToolDescriptor {
  return {
    id: 'tool',
    version: '0.1.0',
    author: 'opita',
    title: 'herramienta de prueba',
    determinism: 'deterministic',
    tier: 'T0',
    effect: 'none',
    inputs: [],
    outputs: [],
    ...over,
  };
}

const SIN_ENTRADA = descriptor({ id: 'sin_entrada' });
const CON_ENTRADA = descriptor({
  id: 'con_entrada',
  inputs: [p('entrada', 'text')],
  outputs: [p('salida', 'text', true)],
});
const ARTIFACT = descriptor({
  id: 'artifact',
  outputs: [p('salida', 'text', true)],
});

function edge(from: string, to: string): Edge {
  return { from, fromPort: 'salida', to, toPort: 'entrada' };
}

test('L2-T5 · el contador suma exactamente las verificaciones solicitadas', () => {
  const contador = new Checker();
  contador.count();
  contador.count(3);
  assert.equal(contador.total, 4);
});

test('L1-S5 · el registry entrega el binario a la capa estatica del sandbox', () => {
  const registry = new ToolRegistry().register(SIN_ENTRADA, () => ({
    ok: true,
    outputs: [],
  }));
  const resultado = registry.run(
    SIN_ENTRADA.id,
    SIN_ENTRADA.version,
    {},
    emptyContext('estatico', IDENTIDAD),
    {
      module: wasm(moduleWithImports([
        { module: 'env', field: 'memory', kind: 0x02, payload: limits(1) },
      ])),
    },
  );
  assert.equal(resultado.ok, false);
  if (resultado.ok) return;
  assert.equal(resultado.code, 'E_MODULE_DENIED');
});

test('L1-S5 · deniedCount cuenta solo los intentos que fueron denegados', () => {
  const resultado = runInSandbox({
    env: HOSTS.clientFull,
    binding: {
      descriptor: descriptor({ id: 'mixta', tier: 'T1' }),
      impl: (_input, _ctx, efectos) => {
        efectos.net('https://ejemplo.test');
        efectos.proc(['proceso']);
        return { ok: true, outputs: [] };
      },
    },
    input: {},
    ctx: emptyContext('conteo', IDENTIDAD),
    backend: { net: () => 'respuesta' },
  });
  assert.equal(resultado.ok, false);
  assert.equal(resultado.attempts.length, 2);
  assert.equal(deniedCount(resultado), 1);
});

test('L1-S3 · varUint rechaza un sexto byte que excede el rango u32', () => {
  const bytes = new Uint8Array([0xff, 0xff, 0xff, 0xff, 0x8f, 0x01]);
  assert.equal(varUint(bytes, 0), null);
});

test('L1-S3 · varUint decodifica LEB128 con base 128', () => {
  assert.deepEqual(varUint(new Uint8Array([0x80, 0x01]), 0), { value: 128, next: 2 });
});

test('L1-S3 · readName rechaza un nombre cuyo contenido fue truncado', () => {
  assert.equal(readName(new Uint8Array([0x05, 0x61, 0x62]), 0), null);
});

test('L1-S3 · byteAt no consulta una posicion que queda fuera del rango', () => {
  let consultado = false;
  const bytes = {
    length: 0,
    get 0(): number {
      consultado = true;
      return 7;
    },
  } as unknown as Uint8Array;
  assert.equal(byteAt(bytes, 0), null);
  assert.equal(consultado, false, 'la comprobacion de rango debe ocurrir antes de leer');
});

test('L1-S3 · parseImports rechaza un descriptor global incompleto', () => {
  const contenido = new Uint8Array([0x01, ...str('mod'), ...str('campo'), 0x03, 0x7f]);
  assert.equal(parseImports(contenido, 0, contenido.length), null);
});

test('L1-S3 · parseImports consume los dos bytes del descriptor global', () => {
  const contenido = new Uint8Array([
    0x02,
    ...importEntry({ module: 'a', field: 'f', kind: 0x03, payload: [0x7f, 0x00] }),
    ...importEntry({ module: 'b', field: 'g', kind: 0x03, payload: [0x7e, 0x01] }),
  ]);
  const imports = parseImports(contenido, 0, contenido.length);
  assert.ok(imports);
  assert.deepEqual(imports.map((item) => item.module), ['a', 'b']);
});

test('L1-S3 · parseImports consume los limits completos del descriptor de tabla', () => {
  const contenido = new Uint8Array([
    0x02,
    ...importEntry({ module: 'a', field: 'tabla', kind: 0x01, payload: [0x70, ...limits(1, 4)] }),
    ...importEntry({ module: 'b', field: 'funcion', kind: 0x00, payload: [0x00] }),
  ]);
  const imports = parseImports(contenido, 0, contenido.length);
  assert.ok(imports);
  assert.deepEqual(imports.map((item) => item.field), ['tabla', 'funcion']);
});

test('L1-S3 · readStructure identifica especificamente la seccion de imports duplicada', () => {
  const resultado = readStructure(
    wasm([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00], importSection([]), importSection([])),
  );
  assert.equal(resultado.ok, false);
  if (resultado.ok) return;
  assert.equal(resultado.code, 'E_DUPLICATE_SECTION');
  assert.match(resultado.detail, /dos secciones de imports/);
});

test('L0-T1 · sha256 escribe la parte alta de la longitud en big endian', () => {
  const Uint8ArrayOriginal = globalThis.Uint8Array;
  const DataViewOriginal = globalThis.DataView;
  const escrituras: Array<{ value: number; littleEndian: boolean }> = [];

  class AltaLongitudAlcanzada extends Error {}

  try {
    const globals = globalThis as unknown as {
      Uint8Array: typeof Uint8Array;
      DataView: typeof DataView;
    };
    globals.Uint8Array = class {
      constructor(_size: number) {
        return { buffer: new ArrayBuffer(0), set: () => undefined } as never;
      }
    } as unknown as typeof Uint8Array;
    globals.DataView = class {
      constructor(_buffer: ArrayBuffer) {}
      setUint32(_offset: number, value: number, littleEndian?: boolean): void {
        escrituras.push({ value, littleEndian: littleEndian === true });
        throw new AltaLongitudAlcanzada();
      }
      getUint32(): number {
        return 0;
      }
    } as unknown as typeof DataView;

    const bytes = { length: 2 ** 29 } as unknown as Uint8Array;
    assert.throws(() => sha256Hex(bytes), AltaLongitudAlcanzada);
  } finally {
    const globals = globalThis as unknown as {
      Uint8Array: typeof Uint8Array;
      DataView: typeof DataView;
    };
    globals.Uint8Array = Uint8ArrayOriginal;
    globals.DataView = DataViewOriginal;
  }

  assert.equal(escrituras.length, 1);
  assert.equal(escrituras[0]?.value, 1);
  assert.equal(escrituras[0]?.littleEndian, false);
});

test('L2-S1 · R10 descuenta cada arista una sola vez al colocar un nodo', () => {
  const mod: ModuleDescriptor = {
    id: 'm',
    version: '0.1.0',
    author: 'opita',
    title: 'mod',
    nodes: [
      { node: 'fuente', tool: descriptor({ id: 'fuente', outputs: [p('salida', 'text')] }) },
      { node: 'destino', tool: CON_ENTRADA },
    ],
    edges: [edge('fuente', 'destino')],
    sinks: ['destino:salida'],
  };

  const setPrototype = Set.prototype as unknown as { delete(value: unknown): boolean };
  const deleteOriginal = setPrototype.delete;
  let deleteCalls = 0;
  setPrototype.delete = function (this: Set<unknown>, value: unknown): boolean {
    deleteCalls += 1;
    return deleteOriginal.call(this, value);
  };
  try {
    const resultado = validate(mod);
    assert.equal(resultado.ok, true, resultado.ok ? '' : `${resultado.code}: ${resultado.detail}`);
  } finally {
    setPrototype.delete = deleteOriginal;
  }
  assert.equal(deleteCalls, 1);
});

test('L2-S10 · una corrida fallida no entrega el artifact de un nodo que si completo', () => {
  const modulo: ModuleDescriptor = {
    id: 'm',
    version: '0.1.0',
    author: 'opita',
    title: 'mod',
    nodes: [
      { node: 'completo', tool: ARTIFACT },
      { node: 'fallido', tool: descriptor({ id: 'fallido', outputs: [p('salida', 'text', true)] }) },
    ],
    edges: [],
    sinks: ['completo:salida', 'fallido:salida'],
  };
  const validacion = validate(modulo);
  assert.ok(validacion.ok);
  if (!validacion.ok) return;

  const registry = new ToolRegistry()
    .register(ARTIFACT, () => ({ ok: true, outputs: [{ port: 'salida', value: 'completo' }] }))
    .register(
      descriptor({ id: 'fallido', outputs: [p('salida', 'text', true)] }),
      () => ({ ok: false, error: 'fallo previsto' }),
    );

  const corrida = runModule(validacion.plan, registry, emptyContext('fallo', IDENTIDAD));
  assert.equal(corrida.ok, false);
  assert.equal(corrida.deliveries.size, 0);
});

test('L2-S10 · deliveriesOf no entrega desde un nodo cuyo resultado fue fallido', () => {
  const modulo: ModuleDescriptor = {
    id: 'm',
    version: '0.1.0',
    author: 'opita',
    title: 'mod',
    nodes: [{ node: 'fallido', tool: ARTIFACT }],
    edges: [],
    sinks: ['fallido:salida'],
  };
  const validacion = validate(modulo);
  assert.ok(validacion.ok);
  if (!validacion.ok) return;

  const corridaFallida = nodeRun(
    'fallido',
    ARTIFACT,
    'mutation',
    false,
    false,
    'E_NODE_FAILED',
    'fallo previsto',
    [{ port: 'salida', value: 'parcial' }],
  );
  const entregas = deliveriesOf(validacion.plan, [corridaFallida]);
  assert.equal(entregas.size, 0);
});

test('L2-S6 · renderSvg conserva la coordenada horizontal de cada linea', () => {
  const svg = renderSvg('uno\ndos');
  const etiquetas = svg.match(/<text\b[^>]*>/g) ?? [];
  assert.equal(etiquetas.length, 2);
  for (const etiqueta of etiquetas) {
    assert.match(etiqueta, / x="16"/);
  }
});

test('L2-S6 · draft separa topic y nonce con NUL antes de calcular la semilla', () => {
  assert.equal(
    draft('te', 'maxxxxx'),
    'Una forma de mirar te es empezar por lo que no cambia. Queda pendiente probarlo.',
  );
});

test('L2-S6 · el topic participa en la semilla del borrador', () => {
  assert.equal(
    draft('tema0', 'n1'),
    'Una forma de mirar tema0 es empezar por lo que no cambia. Y no por mucho tiempo.',
  );
});

test('L2-S6 · la semilla elige tambien el closer del borrador', () => {
  assert.equal(
    draft('tema0', 'n0'),
    'Hay una version de tema0 que cabe en una linea, y no es la que importa. Queda pendiente probarlo.',
  );
});
