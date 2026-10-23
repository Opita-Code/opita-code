/**
 * RENDER — SVG. T0, sin efecto, determinista.
 *
 * Produce SVG, y eso no es un atajo: SVG es un formato de imagen de verdad, de
 * texto, y por lo tanto determinista. La alternativa habria sido afirmar que
 * produce `image` y devolver algo que no es una imagen, que es el modo de falla
 * que mas caro da: un descriptor que miente survives porque nadie mira el valor.
 *
 * POR QUE ESCAPA Y NO ES COSMETICO
 * El valor de EXEC viene de una expresion que el autor escribio, o sea que puede
 * contener `<`, `&` o `"`. Pegado tal cual en el texto del SVG rompe el
 * documento: el artifact deja de ser una imagen y pasa a ser markup inyectado
 * desde una tool que el sandbox considero inocua. Escalar y escapar no es
 * robustez de presentacion: es la frontera entre "una imagen" y "codigo que se
 * ejecuta en el visor".
 *
 * EL TAMAÑO SE CALCULA DEL TEXTO, NO SE INVENTA
 * Un `width` fijo con texto largo produce una imagen cortada, que es un artifact
 * roto que el validador no puede ver. El ancho sigue al texto, y por eso dos
 * textos distintos dan dos SVG distintos: el output es funcion del input, que es
 * lo que un artifact determinista tiene que ser.
 */

import type { ToolDescriptor } from '../contract.js';
import type { ToolImpl } from '../tool.js';

export const RENDER_DESCRIPTOR: ToolDescriptor = {
  id: 'opita.render',
  version: '0.1.0',
  author: 'opita',
  title: 'renderiza un valor como SVG',
  determinism: 'deterministic',
  tier: 'T0',
  effect: 'none',
  inputs: [{ name: 'value', produces: 'text', artifact: false }],
  outputs: [{ name: 'svg', produces: 'image', artifact: true }],
};

/** Los cinco que XML necesita. `'` en un atributo delimitado por `"` es inocuo. */
export function escapeXml(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const CHAR_W = 8;
const PAD = 16;
const LINE_H = 24;

export function renderSvg(value: string): string {
  const lines = value.split('\n');
  const width = Math.max(...lines.map((l) => l.length)) * CHAR_W + PAD * 2;
  const height = lines.length * LINE_H + PAD * 2;
  const body = lines
    .map((l, i) => `<text x="${PAD}" y="${PAD + i * LINE_H}" font-family="monospace">${escapeXml(l)}</text>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${body}</svg>`;
}

export const RENDER_IMPL: ToolImpl = (input) => {
  const value = input['value'];
  if (typeof value !== 'string') return { ok: false, error: 'falta el puerto de entrada value' };
  return { ok: true, outputs: [{ port: 'svg', value: renderSvg(value) }] };
};
