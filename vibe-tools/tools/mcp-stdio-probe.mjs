/**
 * Sonda MCP por stdio: levanta un proceso FRESCO de dark-memory y le hace
 * una llamada real. Sirve para verificar una cadena sin depender de que el
 * harness reenganche el servidor.
 *
 * Uso: node tools/mcp-stdio-probe.mjs <tool_name> <args-json>
 */
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const WRAPPER = 'C:/Users/nicou/.dark-research/artifacts/dark-memory-wrapper.ps1';
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
for (const step of steps) {
  // El placeholder __SESSION__ se sustituye por el session_id devuelto por el
  // session_start anterior, para no tener que hardcodearlo en el archivo.
  const args = JSON.parse(JSON.stringify(step.arguments ?? {}).replace(/__SESSION__/g, sessionId ?? ''));
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
