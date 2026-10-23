/**
 * Partida por concepto de L-PUB2-archivos.md, que cruzo el tope de 4096 B.
 * Operacion de un solo uso: si los archivos ya existen, no toca nada.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const D = 'C:/Users/nicou/Documents/IA/opita-code/docs/arquitectura/loops/';

if (existsSync(D + 'L-PUB2-comunidad.md') || existsSync(D + 'L-PUB2-guard.md')) {
  console.log('La partida ya esta hecha. No se toca nada.');
  process.exit(0);
}

const l = readFileSync(D + 'L-PUB2-archivos.md', 'utf8').split('\n');
const iComunidad = l.findIndex((x) => x.startsWith('## 3. LA LICENCIA'));
const iGuard = l.findIndex((x) => x.startsWith('## 6. EL GUARD'));

const cabecera = (titulo, extra) => `# ${titulo}

> ${extra}
> Spec 550. Tareas P1 a P5.
`;

const comunidad = l.slice(iComunidad, iGuard).join('\n').trim();
const guard = l.slice(iGuard).join('\n').trim();

// El primer documento conserva la introduccion y las secciones 1 y 2.
const resto = l.slice(0, iComunidad).join('\n').replace(/\n+$/, '');
const nuevo = resto + `

La licencia, los archivos de la comunidad y las plantillas de GitHub estan en
[comunidad](L-PUB2-comunidad.md). El hueco del guard, que aparecio al escribir
esos archivos, esta en [guard](L-PUB2-guard.md).
`;
writeFileSync(D + 'L-PUB2-archivos.md', nuevo);

writeFileSync(D + 'L-PUB2-comunidad.md', cabecera(
  'L-PUB2 · La comunidad',
  'Parte 2 de 3. [Archivos](L-PUB2-archivos.md) · [Guard](L-PUB2-guard.md) · [Indice](INDICE-publico.md)'
) + '\n' + comunidad + '\n');

writeFileSync(D + 'L-PUB2-guard.md', cabecera(
  'L-PUB2 · El guard que no miraba la raiz',
  'Parte 3 de 3. [Archivos](L-PUB2-archivos.md) · [Comunidad](L-PUB2-comunidad.md) · [Indice](INDICE-publico.md)'
) + '\n' + guard + '\n');

console.log('partido: L-PUB2-archivos.md + L-PUB2-comunidad.md + L-PUB2-guard.md');
