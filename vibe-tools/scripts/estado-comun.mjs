/**
 * LO COMPARTIDO POR LOS DOS GENERADORES DE LA SUPERFICIE PUBLICA.
 *
 * Por que existe: `generar-estado.mjs` produce el estado y los avances, y
 * `generar-sitio.mjs` produce el sitio. Los dos leen la misma fuente y
 * comparten el vocabulario (la tabla, el enlace relativo, la fecha). Copiar
 * ese vocabulario en los dos seria una segunda fuente de verdad, que es
 * exactamente lo que esta unidad vino a eliminar.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const root = join(here, '..', '..');

export const estado = JSON.parse(readFileSync(join(root, 'vibe-tools', 'estado.json'), 'utf8'));
export const k = estado.kpis;
export const cerrados = estado.loops.filter((l) => l.estado === 'cerrado');
export const siguiente = estado.loops.find((l) => l.estado === 'siguiente');
export const fecha = estado.proyecto.actualizado;

/** Texto sin espacios sobrantes. */
export const t = (s) => String(s ?? '').trim();

/** Enlace relativo desde un directorio del repo hacia otro. */
export function link(desde, hacia) {
  return relative(join(root, desde), join(root, hacia)).split(/[\\/]/).join('/');
}

/** Tabla de Markdown. Las celdas no pueden traer pipes sueltos. */
export function tabla(cabeceras, filas) {
  const linea = (c) => `| ${c.join(' | ')} |`;
  return [linea(cabeceras), linea(cabeceras.map(() => '---')), ...filas.map(linea)].join('\n');
}

/** El texto de "que se esta construyendo ahora", compartido por los tres archivos. */
export function lineaAhora() {
  return siguiente
    ? `**${siguiente.id} · ${siguiente.nombre}.** ${t(siguiente.abierto)}`
    : 'No hay ningun loop en cola.';
}
