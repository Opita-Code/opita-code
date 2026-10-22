/**
 * LA SECCION DE IMPORTS: donde vive toda la superficie de escape de un modulo.
 *
 * En WASM un modulo no alcanza la red, el archivo ni el proceso sin importarlos.
 * Todo poder que tiene es un par `modulo#campo` declarado aqui. Por eso la
 * garantia de T0 se construye sobre esta seccion y no sobre el codigo.
 *
 * POR QUE NO ES UN PARSER COMPLETO
 *
 * Lee lo justo para recorrer la seccion y nombrar cada import. Ante algo que no
 * entiende devuelve `null`, que el llamador traduce a rechazo. Nunca adivina:
 * un validador que se rinde ante lo raro es peor que no tener validador, porque
 * su salida se lee como aprobacion.
 *
 * LOS CUATRO DESCRIPTORES
 *
 *   0x00 func     -> indice de tipo
 *   0x01 table    -> tipo de referencia + limits
 *   0x02 memoria  -> limits
 *   0x03 global   -> tipo de valor + mutabilidad
 *
 * Un quinto byte inicial es un formato que no existe. No se salta: se rechaza.
 */

import { byteAt, readName, skipLimits, varUint } from './binary.js';

export interface WasmImport {
  readonly module: string;
  readonly field: string;
  readonly kind: number;
}

export const IMPORT_KINDS = ['func', 'table', 'memory', 'global'] as const;

export function kindName(kind: number): string {
  return IMPORT_KINDS[kind] ?? `desconocido(${kind})`;
}

export function parseImports(b: Uint8Array, start: number, end: number): WasmImport[] | null {
  const count = varUint(b, start);
  if (count === null) return null;
  const found: WasmImport[] = [];
  let p = count.next;

  for (let i = 0; i < count.value; i++) {
    const mod = readName(b, p);
    if (mod === null) return null;
    const fld = readName(b, mod.next);
    if (fld === null) return null;
    const kind = byteAt(b, fld.next);
    if (kind === null) return null;
    p = fld.next + 1;

    if (kind === 0x00) {
      const type = varUint(b, p);
      if (type === null) return null;
      p = type.next;
    } else if (kind === 0x01) {
      const refType = byteAt(b, p);
      p = refType === null ? -1 : skipLimits(b, p + 1);
    } else if (kind === 0x02) {
      p = skipLimits(b, p);
    } else if (kind === 0x03) {
      const valType = byteAt(b, p);
      const mutable = byteAt(b, p + 1);
      p = valType === null || mutable === null ? -1 : p + 2;
    } else {
      return null;
    }

    if (p < 0 || p > end) return null;
    found.push({ module: mod.value, field: fld.value, kind });
  }
  return found;
}

/**
 * Que capacidad pretendia alcanzar un import.
 *
 * Solo sirve para auditar y explicar un rechazo; la decision no depende de esto.
 * El validador rechaza por lista blanca, no por adivinar la intencion.
 */
export function capabilityOfImport(imp: WasmImport): 'net' | 'fs' | 'process' | 'unknown' {
  const text = `${imp.module} ${imp.field}`.toLowerCase();
  if (text.includes('sock') || text.includes('net') || text.includes('http')) return 'net';
  if (text.includes('path') || text.includes('fd_') || text.includes('file')) return 'fs';
  if (text.includes('proc') || text.includes('spawn')) return 'process';
  return 'unknown';
}