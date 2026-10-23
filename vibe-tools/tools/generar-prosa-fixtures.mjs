/**
 * Genera el corpus de fixtures del prosa-guard: un archivo con un defecto de
 * cada clase, y dos controles limpios.
 *
 * POR QUE UN GENERADOR Y NO LOS ARCHIVOS A MANO. Una de las clases es el
 * CARACTER INVISIBLE: un espacio de ancho cero no se ve, no se puede escribir
 * a mano sin copiarlo de algun sitio, y si se mete con un editor de texto se
 * puede normalizar sin que nadie lo note. Generado, el byte es exacto.
 *
 * USO: node tools/generar-prosa-fixtures.mjs
 */
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, 'prosa-fixtures');

if (existsSync(dir)) rmSync(dir, { recursive: true });
mkdirSync(dir, { recursive: true });

const ZWSP = String.fromCharCode(0x200b);
const NBSP = String.fromCharCode(0x00a0);
const SHY = String.fromCharCode(0x00ad);

// Un archivo con UN defecto de cada clase que el guard debe cazar.
const defectos = [
  '# Fixture de prosa',
  '',
  'Una linea con voseo: vos podés tenés hacés.',
  'Una linea con un caracter invisible: ancho' + ZWSP + 'cero.',
  'Una linea con un espacio duro:$' + NBSP + 'asi.',
  'Una linea con un guion blando: asis' + SHY + 'to.',
  'Una linea con una palabra repetida: esto esto esta bien.',
  'Una linea con ingles que no es del repo: se judging no se puede.',
  'Una linea con un tabulador:',
  '\tcolumna',
  'Una linea con espacio al final: ',
  'Una linea con tres lineas en blanco debajo:',
  '',
  '',
  '',
  'Ultima linea.',
].join('\n');

writeFileSync(join(dir, 'fx1-defectos.md'), defectos, 'utf8');

// Un control limpio: debe dar CERO hallazgos.
writeFileSync(join(dir, 'fx2-limpio.md'), [
  '# Fixture limpio',
  '',
  'Esta es una linea de prosa normal, con la longitud de siempre, y con el',
  'registro que el repositorio usa: tuteado, sin voseo, sin ingles suelto.',
  '',
  'Una lista:',
  '',
  '- primera cosa',
  '- segunda cosa',
  '',
  'Un codigo en linea: `npm run check`.',
  '',
  'Un enlace: [el indice](INDICE.md).',
  '',
  '```bash',
  'npm run check',
  '```',
  '',
].join('\n'), 'utf8');

console.log(`\n  corpus de prosa: ${dir}`);
console.log('  fx1-defectos.md  un defecto de cada clase');
console.log('  fx2-limpio.md    control limpio, debe dar cero\n');
