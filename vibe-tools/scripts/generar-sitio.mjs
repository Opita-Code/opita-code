/**
 * GENERADOR DEL SITIO DE GITHUB PAGES.
 *
 * QUE ES. Produce `site/` desde `vibe-tools/estado.json`: la pagina que
 * responde "que se esta construyendo ahora" y que se lee sin clonar nada y
 * sin tener cuenta en GitHub.
 *
 * POR QUE UN SITIO Y NO SOLO UN README. El README es la puerta del
 * repositorio: se ve cuando alguien ya sabe que esto es un repositorio. El
 * sitio es donde se llega desde un enlace, y por eso tiene que contestar en
 * el primer vistazo que es esto y que esta vivo.
 *
 * POR QUE SE GENERA Y NO SE ESCRIBE. Por la misma razon que el resto de la
 * superficie: lo que se publica no se escribe a mano. Si el estado cambia, el
 * sitio cambia, y no pueden divergir porque salen de la misma linea.
 *
 * LAS REGLAS DE LA PAGINA
 *   - Cero peticiones de red. Ni un CDN de fuentes, ni un script, ni una
 *     imagen externa. Un sitio que depende de la red no se renderiza igual en
 *     todas partes, y el punto es que se vea igual en todas.
 *   - Las fuentes son las de la marca de Opita, con su fallback de sistema.
 *   - Movil primero: el producto es movil primero, y la pagina tambien.
 *   - El contraste, el mismo de la paleta, que ya tiene su auditoria WCAG.
 *
 * USO
 *   node scripts/generar-sitio.mjs            escribe el sitio
 *   node scripts/generar-sitio.mjs --check    compara con lo que hay en disco
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { estado, k, cerrados, siguiente, fecha, t, root } from './estado-comun.mjs';

const RAIZ = join(root, 'site');
const PREVIEW_ORIGEN = join(root, 'docs', 'social-preview.png');

/** Escapa el HTML. La prosa viene de un archivo de datos, no del HTML. */
const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const CSS = `
:root {
  --ink: #0D0D0D; --paper: #FAFAFA; --accent: #00D084; --accent-dark: #00AC6E;
  --stone-500: #6B7280; --stone-200: #E5E7EB; --stone-800: #1F2937;
  --font-sans: 'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  background: var(--paper); color: var(--ink);
  font-family: var(--font-sans); line-height: 1.6;
  font-size: 16px; padding: 0 20px 72px;
  -webkit-font-smoothing: antialiased;
}
.wrap { max-width: 760px; margin: 0 auto; }
.hero { padding: 64px 0 40px; border-bottom: 1px solid var(--stone-200); }
.regla { width: 56px; height: 4px; background: var(--accent); margin-bottom: 22px; }
h1 { font-size: 40px; line-height: 1.1; letter-spacing: -0.02em; font-weight: 700; }
.sub { color: var(--accent-dark); font-weight: 500; margin-top: 10px; font-size: 18px; }
.gancho { color: var(--stone-800); font-weight: 500; margin-top: 10px; font-size: 20px; }
.nota { color: var(--stone-500); margin-top: 10px; font-size: 14px; }
.fecha { color: var(--stone-500); font-size: 14px; margin-top: 14px; }
section { padding: 40px 0; border-bottom: 1px solid var(--stone-200); }
h2 { font-size: 15px; text-transform: uppercase; letter-spacing: 0.08em;
     color: var(--stone-500); font-weight: 600; margin-bottom: 18px; }
p + p { margin-top: 12px; }
ul, ol { padding-left: 20px; }
li { margin-bottom: 12px; }
li strong { color: var(--ink); }
.score { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; }
.carta { background: #fff; border: 1px solid var(--stone-200); border-radius: 10px; padding: 16px; }
.carta .n { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; }
.carta .d { font-size: 13px; color: var(--stone-500); margin-top: 2px; }
.hallazgo { border-left: 3px solid var(--accent); padding-left: 14px; color: var(--stone-800); }
.bloque { background: #fff; border: 1px dashed var(--stone-200); border-radius: 10px;
          padding: 16px; color: var(--stone-800); font-size: 15px; }
.enlaces a { color: var(--accent-dark); }
footer { padding-top: 36px; color: var(--stone-500); font-size: 13px; }
footer a { color: var(--accent-dark); }
@media (max-width: 560px) {
  h1 { font-size: 32px; }
  .hero { padding: 40px 0 32px; }
  section { padding: 30px 0; }
}
`;

const PAGINA = estado.proyecto.pagina.url;
const REPO = estado.proyecto.repo;

function paginaEnvolvente({ titulo, descripcion, cuerpo, pie }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:image" content="${esc(PAGINA)}social-preview.png">
<meta property="og:type" content="website">
<link rel="icon" href="${esc(PAGINA)}social-preview.png">
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
${cuerpo}
<footer>${pie}</footer>
</div>
</body>
</html>
`;
}

function portada() {
  // La promesa y el gancho salen de la vision del operador, que esta en la
  // fuente. Antes esta pagina abria con una linea tecnica ("runtime de tools
  // componibles"), y eso solo la entiende quien ya conoce el proyecto. Con el
  // canal, el primer clic de alguien que llega de Facebook aterriza aqui: la
  // pagina tiene que decir que es esto antes de decir como esta construida.
  const bloques = String(estado.vision.texto ?? '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const promesa = bloques[0] ?? '';
  const gancho = bloques[bloques.length - 1] ?? '';

  const ahora = siguiente
    ? `<p><strong>${esc(siguiente.id)} · ${esc(siguiente.nombre)}.</strong> ${esc(t(siguiente.abierto))}</p>`
    : '<p>No hay ningun loop en cola.</p>';

  const score = [
    ['Tests', `${k.tests_pasan} de ${k.tests_total}`],
    ['Mutantes', `${k.mutantes_muertos} de ${k.mutantes_total}`],
    ['Unidades juzgables', `${k.unidades_juzgables}`],
    ['Loops cerrados', `${k.loops_cerrados}`],
  ].map(([d, n]) => `<div class="carta"><div class="n">${esc(n)}</div><div class="d">${esc(d)}</div></div>`).join('\n');

  const linea = cerrados.map((l) => `
    <li>
      <strong>${esc(l.id)} · ${esc(l.nombre)}</strong><br>
      ${esc(t(l.puede))}<br>
      <span class="hallazgo"><em>Lo que nos equivocamos:</em> ${esc(t(l.hallazgo))}</span>
    </li>`).join('\n');

  const abiertos = estado.abiertos.map((a) => `<li>${esc(t(a.titulo))} <em>(${esc(t(a.quien))})</em></li>`).join('\n');

  const enlaces = [
    ['El ahora: una pagina con fecha', `${PAGINA}now.html`],
    ['El registro en lenguaje llano', `${PAGINA}avances.html`],
    ['Los documentos tecnicos', `${REPO}/tree/main/docs/arquitectura/loops`],
    ['Como se verifica', `${REPO}/blob/main/docs/como-verificar.md`],
    ['El indice de la superficie', `${REPO}/blob/main/docs/arquitectura/loops/INDICE-publico.md`],
  ].map(([d, u]) => `<li><a href="${esc(u)}">${esc(d)}</a></li>`).join('\n');

  const cuerpo = `<header class="hero">
  <div class="regla"></div>
  <h1>Opita Code</h1>
  <p class="sub">${esc(promesa.replace(/\*\*/g, ''))}</p>
  <p class="gancho">${esc(gancho.replace(/\*\*/g, ''))}</p>
  <p class="nota">Runtime de tools componibles. La memoria se inyecta como contexto y nunca se lee desde una herramienta.</p>
  <p class="fecha">Actualizado el ${esc(fecha)} &middot; generado desde <code>vibe-tools/estado.json</code>, no se edita a mano</p>
</header>

<section>
  <h2>Ahora</h2>
  ${ahora}
</section>

<section>
  <h2>La evidencia, medida</h2>
  <div class="score">
${score}
  </div>
  <p style="margin-top:18px;font-size:14px;color:var(--stone-500)">${esc(k.judge_detalle)}</p>
</section>

<section>
  <h2>Como se llega hasta aqui</h2>
  <ol>
${linea}
  </ol>
</section>

<section>
  <h2>Lo que esta abierto</h2>
  <ul>
${abiertos}
  </ul>
</section>

<section class="enlaces">
  <h2>El detalle</h2>
  <ul>
${enlaces}
  </ul>
</section>`;

  return paginaEnvolvente({
    titulo: 'Opita Code — que se esta construyendo ahora',
    descripcion: 'Runtime de tools componibles para Opita Code. Que se esta construyendo ahora, con la evidencia medida.',
    cuerpo,
    pie: `Generado desde <code>vibe-tools/estado.json</code> y verificado contra la realidad medida en cada push. <a href="${esc(REPO)}">Repositorio</a>`,
  });
}

function avance(l) {
  const cuerpo = `<header class="hero">
  <div class="regla"></div>
  <h1>${esc(l.id)} · ${esc(l.nombre)}</h1>
  <p class="fecha"><a href="now.html">El ahora</a> &middot; <a href="index.html">Volver al estado</a> &middot; actualizado el ${esc(fecha)}</p>
</header>
<section>
  <h2>Que puedes hacer ahora que antes no podias</h2>
  <p>${esc(t(l.puede))}</p>
</section>
<section>
  <h2>Que se volvio mas tuyo o mas seguro</h2>
  <p>${esc(t(l.mas_tuyo))}</p>
</section>
<section>
  <h2>Lo que nos equivocamos en esta ronda</h2>
  <p class="hallazgo">${esc(t(l.hallazgo))}</p>
</section>
<section>
  <h2>Lo que quedo abierto</h2>
  <p>${esc(t(l.abierto))}</p>
</section>`;
  return paginaEnvolvente({
    titulo: `${l.id} · ${l.nombre} — Avances de Opita Code`,
    descripcion: t(l.puede),
    cuerpo,
    pie: `<a href="${esc(REPO)}">Repositorio</a>`,
  });
}

function indiceAvances() {
  const items = cerrados.slice().reverse()
    .map((l) => `<li><a href="avance-${esc(l.id)}.html">${esc(l.id)} · ${esc(l.nombre)}</a><br>${esc(t(l.puede))}</li>`)
    .join('\n');
  const cuerpo = `<header class="hero">
  <div class="regla"></div>
  <h1>Avances</h1>
  <p class="fecha"><a href="now.html">El ahora</a> &middot; <a href="index.html">Volver al estado</a> &middot; actualizado el ${esc(fecha)}</p>
</header>
<section>
  <ul>
${items}
  </ul>
</section>`;
  return paginaEnvolvente({
    titulo: 'Avances — Opita Code',
    descripcion: 'El registro en lenguaje llano, ronda por ronda.',
    cuerpo,
    pie: `<a href="${esc(REPO)}">Repositorio</a>`,
  });
}

/**
 * LA PAGINA DEL AHORA — el preview entre updates.
 *
 * QUE ES. Una pagina, con FECHA VISIBLE, que responde "que estoy haciendo
 * ahora". No es un feed: cuenta una sola entrada, la que esta en marcha, y
 * la anterior, para que se vea de donde viene.
 *
 * POR QUE UNA PAGINA Y NO UNA LINEA EN EL ESTADO. La fecha visible es la
 * senal de frescura: una pagina sin fecha no es evidencia de nada. Y el
 * bloque del final se puede copiar y pegar donde haga falta, que es lo que
 * la hace util para alguien que no lee codigo.
 *
 * POR QUE GENERADA Y NO ESCRITA. Por la misma razon que el resto de la
 * superficie: si el estado cambia, la pagina cambia, y no pueden divergir.
 */
function paginaAhora() {
  const promesa = String(estado.vision.texto ?? '').split('\n')[0].replace(/\*\*/g, '');
  const enCurso = siguiente
    ? `<p><strong>${esc(siguiente.id)} · ${esc(siguiente.nombre)}.</strong> ${esc(t(siguiente.abierto))}</p>`
    : '<p>No hay ningun loop en cola.</p>';
  const ultimo = cerrados.length ? cerrados[cerrados.length - 1] : null;
  const score = [
    ['Tests', `${k.tests_pasan} de ${k.tests_total}`],
    ['Mutantes', `${k.mutantes_muertos} de ${k.mutantes_total}`],
    ['Unidades juzgables', `${k.unidades_juzgables}`],
    ['Loops cerrados', `${k.loops_cerrados}`],
  ].map(([d, n]) => `<div class="carta"><div class="n">${esc(n)}</div><div class="d">${esc(d)}</div></div>`).join('\n');
  const bloque = [
    promesa,
    siguiente ? `Ahora: ${siguiente.id} · ${siguiente.nombre}.` : '',
    ultimo ? `Lo ultimo que se cerro: ${ultimo.id} · ${ultimo.nombre}.` : '',
    `Hoy: ${k.tests_pasan} de ${k.tests_total} tests y ${k.mutantes_muertos} de ${k.mutantes_total} mutantes, medidos en cada push.`,
    `${PAGINA}now.html`,
  ].filter(Boolean).join(' ');

  const cuerpo = `<header class="hero">
  <div class="regla"></div>
  <h1>Ahora</h1>
  <p class="sub">${esc(promesa)}</p>
  <p class="fecha">Actualizado el ${esc(fecha)} &middot; una sola entrada, no un archivo &middot; generado desde <code>vibe-tools/estado.json</code></p>
</header>

<section>
  <h2>Que estoy haciendo ahora</h2>
  ${enCurso}
</section>

<section>
  <h2>Lo que se cerro por ultima vez</h2>
  <p>${ultimo ? esc(t(ultimo.puede)) : 'Todavia no hay nada cerrado.'}</p>
</section>

<section>
  <h2>La evidencia, medida</h2>
  <div class="score">
${score}
  </div>
</section>

<section>
  <h2>Para copiar y pegar</h2>
  <p class="bloque">${esc(bloque)}</p>
</section>

<section class="enlaces">
  <h2>El detalle</h2>
  <ul>
    <li><a href="index.html">El estado completo, con la linea de tiempo</a></li>
    <li><a href="avances.html">El registro en lenguaje llano, ronda por ronda</a></li>
    <li><a href="${esc(REPO)}">Repositorio</a></li>
  </ul>
</section>`;

  return paginaEnvolvente({
    titulo: 'Ahora — Opita Code',
    descripcion: 'Que se esta construyendo ahora en Opita Code, con la fecha y la evidencia medida.',
    cuerpo,
    pie: `Actualizado el ${esc(fecha)}. Generado desde <code>vibe-tools/estado.json</code> y verificado contra la realidad medida en cada push. <a href="${esc(REPO)}">Repositorio</a>`,
  });
}

// TODO el sitio se arma en un mapa primero. Asi el modo --check puede
// compararlo con lo que hay en disco, y la CI puede detectar que el sitio se
// quedo viejo sin que nadie lo note.
const paginas = new Map();
paginas.set('index.html', portada());
paginas.set('now.html', paginaAhora());
paginas.set('avances.html', indiceAvances());
for (const l of cerrados) paginas.set(`avance-${l.id}.html`, avance(l));

const soloComprobar = process.argv.includes('--check');

if (soloComprobar) {
  const distintos = [];
  for (const [nombre, contenido] of paginas) {
    const destino = join(RAIZ, nombre);
    if (!existsSync(destino) || readFileSync(destino, 'utf8') !== contenido) distintos.push(nombre);
  }
  if (existsSync(PREVIEW_ORIGEN)) {
    const destino = join(RAIZ, 'social-preview.png');
    if (!existsSync(destino) || readFileSync(PREVIEW_ORIGEN).length !== readFileSync(destino).length) {
      distintos.push('social-preview.png');
    }
  }
  if (distintos.length > 0) {
    console.error('\n  EL SITIO NO CUADRA CON LA FUENTE:');
    for (const d of distintos) console.error(`    - ${d}`);
    console.error('\n  Corre `npm run generar-sitio` y vuelve a commitear.\n');
    process.exit(1);
  }
  console.log(`\n  Sitio al dia: ${paginas.size} paginas.\n`);
  process.exit(0);
}

mkdirSync(RAIZ, { recursive: true });
for (const [nombre, contenido] of paginas) {
  writeFileSync(join(RAIZ, nombre), contenido, 'utf8');
}
if (existsSync(PREVIEW_ORIGEN)) copyFileSync(PREVIEW_ORIGEN, join(RAIZ, 'social-preview.png'));

console.log(`\n  sitio: ${RAIZ}`);
console.log(`  ${paginas.size + 1} archivos: index, now, avances, un archivo por loop y la imagen\n`);
