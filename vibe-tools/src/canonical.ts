/**
 * Canonicalizacion: JSON estable, total y determinista.
 *
 * Sin esto, la huella de integridad dependeria del orden en que el motor
 * construyo el objeto. Dos personas que deserialicen el mismo descriptor en
 * runtimes distintos obtendrian hashes distintos, y el hash deja de servir para
 * confirmar que se habla del mismo artefacto.
 *
 * Que NO es idempotente y por que esta bien: canonicalize devuelve una CADENA.
 * Canonizar esa cadena la vuelve a escapar. La propiedad que importa es que la
 * forma ordenada ya no cambia al volver a canonizar (punto fijo).
 */

export class CanonicalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CanonicalError';
  }
}

export function canonicalize(value: unknown): string {
  if (value === null) return 'null';

  const t = typeof value;

  if (t === 'boolean') return value === true ? 'true' : 'false';

  if (t === 'number') {
    const n = value as number;
    if (!Number.isFinite(n)) throw new CanonicalError(`no canonizable: numero no finito (${String(n)})`);
    return JSON.stringify(n) ?? 'null';
  }

  if (t === 'string') return JSON.stringify(value);

  if (t === 'bigint') throw new CanonicalError('no canonizable: bigint');
  if (t === 'symbol' || t === 'function') throw new CanonicalError(`no canonizable: ${t}`);

  if (Array.isArray(value)) {
    const parts: string[] = [];
    for (const item of value) parts.push(canonicalize(item));
    return `[${parts.join(',')}]`;
  }

  if (t === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj)
      .filter((k) => obj[k] !== undefined)
      .sort();
    const parts: string[] = [];
    for (const k of keys) {
      const child = obj[k];
      if (child === undefined) continue;
      parts.push(`${JSON.stringify(k)}:${canonicalize(child)}`);
    }
    return `{${parts.join(',')}}`;
  }

  throw new CanonicalError(`no canonizable: tipo ${t}`);
}
