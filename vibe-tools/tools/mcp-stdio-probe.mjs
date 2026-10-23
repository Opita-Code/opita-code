/**
 * Sonda MCP por stdio: levanta un proceso FRESCO de dark-memory y le hace
 * una llamada real. Sirve para verificar una cadena sin depender de que el
 * harness reenganche el servidor.
 *
 * Uso: node tools/mcp-stdio-probe.mjs <tool_name> <args-json>
 *
 * PORTABILIDAD (tarea P1). Este archivo vivia con la ruta absoluta del
 * usuario hardcodeada en dos sitios, y eso hacia que la sonda no corriera en
 * ninguna otra maquina. Ahora:
 *   - el wrapper se deriva de homedir(), porque vive en el perfil del
 *     usuario y no en el repo; se puede sobrescribir con
 *     DARK_MEMORY_WRAPPER.
 *   - la raiz del repo se deriva de la ubicacion de ESTE archivo, no del
 *     directorio de trabajo.
 *   - los pasos pueden usar el marcador __ROOT__ para las rutas de artefacto.
 *     El juez resuelve el artefacto contra el CWD DEL PROCESO, asi que la
 *     ruta tiene que ser ABSOLUTA; __ROOT__ se sustituye por la raiz real
 *     antes de la llamada, y por eso sigue siendo portable.
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const WRAPPER = process.env.DARK_MEMORY_WRAPPER
  ?? join(homedir(), '.dark-research', 'artifacts', 'dark-memory-wrapper.ps1');
const toolName = process.argv[2] ?? 'dark_memory_llm_provider_status';
const rawArgs = process.argv[3] ?? '{}';
// El tercer argumento puede ser un JSON en linea o una ruta precedida por @.
const payloadText = rawArgs.startsWith('@') ? readFileSync(rawArgs.slice(1), 'utf8') : rawArgs;
// Acepta una llamada o una lista de llamadas encadenadas.
const steps = (() => {
  const parsed = JSON.parse(payloadText);
  return Array.isArray(parsed) ? parsed : [{ name: toolName, arguments: parsed }];
})();

const proc = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', WRAPPER], {
  stdio: ['pipe', 'pipe', 'pipe'],
});

let buf = '';
const pending = new Map();
proc.stdout.on('data', (d) => {
  buf += d.toString();
  let i;
  while ((i = buf.indexOf('\n')) >= 0) {
    const line = buf.slice(0, i).trim();
    buf = buf.slice(i + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  }
});
proc.stderr.on('data', (d) => process.stderr.write('[stderr] ' + d.toString()));

let nextId = 1;
const call = (method, params) =>
  new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, resolve);
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); reject(new Error('timeout ' + method)); } }, 180000);
  });

const init = await call('initialize', {
  protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'stdio-probe', version: '1.0' },
});
proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
console.log('initialize ok:', JSON.stringify(init?.result?.serverInfo ?? init?.result?.protocolVersion ?? '?'));

let sessionId = null;

/**
 * Sustituye marcadores dentro de los VALORES, no dentro del texto JSON.
 *
 * HALLAZGO (P1, verificado en la corrida). La primera version sustititia
 * sobre `JSON.stringify(args)`, y al meter la raiz del repo -- que en Windows
 * lleva barras invertidas -- el JSON resultante era INVALIDO: la barra es un
 * caracter de escape en JSON, asi que "C:\Users\nicou" se leia como
 * "C:<salto-de-linea>Users<retorno-de-carro>nicou". El servidor se colgaba y el
 * error estaba a tres lineas del sitio de la causa.
 *
 * La leccion es la misma que la del guard y el juez: si se sustituye dentro
 * de una representacion, hay que respectar la representacion. Sustituyendo
 * sobre los valores, da igual lo que contenga la ruta.
 */
function substitute(value, pairs) {
  if (typeof value === 'string') {
    let out = value;
    for (const [from, to] of pairs) out = out.split(from).join(to);
    return out;
  }
  if (Array.isArray(value)) return value.map((v) => substitute(v, pairs));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = substitute(v, pairs);
    return out;
  }
  return value;
}

// La raiz, con barras PROBANTES. No es cosmetico: el juez resuelve el
// artefacto con una ruta que el servidor abre tal cual, y todas las rutas
// que han funcionado usan barras forward.
const ROOT_POSIX = ROOT.split(/[\\/]/).join('/');

for (const step of steps) {
  const args = substitute(step.arguments ?? {}, [
    ['__SESSION__', sessionId ?? ''],
    ['__ROOT__', ROOT_POSIX],
  ]);
  const res = await call('tools/call', { name: step.name, arguments: args });
  const text = res?.result?.content?.map((c) => c.text).join('\n') ?? JSON.stringify(res);
  try {
    const parsed = JSON.parse(text);
    if (parsed?.data?.session_id) sessionId = parsed.data.session_id;
  } catch { /* la respuesta no es JSON: se imprime tal cual */ }
  console.log('\n=== ' + step.name + ' ===');
  console.log(text);
}
proc.kill();
process.exit(0);
