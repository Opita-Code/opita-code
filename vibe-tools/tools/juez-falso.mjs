#!/usr/bin/env node
/**
 * L5 · EL DOBLE DEL SERVIDOR MCP, PARA MEDIR EL TRANSPORTE SIN PROVEEDOR.
 *
 * QUE ES. Un servidor JSON-RPC 2.0 por stdio que responde las cuatro tools que
 * usa `juez-correr.mjs` (`initialize`, `session_start`, `judge`,
 * `session_close`) con la forma exacta que devuelve el servidor real. No llama
 * a ningun modelo: el veredicto lo elige `JUEZ_FALSO_MODO`.
 *
 * POR QUE EXISTE. El transporte tiene que poder medirse en la CI, donde no hay
 * keyring, ni cuota, ni proveedor. Sin un doble, la unica forma de saber si el
 * transporte traduce bien la respuesta es gastar una llamada real, y un test
 * que depende de un proveedor externo se acaba saltando.
 *
 * LO QUE COPIA DEL SERVIDOR REAL, y es lo que hace que el test valga:
 *
 *   - El sobre de dos capas: `result.content[].text` con un `{data: ...}`
 *     dentro. Un cliente que solo lee `content` cree que todo falla.
 *   - El veredicto DENTRO de `verdict_json`, que es una cadena JSON. Leer
 *     `data.verdict` da `undefined`.
 *   - Logs en stdout junto al JSON, sin empezar por `{`. El transporte tiene
 *     que descartarlos y correlacionar por `id`; si no, el test no mide eso.
 *   - `needs_human` con confianza 0 y sin proveedor para la cuota caida, que
 *     es el patron que distingue infraestructura de juicio.
 *
 * LO QUE NO HACE. No valida el artefacto, no lee el fichero de la parte y no
 * parte nada: el transporte es el que parte, escribe las partes y comprueba
 * que recomponen el original.
 *
 * MODOS (`JUEZ_FALSO_MODO`)
 *   aligned · drift · semantico · infra · sin_proveedor · malformed · disenso
 *   latencia_variable
 *
 * `JUEZ_FALSO_LOG` (opcional): ruta de un JSONL donde se anota cada llamada al
 * juez. Es lo que permite afirmar «no se gasto ninguna llamada» en vez de
 * suponerlo.
 */

import { appendFileSync } from 'node:fs';

const MODO = process.env.JUEZ_FALSO_MODO ?? 'aligned';
const LOG = process.env.JUEZ_FALSO_LOG ?? null;

let llamadasAlJuez = 0;

/** El veredicto que devuelve el modo, con la forma del juez real. */
function veredicto() {
  const n = llamadasAlJuez;
  switch (MODO) {
    case 'drift':
      return {
        verdict: 'drift_detected',
        confidence: 0.98,
        provider_id: 'judge-minimax',
        latency_ms: 12000,
        degraded: false,
        reasoning: 'dice 8192 donde la fuente dice 4096',
      };
    case 'semantico':
      return {
        verdict: 'needs_human',
        confidence: 0.7,
        provider_id: 'judge-minimax',
        latency_ms: 9000,
        degraded: false,
        reasoning: 'el juez respondio y no pudo sostener la afirmacion',
      };
    case 'infra':
      return {
        verdict: 'needs_human',
        confidence: 0,
        latency_ms: null,
        degraded: true,
        reasoning: 'nli: provider rate limited',
      };
    case 'sin_proveedor':
      return {
        verdict: 'needs_human',
        confidence: 0,
        latency_ms: null,
        degraded: false,
        reasoning: 'cuota agotada: no hay proveedor que responda',
      };
    case 'disenso':
      return n % 2 === 0
        ? {
            verdict: 'aligned',
            confidence: 0.99,
            provider_id: 'judge-minimax',
            latency_ms: 10000,
            degraded: false,
            reasoning: 'el artefacto afirma lo que el intent dice',
          }
        : {
            verdict: 'drift_detected',
            confidence: 0.98,
            provider_id: 'judge-minimax',
            latency_ms: 10000,
            degraded: false,
            reasoning: 'la misma parte, mirada dos veces, no dice lo mismo',
          };
    case 'latencia_variable':
      return {
        verdict: 'aligned',
        confidence: 0.99,
        provider_id: 'judge-minimax',
        latency_ms: 10 * (n + 1),
        degraded: false,
        reasoning: 'el artefacto afirma lo que el intent dice',
      };
    default:
      return {
        verdict: 'aligned',
        confidence: 0.99,
        provider_id: 'judge-minimax',
        latency_ms: 14294,
        degraded: false,
        reasoning: 'el artefacto afirma lo que el intent dice',
      };
  }
}

function responder(id, result) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result }) + '\n');
}

function responderError(id, code, message) {
  process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }) + '\n');
}

/** El sobre de una tool: `content[].text` con `{data}` dentro. */
function sobre(data) {
  return { content: [{ type: 'text', text: JSON.stringify({ data }) }] };
}

function llamarTool(name, args) {
  if (name === 'dark_memory_session_start') {
    return sobre({ session_id: 'sess-falso', project_id: args?.project_id ?? null });
  }
  if (name === 'dark_memory_session_close') {
    return sobre({ session_id: args?.session_id ?? null, outcome: 'clean' });
  }
  if (name === 'dark_memory_judge') {
    llamadasAlJuez += 1;
    if (LOG !== null) {
      appendFileSync(
        LOG,
        JSON.stringify({
          n: llamadasAlJuez,
          eval_type: args?.eval_type ?? null,
          intent: args?.spec_intent ?? null,
          artifact: args?.artifact_ref ?? null,
          tiene_content: args?.content !== undefined,
        }) + '\n',
        'utf8',
      );
    }
    if (MODO === 'malformed') {
      return sobre({ verdict_json: 'el modelo penso durante tres parrafos y no emitio un veredicto' });
    }
    return sobre({
      verdict_json: JSON.stringify(veredicto()),
      provider: 'minimax',
      confidence: 0.99,
    });
  }
  return { error: { code: 'E_TOOL', message: `tool desconocida: ${name}` } };
}

// ------------------------------------------------------------------ bucle

let buf = '';
process.stdin.on('data', (d) => {
  buf += d.toString();
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const linea = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (linea === '') continue;
    let msg;
    try {
      msg = JSON.parse(linea);
    } catch {
      continue;
    }

    // Un log del servidor real no es JSON. El transporte tiene que
    // descartarlo; aqui se emite uno antes de cada respuesta para que el
    // test lo vea.
    process.stdout.write('[juez-falso] linea de log que no es JSON\n');

    // Una notificacion no lleva id y no se responde.
    if (msg.id === undefined) continue;

    if (msg.method === 'initialize') {
      responder(msg.id, {
        protocolVersion: '2025-06-18',
        capabilities: { tools: {} },
        serverInfo: { name: 'juez-falso', version: '1.0.0' },
      });
      continue;
    }
    if (msg.method === 'tools/call') {
      const r = llamarTool(msg.params?.name, msg.params?.arguments);
      if (r.error) responderError(msg.id, r.error.code, r.error.message);
      else responder(msg.id, r);
      continue;
    }
    responderError(msg.id, -32601, `metodo no encontrado: ${msg.method}`);
  }
});
