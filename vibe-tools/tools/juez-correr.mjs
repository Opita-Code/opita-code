#!/usr/bin/env node
/**
 * L5-T1 · EL TRANSPORTE: ejecutar el plan contra el juez real.
 *
 * QUE ES. El unico archivo del pipeline que habla con el servidor. Hace cinco
 * cosas, y ninguna decide:
 *
 *   1. Lee el artefacto y lo parte por concepto, con `juez-partes.mjs`, que es
 *      la unica implementacion de la partida.
 *   2. Le pide el plan a `dist/src/juez/pipeline.js` (ambito, consenso,
 *      llamadas). El transporte NO elige cuantas muestras: las ejecuta.
 *   3. Escribe cada parte en un fichero temporal y llama al juez una vez por
 *      muestra, con `artifact_ref`.
 *   4. Comprueba que las partes releidas dan el original byte a byte.
 *   5. Traduce la respuesta del MCP a `Muestra` y le pasa las medidas al
 *      pipeline, que decide.
 *
 * POR QUE CADA PARTE VA EN UN FICHERO Y NO EN `content`.
 *
 *   MEDIDO el 2026-11-03, y es el hallazgo que justifica este archivo:
 *   `drift_judge` con `content` no usa el mismo camino. Devuelve el
 *   razonamiento crudo del modelo dentro de `verdict_json`, con un esquema
 *   distinto (`persona_id`, `eval_type`, `harness_id`, ...), una confianza
 *   distinta de la del veredicto interno, y NINGUN campo `verdict` en el
 *   sobre. Un cliente que lea `data.verdict` recibe `undefined`. Con
 *   `artifact_ref` la respuesta es la del juez: veredicto, confianza,
 *   proveedor, sha del artefacto y latencia.
 *
 * POR QUE UNA LLAMADA POR MUESTRA Y NO `consensus`.
 *
 *   Porque el consenso lo decide el pipeline, con su tabla de ambitos y su
 *   riesgo. Si lo decidiera el MCP, el que llama podria bajar el coste
 *   bajando las muestras sin que el plan lo viera. Ademas, las muestras de
 *   `consensus` no traen `provider_id` en su `verdict_json`, y el clasificador
 *   las tomaria por infraestructura.
 *
 * LO QUE NO HACE. No juzga, no agrega y no decide: eso es el pipeline. Y no
 * usa `content`, porque el camino por contenido devuelve otra cosa.
 *
 * USO
 *   node tools/juez-correr.mjs --ruta <rel> --afirmacion "<texto>"
 *     [--riesgo alto] [--tarifa <n> --moneda COP] [--conservar] [--json]
 *     [--raiz <dir>]
 *
 * `--raiz` existe para medir el transporte con un fixture: la ruta sigue
 * siendo relativa al repo (es la que decide el ambito), pero el archivo y las
 * partes viven bajo otra raiz. Sin el, un test del transporte tendria que
 * escribir dentro del arbol de trabajo, y un test que ensucia el repo se
 * acaba desactivando.
 *
 * CODIGOS DE SALIDA
 *   0 publicar · 1 corregir · 2 rechazo o error · 3 parar
 */

import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { partir, sha, verificar, TOPE } from './juez-partes.mjs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(join(AQUI, '..', '..'));
/**
 * El compilado se resuelve desde el directorio del script, no desde la raiz
 * del repo. En el checkout `tools/` y `dist/` son hermanos dentro de
 * `vibe-tools/`; en la copia que usa el runner de mutacion, `tools/` y
 * `dist/` son hermanos en la raiz de la copia. Las dos disposiciones tienen
 * que funcionar, y anclar `dist` a la raiz del repo solo funciona en una.
 */
const DIST = resolve(join(AQUI, '..', 'dist'));

// ---------------------------------------------------------------- argumentos

function argumentos(argv) {
  const out = { riesgo: 'normal', conservar: false, json: false, afirmaciones: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') out.json = true;
    else if (a === '--conservar') out.conservar = true;
    else if (a.startsWith('--')) {
      const clave = a.slice(2);
      const valor = argv[i + 1];
      if (valor === undefined || valor.startsWith('--')) throw new Error(`falta el valor de --${clave}`);
      // `--afirmacion` se repite: una por parte. Las demas claves son unicas.
      if (clave === 'afirmacion') out.afirmaciones.push(valor);
      else out[clave] = valor;
      i++;
    } else {
      throw new Error(`argumento inesperado: ${a}`);
    }
  }
  return out;
}

const USO =
  'uso: node tools/juez-correr.mjs --ruta <rel> --afirmacion "<texto>" [--afirmacion "<texto>"]... [--riesgo alto] [--tarifa <n> --moneda COP] [--conservar] [--json] [--raiz <dir>]';

// ------------------------------------------------------------ configuracion

/**
 * El comando y el entorno del servidor salen de la configuracion del harness,
 * no de valores inventados aqui. Es lo que evita el accidente caro: sin
 * `DARK_DB`, el servidor abre `./dark-memory.db` en el directorio de trabajo,
 * crea una base nueva y el proyecto no tiene ni juez ni sesiones.
 */
export function configDelServidor() {
  const porDefecto = {
    command: [process.env.DARK_MEM_BIN ?? join(homedir(), '.local', 'lib', 'dark-memory', 'dark-mem-mcp')],
    environment: {},
  };
  const ruta = join(homedir(), '.config', 'opencode', 'opencode.json');
  if (!existsSync(ruta)) return porDefecto;
  try {
    const cfg = JSON.parse(readFileSync(ruta, 'utf8'));
    const s = cfg?.mcp?.servers?.['dark-memory'] ?? cfg?.mcp?.['dark-memory'];
    if (!s || !Array.isArray(s.command) || s.command.length === 0) return porDefecto;
    const command = process.env.DARK_MEM_BIN ? [process.env.DARK_MEM_BIN] : s.command;
    return { command, environment: s.environment ?? {} };
  } catch {
    return porDefecto;
  }
}

// --------------------------------------------------------------- JSON-RPC

/**
 * El servidor escribe sus logs en stdout junto al JSON. Se descartan las
 * lineas que no son JSON y se correlaciona por `id`: leer stdout como si
 * fuera un flujo limpio es el error que hace que un cliente crea que todo
 * falla.
 */
function abrirServidor(config, { verbose = false } = {}) {
  const proc = spawn(config.command[0], config.command.slice(1), {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...config.environment },
  });
  let buf = '';
  const pendientes = new Map();
  proc.stdout.on('data', (d) => {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const linea = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!linea.startsWith('{')) continue;
      let msg;
      try {
        msg = JSON.parse(linea);
      } catch {
        continue;
      }
      if (msg.id !== undefined && pendientes.has(msg.id)) {
        pendientes.get(msg.id)(msg);
        pendientes.delete(msg.id);
      }
    }
  });
  proc.stderr.on('data', (d) => {
    if (verbose) process.stderr.write('[mcp] ' + d.toString());
  });
  proc.on('exit', (code) => {
    for (const [id, resolver] of pendientes) {
      resolver({ error: { code: 'E_SERVIDOR', message: `el servidor termino con codigo ${code} (llamada ${id})` } });
    }
    pendientes.clear();
  });

  let siguiente = 1;
  const llamar = (method, params, timeoutMs = 180000) =>
    new Promise((resolver, rechazar) => {
      const id = siguiente++;
      pendientes.set(id, resolver);
      proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
      const t = setTimeout(() => {
        if (pendientes.has(id)) {
          pendientes.delete(id);
          rechazar(new Error(`timeout de ${method} a los ${timeoutMs} ms`));
        }
      }, timeoutMs);
      t.unref?.();
    });

  return {
    llamar,
    cerrar: () => {
      try {
        proc.stdin.end();
      } catch {
        /* ya cerrado */
      }
      try {
        proc.kill();
      } catch {
        /* ya muerto */
      }
    },
  };
}

/** El texto de una respuesta MCP: `content[].text` con un sobre JSON dentro. */
function textoDe(res) {
  if (res?.error) {
    const e = res.error;
    return { error: `${e.code ?? 'E_MCP'}: ${e.message ?? 'sin mensaje'}` };
  }
  const partes = res?.result?.content;
  if (!Array.isArray(partes)) return { error: 'la respuesta no trae content' };
  return { texto: partes.map((c) => c.text ?? '').join('\n') };
}

/** Llama a una tool y devuelve su `data`, o el error del sobre. */
async function tool(cliente, nombre, args) {
  const res = await cliente.llamar('tools/call', { name: nombre, arguments: args });
  const t = textoDe(res);
  if (t.error) return { ok: false, error: t.error };
  let sobre;
  try {
    sobre = JSON.parse(t.texto);
  } catch {
    return { ok: false, error: 'la respuesta no es JSON' };
  }
  if (sobre?.error) {
    return { ok: false, error: `${sobre.error.code ?? 'E_MCP'}: ${sobre.error.message ?? ''}` };
  }
  if (!sobre?.data) return { ok: false, error: 'la respuesta no trae data' };
  return { ok: true, data: sobre.data };
}

/**
 * Traduce la respuesta del juez a una muestra.
 *
 * El veredicto vive DENTRO de `verdict_json`, que es una cadena JSON. Leer
 * `data.verdict` da `undefined`: el sobre no lo trae. Y si `verdict_json` no
 * es JSON, no se adivina: es una muestra que no vale, y se devuelve como
 * fallo de infraestructura con el motivo.
 *
 * EL PROVEEDOR SALE SOLO DE `verdict_json.provider_id`. El sobre trae un
 * campo `provider` que, medido, nombra el proveedor del camino por contenido
 * (`minimax`), no el juez que emitio el veredicto. Tomarlo como prueba de que
 * el juez respondio convertiria una cuota caida en una parada semantica: la
 * muestra diria `needs_human` con confianza 0 y un proveedor que no es el del
 * juicio. Si `verdict_json` no trae `provider_id`, el proveedor es `null` y el
 * pipeline lo trata como infraestructura.
 */
export function muestraDe(data) {
  let v;
  try {
    v = JSON.parse(data.verdict_json);
  } catch {
    return {
      veredicto: 'needs_human',
      confianza: 0,
      proveedor: null,
      latenciaMs: null,
      degradado: true,
      razon: 'verdict_json no es JSON: el camino por contenido devuelve el razonamiento crudo',
    };
  }
  const veredicto = v.verdict;
  if (veredicto !== 'aligned' && veredicto !== 'drift_detected' && veredicto !== 'needs_human') {
    return {
      veredicto: 'needs_human',
      confianza: 0,
      proveedor: null,
      latenciaMs: null,
      degradado: true,
      razon: `veredicto desconocido: ${String(veredicto)}`,
    };
  }
  const proveedor =
    typeof v.provider_id === 'string' && v.provider_id !== '' ? v.provider_id : null;
  return {
    veredicto,
    confianza: Number.isFinite(v.confidence) ? v.confidence : Number(data.confidence ?? 0),
    proveedor,
    latenciaMs: Number.isFinite(v.latency_ms) ? v.latency_ms : null,
    degradado: v.degraded === true,
    razon: typeof v.reasoning === 'string' ? v.reasoning : '',
  };
}

// ------------------------------------------------------------------- flujo

async function main() {
  const a = argumentos(process.argv.slice(2));
  if (!a.ruta || a.afirmaciones.length === 0) {
    console.error(USO);
    process.exit(2);
  }

  let pipeline;
  try {
    pipeline = await import(pathToFileURL(join(DIST, 'src', 'juez', 'pipeline.js')).href);
    await import(pathToFileURL(join(DIST, 'src', 'juez', 'coste.js')).href);
  } catch (e) {
    console.error(`\n  Falta el compilado del pipeline: corre \`npm run build\` en vibe-tools.\n  ${e.message}\n`);
    process.exit(2);
  }
  const { planificar, resolver, resumenDe, MedidaIncoherenteError } = pipeline;
  const { cobrar } = await import(pathToFileURL(join(DIST, 'src', 'juez', 'coste.js')).href);

  const rutaRel = a.ruta.replace(/\\/g, '/');
  const raiz = a.raiz === undefined ? ROOT : resolve(a.raiz);
  const abs = join(raiz, rutaRel);
  if (!existsSync(abs)) {
    console.error(`\n  No existe el artefacto: ${abs}\n`);
    process.exit(2);
  }
  const texto = readFileSync(abs, 'utf8');
  const ext = extname(abs);

  // 1. La partida, con la unica implementacion que hay.
  let trozos;
  try {
    trozos = partir(texto, TOPE, ext);
  } catch (e) {
    console.error(`\n  No se puede partir: ${e.message}\n  Un concepto que no cabe solo no se amputa.\n`);
    process.exit(2);
  }

  const partes = trozos.map((p, i) => ({
    n: i + 1,
    titulo: p.titulo,
    bytes: Buffer.byteLength(p.texto, 'utf8'),
    sha: sha(p.texto),
  }));

  // 2. El plan. Si se rechaza, no se gasta una sola llamada.
  const encargo = { ruta: rutaRel, afirmaciones: a.afirmaciones, evalType: 'drift_judge', riesgo: a.riesgo };
  const planificado = planificar(encargo, partes, { tope: TOPE });
  if (!planificado.ok) {
    console.error(`\n  ENCARGO RECHAZADO (${planificado.motivo}): ${planificado.detalle}\n`);
    process.exit(2);
  }
  const plan = planificado.plan;

  // 3. Las partes, en ficheros. El juez resuelve el artefacto leyendo un
  //    fichero; por `content` devuelve otra cosa (ver la cabecera).
  const slug = rutaRel.replace(/[^A-Za-z0-9._-]+/g, '_');
  const dir = join(raiz, '.partes-juez', slug);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const rutas = trozos.map((p, i) => {
    const nombre = `${basename(abs, ext)}.parte-${i + 1}${ext}`;
    const destino = join(dir, nombre);
    writeFileSync(destino, p.texto, 'utf8');
    return destino;
  });

  const config = configDelServidor();
  const cliente = abrirServidor(config, { verbose: a.verbose === 'true' });
  const medidas = [];
  let sessionId = null;
  let fallo = null;

  try {
    const init = await cliente.llamar('initialize', {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'juez-correr', version: '1.0' },
    });
    if (init?.error) throw new Error(`initialize: ${init.error.message ?? init.error.code}`);
    cliente.llamar('notifications/initialized', {}).catch(() => {});

    const sesion = await tool(cliente, 'dark_memory_session_start', { operator: 'opencode', project_id: 'opita-code' });
    if (!sesion.ok) throw new Error(`session_start: ${sesion.error}`);
    sessionId = sesion.data.session_id;

    for (const [i, rutaParte] of rutas.entries()) {
      const muestras = [];
      for (let k = 0; k < plan.consenso; k++) {
        const r = await tool(cliente, 'dark_memory_judge', {
          operator: 'opencode',
          eval_type: 'drift_judge',
          vibe_case: 'C1',
          artifact_ref: { kind: 'file', path: rutaParte },
          spec_intent: plan.afirmaciones[i],
        });
        if (!r.ok) {
          muestras.push({
            veredicto: 'needs_human',
            confianza: 0,
            proveedor: null,
            latenciaMs: null,
            degradado: true,
            razon: r.error,
          });
        } else {
          muestras.push(muestraDe(r.data));
        }
      }
      medidas.push({ parte: partes[i].n, sha: partes[i].sha, bytes: partes[i].bytes, muestras });
    }
  } catch (e) {
    fallo = e.message;
  } finally {
    if (sessionId !== null) {
      await tool(cliente, 'dark_memory_session_close', { session_id: sessionId, outcome: 'clean' }).catch(() => {});
    }
    cliente.cerrar();
  }

  // 4. Las partes releidas tienen que dar el original. Sin esto, el veredicto
  //    es de algo que no es el artefacto.
  const cuerpos = rutas.map((r) => readFileSync(r, 'utf8'));
  const composicion = verificar(texto, cuerpos);
  if (!a.conservar) rmSync(join(raiz, '.partes-juez'), { recursive: true, force: true });

  if (fallo !== null) {
    console.error(`\n  EL PIPELINE NO PUDO CORRER: ${fallo}\n`);
    process.exit(2);
  }
  if (!composicion.ok) {
    console.error(
      `\n  LAS PARTES NO DAN EL ORIGINAL: esperado ${composicion.esperado}, obtenido ${composicion.obtenido}\n  El veredicto no es del artefacto.\n`,
    );
    process.exit(2);
  }

  // 5. La decision.
  let publicacion;
  try {
    publicacion = resolver(plan, medidas);
  } catch (e) {
    if (e instanceof MedidaIncoherenteError) {
      console.error(`\n  MEDIDA INCOHERENTE: ${e.message}\n`);
      process.exit(2);
    }
    throw e;
  }

  const tarifa = a.tarifa !== undefined ? { porLlamada: Number(a.tarifa), moneda: a.moneda ?? 'COP' } : null;
  const cargo = tarifa === null ? null : cobrar(publicacion.coste, tarifa);

  if (a.json) {
    console.log(
      JSON.stringify(
        {
          ruta: rutaRel,
          ambito: plan.ambito,
          consenso: plan.consenso,
          partes: partes.map((p) => ({ n: p.n, titulo: p.titulo, bytes: p.bytes, sha: p.sha })),
          composicion,
          medidas,
          agregado: publicacion.agregado,
          decision: publicacion.decision,
          accion: publicacion.accion,
          coste: publicacion.coste,
          cargo,
        },
        null,
        2,
      ),
    );
  } else {
    console.log(`\n=== JUEZ · ${rutaRel} ===\n`);
    for (const linea of resumenDe(publicacion)) console.log('  ' + linea);
    for (const m of medidas) {
      const cuenta = m.muestras.map((s) => `${s.veredicto} ${s.confianza}`).join(' · ');
      console.log(`  parte ${m.parte} (${m.bytes} B): ${cuenta}`);
    }
    if (cargo !== null) {
      console.log(`  cargo: ${cargo.total} ${cargo.moneda} · margen no calculable (${cargo.motivoMargen})`);
    }
    console.log('');
  }

  process.exit(publicacion.decision === 'publicar' ? 0 : publicacion.decision === 'corregir' ? 1 : 3);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    console.error(`\n  ${e.message}\n`);
    process.exit(2);
  });
}
