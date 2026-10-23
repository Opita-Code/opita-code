/**
 * PRIMITIVAS DEL FORMATO BINARIO WASM.
 *
 * Unicamente aritmetica sobre bytes y decodificacion de texto. Sin politica, sin
 * veredictos, sin nada que sepa de sandbox. Este archivo es el unico que tiene que
 * acertar en el formato; los de al lado solo tienen que decidir.
 *
 * POR QUE `TextDecoder` SI Y `hash.ts` NO
 *
 * Porque este archivo corre en el HOST, antes de entrar al sandbox. `hash.ts`
 * corre dentro de los tres tiers, y ahi una API del host no existe o no es la
 * misma. La regla del runtime es una sola: lo que corre ADENTRO es puro; lo que
 * corre ANTES puede usar el host.
 *
 * LEB128 SIN SIGNOS
 *
 * Se acumula por multiplicacion y no con `<<`. Con desplazamiento, un valor de
 * 32 bits acumulado en un entero de JS con signo se sale del rango y el numero
 * queda negativo. La multiplicacion no tiene ese problema.
 */

export const MAGIC: readonly number[] = [0x00, 0x61, 0x73, 0x6d];
export const VERSION: readonly number[] = [0x01, 0x00, 0x00, 0x00];

/** IDs de seccion validos: 0 = custom, 1..12 = secciones con formato fijado. */
export const MAX_SECTION_ID = 12;
export const IMPORT_SECTION = 2;
export const HEADER_BYTES = 8;

const SECTION_NAMES: Record<number, string> = {
  0: 'custom',
  1: 'type',
  2: 'import',
  3: 'function',
  4: 'table',
  5: 'memory',
  6: 'global',
  7: 'export',
  8: 'start',
  9: 'element',
  10: 'code',
  11: 'data',
  12: 'datacount',
};

export function sectionName(id: number): string {
  return SECTION_NAMES[id] ?? `desconocida(${id})`;
}

export function byteAt(b: Uint8Array, i: number): number | null {
  return i >= 0 && i < b.length ? (b[i] as number) : null;
}

/** LEB128 sin signo. `null` si excede u32 o si se corta a mitad. */
export function varUint(b: Uint8Array, pos: number): { value: number; next: number } | null {
  let value = 0;
  let scale = 1;
  let p = pos;
  for (let i = 0; i < 5; i++) {
    const byte = byteAt(b, p);
    if (byte === null) return null;
    p++;
    value += (byte & 0x7f) * scale;
    if ((byte & 0x80) === 0) return { value, next: p };
    scale *= 128;
  }
  return null;
}

const decoder = new TextDecoder('utf-8', { fatal: true });

/** `modulo#campo`. El par es lo que identifica el poder, no el modulo solo. */
export function allowKey(mod: string, field: string): string {
  return `${mod}#${field}`;
}

export function readName(b: Uint8Array, pos: number): { value: string; next: number } | null {
  const len = varUint(b, pos);
  if (len === null) return null;
  const end = len.next + len.value;
  if (end > b.length) return null;
  try {
    return { value: decoder.decode(b.subarray(len.next, end)), next: end };
  } catch {
    return null;
  }
}

/** Salta un descriptor `limits`. `flags & 1` indica que viene `max`. `-1` si no cabe. */
export function skipLimits(b: Uint8Array, pos: number): number {
  const flags = byteAt(b, pos);
  if (flags === null) return -1;
  const min = varUint(b, pos + 1);
  if (min === null) return -1;
  if ((flags & 0x01) === 0) return min.next;
  const max = varUint(b, min.next);
  return max === null ? -1 : max.next;
}
