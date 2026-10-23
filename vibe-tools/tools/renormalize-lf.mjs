/**
 * Renormaliza el arbol de trabajo a LF.
 *
 * Por que hace falta un script: con .gitattributes (text=auto eol=lf) y
 * core.autocrlf=true, el filtro clean convierte el CRLF del disco en LF y
 * git considera el archivo IDENTICO al indice. Por eso `git checkout`,
 * `git checkout-index -f` y `git add --renormalize` NO lo reescriben nunca:
 * git cree que no hay nada que hacer. La unica via es borrar el archivo del
 * disco y dejar que git lo restaure, que si aplica el filtro de checkout.
 *
 * Uso: node tools/renormalize-lf.mjs [--dry]
 */
import { readdirSync, statSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const SKIP = new Set(['node_modules', 'dist', '.git']);
const TEXT = /\.(ts|md|mjs|json)$/;
const dry = process.argv.includes('--dry');

function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e)) continue;
    const f = join(dir, e);
    if (statSync(f).isDirectory()) walk(f, acc);
    else if (TEXT.test(f)) acc.push(f);
  }
  return acc;
}

const files = walk('.');
const crlf = files.filter((f) => readFileSync(f, 'utf8').includes('\r\n'));
console.log(`archivos de texto: ${files.length} · con CRLF: ${crlf.length}`);

if (dry) {
  crlf.forEach((f) => console.log('  ' + f));
  process.exit(0);
}

// Solo se borra lo que git tiene versionado y sin cambios: si un archivo
// tiene modificaciones locales, borrarlo perderia trabajo.
const dirty = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' })
  .split('\n').filter(Boolean).map((l) => l.slice(3).trim().replace(/\\/g, '/'));
const dirtySet = new Set(dirty);
const safe = crlf.filter((f) => !dirtySet.has(f.replace(/\\/g, '/')));
const skipped = crlf.filter((f) => dirtySet.has(f.replace(/\\/g, '/')));

skipped.forEach((f) => console.log('  OMITIDO (tiene cambios locales): ' + f));
safe.forEach((f) => unlinkSync(f));
console.log(`borrados ${safe.length} para restaurarlos con LF`);
execFileSync('git', ['checkout', '--', '.'], { stdio: 'inherit' });

const after = walk('.').filter((f) => readFileSync(f, 'utf8').includes('\r\n'));
console.log(`CRLF restantes: ${after.length}`);
after.forEach((f) => console.log('  ' + f));
