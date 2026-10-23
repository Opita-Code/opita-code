/**
 * LA TABLA DE SECCIONES: leer el binario o explicar por que no se pudo leer.
 *
 * Esta capa no sabe nada de sandbox, ni de lista blanca, ni de capacidades. Solo
 * recorre el binario y responde una pregunta: cuales son las secciones y donde
 * empieza y termina cada una. La politica la aplica el de al lado.
 *
 * LAS TRES REGLAS DE FORMA, Y POR QUE NO SON CAPRICHO
 *
 * Las secciones no-custom van en orden creciente de id y aparecen una vez cada
 * una. Con secciones repetidas o desordenadas hay DOS lecturas validas del mismo
 * binario, y un validador que elige una es un validador que otro puede hacer
 * pasar por la otra. Ademas, el orden en WASM no es estetico: el recorrido
 * secuencial que ejecuta el runtime empieza por ahi.
 *
 * Ante cualquier duda devuelve rechazo. Un modulo que esta capa no entiende no
 * esta aprobado: esta desconocido, que es un estado distinto.
 */

import { HEADER_BYTES, IMPORT_SECTION, MAGIC, MAX_SECTION_ID, VERSION, byteAt, sectionName, varUint } from './binary.js';

export type StructureCode =
  | 'E_SHORT'
  | 'E_MAGIC'
  | 'E_VERSION'
  | 'E_TRUNCATED'
  | 'E_UNKNOWN_SECTION'
  | 'E_SECTION_ORDER'
  | 'E_DUPLICATE_SECTION';

export interface Section {
  readonly id: number;
  readonly from: number;
  readonly to: number;
}

export type Structure =
  | { readonly ok: true; readonly sections: readonly Section[] }
  | { readonly ok: false; readonly code: StructureCode; readonly detail: string };

export function hasImportSection(sections: readonly Section[]): boolean {
  return sections.some((s) => s.id === IMPORT_SECTION);
}

export function readStructure(bytes: Uint8Array): Structure {
  if (bytes.length < HEADER_BYTES) {
    return {
      ok: false,
      code: 'E_SHORT',
      detail: `modulo de ${bytes.length} B: menor que la cabecera de ${HEADER_BYTES} B`,
    };
  }
  for (let i = 0; i < 4; i++) {
    if (byteAt(bytes, i) !== MAGIC[i]) {
      return { ok: false, code: 'E_MAGIC', detail: 'los primeros 4 bytes no son el numero magico \\0asm' };
    }
    if (byteAt(bytes, i + 4) !== VERSION[i]) {
      return { ok: false, code: 'E_VERSION', detail: 'la version del modulo no es 1' };
    }
  }

  const sections: Section[] = [];
  let p = HEADER_BYTES;
  let lastId = 0;
  let seenImports = false;

  while (p < bytes.length) {
    const id = byteAt(bytes, p);
    const size = id === null ? null : varUint(bytes, p + 1);
    if (id === null || size === null) {
      return { ok: false, code: 'E_TRUNCATED', detail: 'seccion sin encabezado legible' };
    }
    const from = size.next;
    const to = from + size.value;
    if (to > bytes.length) {
      return {
        ok: false,
        code: 'E_TRUNCATED',
        detail: `la seccion ${sectionName(id)} declara ${size.value} B y el modulo no alcanza`,
      };
    }
    if (id > MAX_SECTION_ID) {
      return {
        ok: false,
        code: 'E_UNKNOWN_SECTION',
        detail: `id de seccion ${id} fuera del formato conocido 0..${MAX_SECTION_ID}`,
      };
    }
    if (id !== 0) {
      if (id <= lastId) {
        return {
          ok: false,
          code: id === lastId ? 'E_DUPLICATE_SECTION' : 'E_SECTION_ORDER',
          detail:
            id === lastId
              ? `la seccion ${sectionName(id)} aparece mas de una vez`
              : `la seccion ${sectionName(id)} aparece despues de la ${sectionName(lastId)}`,
        };
      }
      if (id === IMPORT_SECTION && seenImports) {
        return { ok: false, code: 'E_DUPLICATE_SECTION', detail: 'hay dos secciones de imports' };
      }
      lastId = id;
      if (id === IMPORT_SECTION) seenImports = true;
    }
    sections.push({ id, from, to });
    p = to;
  }
  return { ok: true, sections };
}
