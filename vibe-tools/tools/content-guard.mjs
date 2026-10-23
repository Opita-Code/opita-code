/**
 * CONTENT GUARD — la segunda capa que el gate de presupuesto no puede dar.
 *
 * ORIGEN (medido, 2026-10-23). Escribi docs/arquitectura/loops/L3-mindsets.md,
 * lo publique sin leerlo, y tenia 6 corrupciones en 5 lineas. El guard de
 * presupuesto lo reporto como "EXCEDE 665 B" y no detecto NI UNA: el guard
 * cuenta bytes, no lee texto.
 *
 * Y al medir el alcance aparecio algo peor: la corrupcion no era solo mia.
 *   docs/arquitectura/loops/L3-mindsets.md:8,80
 *   docs/arquitectura/plan-iteracion-mvp.md:226
 *   docs/arquitectura/vibe-studio-arquitectura-v2-vibe-tools.md:152
 *   docs/legal/cumplimiento-aislamiento-datos-v1.md:168
 * Cuatro archivos. Tres escritos antes de esta sesion. Nadie lo vio porque no
 * habia nada que lo mirara.
 *
 * ALCANCE. Todo .md del repo y todo .ts de vibe-tools/src. Se incluyen los .ts
 * porque sus cabeceras llevan el razonamiento del proyecto: una corrupcion en
 * un comentario es tan perdida como una en un documento.
 *
 * Lo que este guard NO hace:
 *   - no juzga si el texto es verdad. Para eso esta el gate de drift.
 *   - no mide bytes. Para eso esta gate-budget.mjs.
 *   - no detecta toda corrupcion posible. Detecta la clase observada: intrusion
 *     de otro guion, marcador pendiente, tabla rota, enlace roto, bloque sin
 *     cerrar. Su lista es una muestra observada y crece con cada hallazgo; no
 *     es una garantia. Decirlo aqui para que nadie lo cite como garantia.
 *
 * POR QUE UNA DENYLIST DE GUIONES Y NO UNA ALLOWLIST DE CARACTERES
 * Se midieron 60 caracteres no-ASCII en 37 documentos: acentos, dibujo de caja,
 * flechas, matematicas, comillas tipograficas. Una lista blanca de caracteres
 * habria tenido que enumerarlos, y el proximo caracter legitimo la habria roto
 * entrenando al equipo a ignorar el guard. Un rango de guion no: el castellano
 * con tipografia es ASCII mas acentuacion, y la intrusion observada es siempre
 * de otro sistema de escritura.
 *
 * REGLA: la lista blanca se widen EN CODIGO Y CON REVISION. No se desactiva el
 * guard. El caso legitimo se agrega al conjunto, no se silencia.
 */

import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

const MD_ROOTS = ['docs'];
const TS_ROOTS = ['vibe-tools/src'];
/**
 * La raiz del repositorio es superficie publica: los archivos que ve quien
 * llega de fuera. Antes de L-PUB2 no la cubria nadie, y se noto: al escribir
 * SECURITY.md aparecieron dos caracteres arabes dentro de una palabra, y
 * CODE_OF_CONDUCT.md tres mas. El guard que caza la intrusion de guion no
 * los podia ver porque no miraba esos archivos.
 */
const RAIZ_ROOTS = ['site'];
const RAIZ_EXTS = { '.html': ['site'], '.json': ['vibe-tools'], '.yml': ['.github'] };
const ALSO_FILES = [
  'vibe-tools/README.md',
  'README.md',
  'STATUS.md',
  'CONTRIBUTING.md',
  'SECURITY.md',
  'CODE_OF_CONDUCT.md',
  'LICENSE',
  'vibe-tools/estado.json',
];
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);

/** Rangos de guion que no aparecen en castellano con tipografia. */
const FOREIGN_SCRIPTS = [
  ['CJK ideograma', 0x4e00, 0x9fff],
  ['CJK puntuacion', 0x3000, 0x303f],
  ['CJK extension A', 0x3400, 0x4dbf],
  ['hiragana', 0x3040, 0x309f],
  ['katakana', 0x30a0, 0x30ff],
  ['hangul', 0xac00, 0xd7af],
  ['cirilico', 0x0400, 0x04ff],
  ['griego', 0x0370, 0x03ff],
  ['hebreo', 0x0590, 0x05ff],
  ['arabigo', 0x0600, 0x06ff],
  ['devanagari', 0x0900, 0x097f],
  ['fullwidth', 0xff00, 0xffef],
];
const REPLACEMENT_CHAR = 0xfffd;

/**
 * Marcadores de trabajo pendiente. "TODO" NO va aqui a proposito: es
 * vocabulario legitimo del repo ("el TODO bloqueante de L1") y un guard que
 * marca algo que el equipo usa todos los dias entrena a ignorar el guard.
 */
const PLACEHOLDERS = [/\bFIXME\b/, /\bXXX\b/, /lorem ipsum/i, /<PLACEHOLDER>/i, /\bTBD_/, /\(\s*sic\s*\)/i];

function walk(dir, exts, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, exts, acc);
    else if (exts.has(extname(entry))) acc.push(full);
  }
  return acc;
}

function scanFile(file) {
  const rel = relative(root, file).replace(/\\/g, '/');
  const problems = [];
  const text = readFileSync(file, 'utf8');
  const lines = text.split(/\r?\n/);
  const isMd = extname(file) === '.md';
  const isYml = extname(file) === '.yml';

  // CRLF en un artefacto juzgable: el guard de presupuesto mide los bytes
  // CRUDOS (los que lee el juez) y el juez trocea sobre esos bytes. Si el
  // archivo trae CR, mide mas de lo que el guard permitio, y el juez puede
  // trocearlo donde el guard dijo que cabia entero. Es divergencia silenciosa
  // entre el guard y el juez. Se fija con .gitattributes; esta comprobacion
  // avisa si deja de estar fijado. Se cuenta sobre el texto crudo porque las
  // lineas ya vienen partidas con /\r?\n/ y el CR se consumio ahi.
  if (text.includes('\r\n')) {
    const crlfCount = (text.match(/\r\n/g) || []).length;
    problems.push({
      at: rel,
      kind: 'CRLF',
      detail: `${crlfCount} lineas con CR: el archivo mide mas de lo que el guard permitio y el juez puede trocearlo`,
    });
  }

  lines.forEach((line, i) => {
    const at = `${rel}:${i + 1}`;
    for (const ch of line) {
      const c = ch.codePointAt(0);
      if (c === REPLACEMENT_CHAR) {
        problems.push({ at, kind: 'reemplazo U+FFFD', detail: 'carácter de reemplazo: la escritura ya estaba dañada' });
        continue;
      }
      const hit = FOREIGN_SCRIPTS.find(([, a, b]) => c >= a && c <= b);
      if (hit) {
        problems.push({
          at,
          kind: `guion ${hit[0]}`,
          detail: `U+${c.toString(16).toUpperCase().padStart(4, '0')} ${JSON.stringify(ch)} en: ${line.trim().slice(0, 60)}`,
        });
      }
    }
    for (const re of PLACEHOLDERS) {
      if (re.test(line)) {
        problems.push({ at, kind: 'marcador pendiente', detail: `${re} en: ${line.trim().slice(0, 60)}` });
      }
    }
  });

  if (isYml) {
    // Un escalar simple de YAML no puede contener ": " seguido de espacio:
    // el parser corta el valor ahi y despues se queja de un mapeo donde no lo
    // hay. El efecto real locile el 2026-10-23: un `run: echo "...: ..."` de
    // un workflow dejo el workflow entero invalido, y GitHub lo reporto como
    // un run fallido con el nombre del archivo y sin jobs. Un fallo que
    // parece de logica y es de sintaxis.
    lines.forEach((line, i) => {
      const m = line.match(/^(\s*)([A-Za-z_][\w-]*):\s+(\S.*)$/);
      if (!m) return;
      const valor = m[3];
      if (!/^['"|>&*[{]/.test(valor) && /:\s/.test(valor)) {
        problems.push({
          at: `${rel}:${i + 1}`,
          kind: 'YAML escalar con dos puntos',
          detail: `la clave "${m[2]}" tiene un valor con ": " sin comillas: el parser de GitHub rechaza el archivo entero`,
        });
      }
    });
  }

  if (isMd) {
    // Bloques de codigo sin cerrar
    const fences = lines.filter((l) => /^\s*```/.test(l)).length;
    if (fences % 2 !== 0) {
      problems.push({ at: rel, kind: 'bloque sin cerrar', detail: `${fences} lineas con \`\`\` — debe ser par` });
    }
    // Titulo de primer nivel
    if (lines[0]?.trim() && !lines[0].startsWith('# ')) {
      problems.push({ at: `${rel}:1`, kind: 'sin H1', detail: `la primera linea no es "# ...": ${lines[0].slice(0, 50)}` });
    }
    // Tablas: dentro de un bloque, todas las filas con el mismo numero de columnas
    let block = [];
    const flushTable = () => {
      if (block.length > 1) {
        const counts = block.map(([, line]) => (line.match(/(?<!\\)\|/g) || []).length);
        const set = new Set(counts);
        if (set.size > 1) {
          problems.push({
            at: block[0][0],
            kind: 'tabla irregular',
            detail: `columnas ${[...set].join('/')} entre lineas ${block[0][0].split(':')[1]}-${block[block.length - 1][0].split(':')[1]}`,
          });
        }
      }
      block = [];
    };
    lines.forEach((line, i) => {
      if (line.trim().startsWith('|')) block.push([`${rel}:${i + 1}`, line]);
      else flushTable();
    });
    flushTable();
    // Enlaces internos rotos
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/\]\(([^)]+)\)/g)) {
        const href = m[1].split('#')[0].trim();
        if (!href || /^(https?:|mailto:|tel:)/.test(href)) continue;
        const abs = href.startsWith('/') ? join(root, href) : join(dirname(file), href);
        if (!existsSync(abs)) {
          problems.push({ at: `${rel}:${i + 1}`, kind: 'enlace roto', detail: href });
        }
      }
    });
  }
  return problems;
}

/** Si el override trae una ruta absoluta se respeta; si no, es relativa a la raiz. */
function resolveRoot(dir) {
  return /^([a-zA-Z]:[\\/]|[\\/])/.test(dir) ? dir : join(root, dir);
}

function main() {
  // Un guard que solo se puede correr sobre el repo es un guard que solo se
  // puede verificar rompienendo el repo. Este override existe para poder
  // correrlo contra un corpus de defectos deliberados (ver tools/guard-fixtures).
  const override = process.argv[2];
  const extraExts = new Set(['.md', '.ts']);

  if (override) {
    // Una ruta que no existe es un ERROR, no un corpus vacio que pasa. Un guard
    // que informa OK porque no encontro nada es peor que no tener guard: es la
    // forma exacta de que una verificacion se vuelva decoracion en silencio.
    for (const d of override.split(',')) {
      const abs = resolveRoot(d);
      if (!existsSync(abs)) {
        console.error(`\n  RUTA INEXISTENTE: ${d}  (resuelta a ${abs})`);
        console.error('  Las rutas del override son relativas a la raiz del repo, o absolutas.\n');
        process.exit(2);
      }
    }
  }

  const files = override
    ? override.split(',').flatMap((d) => walk(resolveRoot(d), extraExts))
    : []
      .concat(MD_ROOTS.flatMap((r) => walk(join(root, r), new Set(['.md']))))
      .concat(TS_ROOTS.flatMap((r) => walk(join(root, r), new Set(['.ts']))))
      .concat(RAIZ_ROOTS.flatMap((r) => walk(join(root, r), new Set(['.html']))))
      .concat(Object.entries(RAIZ_EXTS).flatMap(([ext, raices]) =>
        raices.flatMap((r) => walk(join(root, r), new Set([ext])))))
      .concat(ALSO_FILES.filter((f) => existsSync(join(root, f))).map((f) => join(root, f)));

  const all = files.flatMap(scanFile);
  const byKind = new Map();
  for (const p of all) {
    if (!byKind.has(p.kind)) byKind.set(p.kind, []);
    byKind.get(p.kind).push(p);
  }

  console.log(`\n=== CONTENT GUARD · integridad de texto, ${files.length} archivos ===\n`);
  if (all.length === 0) {
    console.log('  OK: sin intrusion de guion, marcadores, tablas rotas, enlaces rotos ni bloques sin cerrar.\n');
    return;
  }
  for (const [kind, rows] of [...byKind.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${String(rows.length).padStart(3)} × ${kind}`);
    for (const p of rows.slice(0, 12)) console.log(`        ${p.at}  ${p.detail}`);
    if (rows.length > 12) console.log(`        … y ${rows.length - 12} más`);
  }
  console.log(`\n  ${all.length} hallazgos en ${files.length} archivos.`);
  console.log('\n  Esto NO es un veredicto de drift: es texto dañado, y se arregla, no se discute.');
  console.log('  Un hallazgo aqui es un defecto de escritura, no una duda sobre el contenido.\n');
  process.exit(1);
}

main();