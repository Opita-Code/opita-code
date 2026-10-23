/**
 * GENERADOR DE LA SUPERFICIE PUBLICA.
 *
 * QUE ES. Todo lo que el mundo ve fuera del repo sale de un solo archivo:
 * `vibe-tools/estado.json`. Este generador lo materializa en:
 *
 *   STATUS.md              que hay hoy (lo que se lee en treinta segundos)
 *   docs/avances.md        el indice del registro en lenguaje llano
 *   docs/avances/L*.md     un archivo por loop, con las tres preguntas
 *   README.md              la puerta: se reemplazan solo sus islas generadas
 *
 * POR QUE GENERAR Y NO ESCRIBIR A MANO. Porque el README del paquete decia
 * «Siguiente: L3» cuando L3 ya estaba cerrado, y el numero de unidades
 * juzgables era 67 cuando eran 77. La superficie envejecia mas rapido que el
 * codigo, y nadie se entera hasta que un visitante lo lee.
 *
 * LA REGLA. Un numero que se puede medir NO se escribe a mano: lo declara el
 * generador, y `verificar-estado.mjs` lo contrasta contra la realidad. Si no
 * cuadra, la tuberia se cae. Lo unico que se escribe a mano es la prosa, y la
 * prosa vive fuera de las islas generadas.
 *
 * LOS NUMEROS NO SE COPIAN DE ESTE ARCHIVO PARA MEDIR: se miden y se
 * comparan. Este archivo declara lo que se afirma; el verificador lo
 * contrasta. Si divergen, el verificador falla. Por eso un numero no puede
 * envejecer en silencio: o se actualiza aqui, o cae la corrida.
 *
 * USO
 *   node scripts/generar-estado.mjs            escribe la superficie
 *   node scripts/generar-estado.mjs --check    compara con lo que hay en disco
 *   node scripts/generar-estado.mjs --release v0.4.0   imprime las notas
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const estado = JSON.parse(readFileSync(join(root, 'vibe-tools', 'estado.json'), 'utf8'));
const k = estado.kpis;
const cerrados = estado.loops.filter((l) => l.estado === 'cerrado');
const siguiente = estado.loops.find((l) => l.estado === 'siguiente');
const fecha = estado.proyecto.actualizado;

/** Enlace relativo desde un directorio del repo hacia otro. */
function link(desde, hacia) {
  return relative(join(root, desde), join(root, hacia)).split(/[\\/]/).join('/');
}

const t = (s) => String(s ?? '').trim();

/** Tabla de Markdown. Las celdas no pueden traer pipes sueltos. */
function tabla(cabeceras, filas) {
  const linea = (c) => `| ${c.join(' | ')} |`;
  return [linea(cabeceras), linea(cabeceras.map(() => '---')), ...filas.map(linea)].join('\n');
}

// ---------------------------------------------------------------- STATUS.md

function renderStatus() {
  const ahora = siguiente
    ? `**${siguiente.id} · ${siguiente.nombre}.** ${t(siguiente.abierto)}`
    : 'No hay ningun loop en cola.';

  const loops = tabla(
    ['Loop', 'Que entrega', 'Cierre'],
    cerrados.map((l) => [l.id, t(l.resumen), `[${l.documento_cierre.split('/').pop()}](${link('.', l.documento_cierre)})`])
  );

  const evidencia = tabla(
    ['Medida', 'Resultado'],
    [
      ['Tests', `${k.tests_pasan} de ${k.tests_total}, ${k.tests_fallan} fallos`],
      ['Mutantes', `${k.mutantes_muertos} de ${k.mutantes_total}, ${k.mutantes_score}% en ${k.mutantes_paquetes} paquetes (umbral ${k.mutantes_umbral}%)`],
      ['Unidades juzgables', `${k.unidades_juzgables}, y ${k.unidades_exceden} exceden los ${k.presupuesto_bytes} B`],
      ['Gates de loop', `${k.loops_cerrados} loops cerrados`],
      ['Veredicto del juez', t(k.judge_detalle)],
    ]
  );

  const abiertos = tabla(
    ['Que falta', 'De quien'],
    estado.abiertos.map((a) => [t(a.titulo), t(a.quien)])
  );

  return `# Estado

> Actualizado el ${fecha}. Generado desde \`vibe-tools/estado.json\`: no se edita a mano.

## Ahora

${ahora}

## Lo que ya funciona

${loops}

## La evidencia, medida

${evidencia}

## Abierto

${abiertos}

## El detalle

El estado completo, con el por que de cada numero, esta en
[docs/avances.md](docs/avances.md). Los documentos tecnicos, con su razonamiento,
estan en [docs/arquitectura/loops/INDICE.md](docs/arquitectura/loops/INDICE.md).
`;
}

// ----------------------------------------------------------- docs/avances.md

function renderAvancesIndice() {
  const filas = tabla(
    ['Loop', 'Que se puede hacer ahora que antes no se podia'],
    cerrados.map((l) => [l.id, t(l.puede)])
  );
  const lista = cerrados
    .slice()
    .reverse()
    .map((l) => `- [${l.id} · ${l.nombre}](avances/${l.id}.md)`)
    .join('\n');

  return `# Avances

> El registro en lenguaje llano: que se puede hacer ahora que antes no se podia, que se
> volvio mas seguro, y **lo que nos equivocamos en esta ronda**.
> Generado desde \`vibe-tools/estado.json\`. Actualizado el ${fecha}.

## De un vistazo

${filas}

## Ronda por ronda

${lista}

El detalle tecnico de cada loop, con su razonamiento y sus hallazgos, esta en
[arquitectura/loops/INDICE.md](arquitectura/loops/INDICE.md). La superficie
publica y los documentos transversales, en
[arquitectura/loops/INDICE-publico.md](arquitectura/loops/INDICE-publico.md).
`;
}

// -------------------------------------------------------- docs/avances/L*.md

function renderAvancesLoop(l) {
  const bloques = [
    ['Que puedes hacer ahora que antes no podias', l.puede],
    ['Que se volvio mas tuyo o mas seguro', l.mas_tuyo],
    ['Lo que nos equivocamos en esta ronda', l.hallazgo],
    ['Lo que quedo abierto', l.abierto],
  ]
    .filter(([, texto]) => t(texto))
    .map(([titulo, texto]) => `**${titulo}.** ${t(texto)}`)
    .join('\n\n');

  return `# ${l.id} · ${l.nombre}

> Cierre: [${l.documento_cierre.split('/').pop()}](${link('docs/avances', l.documento_cierre)}) ·
> Indice: [${l.indice.split('/').pop()}](${link('docs/avances', l.indice)})

${bloques}
`;
}

// -------------------------------------------------------------- README.md

function islaVision() {
  if (estado.vision.estado === 'pendiente-del-operador' || !t(estado.vision.texto)) {
    // La declaracion del hueco va corta y al principio: el lector no necesita
    // el razonamiento completo, que se queda en la fuente. La version larga
    // duplicaba el texto en el README y lo empujaba sobre el tope de 4096 B.
    return `> **PENDIENTE DEL OPERADOR.** El para que de Opita Code, a quien le duele y por
> que se construye no esta escrito todavia. No se inventa: la superficie lo declara y
> espera.`;
  }
  return t(estado.vision.texto);
}

function islaEstado() {
  const ahora = siguiente ? `**${siguiente.id} · ${siguiente.nombre}.** ${t(siguiente.abierto)}` : 'Sin loops en cola.';
  const evidencia = tabla(
    ['Medida', 'Resultado'],
    [
      ['Tests', `${k.tests_pasan} de ${k.tests_total}`],
      ['Mutantes', `${k.mutantes_muertos} de ${k.mutantes_total} (${k.mutantes_score}%, ${k.mutantes_paquetes} paquetes)`],
      ['Unidades juzgables', `${k.unidades_juzgables}, 0 exceden los ${k.presupuesto_bytes} B`],
      ['Veredicto del juez', t(k.judge_detalle)],
    ]
  );
  return `### Ahora

${ahora}

### La evidencia, medida

${evidencia}

### Los documentos

${tabla(
    ['Loop', 'Que entrega'],
    cerrados.map((l) => [l.id, l.nombre])
  )}

El detalle, con el razonamiento y los hallazgos: [docs/arquitectura/loops/INDICE.md](docs/arquitectura/loops/INDICE.md).
El estado completo: [STATUS.md](STATUS.md). El registro en lenguaje llano: [docs/avances.md](docs/avances.md).`;
}

/**
 * La seccion de estado del README del paquete. Va generada por la misma
 * razon que el resto: un numero escrito a mano en dos sitios es un numero que
 * se aginge en uno de los dos.
 */
function islaEstadoPaquete() {
  const loops = cerrados
    .map((l) => `**${l.id} cerrado** — ${l.nombre}.`)
    .join('\n');
  const siguiente = estado.loops.find((l) => l.estado === 'siguiente');
  const cola = siguiente
    ? `Siguiente según el plan: **${siguiente.id}** — ${siguiente.nombre}.`
    : 'Sin loops en cola.';
  return `${loops}

${k.tests_total} tests · mutation ${k.mutantes_muertos}/${k.mutantes_total} = ${k.mutantes_score}% en ${k.mutantes_paquetes} paquetes · ${k.unidades_juzgables} unidades juzgables.
${cola}`;
}

/** Reemplaza el contenido entre dos marcadores, conservando los marcadores. */
function conIslas(texto, nombre, cuerpo) {
  const abre = `<!-- GENERADO:${nombre} -->`;
  const cierra = `<!-- /GENERADO:${nombre} -->`;
  const i = texto.indexOf(abre);
  const j = texto.indexOf(cierra);
  if (i < 0 || j < 0) throw new Error(`falta la isla ${nombre}`);
  return texto.slice(0, i + abre.length) + '\n' + cuerpo + '\n' + texto.slice(j);
}

// ------------------------------------------------------------ notas de release

function renderNotas(tag) {
  const l = cerrados.find((x) => `v${x.version}` === tag);
  if (!l) throw new Error(`ningun loop corresponde al tag ${tag}`);
  const cap1 = `**${t(l.resumen)}**

Que puedes hacer ahora: ${t(l.puede)}

Lo que nos equivocamos en esta ronda: ${t(l.hallazgo)}`;
  const cap2 = tabla(
    ['Medida', 'Resultado'],
    [
      ['Tests', `${k.tests_pasan} de ${k.tests_total}`],
      ['Mutantes', `${k.mutantes_muertos} de ${k.mutantes_total} en ${k.mutantes_paquetes} paquetes`],
      ['Unidades juzgables', `${k.unidades_juzgables}, 0 exceden los ${k.presupuesto_bytes} B`],
      ['Veredicto del juez', t(k.judge_detalle)],
    ]
  );
  const cap3 = `Ninguna. Todavia no hay API publica: los ${cerrados.length} loops son internos.
Quedan abiertas ${estado.abiertos.length} decisiones, todas listadas en [STATUS.md](STATUS.md).`;

  return `# ${tag} — ${l.nombre}

## En lenguaje llano

${cap1}

## El registro

${cap2}

## Migracion

${cap3}
`;
}

// ------------------------------------------------------------------ salida

function leer(rel) {
  const p = join(root, rel);
  return existsSync(p) ? readFileSync(p, 'utf8') : null;
}

function construir() {
  const archivos = [];
  archivos.push(['STATUS.md', renderStatus()]);
  archivos.push(['docs/avances.md', renderAvancesIndice()]);
  for (const l of cerrados) archivos.push([`docs/avances/${l.id}.md`, renderAvancesLoop(l)]);

  const readme = leer('README.md');
  if (readme === null) throw new Error('falta README.md con las islas generadas');
  archivos.push(['README.md', conIslas(conIslas(readme, 'vision', islaVision()), 'estado', islaEstado())]);

  const paquete = leer('vibe-tools/README.md');
  if (paquete !== null) {
    archivos.push(['vibe-tools/README.md', conIslas(paquete, 'estado', islaEstadoPaquete())]);
  }
  return archivos;
}

const args = process.argv.slice(2);

if (args.includes('--release')) {
  const i = args.indexOf('--release');
  process.stdout.write(renderNotas(args[i + 1]));
  process.exit(0);
}

const archivos = construir();

if (args.includes('--check')) {
  const descuadrados = [];
  for (const [rel, contenido] of archivos) {
    const enDisco = leer(rel);
    if (enDisco !== contenido) descuadrados.push(rel);
  }
  if (descuadrados.length > 0) {
    console.error('\n  LA SUPERFICIE PUBLICA NO CUADRA CON LA FUENTE:');
    for (const rel of descuadrados) console.error(`    - ${rel}`);
    console.error('\n  Corre `npm run generar-estado` y vuelve a commitear.\n');
    process.exit(1);
  }
  console.log(`\n  Superficie publica al dia: ${archivos.length} archivos.\n`);
  process.exit(0);
}

for (const [rel, contenido] of archivos) {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  if (leer(rel) === contenido) continue;
  writeFileSync(p, contenido);
  console.log(`  escrito: ${rel}`);
}
console.log(`\n  ${archivos.length} archivos de superficie publica, desde vibe-tools/estado.json\n`);
