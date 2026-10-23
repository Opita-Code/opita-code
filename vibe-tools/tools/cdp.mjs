/**
 * CLIENTE CDP MINIMO, sobre el WebSocket que ya trae Node.
 *
 * POR QUE EXISTE. El probe de dark-copilot-rod no expone CDP generico (rod
 * v0.116: "doesn't expose generic raw CDP"), asi que no se puede fijar el
 * viewport ni recortar una captura. Y el MCP del harness no se puede invocar
 * desde un script, asi que no sirve para un procedimiento reproducible.
 * Node trae WebSocket y fetch, y con eso basta para hablar CDP de verdad:
 * cero dependencias, y el lienzo sale exacto.
 *
 * QUE OFRECE
 *   abrirNavegador()  lanza Edge o Chrome en headless, con el puerto de
 *                     depuracion en un archivo, y devuelve el cliente CDP.
 *   cliente.enviar()  una llamada CDP y su respuesta.
 *   cliente.al()      un listener de evento.
 *   cliente.cerrar()  cierra el websocket y mata el navegador.
 */

import { spawn } from 'node:child_process';
import { readFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export const NAVEGADORES = [
  process.env.OPITA_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].filter(Boolean);

export const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

export function navegadorDisponible() {
  return NAVEGADORES.find((p) => existsSync(p)) ?? null;
}

/** Espera a que el puerto de depuracion del navegador aparezca. */
async function puertoDeDepuracion(dir, ms = 20000) {
  const archivo = join(dir, 'DevToolsActivePort');
  const limite = Date.now() + ms;
  while (Date.now() < limite) {
    if (existsSync(archivo)) {
      const [puerto] = readFileSync(archivo, 'utf8').split('\n');
      if (puerto && puerto.trim()) return Number(puerto.trim());
    }
    await dormir(120);
  }
  throw new Error('el navegador no abrio el puerto de depuracion');
}

/** Cliente CDP: enviar y escuchar. */
function crearCliente(ws) {
  let id = 0;
  const pendientes = new Map();
  const oyentes = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pendientes.has(msg.id)) {
      const { res, rej } = pendientes.get(msg.id);
      pendientes.delete(msg.id);
      if (msg.error) rej(new Error(msg.error.message));
      else res(msg.result);
    } else if (msg.method) {
      for (const fn of oyentes.get(msg.method) ?? []) fn(msg.params);
    }
  });
  return {
    enviar(method, params = {}) {
      const idEnvio = ++id;
      return new Promise((res, rej) => {
        pendientes.set(idEnvio, { res, rej });
        ws.send(JSON.stringify({ id: idEnvio, method, params }));
      });
    },
    al(evento, fn) {
      if (!oyentes.has(evento)) oyentes.set(evento, []);
      oyentes.get(evento).push(fn);
    },
    cerrar() {
      try { ws.close(); } catch { /* ya estaba cerrado */ }
    },
  };
}

/**
 * Lanza el navegador y devuelve { cliente, cerrar }.
 * El cierre mata el proceso y limpia el perfil temporal.
 */
export async function abrirNavegador({ ancho = 1280, alto = 640, escala = 1 } = {}) {
  const binario = navegadorDisponible();
  if (!binario) {
    throw new Error(`no hay navegador. Se probaron: ${NAVEGADORES.join(', ')}`);
  }
  const perfil = join(tmpdir(), 'opita-cdp-' + process.pid);
  mkdirSync(perfil, { recursive: true });

  const proc = spawn(binario, [
    '--headless=new',
    '--remote-debugging-port=0',
    `--user-data-dir=${perfil}`,
    `--window-size=${ancho},${alto}`,
    '--hide-scrollbars',
    `--force-device-scale-factor=${escala}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu',
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'ignore'] });

  const cerrar = async () => {
    proc.kill();
    await dormir(300);
    try { rmSync(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch { /* se limpia luego */ }
  };

  try {
    const puerto = await puertoDeDepuracion(perfil);
    const lista = await (await fetch(`http://127.0.0.1:${puerto}/json/list`)).json();
    const pagina = lista.find((t) => t.type === 'page');
    if (!pagina) throw new Error('el navegador no abrio ninguna pagina');

    const ws = new WebSocket(pagina.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true });
      ws.addEventListener('error', () => rej(new Error('no se pudo abrir el websocket de CDP')), { once: true });
    });
    const cliente = crearCliente(ws);
    await cliente.enviar('Page.enable');
    return { cliente, cerrar, binario };
  } catch (e) {
    await cerrar();
    throw e;
  }
}

/**
 * Fija el lienzo y mide si algo se sale.
 *
 * SOLO cuenta el desbordamiento HORIZONTAL. Una pagina mas alta que el
 * viewport es normal: scrollea. Lo que es un defecto es que algo se salga de
 * lado, porque eso corta el contenido y no hay forma de verlo en la captura.
 */
export async function fijarLienzoYMedir(cliente, ancho, alto, escala = 1) {
  await cliente.enviar('Emulation.setDeviceMetricsOverride', {
    width: ancho, height: alto, deviceScaleFactor: escala, mobile: false,
  });
  const r = await cliente.enviar('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const c = ${ancho};
      const sueltos = [];
      for (const el of document.querySelectorAll('body *')) {
        const b = el.getBoundingClientRect();
        if (b.right > c + 0.5 || b.left < -0.5) {
          sueltos.push(el.tagName + ' ' + Math.round(b.left) + '..' + Math.round(b.right) + ' ancho ' + Math.round(b.width));
        }
      }
      return {
        scrollW: document.documentElement.scrollWidth,
        scrollH: document.documentElement.scrollHeight,
        sueltos,
        titulo: document.title,
      };
    })()`,
  });
  return r.result.value;
}
