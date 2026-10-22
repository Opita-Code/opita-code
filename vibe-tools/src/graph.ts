/**
 * VALIDACION DE COMPOSICION (L0-T3)
 *
 * Nueve reglas, en orden fijo. El orden importa: el primer rechazo es el
 * veredicto. Fijarlo es lo que hace la funcion determinista y testeable.
 *
 * R0  nombres no contienen ':'            -> E_BAD_REF
 * R1  no hay nodos duplicados             -> E_DUPLICATE_NODE
 * R2  los extremos de cada arista existen -> E_DANGLING_NODE
 * R3  los puertos existen                 -> E_PORT_NOT_FOUND
 * R4  eje 1 coincide puerto a puerto      -> E_AXIS_MISMATCH
 * R5  determinista exige entradas         -> E_NONDETERMINISIC_INPUT
 *      deterministas
 * R6  un artifact no alimenta otro nodo   -> E_ARTIFACT_NOT_TERMINAL
 * R7  todo sink existe y es terminal      -> E_SINK_NOT_FOUND / E_SINK_NOT_TERMINAL
 * R8  toda salida sin arista es sink      -> E_UNDECLARED_SINK
 * R9  el modulo entrega al menos un       -> E_NO_ARTIFACT
 *      artifact
 */

import { tierAllows } from './axes.js';
import type { ModuleDescriptor, ToolDescriptor } from './contract.js';
import { integrityOf, outputPort, parseRef } from './contract.js';

export type RejectCode =
  | 'E_BAD_REF'
  | 'E_DUPLICATE_NODE'
  | 'E_DANGLING_NODE'
  | 'E_PORT_NOT_FOUND'
  | 'E_AXIS_MISMATCH'
  | 'E_NONDETERMINISTIC_INPUT'
  | 'E_ARTIFACT_NOT_TERMINAL'
  | 'E_SINK_NOT_FOUND'
  | 'E_SINK_NOT_TERMINAL'
  | 'E_UNDECLARED_SINK'
  | 'E_NO_ARTIFACT'
  | 'E_TIER_EFFECT';

export const REJECT_CODES: readonly RejectCode[] = [
  'E_BAD_REF',
  'E_DUPLICATE_NODE',
  'E_DANGLING_NODE',
  'E_PORT_NOT_FOUND',
  'E_AXIS_MISMATCH',
  'E_NONDETERMINISTIC_INPUT',
  'E_ARTIFACT_NOT_TERMINAL',
  'E_SINK_NOT_FOUND',
  'E_SINK_NOT_TERMINAL',
  'E_UNDECLARED_SINK',
  'E_NO_ARTIFACT',
  'E_TIER_EFFECT',
];

export interface CompiledModule {
  readonly module: ModuleDescriptor;
  readonly integrity: string;
  /** Orden estable de nodos: el que se ejecutaria en T0. */
  readonly executionOrder: readonly string[];
  /** Cuantas verificaciones corrieron. Sondas de rigor del verificador. */
  readonly checksRun: number;
}

export type Validation =
  | { readonly ok: true; readonly plan: CompiledModule }
  | {
      readonly ok: false;
      readonly code: RejectCode;
      readonly detail: string;
      readonly at: string | null;
      readonly checksRun: number;
    };

function reject(code: RejectCode, detail: string, at: string | null, checksRun: number): Validation {
  return { ok: false, code, detail, at, checksRun };
}

function hasColon(s: string): boolean {
  return s.includes(':');
}

export function validate(mod: ModuleDescriptor): Validation {
  let checksRun = 0;

  // ---- R0: nombres sin ':' (referencias son `nodo:puerto`) ----------------
  for (const n of mod.nodes) {
    checksRun++;
    if (hasColon(n.node) || n.node.length === 0) {
      return reject('E_BAD_REF', `id de nodo invalido: "${n.node}"`, null, checksRun);
    }
    for (const p of [...n.tool.inputs, ...n.tool.outputs]) {
      checksRun++;
      if (hasColon(p.name) || p.name.length === 0) {
        return reject('E_BAD_REF', `nombre de puerto invalido: "${p.name}" en ${n.node}`, n.node, checksRun);
      }
    }
  }

  // ---- R1: sin nodos duplicados -------------------------------------------
  const byId = new Map<string, ToolDescriptor>();
  for (const n of mod.nodes) {
    checksRun++;
    if (byId.has(n.node)) {
      return reject('E_DUPLICATE_NODE', `nodo duplicado: "${n.node}"`, n.node, checksRun);
    }
    byId.set(n.node, n.tool);
  }

  // ---- R11: el tier permite el efecto declarado ---------------------------
  for (const n of mod.nodes) {
    checksRun++;
    if (!tierAllows(n.tool.tier, n.tool.effect)) {
      return reject(
        'E_TIER_EFFECT',
        `herramienta ${n.tool.id} declara tier ${n.tool.tier} con efecto "${n.tool.effect}"`,
        n.node,
        checksRun,
      );
    }
  }

  const outEdges = new Map<string, number>();
  for (const e of mod.edges) {
    const k = `${e.from}:${e.fromPort}`;
    outEdges.set(k, (outEdges.get(k) ?? 0) + 1);
  }

  // ---- R2..R6 sobre cada arista ------------------------------------------
  for (const e of mod.edges) {
    const src = byId.get(e.from);
    checksRun++;
    if (src === undefined) {
      return reject('E_DANGLING_NODE', `origen inexistente: ${e.from}`, `${e.from}:${e.fromPort}`, checksRun);
    }
    const dst = byId.get(e.to);
    checksRun++;
    if (dst === undefined) {
      return reject('E_DANGLING_NODE', `destino inexistente: ${e.to}`, `${e.to}:${e.toPort}`, checksRun);
    }

    const sp = src.outputs.find((p) => p.name === e.fromPort);
    checksRun++;
    if (sp === undefined) {
      return reject('E_PORT_NOT_FOUND', `puerto de salida inexistente: ${e.from}:${e.fromPort}`, `${e.from}:${e.fromPort}`, checksRun);
    }
    const dp = dst.inputs.find((p) => p.name === e.toPort);
    checksRun++;
    if (dp === undefined) {
      return reject('E_PORT_NOT_FOUND', `puerto de entrada inexistente: ${e.to}:${e.toPort}`, `${e.to}:${e.toPort}`, checksRun);
    }

    // R4: eje 1 debe coincidir
    checksRun++;
    if (sp.produces !== dp.produces) {
      return reject(
        'E_AXIS_MISMATCH',
        `${sp.produces} no conecta a ${dp.produces}: ${e.from}:${e.fromPort} -> ${e.to}:${e.toPort}`,
        `${e.to}:${e.toPort}`,
        checksRun,
      );
    }

    // R5: una herramienta determinista solo puede recibir entradas deterministas
    checksRun++;
    if (dst.determinism === 'deterministic' && src.determinism !== 'deterministic') {
      return reject(
        'E_NONDETERMINISTIC_INPUT',
        `${dst.id} es determinista pero consume de ${src.id} que es ${src.determinism}`,
        `${e.to}:${e.toPort}`,
        checksRun,
      );
    }

    // R6: un artifact no se compone hacia adentro
    checksRun++;
    if (sp.artifact === true) {
      return reject(
        'E_ARTIFACT_NOT_TERMINAL',
        `${e.from}:${e.fromPort} es artifact y no puede alimentar ${e.to}`,
        `${e.from}:${e.fromPort}`,
        checksRun,
      );
    }
  }

  // ---- R7: sinks declarados existen y son terminales ----------------------
  const declared = new Set<string>();
  for (const s of mod.sinks) {
    checksRun++;
    const ref = parseRef(s);
    if (ref === null) {
      return reject('E_SINK_NOT_FOUND', `referencia de sink invalida: "${s}"`, s, checksRun);
    }
    const tool = byId.get(ref.node);
    if (tool === undefined) {
      return reject('E_SINK_NOT_FOUND', `sink sobre nodo inexistente: "${s}"`, s, checksRun);
    }
    if (outputPort(tool, ref.port) === undefined) {
      return reject('E_SINK_NOT_FOUND', `sink sobre puerto inexistente: "${s}"`, s, checksRun);
    }
    if ((outEdges.get(s) ?? 0) > 0) {
      return reject('E_SINK_NOT_TERMINAL', `sink "${s}" tiene ${outEdges.get(s) as number} arista(s) saliente(s)`, s, checksRun);
    }
    declared.add(s);
  }

  // ---- R8: toda salida sin arista saliente debe declararse sink -----------
  for (const n of mod.nodes) {
    for (const p of n.tool.outputs) {
      checksRun++;
      const ref = `${n.node}:${p.name}`;
      if ((outEdges.get(ref) ?? 0) === 0 && !declared.has(ref)) {
        return reject('E_UNDECLARED_SINK', `salida terminal "${ref}" no declarada como sink`, ref, checksRun);
      }
    }
  }

  // ---- R9: el modulo entrega al menos un artifact ------------------------
  let artifactCount = 0;
  for (const s of mod.sinks) {
    const ref = parseRef(s);
    if (ref === null) continue;
    const tool = byId.get(ref.node);
    if (tool === undefined) continue;
    const port = outputPort(tool, ref.port);
    if (port !== undefined && port.artifact === true) artifactCount++;
  }
  checksRun++;
  if (artifactCount === 0) {
    return reject('E_NO_ARTIFACT', 'el modulo no entrega ningun artifact', null, checksRun);
  }

  return {
    ok: true,
    plan: {
      module: mod,
      integrity: integrityOf(mod),
      executionOrder: mod.nodes.map((n) => n.node),
      checksRun,
    },
  };
}