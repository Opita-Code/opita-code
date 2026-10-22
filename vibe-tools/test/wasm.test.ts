/**
 * L1-S3 · El validador estatico de imports.
 *
 * La afirmacion que este archivo verifica es una sola: bajo T0 no se carga ningun
 * modulo que importe algo. Ni "lo razonable", ni "lo conocido": nada. Y la lista
 * de lo admitido esta vacia a proposito.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { scanWasm, T0_ALLOWED, allowKey, capabilityOfImport } from '../src/sandbox/wasm/scan.js';
import { readStructure } from '../src/sandbox/wasm/structure.js';
import { kindName } from '../src/sandbox/wasm/imports.js';
import {
  bytes,
  customSection,
  emptyModule,
  importSection,
  limits,
  moduleWithImports,
  section,
  wasm,
  type RawImport,
} from './wasm-builder.js';

function codeOf(v: { violations: readonly { code: string }[] }): string {
  return v.violations[0]?.code ?? '';
}

const SOCK: RawImport = { module: 'wasi_snapshot_preview1', field: 'sock_send', kind: 0x00 };
/** `env.memory` no es archivo: es RAM. Se rechaza igual, pero no como `fs`. */
const MEM: RawImport = { module: 'env', field: 'memory', kind: 0x02, payload: limits(1) };
/** Este si es acceso al sistema de archivos. */
const PATH: RawImport = { module: 'wasi_snapshot_preview1', field: 'path_open', kind: 0x00 };
const GLOB: RawImport = { module: 'env', field: 'mutacion', kind: 0x03, payload: [0x7f, 0x00] };

test('L1-S3 · un modulo sin imports es valido', () => {
  const v = scanWasm(bytes(emptyModule()));
  assert.equal(v.ok, true);
  assert.equal(v.imports.length, 0);
  assert.equal(v.violations.length, 0);
});

test('L1-S3 · la lista de T0 esta vacia: no hay un solo import admitido', () => {
  assert.deepEqual(T0_ALLOWED, []);
});

test('L1-S3 · un solo import deniega el modulo y nombra que alcanzaba', () => {
  const v = scanWasm(bytes(moduleWithImports([SOCK])));
  assert.equal(v.ok, false);
  assert.equal(codeOf(v), 'E_IMPORT_DENIED');
  assert.equal(v.violations[0]?.target, 'wasi_snapshot_preview1#sock_send');
  assert.equal(v.violations[0]?.capability, 'net');
});

test('L1-S3 · un import de archivo se lee como fs, y la memoria NO es archivo', () => {
  const archivo = scanWasm(bytes(moduleWithImports([PATH])));
  assert.equal(archivo.ok, false);
  assert.equal(archivo.violations[0]?.capability, 'fs');

  // `env.memory` es RAM, no disco: se rechaza, pero no se etiqueta como fs.
  const ram = scanWasm(bytes(moduleWithImports([MEM])));
  assert.equal(ram.ok, false, 'la politica rechaza por lista blanca, no por la capacidad inferida');
  assert.equal(ram.violations[0]?.capability, 'unknown');
});

test('L1-S3 · un import de tipo descriptor desconocido no se adivina', () => {
  const v = scanWasm(bytes(moduleWithImports([GLOB])));
  assert.equal(v.ok, false);
  assert.equal(codeOf(v), 'E_IMPORT_DENIED');
});

test('L1-S3 · los cuatro descriptores se recorren sin desbordarse', () => {
  const tabla: RawImport[] = [
    { module: 'a', field: 'f', kind: 0x00, payload: [0x00] },
    { module: 'b', field: 'f', kind: 0x01, payload: [0x70, ...limits(1, 4)] },
    { module: 'c', field: 'f', kind: 0x02, payload: limits(2, 9) },
    { module: 'd', field: 'f', kind: 0x03, payload: [0x7e, 0x01] },
  ];
  const v = scanWasm(bytes(moduleWithImports(tabla)));
  assert.equal(v.imports.length, 4, 'los cuatro se leen hasta el final de la seccion');
  assert.equal(v.violations.length, 4, 'y los cuatro se rechazan');
});

test('L1-S3 · un descriptor de import que no existe es rechazo, no salto', () => {
  const v = scanWasm(bytes(moduleWithImports([{ module: 'x', field: 'y', kind: 0x09 }])));
  assert.equal(v.ok, false);
  assert.equal(codeOf(v), 'E_BAD_IMPORT');
});

test('L1-S3 · varios imports denegados se acumulan, no se reporta solo el primero', () => {
  const v = scanWasm(bytes(moduleWithImports([SOCK, MEM, GLOB])));
  assert.equal(v.ok, false);
  assert.equal(v.violations.length, 3);
  assert.equal(v.imports.length, 3);
});

test('L1-S3 · una lista blanca que admite el import lo deja pasar', () => {
  const v = scanWasm(bytes(moduleWithImports([SOCK])), ['wasi_snapshot_preview1#sock_send']);
  assert.equal(v.ok, true);
  assert.equal(v.imports.length, 1);
});

test('L1-S3 · la lista blanca compara el par completo, no el modulo', () => {
  const v = scanWasm(bytes(moduleWithImports([MEM])), ['env#otra']);
  assert.equal(v.ok, false);
  assert.equal(v.violations[0]?.target, 'env#memory');
});

test('L1-S3 · sin numero magico no se aprueba el modulo', () => {
  const v = scanWasm(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]));
  assert.equal(v.ok, false);
  assert.equal(codeOf(v), 'E_MAGIC');
});

test('L1-S3 · una version distinta de 1 no se aprueba', () => {
  const v = scanWasm(new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x02, 0, 0, 0]));
  assert.equal(v.ok, false);
  assert.equal(codeOf(v), 'E_VERSION');
});

test('L1-S3 · un modulo mas corto que la cabecera no se aprueba', () => {
  const v = scanWasm(new Uint8Array([0x00, 0x61, 0x73]));
  assert.equal(v.ok, false);
  assert.equal(codeOf(v), 'E_SHORT');
});

test('L1-S3 · una seccion que declara mas bytes de los que hay no se aprueba', () => {
  // id 1, declara 8 B de contenido, y solo aparecen 2.
  const v = scanWasm(new Uint8Array([0x00, 0x61, 0x73, 0x6d, 1, 0, 0, 0, 1, 8, 1, 2]));
  assert.equal(v.ok, false);
  assert.equal(codeOf(v), 'E_TRUNCATED');
});

test('L1-S3 · un id de seccion fuera del formato conocido no se aprueba', () => {
  const v = scanWasm(wasm([0x00, 0x61, 0x73, 0x6d, 1, 0, 0, 0], section(13, [])));
  assert.equal(v.ok, false);
  assert.equal(codeOf(v), 'E_UNKNOWN_SECTION');
});

test('L1-S3 · dos secciones del mismo tipo no se aprueban', () => {
  const v = scanWasm(
    wasm(
      [0x00, 0x61, 0x73, 0x6d, 1, 0, 0, 0],
      section(1, [0x01, 0x60]),
      section(1, [0x01, 0x60]),
    ),
  );
  assert.equal(v.ok, false);
  assert.equal(codeOf(v), 'E_DUPLICATE_SECTION');
});

test('L1-S3 · dos secciones de imports seguidas no se aprueban', () => {
  const v = scanWasm(
    wasm([0x00, 0x61, 0x73, 0x6d, 1, 0, 0, 0], importSection([]), importSection([])),
  );
  assert.equal(v.ok, false);
  assert.equal(codeOf(v), 'E_DUPLICATE_SECTION');
});

test('L1-S3 · secciones desordenadas no se aprueban', () => {
  const v = scanWasm(
    wasm(
      [0x00, 0x61, 0x73, 0x6d, 1, 0, 0, 0],
      section(3, []),
      section(1, [0x01, 0x60]),
    ),
  );
  assert.equal(v.ok, false);
  assert.equal(codeOf(v), 'E_SECTION_ORDER');
});

test('L1-S3 · una seccion custom puede ir donde quiera y no rompe el orden', () => {
  const v = scanWasm(
    wasm(
      [0x00, 0x61, 0x73, 0x6d, 1, 0, 0, 0],
      section(1, [0x01, 0x60]),
      customSection('cargando.js'),
      section(3, []),
      customSection('paquete.json'),
      section(7, []),
    ),
  );
  assert.equal(v.ok, true, 'el recorrido llega hasta el final y el orden sigue valido');
});

test('L1-S3 · la capa de estructura y la de politica rechazan por separado', () => {
  const estructura = readStructure(new Uint8Array([9, 9, 9, 9, 9, 9, 9, 9]));
  assert.equal(estructura.ok, false);
  if (!estructura.ok) assert.equal(estructura.code, 'E_MAGIC');
  const entero = readStructure(bytes(moduleWithImports([SOCK])));
  assert.equal(entero.ok, true, 'la estructura esta bien aunque la politica no');
});

test('L1-S3 · un modulo valido no produce violaciones ni imports', () => {
  const v = scanWasm(bytes(emptyModule()));
  assert.equal(v.bytes, 8);
  assert.equal(v.ok, true);
});

test('L1-S3 · la clave de la lista blanca une modulo y campo con #', () => {
  assert.equal(allowKey('env', 'memory'), 'env#memory');
});

test('L1-S3 · el nombre del descriptor de import se lee, y lo desconocido se dice', () => {
  assert.equal(kindName(0x00), 'func');
  assert.equal(kindName(0x02), 'memory');
  assert.equal(kindName(0x77), 'desconocido(119)');
});

test('L1-S3 · la capacidad de un import se usa para auditar, no para decidir', () => {
  assert.equal(capabilityOfImport(SOCK), 'net');
  assert.equal(capabilityOfImport(PATH), 'fs');
  assert.equal(capabilityOfImport(MEM), 'unknown', 'la memoria no es el disco');
  assert.equal(capabilityOfImport({ module: 'env', field: 'x', kind: 0x00 }), 'unknown');
  // Aunque la capacidad inferida sea desconocida, la politica lo rechaza igual.
  const v = scanWasm(bytes(moduleWithImports([{ module: 'env', field: 'x', kind: 0x00 }])));
  assert.equal(v.ok, false);
});