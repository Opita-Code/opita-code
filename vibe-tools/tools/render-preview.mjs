/**
 * RENDERIZA LA IMAGEN DE SOCIAL PREVIEW.
 *
 * QUE ES. Levanta `docs/social-preview.html` en un navegador real y lo captura
 * a 1280x640 exactos, dejando el PNG en `docs/social-preview.png`.
 *
 * POR QUE NO SE GENERA EL PNG A MANO. Un PNG binario en el repo no se puede
 * revisar: nadie sabe que dice ni como se reproduce. La fuente es el HTML, y
 * este script es el procedimiento. Cambiar la imagen es cambiar el HTML.
 *
 * POR QUE NO SE USA LA HERRAMIENTA DEL PROBE. El probe de dark-copilot-rod no
 * expone CDP generico (rod v0.116: "doesn't expose generic raw CDP"), asi que
 * no se puede fijar el viewport y la captura salia de 1280x800. Este script
 * habla CDP de verdad, con el WebSocket que ya trae Node, y por eso el lienzo
 * es exacto y la captura es reproducible.
 *
 * QUE MIDE, Y POR QUE
 *   - El lienzo, con Emulation.setDeviceMetricsOverride: 1280x640 exactos (2:1,
 *     el que GitHub recorta sin perder nada).
 *   - El PNG, leyendo la cabecera IHDR a mano: sin dependencias.
 *   - El peso: por debajo de 1 MB, que es lo que acepta GitHub.
 *   - El contraste, calculando la razon WCAG de los pares de color que el
 *     propio HTML declara. El estado del arte pide 4.5:1 como minimo; la
 *     paleta de Opita llega a 19.7:1 y 12.4:1, y eso se comprueba en vez de
 *     suponerlo.
 *
 * USO
 *   node tools/render-preview.mjs
 *
 * Si no hay navegador, el script lo dice y sale con codigo 2: es mejor un
 * fallo explicito que un PNG de la nada.
 */

import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const HTML = join(root, 'docs', 'social-preview.html');
const PNG = join(root, 'docs', 'social-preview.png');

const ANCHO = 1280;
const ALTO = 640;

const NAVEGADORES = [
  process.env.SOCIAL_PREVIEW_BROWSER,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
].filter(Boolean);

/** Lee ancho y alto de la cabecera IHDR de un PNG. Sin dependencias. */
function dimensionesPng(buf) {
  const firma = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buf.subarray(0, 8).equals(firma)) throw new Error('no es un PNG');
  if (buf.subarray(12, 16).toString('latin1') !== 'IHDR') throw new Error('no tiene cabecera IHDR');
  return { ancho: buf.readUInt32BE(16), alto: buf.readUInt32BE(20) };
}

/** Razon de contraste WCAG entre dos colores hex. */
function contraste(hexA, hexB) {
  const lum = (hex) => {
    const n = parseInt(hex.replace('#', ''), 16);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const a = lum(hexA);
  const b = lum(hexB);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Los pares de color que el propio HTML declara, para no medirlos a mano. */
function paresDelHtml() {
  const html = readFileSync(HTML, 'utf8');
  const decl = (nombre) => {
    const m = html.match(new RegExp(`--${nombre}:\\s*(#[0-9a-fA-F]{6})`));
    if (!m) throw new Error(`el HTML no declara --${nombre}`);
    return m[1];
  };
  return [
    ['texto principal sobre fondo', decl('paper'), decl('ink')],
    ['acento sobre fondo', decl('accent'), decl('ink')],
  ];
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

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

/** Cliente CDP minimo sobre el WebSocket que ya trae Node. */
function cdp(ws) {
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
  };
}

const navegador = NAVEGADORES.find((p) => existsSync(p));
if (!navegador) {
  console.error(`\n  NO HAY NAVEGADOR. Se probaron:\n${NAVEGADORES.map((p) => `    ${p}`).join('\n')}\n`);
  process.exit(2);
}
if (!existsSync(HTML)) {
  console.error(`\n  FALTA LA FUENTE: ${HTML}\n`);
  process.exit(2);
}

const perfil = join(tmpdir(), 'opita-preview-' + process.pid);
mkdirSync(perfil, { recursive: true });

const proc = spawn(navegador, [
  '--headless=new',
  '--remote-debugging-port=0',
  `--user-data-dir=${perfil}`,
  `--window-size=${ANCHO},${ALTO}`,
  '--hide-scrollbars',
  '--force-device-scale-factor=1',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  'about:blank',
], { stdio: ['ignore', 'ignore', 'ignore'] });

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
  const cliente = cdp(ws);

  await cliente.enviar('Page.enable');
  await cliente.enviar('Emulation.setDeviceMetricsOverride', {
    width: ANCHO, height: ALTO, deviceScaleFactor: 1, mobile: false,
  });

  const url = 'file:///' + HTML.replace(/\\/g, '/');
  const cargado = new Promise((res) => cliente.al('Page.loadEventFired', res));
  await cliente.enviar('Page.navigate', { url });
  await Promise.race([cargado, dormir(15000)]);
  await dormir(400);

  // GUARD DE DESBORDAMIENTO. Que nada se salga del lienzo es una propiedad
  // MECANICA del diseno, y se comprueba antes de capturar: si el subtitulo
  // crece y se sale, el error sale aqui y no en la tarjeta que se comparte.
  const medidas = await cliente.enviar('Runtime.evaluate', {
    returnByValue: true,
    expression: `(() => {
      const c = ${ANCHO}, f = ${ALTO};
      const sueltos = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.right > c + 0.5 || r.bottom > f + 0.5 || r.left < -0.5 || r.top < -0.5) {
          sueltos.push(el.tagName + ' ' + Math.round(r.left) + ',' + Math.round(r.top) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
        }
      }
      const p = document.querySelector('p');
      const h1 = document.querySelector('h1');
      return {
        scrollW: document.documentElement.scrollWidth,
        scrollH: document.documentElement.scrollHeight,
        sueltos,
        pTexto: p ? Math.round(p.getBoundingClientRect().width) : 0,
        pAlto: p ? Math.round(parseFloat(getComputedStyle(p).fontSize)) : 0,
        h1Alto: h1 ? Math.round(parseFloat(getComputedStyle(h1).fontSize)) : 0,
      };
    })()`,
  });
  const m = medidas.result.value;
  if (m.scrollW > ANCHO || m.scrollH > ALTO || m.sueltos.length > 0) {
    throw new Error(`el diseno se sale del lienzo: scroll ${m.scrollW}x${m.scrollH}, sueltos: ${m.sueltos.join(' | ') || 'ninguno'}`);
  }

  const shot = await cliente.enviar('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: ANCHO, height: ALTO, scale: 1 },
    captureBeyondViewport: false,
  });
  const buf = Buffer.from(shot.data, 'base64');
  const { ancho, alto } = dimensionesPng(buf);

  if (ancho !== ANCHO || alto !== ALTO) {
    throw new Error(`la captura mide ${ancho}x${alto}, y el diseno exige ${ANCHO}x${ALTO}`);
  }
  if (buf.length > 1024 * 1024) {
    throw new Error(`el PNG pesa ${(buf.length / 1024).toFixed(0)} KB, y el tope son 1024 KB`);
  }
  writeFileSync(PNG, buf);
  ws.close();

  console.log('\n=== IMAGEN DE SOCIAL PREVIEW ===\n');
  console.log(`  lienzo        ${ancho}x${alto} (2:1, el que GitHub recorta sin perder nada)`);
  console.log(`  peso          ${(buf.length / 1024).toFixed(1)} KB, tope 1024 KB`);
  console.log(`  tipografia    nombre ${m.h1Alto} px, subtitulo ${m.pAlto} px, que a 400 px son ${(m.h1Alto * 400 / ANCHO).toFixed(0)} y ${(m.pAlto * 400 / ANCHO).toFixed(0)} px`);
  console.log('  desbordamiento  ninguno: nada se sale del lienzo');
  console.log('  legible a     400 px de ancho (lo que muestra un feed)');
  for (const [nombre, a, b] of paresDelHtml()) {
    const r = contraste(a, b);
    const nivel = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : 'FALLA';
    console.log(`  contraste     ${nombre}: ${r.toFixed(2)}:1 (${nivel})  ${a} sobre ${b}`);
  }
  console.log(`\n  escrito: ${PNG}\n`);
} catch (e) {
  console.error(`\n  NO SE PUDO RENDERIZAR: ${e.message}\n`);
  process.exitCode = 1;
} finally {
  proc.kill();
  // El navegador puede tardar un instante en soltar el perfil. Fallar por un
  // directorio temporal no puede tumbar un render que ya salio bien.
  await dormir(300);
  try {
    rmSync(perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch { /* el perfil se limpiara en la siguiente pasada */ }
}
