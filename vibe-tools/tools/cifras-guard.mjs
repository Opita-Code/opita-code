/**
 * CIFRAS GUARD — las cifras del kit del canal, contra la fuente.
 *
 * ORIGEN (medido, 2026-10-25). El kit del canal (docs/canal.md y
 * docs/canal/*.md) es lo que la persona copia y pega en Facebook, Instagram y
 * LinkedIn. Se escribe a mano, porque cada plataforma lleva su propia
 * adaptacion nativa y una prosa generada no suena a persona. Pero escritas a
 * mano las cifras se quedan viejas, y eso no se ve al leer:
 *
 *   - El kit decia «104 unidades juzgables» y la fuente ya decia 107. El
 *     numero estaba bien cuando se escribio (11:41) y dejo de estarlo
 *     dieciocho minutos despues, cuando el propio kit se sumo a las unidades
 *     juzgables.
 *   - Y decia «104 DOCUMENTOS con criterio escrito y verificado por un juez
 *     automatico». Tres defectos en una linea: el numero no era el de las
 *     unidades (37 de las 107 son codigo, no documentos), y el juez no habia
 *     resuelto 104 documentos: de las 107 unidades, solo 16 tienen veredicto
 *     vigente.
 *
 * POR QUE HAY QUE MEDIR Y NO FIARSE. La superficie generada (README, STATUS,
 * avances, notas de release) se GENERA desde la fuente y `--check` la
 * contrasta. El kit no se genera, porque cada plataforma necesita su texto.
 * Ese hueco lo cubre este guard: extrae las cifras del kit y las mide contra
 * la fuente.
 *
 * LA REGLA DEL INDICE. El indice del canal (docs/canal/INDICE.md) es el
 * registro de lo que se publico, y por eso decide que se mide:
 *   - Una entrada QUE NO esta en el indice todavia no ha salido: sus cifras
 *     tienen que ser las de HOY, y se miden contra la fuente de hoy. Si la
 *     fuente se movio, el guard avisa: el numero que se va a publicar esta
 *     viejo.
 *   - Una entrada QUE YA esta en el indice salio: sus cifras son las del
 *     momento en que salio, y no se vuelven a medir. Sin esto la CI se pondria
 *     vieja sola con cada commit que toca la fuente, y un post publicado
 *     ayer seria un fallo hoy.
 *   - Y cuando la fuente se movio DESPUES de la fecha de una entrada, el
 *     guard lo dice, porque hay dos maneras de que eso pase: la entrada salio
 *     ese dia y sus cifras son un registro fiel, o la publicacion se aplazo y
 *     sus cifras ya estan viejas. El guard no puede distinguirlas; puede solo
 *     no callarse.
 *   - El guion (docs/canal.md) no tiene fecha porque no es un post: es una
 *     regla vigente. Se mide contra la fuente de HOY, siempre.
 *
 * LA REGLA DE PROCESO QUE HACE VERDADERA LA ANTERIOR. Una entrada entra en el
 * indice cuando SE PUBLICA, no antes. Si se lista antes, el guard la da por
 * publicada y deja de mirarla: el 2026-10-25 la entrada se listo a las 11:41
 * y se publico horas despues, y en ese hueco el guard fue ciego.
 *
 * LO QUE ESTE GUARD NO HACE, Y POR QUE.
 *   - No mide nada: no corre tests ni mutacion. Las cifras de la fuente las
 *     mide verificar-estado; aqui solo se comparan dos cosas que ya existen.
 *   - No ve las cifras que la prosa no nombra con las palabras de la tabla de
 *     reglas. Si alguien reescribe el kit con otras palabras, el guard deja de
 *     verlas. Por eso imprime cuantas cifras SI contrasto, y avisa de los
 *     numeros que no sabe mirar: un guard que informa «OK» porque no encontro
 *     nada es peor que no tener guard.
 *   - No juzga si el texto esta bien escrito. Para eso esta prosa-guard.
 *   - No sabe de espanol: solo sabe de formas, de cifras y de una tabla.
 *
 * USO
 *   node tools/cifras-guard.mjs                    el kit del canal
 *   node tools/cifras-guard.mjs <ruta>             un corpus (fixtures)
 *   node tools/cifras-guard.mjs <ruta> --fuente X  un corpus, contra otra fuente
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

/** Donde vive el kit del canal. */
const KIT = 'docs/canal';
/** La fuente de verdad de las cifras. */
const FUENTE = 'vibe-tools/estado.json';

/**
 * LA TABLA DE REGLAS. Cada regla dice: que frase de la prosa lleva una cifra
 * medida, y de que clave de la fuente sale el valor esperado.
 *
 * Se escribe a mano y se amplia con cada hallazgo observado, igual que las
 * demas listas del repo: es una muestra de lo que se ha visto, no una
 * garantia. Por eso el guard imprime cuantas cifras encontro.
 *
 * Cuando una regla tiene dos grupos, el segundo es la segunda mitad de un
 * «N de M»: las dos tienen que ser el mismo valor.
 */
const REGLAS = [
  {
    que: 'pruebas',
    patron: /\b(\d+)(?:\s+de\s+(\d+))?\s+(?:pruebas|tests)\b/g,
    valor: (e) => [e.kpis.tests_total],
    de: 'kpis.tests_total',
  },
  {
    que: 'pruebas en verde',
    patron: /\b(\d+)\s+en\s+verde\b/g,
    valor: (e) => [e.kpis.tests_pasan],
    de: 'kpis.tests_pasan',
  },
  {
    que: 'mutaciones o comprobaciones',
    patron: /\b(\d+)(?:\s+de\s+(\d+))?\s+(?:mutaciones|mutantes|comprobaciones)\b/g,
    valor: (e) => [e.kpis.mutantes_total],
    de: 'kpis.mutantes_total',
  },
  {
    que: 'unidades juzgables',
    patron: /\b(\d+)\s+(?:unidades juzgables|piezas del proyecto)\b/g,
    valor: (e) => [e.kpis.unidades_juzgables],
    de: 'kpis.unidades_juzgables',
  },
  {
    que: 'decisiones abiertas',
    patron: /\b(\d+)\s+decisiones\s+(?:de\s+dise[nñ]o\s+)?abiertas\b/g,
    valor: (e) => [e.abiertos.length],
    de: 'abiertos.length',
  },
  {
    que: 'documentos que fijan los limites',
    patron: /\b(\d+)(?:\s+de\s+(\d+))?\s+documentos\s+que\s+fijan\s+los\s+l[ií]mites\b/g,
    valor: (e) => [e.kpis.documentos_judge_aligned],
    de: 'kpis.documentos_judge_aligned',
  },
  {
    // UNA CIFRA DE DOCUMENTOS CON EL JUEZ. El 2026-10-25 el kit decia
    // «104 documentos con criterio escrito y verificado por un juez
    // automatico»: el numero no era el de las unidades, y el juez no habia
    // resuelto 104 documentos. La cifra de un juez solo puede ser la que el
    // juez resolvio.
    //
    // El patron aprieta en dos puntos, y por los dos hace falta. Uno: el
    // verbo de resolucion (verificados, resueltos, ...) tiene que estar, para
    // que «67 son documentos» no se confunda con una cifra del juez. Dos: el
    // patron cruza el salto de linea, porque la cifra y la palabra «juez»
    // pueden estar en dos renglones distintos de la misma frase.
    que: 'documentos que el juez resolvio',
    patron: /\b(\d+)(?:\s+de\s+(\d+))?\s+documentos\b[^.]{0,80}?\b(?:verificad|resoluid|juzgad|alinead|revisad)\w*\b[^.]{0,40}?\bjuez\b/g,
    valor: (e) => [e.kpis.documentos_judge_aligned],
    de: 'kpis.documentos_judge_aligned',
  },
];

/** La fecha de una entrada del canal va en el nombre: 2026-10-25.md. */
const RE_FECHA = /^(\d{4}-\d{2}-\d{2})\.md$/;

/** Archivos que no llevan cifras: el indice y la nota de los fixtures. */
const SIN_CIFRAS = new Set(['LEEME.md', 'INDICE.md']);

/** La fuente de verdad, tal cual esta hoy (o la que se le indique). */
function fuenteDe(ruta) {
  return JSON.parse(readFileSync(resolve(ruta), 'utf8'));
}

/** Los .md de un directorio, en orden. */
function markdownDe(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => join(dir, f));
}

/**
 * Una ruta relativa se busca primero donde se esta parado, y despues en la
 * raiz del repo. Asi el mismo comando sirve desde `vibe-tools/` y desde la
 * raiz, que es como lo escribe la gente.
 */
function resolve(dir) {
  if (/^[a-zA-Z]:[\\/]/.test(dir)) return dir;
  const enCwd = join(process.cwd(), dir);
  if (existsSync(enCwd)) return enCwd;
  return join(root, dir);
}

/**
 * El indice del canal: el registro de lo que se publico.
 *
 * Se lee entero y se busca el enlace a la entrada. Una entrada entra en el
 * indice cuando SALE, no antes: esa es la regla de proceso que hace que este
 * guard sepa que medir.
 */
function leerIndice() {
  const ruta = join(root, KIT, 'INDICE.md');
  if (!existsSync(ruta)) return '';
  return readFileSync(ruta, 'utf8');
}

/**
 * Que se mide de cada archivo del kit.
 *
 * Con una ruta de override (el corpus de fixtures) todo se mide contra la
 * fuente indicada: el corpus es deliberado y su caso es el de hoy, o el de la
 * fuente congelada con la que se prueba.
 */
function objetivos(override, fuente) {
  const lista = [];

  if (override) {
    const dir = resolve(override);
    for (const abs of markdownDe(dir)) {
      const nombre = basename(abs);
      if (SIN_CIFRAS.has(nombre)) continue;
      lista.push({
        abs,
        rel: relative(root, abs).split(/[\\/]/).join('/'),
        medir: true,
        estado: fuente,
        nota: 'la fuente indicada',
      });
    }
    return lista;
  }

  const guia = join(root, KIT + '.md');
  if (existsSync(guia)) {
    lista.push({
      abs: guia,
      rel: KIT + '.md',
      medir: true,
      estado: fuente,
      nota: 'regla vigente: se mide contra la fuente de hoy',
    });
  }

  const indice = leerIndice();

  for (const abs of markdownDe(join(root, KIT))) {
    const nombre = basename(abs);
    if (SIN_CIFRAS.has(nombre)) continue;
    const m = nombre.match(RE_FECHA);
    if (!m) continue; // un archivo sin fecha no se sabe contra que medirlo
    const fecha = m[1];
    const publicada = indice.includes(`(${nombre})`);
    const movida = String(fuente.proyecto?.actualizado ?? '');
    lista.push({
      abs,
      rel: `${KIT}/${nombre}`,
      medir: !publicada,
      estado: fuente,
      fecha,
      nota: publicada
        ? (movida && movida > fecha
            ? `REGISTRO: ya se publico; la fuente se movio el ${movida}, despues de esa fecha`
            : 'REGISTRO: ya se publico, sus cifras son las de ese dia')
        : 'sin publicar todavia: se mide contra la fuente de hoy',
    });
  }
  return lista;
}

/**
 * Los numeros que el guard NO sabe mirar.
 *
 * Son los numeros que no son cifras medidas: fechas, horas, medidas de
 * lienzo, porcentajes, tamanos y proporciones. Se quitan para no contarlos
 * como cifras sin contrastar. Si queda alguno, se avisa: puede ser una cifra
 * escrita con palabras que la tabla no conoce.
 */
function numerosSinMirar(texto, tapados) {
  let limpio = texto;
  // Los tramos que las reglas ya miraron se borran: no son numeros ciegos.
  for (const [desde, hasta] of tapados.sort((a, b) => b[0] - a[0])) {
    limpio = limpio.slice(0, desde) + ' '.repeat(hasta - desde) + limpio.slice(hasta);
  }
  limpio = limpio
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
    .replace(/\b\d+\s*x\s*\d+\b/gi, ' ')
    .replace(/\b\d+(?:[.,]\d+)?\s*%/g, ' ')
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:B|KB|MB|GB)\b/gi, ' ')
    .replace(/\b\d+(?:[.,]\d+)?\s*px\b/gi, ' ')
    .replace(/\b\d+(?:[.,]\d+)?\s*:\s*\d+\b/g, ' ')
    .replace(/\b0[xX][0-9a-fA-F]+\b/g, ' ');
  return (limpio.match(/\b\d+(?:[.,]\d+)?\b/g) ?? []).map((s) => s.replace(/[.,]$/, ''));
}

/** Las cifras de un archivo, y contra que valor esperado se miden. */
function medir(archivo, fuente) {
  const texto = readFileSync(archivo, 'utf8');
  const hallazgos = [];
  const tapados = [];
  let vistas = 0;

  for (const regla of REGLAS) {
    const esperado = regla.valor(fuente);
    for (const m of texto.matchAll(regla.patron)) {
      const grupos = m.slice(1).filter((g) => g !== undefined);
      if (grupos.length === 0) continue;
      vistas++;
      tapados.push([m.index, m.index + m[0].length]);
      const ok = grupos.every((g, i) => {
        const valor = esperado[Math.min(i, esperado.length - 1)];
        return Number(g) === Number(valor);
      });
      if (ok) continue;
      const linea = texto.slice(0, m.index).split('\n').length;
      hallazgos.push({
        at: `${linea}`,
        regla: regla.que,
        dicho: grupos.join(' de '),
        esperado: esperado.join(' / '),
        de: regla.de,
      });
    }
  }

  return { hallazgos, vistas, sinMirar: numerosSinMirar(texto, tapados) };
}

function main() {
  const args = process.argv.slice(2);
  let override = null;
  let rutaFuente = FUENTE;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--fuente') {
      rutaFuente = args[++i];
    } else if (!override) {
      override = args[i];
    }
  }

  if (rutaFuente && !existsSync(resolve(rutaFuente))) {
    console.error(`\n  FUENTE INEXISTENTE: ${rutaFuente}\n`);
    process.exit(2);
  }
  if (override && !existsSync(resolve(override))) {
    console.error(`\n  RUTA INEXISTENTE: ${override}\n`);
    process.exit(2);
  }

  const fuente = fuenteDe(rutaFuente);
  const lista = objetivos(override, fuente);
  const todos = [];

  console.log(`\n=== CIFRAS GUARD · las cifras del kit contra la fuente ===\n`);
  console.log(`  Fuente: ${rutaFuente} (actualizada el ${fuente.proyecto?.actualizado ?? '?'})\n`);

  for (const o of lista) {
    if (!o.medir) {
      console.log(`  REGISTRO ${o.rel}`);
      console.log(`    ${o.nota}`);
      continue;
    }
    const { hallazgos, vistas, sinMirar } = medir(o.abs, o.estado);
    todos.push(...hallazgos.map((h) => ({ ...h, rel: o.rel })));
    console.log(`  ${hallazgos.length === 0 ? 'OK   ' : 'FALLA'} ${o.rel}  ${vistas} cifra(s) contrastada(s)`);
    console.log(`    ${o.nota}`);
    if (vistas === 0) {
      console.log('    AVISO: este archivo no tiene ninguna cifra que el guard sepa mirar.');
      console.log('    Si tiene cifras, la tabla de reglas no las ve: esa tabla se amplia a mano.');
    }
    if (sinMirar.length > 0) {
      console.log(`    AVISO: ${sinMirar.length} numero(s) que este guard no sabe mirar: ${sinMirar.slice(0, 8).join(', ')}`);
      console.log('    Si alguno es una cifra medida, la tabla de reglas no la ve.');
    }
  }

  if (todos.length > 0) {
    console.log('');
    for (const h of todos) {
      console.log(`  ${h.rel}:${h.at}  ${h.regla}: dice ${h.dicho}, la fuente dice ${h.esperado} (${h.de})`);
    }
  }

  console.log(`\n  ${todos.length} hallazgos en ${lista.length} archivos.`);

  if (todos.length > 0) {
    console.log('\n  Una cifra que no coincide con la fuente no se arregla reescribiendo el');
    console.log('  numero: se mide otra vez, o se cambia el criterio de la regla.\n');
    process.exit(1);
  }
  console.log('\n  OK: las cifras del kit coinciden con la fuente.\n');
}

main();
