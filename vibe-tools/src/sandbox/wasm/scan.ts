/**
 * LA LISTA BLANCA: la politica de T0 sobre un binario.
 *
 * POR QUE LA DE T0 ESTA VACIA
 * Lo que una tool T0 necesita ya viene en el `input`. Si el modulo importa algo,
 * pide algo que el contrato no pidio, y no hay forma de revisar en codigo que sea
 * inocuo: `wasi_snapshot_preview1` mas `sock_send` sale a la red, y el mismo
 * import mas `fd_write` escribe al disco. La granularidad del nombre no compra
 * seguridad, asi que la lista esta vacia.
 *
 * La forma del binario la revisa `structure.ts`; aqui solo se decide si lo que se
 * leyó es admisible. Las dos capas rechazan por separado a proposito: que la
 * tabla de secciones este bien no dice nada de los imports.
 */

import { IMPORT_SECTION, allowKey } from './binary.js';
import { capabilityOfImport, kindName, parseImports, type WasmImport } from './imports.js';
import { readStructure, type StructureCode } from './structure.js';

export type ImportPolicyCode = 'E_BAD_IMPORT' | 'E_IMPORT_DENIED';
export type WasmViolationCode = StructureCode | ImportPolicyCode;

export interface WasmViolation {
  readonly code: WasmViolationCode;
  readonly detail: string;
  /** `modulo#campo` del import rechazado, si la violacion viene de uno. */
  readonly target: string | null;
  readonly capability: 'net' | 'fs' | 'process' | 'unknown';
}

export interface WasmVerdict {
  readonly ok: boolean;
  readonly bytes: number;
  readonly imports: readonly WasmImport[];
  readonly violations: readonly WasmViolation[];
}

export { allowKey, capabilityOfImport, kindName };
export type { WasmImport };

/** Lista blanca de T0: vacia a proposito. Ver la cabecera del archivo. */
export const T0_ALLOWED: readonly string[] = [];

function violation(
  code: WasmViolationCode,
  detail: string,
  target: string | null = null,
  capability: WasmViolation['capability'] = 'unknown',
): WasmViolation {
  return { code, detail, target, capability };
}

export function scanWasm(bytes: Uint8Array, allowed: readonly string[] = T0_ALLOWED): WasmVerdict {
  const structure = readStructure(bytes);
  if (!structure.ok) {
    const only = [violation(structure.code, structure.detail)];
    return { ok: false, bytes: bytes.length, imports: [], violations: only };
  }

  const violations: WasmViolation[] = [];
  const imports: WasmImport[] = [];

  for (const section of structure.sections) {
    if (section.id !== IMPORT_SECTION) continue;
    const parsed = parseImports(bytes, section.from, section.to);
    if (parsed === null) {
      violations.push(violation('E_BAD_IMPORT', 'la seccion de imports no tiene la forma del formato'));
      break;
    }
    for (const imp of parsed) {
      imports.push(imp);
      const key = allowKey(imp.module, imp.field);
      if (allowed.includes(key)) continue;
      violations.push(
        violation(
          'E_IMPORT_DENIED',
          `T0 no admite ${key} (${kindName(imp.kind)}); lo que una tool necesita ya viene en el input`,
          key,
          capabilityOfImport(imp),
        ),
      );
    }
  }

  return { ok: violations.length === 0, bytes: bytes.length, imports, violations };
}
