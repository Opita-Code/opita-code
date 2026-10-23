/**
 * CONSTRUCTOR DE MODULOS WASM, A MANO.
 *
 * El validador de T0 se prueba sobre bytes, no sobre modulos compilados. Es a
 * proposito: si los tests dependieran de una toolchain, el validador solo se
 * podria ejercitar en modulos que la toolchain produce, que es un subconjunto
 * diminuto y con la forma que ella quiere. Aqui se pueden forzar a mano las
 * formas raras que un atacante escribiria a proposito.
 *
 * El formato es el del core spec: cabecera de 8 B, y despues secciones con id de
 * 1 B, tamano en LEB128 y contenido.
 */

export function leb(n: number): number[] {
  const out: number[] = [];
  let v = n;
  do {
    const byte = v & 0x7f;
    v = Math.floor(v / 128);
    out.push(v === 0 ? byte : byte | 0x80);
  } while (v > 0);
  return out;
}

export function str(s: string): number[] {
  const bytes = [...Buffer.from(s, 'utf8')];
  return [...leb(bytes.length), ...bytes];
}

export function section(id: number, content: number[]): number[] {
  return [id, ...leb(content.length), ...content];
}

export function concat(parts: number[][]): number[] {
  const out: number[] = [];
  for (const p of parts) out.push(...p);
  return out;
}

export const MAGIC = [0x00, 0x61, 0x73, 0x6d];
export const V1 = [0x01, 0x00, 0x00, 0x00];

/** Modulo vacio valido: cabecera y nada mas. */
export function emptyModule(): number[] {
  return concat([MAGIC, V1]);
}

/** limits con solo minimo. `flags & 1` indica que viene `max`. */
export function limits(min: number, max?: number): number[] {
  return max === undefined ? [0x00, ...leb(min)] : [0x01, ...leb(min), ...leb(max)];
}

export interface RawImport {
  module: string;
  field: string;
  /** 0x00 func, 0x01 table, 0x02 memoria, 0x03 global. */
  kind: number;
  payload?: number[];
  /** Para simular un descriptor inexistente: se escribe el byte tal cual. */
  raw?: number[];
}

export function importEntry(imp: RawImport): number[] {
  if (imp.raw !== undefined) return concat([str(imp.module), str(imp.field), imp.raw]);
  // Para `func` el descriptor es solo el indice de tipo, un LEB128.
  const tail = imp.payload ?? [0x00];
  return concat([str(imp.module), str(imp.field), [imp.kind], tail]);
}

export function importSection(imports: RawImport[]): number[] {
  return section(2, [...leb(imports.length), ...imports.flatMap(importEntry)]);
}

/** Modulo con una sola seccion de imports y nada mas. */
export function moduleWithImports(imports: RawImport[]): number[] {
  return concat([MAGIC, V1, importSection(imports)]);
}

/** Seccion custom, que puede repetirse y no cuenta para el orden. */
export function customSection(nameText: string, payload: number[] = []): number[] {
  return section(0, [...str(nameText), ...payload]);
}

export function wasm(...parts: number[][]): Uint8Array {
  return new Uint8Array(concat(parts));
}

export function bytes(...parts: number[][]): Uint8Array {
  return wasm(...parts);
}
