/**
 * CONTRATOS SON DATOS.
 *
 * Un descriptor es JSON puro: sin funciones, sin referencias, sin estado.
 * Eso es lo que lo hace publicable, versionable, hasheable y portable entre
 * T0 (WASM), Lambda y Firecracker sin reescribir nada.
 *
 * La magia (el codigo que corre la herramienta) vive aparte, resuelta por
 * (id, version). El contrato es la promesa; el codigo es su cumplimiento.
 */

import type { Determinism, Effect, Produces, Tier } from './axes.js';

/** Puerto de una herramienta. El eje 1 vive aqui. */
export interface Port {
  readonly name: string;
  readonly produces: Produces;
  /** `true` afirma que esta salida ES el entregable del modulo. No puede alimentar otro nodo. */
  readonly artifact: boolean;
}

/** Descriptor de herramienta. Serializable. Inmutable. */
export interface ToolDescriptor {
  readonly id: string;
  readonly version: string;
  readonly author: string;
  readonly title: string;
  /** Eje 2. De aqui sale mutacion vs receta vs nada. */
  readonly determinism: Determinism;
  readonly tier: Tier;
  readonly effect: Effect;
  readonly inputs: readonly Port[];
  readonly outputs: readonly Port[];
}

/** Arista del grafo de composicion: puerto de salida -> puerto de entrada. */
export interface Edge {
  readonly from: string;
  readonly fromPort: string;
  readonly to: string;
  readonly toPort: string;
}

export interface ModuleNode {
  readonly node: string;
  readonly tool: ToolDescriptor;
}

/** Descriptor de modulo. Serializable. Inmutable. */
export interface ModuleDescriptor {
  readonly id: string;
  readonly version: string;
  readonly author: string;
  readonly title: string;
  readonly nodes: readonly ModuleNode[];
  readonly edges: readonly Edge[];
  /** Referencias `nodo:puerto` que terminan el grafo. */
  readonly sinks: readonly string[];
}

// ---------------------------------------------------------------------------
// Canonicalizacion: JSON estable, total y determinista.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SHA-256 puro (sin node:crypto) para que el hash corra igual en WASM,
// en Lambda y dentro de una microVM sin capa de compatibilidad.
// ---------------------------------------------------------------------------

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(x: number, n: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

export function sha256Hex(bytes: Uint8Array): string {
  const len = bytes.length;
  const blocks = Math.ceil((len + 9) / 64);
  const total = blocks * 64;
  const msg = new Uint8Array(total);
  msg.set(bytes);
  msg[len] = 0x80;

  const view = new DataView(msg.buffer);
  const bitLen = len * 8;
  view.setUint32(total - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(total - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);

  for (let blk = 0; blk < blocks; blk++) {
    const off = blk * 64;
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const a = w[i - 15] as number;
      const c = w[i - 2] as number;
      const s0 = (rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) >>> 0;
      const s1 = (rotr(c, 17) ^ rotr(c, 19) ^ (c >>> 10)) >>> 0;
      w[i] = ((w[i - 16] as number) + s0 + (w[i - 7] as number) + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) >>> 0;
      const ch = ((e & f) ^ (~e & g)) >>> 0;
      const t1 = (h + S1 + ch + (K[i] as number) + (w[i] as number)) >>> 0;
      const S0 = (rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) >>> 0;
      const maj = ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
      const t2 = (S0 + maj) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const hex = (x: number): string => x.toString(16).padStart(8, '0');
  return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h5) + hex(h6) + hex(h7);
}

const encoder = new TextEncoder();

export function sha256HexOfText(text: string): string {
  return sha256Hex(encoder.encode(text));
}

/**
 * Huella de integridad de un contrato. Mismo descriptor -> mismo hash,
 * en cualquier runtime. Distinto descriptor -> distinto hash.
 *
 * Nota de alcance: el orden de los puertos ES parte del descriptor.
 * Reordenar puertos produce otro descriptor y otro hash. Eso es intencional:
 * la huella identifica el descriptor tal cual es, no su equivalencia semantica.
 */
export function integrityOf(value: unknown): string {
  return sha256HexOfText(canonicalize(value));
}

// ---------------------------------------------------------------------------
// Lecturas derivadas
// ---------------------------------------------------------------------------

export function inputPort(tool: ToolDescriptor, name: string): Port | undefined {
  return tool.inputs.find((p) => p.name === name);
}

export function outputPort(tool: ToolDescriptor, name: string): Port | undefined {
  return tool.outputs.find((p) => p.name === name);
}

/** Puertos que el modulo entrega a un humano. Debe haber al menos uno. */
export function deliveries(tool: ToolDescriptor): Port[] {
  return tool.outputs.filter((p) => p.artifact);
}

export function parseRef(ref: string): { node: string; port: string } | null {
  const i = ref.indexOf(':');
  if (i <= 0 || i === ref.length - 1) return null;
  const node = ref.slice(0, i);
  const port = ref.slice(i + 1);
  if (port.includes(':')) return null;
  return { node, port };
}