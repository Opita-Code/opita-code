/**
 * CAPTURA CUALQUIER PAGINA A UN TAMANO DADO.
 *
 * Para que la verificacion visual sea REPRODUCIBLE y no una accion manual:
 * el comando esta en el repo, y cualquiera puede volver a sacar la misma
 * imagen y compararla.
 *
 * USO
 *   node tools/capturar.mjs <url> <salida.png> [ancho] [alto] [escala]
 *
 *   node tools/capturar.mjs file:///C:/.../site/index.html sitio.png 390 844 2
 *
 * QUE MIDE, Y POR QUE. El lienzo exacto, porque el viewport por defecto es
 * el de la ventana y no el que se pidio. Y el desbordamiento: si algo se sale
 * del lienzo, el script lo dice y sale con error, en vez de guardar una
 * imagen recortada sin que nadie lo note.
 */

import { writeFileSync } from 'node:fs';
import { abrirNavegador, fijarLienzoYMedir, dormir } from './cdp.mjs';

const [url, salida, anchoArg, altoArg, escalaArg] = process.argv.slice(2);
if (!url || !salida) {
  console.error('\n  USO: node tools/capturar.mjs <url> <salida.png> [ancho] [alto] [escala]\n');
  process.exit(2);
}
const ancho = Number(anchoArg ?? 1280);
const alto = Number(altoArg ?? 800);
const escala = Number(escalaArg ?? 1);

const { cliente, cerrar } = await abrirNavegador({ ancho, alto, escala });

try {
  const cargado = new Promise((res) => cliente.al('Page.loadEventFired', res));
  await cliente.enviar('Page.navigate', { url });
  await Promise.race([cargado, dormir(15000)]);
  await dormir(400);

  const medidas = await fijarLienzoYMedir(cliente, ancho, alto, escala);
  const fuera = medidas.scrollW > ancho || medidas.sueltos.length > 0;

  const shot = await cliente.enviar('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: ancho, height: alto, scale: 1 },
    captureBeyondViewport: false,
  });
  const buf = Buffer.from(shot.data, 'base64');
  writeFileSync(salida, buf);

  console.log(`\n  ${salida}  ${ancho}x${alto} @${escala}x  ${(buf.length / 1024).toFixed(1)} KB`);
  console.log(`  titulo: ${medidas.titulo}`);
  console.log(`  documento: ${medidas.scrollW}x${medidas.scrollH}`);
  if (fuera) {
    console.log(`  DESBORDA: ${medidas.sueltos.join(' | ')}`);
    process.exitCode = 1;
  } else {
    console.log('  nada se sale del lienzo');
  }
  console.log('');
} finally {
  cliente.cerrar();
  await cerrar();
}
