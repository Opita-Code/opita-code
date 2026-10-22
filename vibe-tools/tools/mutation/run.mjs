/**
 * MUTATION TESTING (metodo primario, skill llm-testing)
 *
 * Un test suite que pasa no demuestra nada sobre si los tests detectan
 * errores. Esto introduce errores de proposito en el codigo fuente y mide
 * cuantos tests los matan. Un mutante que sobrevive es un hueco en la
 * verificacion.
 *
 * Los mutantes se aplican sobre el JS compilado: mutar sin recompilar mantiene
 * el ciclo en segundos en lugar de minutos.
 *
 * Umbral: >= 80% por paquete. Por debajo, el verificador es debil y hay que
 * reforzar los tests antes de confiar en sus PASS.
 */

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const dist = join(root, 'dist');

/** [archivo, descripcion, buscar, reemplazar] */
const MUTANTS = [
  // ---- tool.ts: el sellado del contexto ---------------------------------
  ['src/tool.js', 'boundary: no sellar el contexto antes de la tool',
    'return binding.impl(input, sealContext(ctx));', 'return binding.impl(input, ctx);'],
  ['src/tool.js', 'boundary: el camino rapido vuelve a confiar en Object.isFrozen',
    'if (sealed.has(ctx))', 'if (Object.isFrozen(ctx) && Object.isFrozen(ctx.injected))'],
  ['src/tool.js', 'boundary: sellado superficial en vez de profundo',
    'Object.freeze(deepFreeze({ ...ctx.injected }))', 'Object.freeze({ ...ctx.injected })'],
  ['src/tool.js', 'boundary: no congelar el contexto entregado',
    'const out = Object.freeze({\n        ...ctx,', 'const out = ({\n        ...ctx,'],
  ['src/tool.js', 'boundary: no recorrer los valores anidados',
    'deepFreeze(v[k]);', 'void 0;'],
  ['src/tool.js', 'boundary: la tool muta el contexto del llamador en vez del sellado',
    'return binding.impl(input, sealContext(ctx));', 'return binding.impl(input, { ...ctx, injected: { ...ctx.injected, hack: 1 } });'],
  ['src/tool.js', 'MVP: permitir ejecutar una tool fuera de T0',
    "if (binding.descriptor.tier !== 'T0') {", "if (false) {"],
  ['src/tool.js', 'resolucion: ignorar la version al resolver',
    'this.#key(id, version)', 'id'],
  ['src/tool.js', 'registro: permitir sobreescribir id@version',
    'if (this.#byKey.has(k))\n            throw new Error(`herramienta ya registrada: ${k}`);',
    'if (false)\n            throw new Error(`herramienta ya registrada: ${k}`);'],

  // ---- graph.ts: las 11 reglas -------------------------------------------
  ['src/graph.js', 'R0 fuera: borrar el rechazo de nombres con dos puntos',
    "if (hasColon(n.node) || n.node.length === 0) {", "if (false) {"],
  ['src/graph.js', 'R0 puerto: borrar el rechazo de nombres con dos puntos',
    "if (hasColon(p.name) || p.name.length === 0) {", "if (false) {"],
  ['src/graph.js', 'R1 fuera: permitir nodos duplicados',
    "if (byId.has(n.node)) {", "if (false) {"],
  ['src/graph.js', 'R2 origen: aceptar arista desde nodo inexistente',
    "if (src === undefined) {", "if (false) {"],
  ['src/graph.js', 'R2 destino: aceptar arista hacia nodo inexistente',
    "if (dst === undefined) {", "if (false) {"],
  ['src/graph.js', 'R3 salida: aceptar puerto de salida inexistente',
    "if (sp === undefined) {", "if (false) {"],
  ['src/graph.js', 'R3 entrada: aceptar puerto de entrada inexistente',
    "if (dp === undefined) {", "if (false) {"],
  ['src/graph.js', 'R4 invertir: dejar que cualquier eje 1 conecte',
    "if (sp.produces !== dp.produces) {", "if (false) {"],
  ['src/graph.js', 'R5 invertir la regla de determinismo',
    "if (dst.determinism === 'deterministic' && src.determinism !== 'deterministic') {",
    "if (dst.determinism !== 'deterministic' && src.determinism === 'deterministic') {"],
  ['src/graph.js', 'R5 fuera: borrar la regla de determinismo',
    "if (dst.determinism === 'deterministic' && src.determinism !== 'deterministic') {", "if (false) {"],
  ['src/graph.js', 'R6 fuera: permitir que un artifact se componga',
    "if (sp.artifact === true) {", "if (false) {"],
  ['src/graph.js', 'R7a borrar el rechazo de sink mal formado',
    "if (ref === null) {", "if (false) {"],
  ['src/graph.js', 'R7b borrar el rechazo de sink sobre nodo inexistente',
    "if (tool === undefined) {", "if (false) {"],
  ['src/graph.js', 'R7c borrar el rechazo de sink sobre puerto inexistente',
    "if (outputPort(tool, ref.port) === undefined) {", "if (false) {"],
  ['src/graph.js', 'R7d permitir un sink con aristas salientes',
    "if ((outEdges.get(s) ?? 0) > 0) {", "if (false) {"],
  ['src/graph.js', 'R8 borrar: aceptar salida terminal sin declarar',
    "if ((outEdges.get(ref) ?? 0) === 0 && !declared.has(ref)) {", "if (false) {"],
  ['src/graph.js', 'R9 borrar: aceptar modulo sin artifact',
    "if (artifactCount === 0) {", "if (false) {"],
  ['src/graph.js', 'R11 borrar el chequeo tier/efecto',
    "if (!tierAllows(n.tool.tier, n.tool.effect)) {", "if (false) {"],
  ['src/graph.js', 'orden: neutralizar el rechazo de duplicados',
    "if (byId.has(n.node)) {", "if (byId.has(n.node) && false) {"],
  ['src/graph.js', 'contador: checksRun nunca avanza',
    "let checksRun = 0;", "let checksRun = 999;"],

  // ---- axes.ts: los dos ejes y su derivacion -----------------------------
  ['src/axes.js', 'eje2: determinista ya no es mutacion',
    "deterministic: 'mutation'", "deterministic: 'recipe'"],
  ['src/axes.js', 'eje2: estocastica ya no es receta',
    "stochastic: 'recipe'", "stochastic: 'none'"],
  ['src/axes.js', 'eje2: con-estado pasa a compartir',
    "stateful: 'none'", "stateful: 'mutation'"],
  ['src/axes.js', 'T0 admite I/O de red',
    "if (tier === 'T0')\n        return false;", "if (tier === 'T0')\n        return true;"],
  ['src/axes.js', 'T1 admite proceso pesado',
    "if (tier === 'T1')\n        return effect !== 'process';", "if (tier === 'T1')\n        return true;"],

  // ---- contract.ts: la huella de integridad ------------------------------
  ['src/contract.js', 'huella: truncar a 16 chars',
    'return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h5) + hex(h6) + hex(h7);',
    'return (hex(h0) + hex(h1) + hex(h2) + hex(h3)).slice(0, 16);'],
  ['src/contract.js', 'huella: ignorar un termino del digest final',
    'return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h5) + hex(h6) + hex(h7);',
    'return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h5) + hex(h6) + hex(0);'],
  ['src/contract.js', 'huella: inicializacion h0 equivocada',
    'let h0 = 0x6a09e667;', 'let h0 = 0x6a09e668;'],
  ['src/contract.js', 'huella: rotacion a la derecha con 0 en vez de 7',
    'const s0 = (rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) >>> 0;',
    'const s0 = (rotr(a, 0) ^ rotr(a, 18) ^ (a >>> 3)) >>> 0;'],
  ['src/contract.js', 'huella: sin el byte 0x80 de padding',
    'msg[len] = 0x80;', 'msg[len] = 0x00;'],
  ['src/contract.js', 'huella: longitud en bits escrita little-endian',
    'view.setUint32(total - 8, Math.floor(bitLen / 0x100000000), false);',
    'view.setUint32(total - 8, Math.floor(bitLen / 0x100000000), true);'],
  ['src/contract.js', 'huella: constante K[0] alterada',
    '0x428a2f98', '0x428a2f99'],
  ['src/contract.js', 'canonicalize: no ordenar claves',
    '.sort();', '.reverse();'],
  ['src/contract.js', 'canonicalize: invertir el orden de los arreglos',
    'for (const item of value)\n            parts.push(canonicalize(item));',
    'for (const item of [...value].reverse())\n            parts.push(canonicalize(item));'],
  ['src/contract.js', 'canonicalize: emitir null en vez de rechazar NaN',
    "if (!Number.isFinite(n))\n            throw new CanonicalError(`no canonizable: numero no finito (${String(n)})`);",
    "if (!Number.isFinite(n))\n            return 'null';"],
  ['src/contract.js', 'parseRef: aceptar referencias con dos puntos en el puerto',
    "if (port.includes(':'))\n        return null;", ""],
];

function runTests(dir) {
  const res = spawnSync(process.execPath, ['--test', 'dist/test/*.test.js'], {
    cwd: dir,
    encoding: 'utf8',
    shell: true,
  });
  return res.status === 0;
}

function main() {
  const base = mkdtempSync(join(tmpdir(), 'vibe-mut-'));
  const resultados = [];
  let noAplicable = 0;

  try {
    for (const [archivo, desc, buscar, reemplazar] of MUTANTS) {
      const dir = join(base, `m${resultados.length}`);
      cpSync(dist, join(dir, 'dist'), { recursive: true });

      const ruta = join(dir, 'dist', archivo);
      const original = readFileSync(ruta, 'utf8');
      if (!original.includes(buscar)) {
        noAplicable++;
        resultados.push({ archivo, desc, estado: 'no-aplicable' });
        rmSync(dir, { recursive: true, force: true });
        continue;
      }
      writeFileSync(ruta, original.replace(buscar, reemplazar));
      const paso = runTests(dir);
      rmSync(dir, { recursive: true, force: true });
      resultados.push({ archivo, desc, estado: paso ? 'sobrevivio' : 'muerto' });
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }

  const aplicables = resultados.filter((r) => r.estado !== 'no-aplicable');
  const muertos = aplicables.filter((r) => r.estado === 'muerto');
  const porPaquete = new Map();

  for (const r of aplicables) {
    const cur = porPaquete.get(r.archivo) ?? { applicable: 0, killed: 0 };
    cur.applicable++;
    if (r.estado === 'muerto') cur.killed++;
    porPaquete.set(r.archivo, cur);
  }

  console.log('\n=== MUTATION TESTING · vibe-tools L0 ===\n');
  for (const r of resultados) {
    const marca = r.estado === 'muerto' ? 'MUERTO     ' : r.estado === 'sobrevivio' ? 'SOBREVIVIO' : 'n/aplicable';
    console.log(`  [${marca}] ${r.archivo.padEnd(18)} ${r.desc}`);
  }

  console.log('\n--- por paquete ---');
  for (const [archivo, c] of porPaquete) {
    const score = (c.killed / c.applicable) * 100;
    const flag = score >= 80 ? 'OK ' : 'BAJO';
    console.log(`  [${flag}] ${archivo.padEnd(18)} ${c.killed}/${c.applicable} = ${score.toFixed(1)}%`);
  }

  const total = muertos.length;
  const totalAplicables = aplicables.length;
  const score = totalAplicables === 0 ? 0 : (total / totalAplicables) * 100;
  console.log(`\n  TOTAL ${total}/${totalAplicables} = ${score.toFixed(1)}%  (umbral 80%)`);
  if (noAplicable > 0) console.log(`  patrones no encontrados en el compilado: ${noAplicable}`);

  const bajos = [...porPaquete.entries()].filter(([, c]) => (c.killed / c.applicable) * 100 < 80);
  if (bajos.length > 0) {
    console.log('\n  VEREDOR DEBIL: paquetes por debajo del umbral:');
    for (const [a] of bajos) console.log(`    - ${a}`);
    process.exit(1);
  }
}

main();