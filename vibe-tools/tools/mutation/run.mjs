/**
 * MUTATION TESTING (metodo primario, skill llm-testing)
 *
 * Un test suite que pasa no demuestra nada sobre si los tests detectan
 * errores. Esto introduce errores de proposito en el codigo compilado y mide
 * cuantos tests los matan. Un mutante que sobrevive es un hueco en la
 * verificacion.
 *
 * Los mutantes se aplican sobre el JS compilado: mutar sin recompilar mantiene
 * el ciclo en segundos en lugar de minutos.
 *
 * Umbral: >= 80% por paquete. Por debajo, el verificador es debil y hay que
 * reforzar los tests antes de confiar en sus PASS.
 *
 * Un patron que no aparece en el compilado se reporta como `no-aplicable` y
 * CUENTA como hueco, no como sobreviviente. Cuatro de ellos aparecieron durante
 * L0 y cuatro mas en L1, y todos revelaron huecos reales de verificacion.
 */

import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const dist = join(root, 'dist');

/** [archivo, descripcion, buscar, reemplazar] */
const MUTANTS = [
  // ---- rules/identity.ts : R0, R1, R11 ---------------------------------
  ['src/rules/identity.js', 'R0 fuera: borrar el rechazo de nombres con dos puntos',
    "if (n.node.includes(':') || n.node.length === 0) {", "if (false) {"],
  ['src/rules/identity.js', 'R0 puerto: borrar el rechazo de nombres con dos puntos',
    "if (p.name.includes(':') || p.name.length === 0) {", "if (false) {"],
  ['src/rules/identity.js', 'R1: R1 vuelve a consultar el indice precolapsado',
    'if (seen.has(n.node)) {', 'if (false) {'],
  ['src/rules/identity.js', 'R1: permitir nodos duplicados',
    'if (seen.has(n.node)) {', 'if (!seen.has(n.node)) {'],
  ['src/rules/identity.js', 'R11 borrar el chequeo tier/efecto',
    'if (!tierAllows(t.tier, t.effect)) {', 'if (false) {'],

  // ---- src/identity.ts : las tres identidades, y su clave ---------------
  ['src/identity.js', 'la clave se deriva sin el id: dos identidades comparten mod',
    'return `${PREFIJOS[kind]}:${id}`;', 'return `${PREFIJOS[kind]}`;'],
  ['src/identity.js', 'el prefijo de la empresa es otro',
    "empresa: 'identity:org',", "empresa: 'identity:enterprise',"],
  ['src/identity.js', 'la empresa puede llevar el nombre de la persona legal',
    "empresa: Object.freeze(['kind', 'id', 'projectId', 'razonSocial']),",
    "empresa: Object.freeze(['kind', 'id', 'projectId', 'razonSocial', 'nombreLegal']),"],

  // ---- src/identity/operaciones.ts : construir y comparar ----------------
  ['src/identity/operaciones.js', 'la identidad anonima no sale congelada',
    "Object.freeze({ kind: 'anonimo', id, projectId: namespaceDe('anonimo', id), nickname })",
    "{ kind: 'anonimo', id, projectId: namespaceDe('anonimo', id), nickname }"],
  ['src/identity/operaciones.js', 'dos identidades son la misma con solo el id',
    'return a.id === b.id && a.kind === b.kind && a.projectId === b.projectId;',
    'return a.id === b.id;'],

  // ---- src/identity/antifraude.ts : donde llega el antifraude -----------
  ['src/identity/antifraude.js', 'el antifraude alcanza a la empresa',
    'empresa: false,', 'empresa: true,'],
  ['src/identity/antifraude.js', 'el antifraude alcanza al anonimo',
    'anonimo: false,', 'anonimo: true,'],
  ['src/identity/antifraude.js', 'el antifraude alcanza a todos',
    'return ALCANCE_ANTIFRAUDE[identity.kind];', 'return true;'],

  // ---- src/identity/validacion.ts : la puerta ---------------------------
  ['src/identity/validacion.js', 'la clave se comprueba siempre',
    "if (c['projectId'] !== namespaceDe(k, id))", 'if (false)'],
  ['src/identity/validacion.js', 'un kind del prototipo pasa el filtro',
    'if (!Object.hasOwn(PREFIJOS, kind))', 'if (false)'],
  ['src/identity/validacion.js', 'un campo que no es del tipo pasa',
    "motivos.push('E_CAMPO_EXTRA');", ''],
  ['src/identity/validacion.js', 'un localizador en el anonimo pasa',
    "motivos.push('E_ANONIMO_LOCALIZABLE');", ''],
  ['src/identity/validacion.js', 'el KYC no se comprueba en la puerta',
    "motivos.push(...validarKyc(c['kyc']));", ''],
  ['src/identity/validacion.js', 'la razon social vacia pasa',
    "if (typeof rs !== 'string' || rs.trim().length === 0)", 'if (false)'],
  ['src/identity/validacion.js', 'el nickname vacio pasa',
    "if (typeof nick !== 'string' || nick.trim().length === 0)", 'if (false)'],
  ['src/identity/validacion.js', 'la puerta no cierra: una identidad invalida pasa',
    'if (motivos.length > 0)', 'if (false)'],

  // ---- src/context.ts : la identidad se comprueba al entrar --------------
  ['src/context.js', 'el camino rapido no comprueba la identidad',
    'afirmarIdentidad(identity);', ''],
  ['src/context.js', 'el sellado no comprueba la identidad',
    'afirmarIdentidad(ctx.identity);', ''],

  // ---- src/sandbox/runner.ts : la identidad invalida no corre ------------
  ['src/sandbox/runner.js', 'la identidad invalida no se reporta',
    'if (e instanceof IdentidadInvalidaError) {', 'if (false) {'],
  ['src/sandbox/runner.js', 'la identidad invalida se reporta como fallo de la tool',
    "'E_IDENTITY_INVALID'", "'E_TOOL_ERROR'"],

  // ---- rules/edges.ts : R2..R6 ------------------------------------------
  ['src/rules/edges.js', 'R2 origen: aceptar arista desde nodo inexistente',
    'if (src === undefined) {', 'if (false) {'],
  ['src/rules/edges.js', 'R2 destino: aceptar arista hacia nodo inexistente',
    'if (dst === undefined) {', 'if (false) {'],
  ['src/rules/edges.js', 'R3 salida: aceptar puerto de salida inexistente',
    'if (sp === undefined) {', 'if (false) {'],
  ['src/rules/edges.js', 'R3 entrada: aceptar puerto de entrada inexistente',
    'if (dp === undefined) {', 'if (false) {'],
  ['src/rules/edges.js', 'R4 dejar que cualquier eje 1 conecte',
    'if (sp.produces !== dp.produces) {', 'if (false) {'],
  ['src/rules/edges.js', 'R4 invertir la regla del eje 1',
    'if (sp.produces !== dp.produces) {', 'if (sp.produces === dp.produces) {'],
  ['src/rules/edges.js', 'R5 invertir la regla de determinismo',
    "if (dst.determinism === 'deterministic' && src.determinism !== 'deterministic') {",
    "if (dst.determinism !== 'deterministic' && src.determinism === 'deterministic') {"],
  ['src/rules/edges.js', 'R5 borrar la regla de determinismo',
    "if (dst.determinism === 'deterministic' && src.determinism !== 'deterministic') {", 'if (false) {'],
  ['src/rules/edges.js', 'R6 permitir que un artifact se componga',
    'if (sp.artifact === true) {', 'if (false) {'],

  // ---- rules/terminals.ts : R7, R8, R9 ----------------------------------
  ['src/rules/terminals.js', 'R7a borrar el rechazo de sink mal formado',
    'if (ref === null) {', 'if (false) {'],
  ['src/rules/terminals.js', 'R7b borrar el rechazo de sink sobre nodo inexistente',
    'if (tool === undefined) {', 'if (false) {'],
  ['src/rules/terminals.js', 'R7c borrar el rechazo de sink sobre puerto inexistente',
    'if (outputPort(tool, ref.port) === undefined) {', 'if (false) {'],
  ['src/rules/terminals.js', 'R7d permitir un sink con aristas salientes',
    'if (salientes > 0) {', 'if (false) {'],
  ['src/rules/terminals.js', 'R7d invertir la comprobacion de terminalidad',
    'if (salientes > 0) {', 'if (salientes === 0) {'],
  ['src/rules/terminals.js', 'R8 borrar: aceptar salida terminal sin declarar',
    'if ((state.outEdges.get(ref) ?? 0) === 0 && !state.declared.has(ref)) {', 'if (false) {'],
  ['src/rules/terminals.js', 'R8 invertir: exigir que si se declare',
    'if ((state.outEdges.get(ref) ?? 0) === 0 && !state.declared.has(ref)) {',
    'if ((state.outEdges.get(ref) ?? 0) > 0 && !state.declared.has(ref)) {'],
  ['src/rules/terminals.js', 'R9 borrar: aceptar modulo sin artifact',
    'if (artifacts === 0) {', 'if (false) {'],

  // ---- graph.ts : el orden y el contador --------------------------------
  ['src/graph.js', 'orden: sacar R4..R6 del pipeline', "['R2..R6', ruleEdges],", '// fuera'],
  ['src/graph.js', 'orden: sacar R8 del pipeline', "['R8', ruleTerminalsDeclared],", '// fuera'],
  ['src/graph.js', 'orden: sacar R9 del pipeline', "['R9', ruleDeliversArtifact],", '// fuera'],
  ['src/graph.js', 'orden: sacar R11 (dejarlo ultimo)', "['R11', ruleTierAllowsEffect],", '// fuera'],
  ['src/graph.js', 'orden: R0 al final en vez de primero',
    "['R0', ruleNames],", '// fuera'],
  ['src/rules/types.js', 'contador: el pipeline no cuenta verificaciones',
    'count(k = 1) {\n        this.n += k;', 'count(k = 1) {\n        this.n += 0;'],
  ['src/rules/types.js', 'contador: multiplicar por diez',
    'count(k = 1) {\n        this.n += k;', 'count(k = 1) {\n        this.n += k * 10;'],

  // ---- context.ts : el sellado ------------------------------------------
  ['src/context.js', 'boundary: el camino rapido vuelve a confiar en Object.isFrozen',
    'if (sealed.has(ctx))', 'if (Object.isFrozen(ctx) && Object.isFrozen(ctx.injected))'],
  ['src/context.js', 'boundary: sellado superficial en vez de profundo',
    'Object.freeze(deepFreeze({ ...ctx.injected }))', 'Object.freeze({ ...ctx.injected })'],
  ['src/context.js', 'boundary: no congelar el contexto entregado',
    'const out = Object.freeze({\n        ...ctx,', 'const out = ({\n        ...ctx,'],
  ['src/context.js', 'boundary: no recorrer los valores anidados',
    'deepFreeze(v[k]);', 'void 0;'],
  ['src/context.js', 'boundary: emptyContext sin sellar',
    'const ctx = Object.freeze({', 'const ctx = ({'],

  // ---- src/identity/kyc-puerta.ts : la puerta del KYC -------------------
  ['src/identity/kyc-puerta.js', 'un KYC que no es un objeto se acepta',
    "if (kyc === null || typeof kyc !== 'object')", 'if (false)'],
  ['src/identity/kyc-puerta.js', 'un estado que no existe se acepta',
    "if (estado !== 'simulada' && estado !== 'documental' && estado !== 'verificada')", 'if (false)'],
  ['src/identity/kyc-puerta.js', 'la simulada con evidencia pasa',
    "if (k['evidencia'] !== undefined)", 'if (false)'],
  ['src/identity/kyc-puerta.js', 'un KYC verificado sin evidencia se acepta',
    "if (evidencia === null || typeof evidencia !== 'object')", 'if (false)'],
  ['src/identity/kyc-puerta.js', 'un campo de mas en la evidencia pasa',
    "if (!CAMPOS_EVIDENCIA.includes(campo))", 'if (false)'],
  ['src/identity/kyc-puerta.js', 'un stack vacio pasa',
    "if (typeof stack !== 'string' || stack.trim().length === 0)", 'if (false)'],
  ['src/identity/kyc-puerta.js', 'una fecha ilegible pasa',
    "if (typeof fecha !== 'string' || !FECHA.test(fecha))", 'if (false)'],
  ['src/identity/kyc-puerta.js', 'unas señales que no son lista pasan',
    "if (!Array.isArray(senales))", 'if (false)'],
  ['src/identity/kyc-puerta.js', 'una señal que falta pasa',
    "if (faltan.length > 0)", 'if (false)'],

  // ---- src/identity/kyc.ts : el modelo del KYC --------------------------
  ['src/identity/kyc.js', 'la verificada no exige la señal registral',
    "if (estado === 'verificada')", 'if (false)'],
  ['src/identity/kyc.js', 'las señales no se copian',
    'senales: Object.freeze([...evidencia.senales]),', 'senales: evidencia.senales,'],
  ['src/identity/kyc.js', 'las señales no se congelan',
    'senales: Object.freeze([...evidencia.senales]),', 'senales: [...evidencia.senales],'],

  // ---- src/identity/operaciones.ts : la identidad stub y su comparacion ------
  ['src/identity/operaciones.js', 'L4: el stub nace como empresa, no como legal',
    "kind: 'legal'", "kind: 'empresa'"],
  ['src/identity/operaciones.js', 'L4: el stub dice KYC verificado sin evidencia',
    "kyc: Object.freeze({ estado: 'simulada' })", "kyc: Object.freeze({ estado: 'verificada' })"],
  ['src/identity/operaciones.js', 'L4: toda identidad es la misma',
    'return a.id === b.id && a.kind === b.kind && a.projectId === b.projectId;',
    'return true;'],
  ['src/identity/operaciones.js', 'L4: la identidad documental se declara verificada',
    "kyc: Object.freeze({ estado: 'documental', evidencia: congelarEvidencia(evidencia) })",
    "kyc: Object.freeze({ estado: 'verificada', evidencia: congelarEvidencia(evidencia) })"],
  ['src/identity/operaciones.js', 'L4: la copia comparte la evidencia del llamador',
    'kyc: Object.freeze({ ...kyc, evidencia: congelarEvidencia(kyc.evidencia) })',
    'kyc: Object.freeze({ ...kyc, evidencia: kyc.evidencia })'],
  ['src/identity/operaciones.js', 'L4: la copia no congela la evidencia',
    'evidencia: congelarEvidencia(kyc.evidencia)', 'evidencia: { ...kyc.evidencia }'],

  // ---- context.ts : la identidad viaja sellada -------------------------
  ['src/context.js', 'L4: el camino rapido deja la identidad del llamador',
    'identity: copiarIdentidad(identity),', 'identity,'],
  ['src/context.js', 'L4: la identidad sellada no se congela',
    'identity: copiarIdentidad(ctx.identity),', 'identity: { ...ctx.identity },'],
  ['src/context.js', 'L4: la identidad sellada es la del llamador',
    'identity: copiarIdentidad(ctx.identity),', 'identity: ctx.identity,'],
  ['src/context.js', 'L4: sellar congela el objeto del llamador',
    'identity: copiarIdentidad(ctx.identity),', 'identity: Object.freeze(ctx.identity),'],

  // ---- scripts/matriz.mjs : la matriz del pipeline ---------------------
  ['scripts/matriz.mjs', 'L5: la p50 de la clase es en realidad la p75',
    'p50: q(0.5),', 'p50: q(0.75),'],
  ['scripts/matriz.mjs', 'L5: la proyeccion usa el maximo en vez de la mediana',
    'return cuerpo.resumen.p50 + extra;', 'return cuerpo.resumen.max + extra;'],
  ['scripts/matriz.mjs', 'L5: un numero proyectado se escribe como medido',
    "origen: medido !== null ? 'medido' : 'proyectado',", "origen: 'medido',"],
  ['scripts/matriz.mjs', 'L5: ninguna parte se marca fuera del tope',
    'fueraDeTope: bytes !== null && bytes > tope,', 'fueraDeTope: false,'],
  ['scripts/matriz.mjs', 'L5: ninguna parte se marca sin afirmacion',
    'sinAfirmacion: claim.length === 0,', 'sinAfirmacion: false,'],
  ['scripts/matriz.mjs', 'L5: el total de la matriz no es la suma de sus partes',
    'bytesTotal: filas.reduce((a, f) => a + f.bytes, 0),', 'bytesTotal: 0,'],

  // ---- tool.ts : el registry y la delegacion ----------------------------
  ['src/tool.js', 'registro: permitir sobreescribir id@version',
    'if (this.#byKey.has(k))', 'if (false)'],
  ['src/tool.js', 'resolucion: ignorar la version al resolver', 'this.#key(id, version)', 'id'],
  ['src/tool.js', 'tool inexistente: ejecutar en vez de fallar tipado',
    'if (binding === undefined) {', 'if (false) {'],
  ['src/tool.js', 'host: ignorar el que pide el llamador',
    'env: opts.env ?? HOSTS.client', 'env: HOSTS.client'],
  ['src/tool.js', 'host: usar el de backend siempre',
    'env: opts.env ?? HOSTS.client', 'env: HOSTS.backend'],
  ['src/tool.js', 'capa estatica: no pasar el binario al runner',
    'module: opts.module,', 'module: undefined,'],

  // ---- sandbox/capability.ts : que concede cada tier --------------------
  ['src/sandbox/capability.js', 'T0 concede red: se rompe el tier entero',
    'T0: [],', "T0: ['net'],"],
  ['src/sandbox/capability.js', 'T1 concede proceso sin kernel',
    "T1: ['net', 'fs'],", "T1: ['net', 'fs', 'process'],"],
  ['src/sandbox/capability.js', 'escribir ya no exige red',
    "write: ['fs', 'net'],", "write: ['fs'],"],
  ['src/sandbox/capability.js', 'leer ya no exige archivo',
    "read: ['fs'],", 'read: [],'],
  ['src/sandbox/capability.js', 'missingFor nunca encuentra lo que falta',
    'if (!granted.includes(c))', 'if (false)'],
  ['src/sandbox/capability.js', 'effectAllowed admite cualquier cosa',
    'return missingFor(tier, effect) === null;', 'return true;'],

  // ---- sandbox/effects/create.ts : denegar y auditar --------------------
  ['src/sandbox/effects/create.js', 'denegar se convierte en "sin backend"',
    'if (!ok) {', 'if (false) {'],
  ['src/sandbox/effects/create.js', 'concedido sin backend finge transporte',
    'if (impl === undefined) {', 'if (false) {'],
  ['src/sandbox/effects/create.js', 'la bitacora miente: marca concedido lo denegado',
    'log.push(Object.freeze({ capability, op, granted: ok }));',
    'log.push(Object.freeze({ capability, op, granted: true }));'],
  ['src/sandbox/effects/create.js', 'la bitacora no se congela y se puede reescribir',
    'log.push(Object.freeze({ capability, op, granted: ok }));',
    'log.push({ capability, op, granted: ok });'],
  ['src/sandbox/effects/create.js', 'la bitacora entregada es la interna',
    'return log.slice();', 'return log;'],

  // ---- sandbox/tier.ts : que host alcanza ------------------------------
  ['src/sandbox/tier.js', 'todo host sostiene todo tier',
    'TIER_REQUIRES[tier].filter((f) => !env[f])', 'TIER_REQUIRES[tier].filter(() => false)'],
  ['src/sandbox/tier.js', 'el veredicto de soporte siempre es afirmativo',
    'return missing.length === 0 ? { ok: true, tier } : { ok: false, tier, missing };',
    'return { ok: true, tier };'],
  ['src/sandbox/tier.js', 'highest elige el tier que NO se sostiene',
    'if (s.ok)\n            return tier;', 'if (!s.ok)\n            return tier;'],
  ['src/sandbox/tier.js', 'T2 no exige microVM', "T2: ['microvm'],", 'T2: [],'],

  // ---- sandbox/runner.ts : las dos capas y la regla central -------------
  ['src/sandbox/runner.js', 'REGLA CENTRAL: el intento denegado pasa',
    'if (denegados.length > 0) {', 'if (false) {'],
  ['src/sandbox/runner.js', 'REGLA CENTRAL invertida: todo intento falla',
    'if (denegados.length > 0) {', 'if (denegados.length === 0) {'],
  ['src/sandbox/runner.js', 'capa estatica: nunca se mira el binario',
    'if (req.module !== undefined) {', 'if (false) {'],
  ['src/sandbox/runner.js', 'capa estatica: un modulo denegado se ejecuta igual',
    'if (!verdict.ok) {', 'if (false) {'],
  ['src/sandbox/runner.js', 'el host da igual: nunca se comprueba',
    'if (!support.ok) {', 'if (false) {'],
  ['src/sandbox/runner.js', 'un fallo de la tool se reporta como exito',
    'if (!outcome.ok) {', 'if (false) {'],
  ['src/sandbox/runner.js', 'boundary: entregar el contexto sin sellar',
    'sealContext(req.ctx)', 'req.ctx'],
  ['src/sandbox/runner.js', 'el sandbox entrega al usuario lo que el puerto anuncia',
    'granted: port.granted', 'granted: []'],
  ['src/sandbox/outcome.js', 'deniedCount cuenta todo, no solo lo denegado',
    'outcome.attempts.filter((a) => !a.granted).length', 'outcome.attempts.length'],

  // ---- sandbox/wasm/binary.ts : el formato ------------------------------
  ['src/sandbox/wasm/binary.js', 'LEB128 acepta un byte mas de los que u32 permite',
    'for (let i = 0; i < 5; i++)', 'for (let i = 0; i < 6; i++)'],
  ['src/sandbox/wasm/binary.js', 'LEB128 multiplica por 127 en vez de 128',
    'scale *= 128;', 'scale *= 127;'],
  ['src/sandbox/wasm/binary.js', 'LEB128 pierde el bit bajo de cada byte',
    'value += (byte & 0x7f) * scale;', 'value += (byte & 0x7e) * scale;'],
  ['src/sandbox/wasm/binary.js', 'un nombre truncado se acepta',
    'if (end > b.length)', 'if (false)'],
  ['src/sandbox/wasm/binary.js', 'limits siempre busca un max que puede no existir',
    'if ((flags & 0x01) === 0)', 'if (false)'],
  ['src/sandbox/wasm/binary.js', 'byteAt lee el byte sin comprobar el rango antes',
    'return i >= 0 && i < b.length ? b[i] : null;', 'return b[i] ?? null;'],
  ['src/sandbox/wasm/binary.js', 'la clave de la lista blanca une con otro separador',
    'return `${mod}#${field}`;', "return `${mod}.${field}`;"],

  // ---- sandbox/wasm/imports.ts : donde vive el poder --------------------
  ['src/sandbox/wasm/imports.js', 'un descriptor se lee un byte corto',
    'if (p < 0 || p > end)', 'if (false)'],
  ['src/sandbox/wasm/imports.js', 'se lee un import menos de los declarados',
    'for (let i = 0; i < count.value; i++)', 'for (let i = 0; i < count.value - 1; i++)'],
  ['src/sandbox/wasm/imports.js', 'el descriptor global avanza un byte de menos',
    'p = valType === null || mutable === null ? -1 : p + 2;',
    'p = valType === null || mutable === null ? -1 : p + 1;'],
  ['src/sandbox/wasm/imports.js', 'el descriptor de tabla no salta sus limits',
    'p = refType === null ? -1 : skipLimits(b, p + 1);', 'p = refType === null ? -1 : p + 1;'],
  ['src/sandbox/wasm/imports.js', 'el descriptor de memoria avanza un byte sin leer limits',
    'p = skipLimits(b, p);', 'p = p + 1;'],

  // ---- sandbox/wasm/structure.ts : la forma del binario -----------------
  ['src/sandbox/wasm/structure.js', 'un modulo mas corto que la cabecera se aprueba',
    'if (bytes.length < HEADER_BYTES) {', 'if (false) {'],
  ['src/sandbox/wasm/structure.js', 'un id de seccion desconocido se aprueba',
    'if (id > MAX_SECTION_ID) {', 'if (false) {'],
  ['src/sandbox/wasm/structure.js', 'una seccion truncada se aprueba',
    'if (to > bytes.length) {', 'if (false) {'],
  ['src/sandbox/wasm/structure.js', 'el orden de las secciones no se comprueba',
    'if (id <= lastId) {', 'if (false) {'],
  ['src/sandbox/wasm/structure.js', 'dos secciones de imports seguidas se aceptan',
    'if (id === IMPORT_SECTION && seenImports) {', 'if (false) {'],
  ['src/sandbox/wasm/structure.js', 'la version del modulo no se comprueba',
    'if (byteAt(bytes, i + 4) !== VERSION[i]) {', 'if (false) {'],

  // ---- sandbox/wasm/scan.ts : la politica de T0 -------------------------
  ['src/sandbox/wasm/scan.js', 'una estructura ilegible pasa a la politica',
    'if (!structure.ok) {', 'if (false) {'],
  ['src/sandbox/wasm/scan.js', 'POLITICA: cualquier import admitido',
    'if (allowed.includes(key))', 'if (true)'],
  ['src/sandbox/wasm/scan.js', 'ok ignora las violaciones',
    'ok: violations.length === 0', 'ok: true'],
  ['src/sandbox/wasm/scan.js', 'una seccion de imports malformada pasa',
    'if (parsed === null) {', 'if (false) {'],
  ['src/sandbox/wasm/scan.js', 'la lista blanca admitida ya no restringe',
    'export const T0_ALLOWED = [];', "export const T0_ALLOWED = ['a#b'];"],

  // ---- axes.ts : los dos ejes y su derivacion --------------------------
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

  // ---- hash.ts : la huella de integridad ------------------------------
  ['src/hash.js', 'huella: truncar el digest',
    'return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h5) + hex(h6) + hex(h7);',
    'return (hex(h0) + hex(h1) + hex(h2) + hex(h3)).slice(0, 16);'],
  ['src/hash.js', 'huella: ignorar un termino del digest final',
    'return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h5) + hex(h6) + hex(h7);',
    'return hex(h0) + hex(h1) + hex(h2) + hex(h3) + hex(h4) + hex(h5) + hex(h6) + hex(0);'],
  ['src/hash.js', 'huella: inicializacion h0 equivocada',
    'let h0 = 0x6a09e667;', 'let h0 = 0x6a09e668;'],
  ['src/hash.js', 'huella: rotacion a la derecha con 0 en vez de 7',
    'const s0 = (rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) >>> 0;',
    'const s0 = (rotr(a, 0) ^ rotr(a, 18) ^ (a >>> 3)) >>> 0;'],
  ['src/hash.js', 'huella: sin el byte 0x80 de padding', 'msg[len] = 0x80;', 'msg[len] = 0x00;'],
  ['src/hash.js', 'huella: longitud en bits escrita little-endian',
    'view.setUint32(total - 8, Math.floor(bitLen / 0x100000000), false);',
    'view.setUint32(total - 8, Math.floor(bitLen / 0x100000000), true);'],
  ['src/hash.js', 'huella: constante K[0] alterada', '0x428a2f98', '0x428a2f99'],

  // ---- canonical.ts : la forma ordenada --------------------------------
  ['src/canonical.js', 'canonicalize: no ordenar claves', '.sort();', '.reverse();'],
  ['src/canonical.js', 'canonicalize: invertir el orden de los arreglos',
    'for (const item of value)\n            parts.push(canonicalize(item));',
    'for (const item of [...value].reverse())\n            parts.push(canonicalize(item));'],
  ['src/canonical.js', 'canonicalize: emitir null en vez de rechazar NaN',
    "if (!Number.isFinite(n))\n            throw new CanonicalError(`no canonizable: numero no finito (${String(n)})`);",
    "if (!Number.isFinite(n))\n            return 'null';"],

  // ---- contract.ts : la huella y las lecturas ----------------------------
  ['src/contract.js', 'integridad: canonizar sobre el valor crudo sin ordenar',
    'return sha256HexOfText(canonicalize(value));', 'return sha256HexOfText(JSON.stringify(value));'],
  ['src/contract.js', 'parseRef: aceptar referencias con dos puntos en el puerto',
    "if (port.includes(':'))\n        return null;", ''],
  ['src/contract.js', 'deliveries: devolver todos los puertos, no solo los artifact',
    'return tool.outputs.filter((p) => p.artifact);', 'return [...tool.outputs];'],

  // ---- rules/order.ts : R10 ---------------------------------------------
  ['src/rules/order.js', 'R10 borrar la deteccion de ciclos',
    'if (placed.length !== names.length) {', 'if (false) {'],
  ['src/rules/order.js', 'R10 invertir la deteccion de ciclos',
    'if (placed.length !== names.length) {', 'if (placed.length > names.length) {'],
  ['src/rules/order.js', 'R10 el desempate pasa a ser alfabetico, no de declaracion',
    'for (const n of names) {\n            c.count();\n            if (done.has(n))\n                continue;\n            if (remaining.get(n).size === 0) {',
    'for (const n of [...names].sort()) {\n            c.count();\n            if (done.has(n))\n                continue;\n            if (remaining.get(n).size === 0) {'],
  ['src/rules/order.js', 'R10 cada arista hace que un nodo se espere a si mismo',
    'preds.get(e.to)?.add(e.from);', 'preds.get(e.to)?.add(e.from);\n        succ.get(e.from)?.push(e.from);'],
  ['src/rules/order.js', 'R10 no descontar al colocar un nodo: nadie llega a estar listo',
    'for (const s of succ.get(pick))\n            remaining.get(s).delete(pick);', ''],
  ['src/rules/order.js', 'R10 marcar el nodo como puesto antes de tiempo',
    'done.add(pick);\n        placed.push(pick);', 'done.add(pick);'],

  // ---- module/share.ts : mutacion vs receta ------------------------------
  ['src/module/share.js', 'POLITICA: una receta si cachea',
    "recipe: { kind: 'recipe', cache: false, comparable: true },", "recipe: { kind: 'recipe', cache: true, comparable: true },"],
  ['src/module/share.js', 'POLITICA: una tool con estado si se puede comparar',
    "none: { kind: 'none', cache: false, comparable: false },", "none: { kind: 'none', cache: false, comparable: true },"],
  ['src/module/share.js', 'POLITICA: mutacion ya no cachea',
    "mutation: { kind: 'mutation', cache: true, comparable: true },", "mutation: { kind: 'mutation', cache: false, comparable: true },"],
  ['src/module/share.js', 'cache: escribir aunque la politica no lo permita',
    'if (!policy.cache)\n            return false;', ''],
  ['src/module/share.js', 'cachedOutputs: servir lo que hay aunque la politica prohiba',
    'if (key === null || !policy.cache || !store.has(key))', 'if (key === null || !store.has(key))'],
  ['src/module/share.js', 'la clave deja de depender del input: solo id y version',
    "return integrityOf({ tool: `${id}@${version}`, input });", 'return integrityOf({ tool: `${id}@${version}` });'],
  ['src/module/share.js', 'la clave depende del separador de texto: se pueden colisionar',
    'return integrityOf({ tool: `${id}@${version}`, input });',
    "return sha256HexOfText(`${id}@${version}:${String(input)}`).toString();"],

  // ---- module/bind.ts : llenar puertos -----------------------------------
  ['src/module/bind.js', 'bind: aceptar un puerto de entrada sin valor (undefined silencioso)',
    'else if (Object.prototype.hasOwnProperty.call(src.entry, here)) {', 'else if (true) {'],
  ['src/module/bind.js', 'bind: borrar el indice de alimentadores',
    'for (const e of edges)\n        m.set(`${e.to}:${e.toPort}`, `${e.from}:${e.fromPort}`);', ''],
  ['src/module/bind.js', 'bind: el feeder se invierte, la entrada se toma de la salida',
    'm.set(`${e.to}:${e.toPort}`, `${e.from}:${e.fromPort}`);', 'm.set(`${e.from}:${e.fromPort}`, `${e.to}:${e.toPort}`);'],

  // ---- module/run.ts : la caminata ---------------------------------------
  ['src/module/run.js', 'run: borrar el rechazo por puerto de entrada sin valor',
    'if (!bound.ok) {', 'if (false) {'],
  ['src/module/run.js', 'run: continuar despues de un nodo fallido',
    'if (!outcome.ok) {', 'if (false) {'],
  ['src/module/run.js', 'run: borrar el chequeo de tool no registrada',
    'if (!registry.has(tool.id, tool.version)) {', 'if (false) {'],
  ['src/module/run.js', 'run: no cruzar el contrato con la magia (puertos no emitidos)',
    'if (missing.length > 0) {', 'if (false) {'],
  ['src/module/run.js', 'run: ENTRAR artefactos aunque la corrida haya fallado',
    'deliveries: failure === null ? deliveriesOf(plan, runs) : new Map(),', 'deliveries: deliveriesOf(plan, runs),'],
  ['src/module/run.js', 'run: el reuso se ignora y la tool se ejecuta siempre',
    'if (cached !== null) {', 'if (false) {'],
  ['src/module/run.js', 'run: borrar la grabacion en la cache',
    'if (key !== null)\n            store.record(key, outcome.outputs, policy);', ''],

  // ---- module/deliver.ts : que entrego ----------------------------------
  ['src/module/deliver.js', 'unemittedPorts: toda tool cumple su contrato',
    'return tool.outputs.filter((p) => !outputs.some((o) => o.port === p.name)).map((p) => p.name);', 'return [];'],
  ['src/module/deliver.js', 'deliveries: entregar tambien desde un nodo que fallo',
    'if (run === undefined || !run.ok)', 'if (run === undefined)'],

  // ---- module/harness.ts : modo X ---------------------------------------
  ['src/module/harness.js', 'harness: sortear entre varias entregas del mismo modo',
    'if (found.length > 1) {', 'if (false) {'],
  ['src/module/harness.js', 'harness: devolver un artifact cualquiera cuando el modo no existe',
    'if (found.length === 0) {', 'if (false) {'],
  ['src/module/harness.js', 'harness: mirar el modo antes que el fallo de la corrida',
    'if (!run.ok) {', 'if (false) {'],
  ['src/module/harness.js', 'harness: aceptar cualquier puerto, no solo los artifact del modo',
    'if (port === undefined || !port.artifact || port.produces !== mode)', 'if (port === undefined)'],

  // ---- tools/render.ts : el escapado es la frontera ----------------------
  ['src/tools/render.js', 'escapeXml: el & se escapa al final, y el escapado se escapa a si mismo',
    "return v\n        .replace(/&/g, '&amp;')\n        .replace(/</g, '&lt;')",
    "return v\n        .replace(/</g, '&lt;')"],
  ['src/tools/render.js', 'escapeXml: los <> crudos pasan de largo',
    ".replace(/</g, '&lt;')\n        .replace(/>/g, '&gt;')", ''],
  ['src/tools/render.js', 'escapeXml: la comilla doble no se escapa',
    ".replace(/\"/g, '&quot;')", ''],
  ['src/tools/render.js', 'renderSvg: el ancho deja de seguir al texto',
    'const width = Math.max(...lines.map((l) => l.length)) * CHAR_W + PAD * 2;', 'const width = 100;'],
  ['src/tools/render.js', 'renderSvg: cada linea sale sin la coordenada horizontal',
    '.map((l, i) => `<text x="${PAD}" y="${PAD + i * LINE_H}"', '.map((l, i) => `<text y="${PAD + i * LINE_H}"'],

  // ---- tools/draft.ts : la variabilidad esta en el input -----------------
  ['src/tools/draft.js', 'draft: quitar el separador NUL entre topic y nonce',
    'return sha256HexOfText(topic + String.fromCharCode(0) + nonce);', 'return sha256HexOfText(topic + nonce);'],
  ['src/tools/draft.js', 'draft: el topic ya no entra en la semilla',
    'return sha256HexOfText(topic + String.fromCharCode(0) + nonce);', 'return sha256HexOfText(nonce);'],
  ['src/tools/draft.js', 'draft: la semilla deja de elegir el closer',
    'const closer = CLOSERS[parseInt(d.slice(2, 4), 16) % CLOSERS.length];', 'const closer = CLOSERS[0];'],

  // ---- src/aislamiento/vinculo.ts : el vinculo con la base ---------------
  ['src/aislamiento/vinculo.js', 'el vinculo se fija con SET, que se pega a la sesion',
    'SET LOCAL ${AJUSTE_VINCULO}', 'SET ${AJUSTE_VINCULO}'],
  ['src/aislamiento/vinculo.js', 'el vinculo no abre su transaccion',
    'BEGIN;\\nSET LOCAL', 'SET LOCAL'],
  ['src/aislamiento/vinculo.js', 'el vinculo acepta cualquier proyecto',
    'if (!esUuid(proyectoId)) {', 'if (false) {'],
  ['src/aislamiento/vinculo.js', 'la denegacion no escapa el texto del recurso',
    "return texto.replace(/'/g, \"''\");", 'return texto;'],
  ['src/aislamiento/vinculo.js', 'la denegacion no cierra su transaccion, y se pierde',
    '`COMMIT;`,', ''],
  ['src/aislamiento/vinculo.js', 'la denegacion no dice por que se denego',
    "'${escapar(motivo)}'", "'denegado'"],
  ['src/aislamiento/vinculo.js', 'la lectura no dice que operacion es',
    "'SELECT'", "'LECTURA'"],
  ['src/aislamiento/vinculo.js', 'la lectura no escapa el resultado',
    "'${escapar(resultado)}'", "'${resultado}'"],
  ['src/aislamiento/vinculo.js', 'la lectura no cierra su transaccion, y se pierde',
    'CIERRE_VINCULO,', ''],

  // ---- tools/coherencia.mjs : el artefacto y la contradiccion -----------
  ['tools/coherencia.mjs', 'el artefacto mide caracteres y no bytes',
    "bytes: Buffer.byteLength(texto, 'utf8'),", 'bytes: texto.length,'],
  ['tools/coherencia.mjs', 'la contradiccion elige un numero que no esta en otra parte',
    'indice > 0 && lista.some((x) => x.n === n)', 'lista.some((x) => x.n === n)'],
  ['tools/coherencia.mjs', 'la contradiccion no cambia el numero',
    'const cambiado = String(Number(elegido.n) + 1);', 'const cambiado = elegido.n;'],
  ['tools/coherencia.mjs', 'la contradiccion cambia la parte equivocada',
    'partesNuevas[elegido.parte] = { ...partes[elegido.parte], texto: textoNuevo };',
    'partesNuevas[0] = { ...partes[0], texto: textoNuevo };'],

  // ---- tools/coherencia-guard.mjs : las constantes declaradas ----------
  ['tools/coherencia-guard.mjs', 'la comparacion siempre dice que coincide',
    'coincide: Number(m[1]) === esperado,', 'coincide: true,'],
  ['tools/coherencia-guard.mjs', 'el ancla no exige la palabra del tope',
    '/(?:tope|', '/(?:|'],
  ['tools/coherencia-guard.mjs', 'la linea del hallazgo no es la del numero',
    'linea: i + 1,', 'linea: i,'],
  ['tools/coherencia-guard.mjs', 'los hallazgos se descartan',
    'malas: hallazgos.filter((h) => !h.coincide),', 'malas: [],'],

  // ---- src/permisos/politica.ts : la concesion tiene tres claves ---------
  ['src/permisos/politica.js', 'la version no se comprueba: el permiso se hereda',
    'if (concesion.version !== descriptor.version)', 'if (false)'],
  ['src/permisos/politica.js', 'el autor no se comprueba: el permiso se hereda',
    'if (concesion.autor !== descriptor.author)', 'if (false)'],

  // ---- src/permisos/categorias.ts : la escala y sus bordes ---------------
  ['src/permisos/categorias.js', 'la escala no es monotona: historial no alcanza a preferencias',
    'return posicion(concedida) >= posicion(pedida);', 'return posicion(concedida) > posicion(pedida);'],
  ['src/permisos/categorias.js', 'una categoria desconocida vale como la mas baja',
    'if (i < 0)\n        throw new Error(`categoria de contexto desconocida: ${categoria}`);', 'if (i < 0)\n        return 0;'],
  ['src/permisos/categorias.js', 'el techo mas bajo no manda: manda el mas alto',
    'return posicion(a) <= posicion(b) ? a : b;', 'return posicion(a) >= posicion(b) ? a : b;'],

  // ---- src/permisos/puerta.ts : quien decide, y dice por que ------------
  ['src/permisos/puerta.js', 'sin concesion, el permiso concede todo',
    'if (concesion === undefined)\n        return SIN_PERMISO;',
    "if (concesion === undefined)\n        return Object.freeze({ categoria: 'usage_history', psicometria: Object.freeze([]), escritura: true });"],
  ['src/permisos/puerta.js', 'el techo declarado no acota la concesion',
    'categoria: menor(concesion.categoria, descriptor.context_profile),',
    'categoria: concesion.categoria,'],
  ['src/permisos/puerta.js', 'la categoria no concedida pasa: la puerta concede de mas',
    "if (!alcanza(permiso.categoria, pedida)) {\n        return { concedido: false, motivo: 'E_CATEGORIA_NO_CONCEDIDA', categoria: 'none' };\n    }", 'if (false) { }'],
  ['src/permisos/puerta.js', 'el techo declarado no se comprueba',
    "if (!alcanza(descriptor.context_profile, pedida)) {\n        return { concedido: false, motivo: 'E_TECHO_DECLARADO', categoria: 'none' };\n    }", 'if (false) { }'],
  ['src/permisos/puerta.js', 'la psicometria se concede sin que la tool la declare',
    "if (!descriptor.psychometrics) {\n        return { concedido: false, motivo: 'E_PSICOMETRIA_NO_DECLARADA', finalidad: null };\n    }", 'if (false) { }'],
  ['src/permisos/puerta.js', 'la finalidad no consentida pasa',
    "if (!concesion.psicometria.includes(finalidad)) {\n        return { concedido: false, motivo: 'E_FINALIDAD_NO_CONSENTIDA', finalidad: null };\n    }", 'if (false) { }'],
  ['src/permisos/puerta.js', 'la escritura se concede sin estar concedida',
    "if (!concesion.escritura)\n        return { concedido: false, motivo: 'E_ESCRITURA_NO_CONCEDIDA' };", 'if (false) { }'],
  ['src/permisos/puerta.js', 'la denegacion no dice por que se denego',
    "motivo: 'E_SIN_CONCESION', categoria: 'none'", "motivo: 'E_CONCEDIDO', categoria: 'none'"],

  // ---- src/permisos/contexto.ts : lo que llega a la tool -----------------
  ['src/permisos/contexto.js', 'pedir preferencias mete el historial: la categoria no acota',
    "case 'preferences':\n            return { ...campos.preferencias };",
    "case 'preferences':\n            return { ...campos.preferencias, ...campos.historial };"],
  ['src/permisos/contexto.js', 'el psicometrio entra sin su decision',
    'if (psicometria.concedido) {', 'if (true) {'],
  ['src/permisos/contexto.js', 'una categoria no concedible no falla: el deny by default se rompe en silencio',
    "throw new Error(`categoria no concedible: ${categoria}`);", "return {};"],

  // ---- src/paquete/formato.ts : la forma, mirada -------------------------
  ['src/paquete/formato.js', 'un campo que el formato no define pasa',
    'if (!CAMPOS_PAQUETE.includes(clave)) {', 'if (false) {'],
  ['src/paquete/formato.js', 'una version de formato ajena pasa',
    'if (obj.formato_version !== VERSION_FORMATO) {', 'if (false) {'],
  ['src/paquete/formato.js', 'un formato ajeno pasa',
    'if (obj.formato !== FORMATO_PAQUETE) {', 'if (false) {'],
  ['src/paquete/formato.js', 'un campo ausente pasa',
    'if (!Object.prototype.hasOwnProperty.call(obj, campo)) {', 'if (false) {'],
  ['src/paquete/formato.js', 'una huella que no es cadena pasa',
    "if (typeof obj.huella !== 'string' || obj.huella === '') {", 'if (false) {'],
  ['src/paquete/formato.js', 'un modulo que no es modulo pasa',
    'if (!esModulo(obj.modulo)) {', 'if (false) {'],
  ['src/paquete/formato.js', 'un texto que no es JSON se lee',
    "motivo: 'E_LECTURA',", "motivo: 'E_CAMPO_AUSENTE',"],
  ['src/paquete/formato.js', 'las peticiones no se derivan: aparecen las tools que no piden',
    'if (contexto === null && !tool.psychometrics)', 'if (false)'],
  ['src/paquete/formato.js', 'la psicometria no se pide',
    'psicometria: tool.psychometrics,', 'psicometria: false,'],
  ['src/paquete/formato.js', 'el contexto no se pide',
    "const contexto = tool.context_profile === 'none' ? null : tool.context_profile;", 'const contexto = null;'],

  // ---- src/paquete/exportar.ts : empaquetar ------------------------------
  ['src/paquete/exportar.js', 'la huella no es la del modulo',
    'huella: integrityOf(modulo),', "huella: '',"],
  ['src/paquete/exportar.js', 'la version del formato no viaja',
    'formato_version: VERSION_FORMATO,', "formato_version: '0.0.0',"],
  ['src/paquete/exportar.js', 'el texto no es el canonico: depende del orden con que se armo',
    'return canonicalize(paquete);', 'return JSON.stringify(paquete);'],

  // ---- src/paquete/instalar.ts : lo que se hace con lo que viene de fuera
  ['src/paquete/instalar.js', 'la forma del paquete no se comprueba',
    'if (!forma.ok) {', 'if (false) {'],
  ['src/paquete/instalar.js', 'la huella no se comprueba: un paquete alterado se instala',
    'if (huella !== paquete.huella) {', 'if (false) {'],
  ['src/paquete/instalar.js', 'un modulo invalido se instala',
    'if (!validacion.ok) {', 'if (false) {'],
  ['src/paquete/instalar.js', 'el motivo del modulo invalido no lo dice',
    "motivo: 'E_MODULO_INVALIDO',", "motivo: 'E_LECTURA',"],
  ['src/paquete/instalar.js', 'instalar concede permisos',
    'politica: POLITICA_VACIA,',
    "politica: { concessiones: [{ herramienta: 'x', version: '1.0.0', autor: 'y', categoria: 'usage_history', psicometria: [], escritura: true }] },"],
  ['src/paquete/instalar.js', 'el orden topologico no viaja',
    'orden: validacion.plan.executionOrder,', 'orden: [],'],

  // ---- src/juez/ambitos.ts : el ambito se asigna por ruta ---------------
  ['src/juez/ruta-de-ambito.js', 'un archivo suelto del conjunto juzgable se queda sin ambito',
    'if (suelto !== undefined)', 'if (false)'],
  ['src/juez/ruta-de-ambito.js', 'una raiz sin archivo hereda el ambito por prefijo',
    'if (r.startsWith(prefijo) && r.length > prefijo.length)', 'if (r.startsWith(prefijo))'],
  ['src/juez/ruta-de-ambito.js', 'el riesgo alto no sube el consenso',
    "return riesgo === 'alto' ? 3 : DEFINICIONES[ambito].consenso;", 'return DEFINICIONES[ambito].consenso;'],

  // ---- src/juez/encargo.ts : lo que se rechaza sin gastar una llamada ----
  ['src/juez/encargo.js', 'un encargo sin afirmaciones pasa',
    'if (encargo.afirmaciones.length === 0)', 'if (false)'],
  ['src/juez/encargo.js', 'una afirmacion vacia gasta una llamada',
    "if (afirmacion.trim() === '')", 'if (false)'],
  ['src/juez/encargo.js', 'una afirmacion multilinea se acepta',
    "if (afirmacion.includes('\\n'))", 'if (false)'],
  ['src/juez/encargo.js', 'una afirmacion sobre el tope se acepta y el proveedor la trunca',
    'if (bytes > topeAfirmacion)', 'if (false)'],
  ['src/juez/encargo.js', 'un tipo de evaluacion ajeno se ignora',
    'if (!EVAL_TYPES_DEL_PIPELINE.includes(encargo.evalType))', 'if (false)'],
  ['src/juez/encargo.js', 'una ruta sin ambito se juzga igual',
    'if (ambito === null)', 'if (false)'],

  // ---- src/juez/medida.ts : alineado, deriva, parada y disenso -----------
  ['src/juez/medida.js', 'una muestra sin proveedor no se distingue de un juicio',
    'const infra = m.find((s) => s.degradado || s.proveedor === null || s.proveedor.trim() === \'\');',
    'const infra = m.find((s) => s.degradado);'],
  ['src/juez/medida.js', 'una minoria discrepante se toma por mayoria',
    'if (maximo < m.length || modal === undefined)', 'if (modal === undefined)'],
  ['src/juez/medida.js', 'el empate se reporta como una minoria',
    'ganadores.length > 1', 'false'],
  ['src/juez/medida.js', 'la desviacion es muestral y no poblacional',
    'const varianza = valores.reduce((a, b) => a + (b - m) * (b - m), 0) / valores.length;',
    'const varianza = valores.reduce((a, b) => a + (b - m) * (b - m), 0) / Math.max(1, valores.length - 1);'],
  ['src/juez/medida.js', 'el agregado publica la confianza mas alta y no la mas baja',
    'confianzaMinima: Math.min(...alineados.map((d) => d.confianza)),',
    'confianzaMinima: Math.max(...alineados.map((d) => d.confianza)),'],
  ['src/juez/medida.js', 'el agregado esconde la parte mas dispersa',
    'stddevMaximo: Math.max(...alineados.map((d) => d.stddev)),',
    'stddevMaximo: Math.min(...alineados.map((d) => d.stddev)),'],
  ['src/juez/medida.js', 'la infraestructura se confunde con el juicio semantico',
    "if (motivos.includes('infraestructura')) {", 'if (false) {'],

  // ---- src/juez/pipeline.ts : el plan y la correspondencia ---------------
  ['src/juez/pipeline.js', 'una afirmacion para todas las partes se acepta',
    'if (encargo.afirmaciones.length !== partes.length)', 'if (false)'],
  ['src/juez/pipeline.js', 'una parte repetida se planifica',
    'if (vistos.has(parte.n)) {', 'if (false) {'],
  ['src/juez/pipeline.js', 'una parte vacia se planifica',
    'if (parte.bytes <= 0) {', 'if (false) {'],
  ['src/juez/pipeline.js', 'una parte sobre el tope se planifica',
    'if (parte.bytes > opciones.tope) {', 'if (false) {'],
  ['src/juez/pipeline.js', 'el plan no multiplica las llamadas por el consenso',
    'llamadas: partes.length * revision.consenso,', 'llamadas: partes.length,'],
  ['src/juez/pipeline.js', 'se publica el veredicto de otro sha',
    'if (medida.sha !== parte.sha) {', 'if (false) {'],
  ['src/juez/pipeline.js', 'se publica el veredicto de otros bytes',
    'if (medida.bytes !== parte.bytes) {', 'if (false) {'],
  ['src/juez/pipeline.js', 'se publica con menos muestras de las que pide el plan',
    'if (medida.muestras.length !== plan.consenso) {', 'if (false) {'],
  ['src/juez/pipeline.js', 'toda medida decide publicar',
    "const decision = agregado.tipo === 'alineado' ? 'publicar' : agregado.tipo === 'deriva' ? 'corregir' : 'parar';",
    "const decision = 'publicar';"],

  // ---- src/juez/coste.ts : lo medido y lo que no se puede medir ----------
  ['src/juez/coste.js', 'la latencia se suma en vez de tomar el maximo',
    'latenciaMs: latencias.length === 0 ? null : Math.max(...latencias),',
    'latenciaMs: latencias.length === 0 ? null : latencias.reduce((a, b) => a + b, 0),'],
  ['src/juez/coste.js', 'los tokens no medidos se publican como cero',
    'tokens: null,', 'tokens: 0,'],
  ['src/juez/coste.js', 'el margen no calculable se publica como cero',
    'margen: null,', 'margen: 0,'],

  // ---- src/juez/whitelist.ts : el backend es una lista, no una regla -----
  ['src/juez/whitelist.js', 'un nodo T2 con tool fuera de la lista pasa',
    'const fuera = backend.filter((n) => !permitidas.includes(n.tool.id)).map((n) => n.tool.id);',
    'const fuera = [];'],
  ['src/juez/whitelist.js', 'la lista mira T1 en vez de T2',
    "const backend = modulo.nodes.filter((n) => n.tool.tier === 'T2');",
    "const backend = modulo.nodes.filter((n) => n.tool.tier === 'T1');"],
  // ---- src/marketplace/clase.ts : el distintivo ---------------------------
  ['src/marketplace/clase.js', 'la clase de una tool no sale del eje 2',
    'return sharePolicy(determinismo).kind;', "return 'mutation';"],
  ['src/marketplace/clase.js', 'un modulo con un nodo con estado no es none',
    "if (delNodo === 'none')", 'if (false)'],
  ['src/marketplace/clase.js', 'un modulo con un nodo estocastico no es recipe',
    "if (delNodo === 'recipe')", 'if (false)'],

  // ---- src/marketplace/entrada.ts : lo que la entrada deriva -------------
  ['src/marketplace/entrada.js', 'el nivel de un modulo no es modulo',
    "return esModulo(descriptor) ? 'modulo' : 'tool';", "return 'tool';"],
  ['src/marketplace/entrada.js', 'la huella de la entrada no es la del descriptor',
    'huella: integrityOf(descriptor),', "huella: 'x'.repeat(64),"],
  ['src/marketplace/entrada.js', 'el autor de la entrada no es el del descriptor',
    'autor: descriptor.author,', "autor: 'alguien',"],
  ['src/marketplace/entrada.js', 'una entrada nace publicada',
    "estado: 'creado',", "estado: 'publicado',"],

  // ---- src/marketplace/manifiesto.ts : lo que el juez va a leer -----------
  ['src/marketplace/manifiesto.js', 'el manifiesto no hace una parte por nodo',
    'for (const nodo of entrada.descriptor.nodes) {',
    'for (const nodo of entrada.descriptor.nodes.slice(0, 1)) {'],
  ['src/marketplace/manifiesto.js', 'el sha de la parte no es el de su texto',
    'sha: sha256HexOfText(c.texto),', "sha: '',"],
  ['src/marketplace/manifiesto.js', 'el manifiesto no dice el determinismo',
    'determinismo: ${tool.determinism}', 'determinismo: desconocido'],

  // ---- src/marketplace/validar.ts : lo que se comprueba antes de publicar -
  ['src/marketplace/validar.js', 'la huella no se comprueba',
    'if (huella !== entrada.huella) {', 'if (false) {'],
  ['src/marketplace/validar.js', 'las reglas del modulo no se comprueban',
    'const reglas = validate(entrada.descriptor);', 'const reglas = { ok: true };'],
  ['src/marketplace/validar.js', 'la lista blanca no se comprueba',
    'const lista = revisarWhitelist(entrada.descriptor);', 'const lista = { ok: true };'],
  ['src/marketplace/validar.js', 'el numero de afirmaciones no se comprueba',
    'if (partes.length !== entrada.afirmaciones.length) {', 'if (false) {'],
  ['src/marketplace/validar.js', 'una tool que no entrega nada pasa',
    'if (deliveries(tool).length === 0) {', 'if (false) {'],
  ['src/marketplace/validar.js', 'una tool con un efecto que su tier no sostiene pasa',
    'if (!tierAllows(tool.tier, tool.effect)) {', 'if (false) {'],
  ['src/marketplace/validar.js', 'una afirmacion vacia se acepta',
    "if (afirmacion.trim() === '') {", 'if (false) {'],
  ['src/marketplace/validar.js', 'publicar el trabajo de otro no es riesgo alto',
    "riesgo: 'alto',", "riesgo: 'normal',"],

  // ---- src/marketplace/licencia.ts : la licencia de distribucion ---------
  ['src/marketplace/licencia.js', 'la licencia puede transferir la propiedad',
    'if (licencia.transferencia !== TRANSFERENCIA) {', 'if (false) {'],
  ['src/marketplace/licencia.js', 'la licencia puede no conceder la distribucion',
    'for (const concesion of CONCESIONES) {', 'for (const concesion of []) {'],
  ['src/marketplace/licencia.js', 'la licencia puede no reservar la suspension',
    'for (const reserva of RESERVAS) {', 'for (const reserva of []) {'],
  ['src/marketplace/licencia.js', 'la licencia puede ser de otro autor',
    'if (licencia.propietario !== propietario) {', 'if (false) {'],

  // ---- src/marketplace/publicar.ts : el flujo, paso a paso ---------------
  ['src/marketplace/publicar.js', 'se puede validar dos veces',
    "const precondition = exige(entrada, 'creado');", 'const precondition = null;'],
  ['src/marketplace/publicar.js', 'se puede juzgar sin validar',
    "const precondition = exige(entrada, 'validado');", 'const precondition = null;'],
  ['src/marketplace/publicar.js', 'se puede publicar sin estar licenciado',
    "const precondition = exige(entrada, 'licenciado');", 'const precondition = null;'],
  ['src/marketplace/publicar.js', 'el veredicto de otra entrada se acepta',
    'if (juzgada === undefined || juzgada.sha !== parte.sha) {', 'if (false) {'],
  ['src/marketplace/publicar.js', 'un veredicto con drift publica',
    "if (publicacion.decision !== 'publicar') {", 'if (false) {'],
  ['src/marketplace/publicar.js', 'la licencia no se comprueba al aceptarla',
    'const comprobacion = comprobarLicencia(licencia, entrada.autor);', 'const comprobacion = { ok: true };'],
  ['src/marketplace/publicar.js', 'una suspension sin motivo se acepta',
    "if (motivo.trim() === '') {\n        return fallo('estado_invalido', 'una suspension sin motivo no es una suspension: es una extincion');",
    "if (false) {\n        return fallo('estado_invalido', 'una suspension sin motivo no es una suspension: es una extincion');"],
  ['src/marketplace/publicar.js', 'una retirada sin motivo se acepta',
    "if (motivo.trim() === '') {\n        return fallo('estado_invalido', 'una retirada sin motivo no es una retirada: es un borrado');",
    "if (false) {\n        return fallo('estado_invalido', 'una retirada sin motivo no es una retirada: es un borrado');"],

  // ---- src/marketplace/pin.ts : las propias de primero -------------------
  ['src/marketplace/pin.js', 'el pin no se aplica: las propias no van primero',
    'return [...propiasVisibles, ...deTerceros];', 'return [...deTerceros, ...propiasVisibles];'],
  ['src/marketplace/pin.js', 'lo que no esta publicado se lista',
    ".filter((e) => e.estado === 'publicado')", '.filter(() => true)'],
  ['src/marketplace/pin.js', 'cualquier entrada es propia',
    'return propias.includes(entrada.id);', 'return true;'],
  ['src/marketplace/pin.js', 'el listado no se ordena por publicacion',
    '.sort((a, b) => (a.secuencia ?? 0) - (b.secuencia ?? 0));', ''],

  // ---- src/marketplace/catalogo.ts : el catalogo -------------------------
  ['src/marketplace/catalogo.js', 'el numero de publicacion no avanza',
    'siguiente: catalogo.siguiente + 1,', 'siguiente: catalogo.siguiente,'],
  ['src/marketplace/catalogo.js', 'sustituir una entrada que no existe no falla',
    'if (indice < 0) {', 'if (false) {'],
  ['src/marketplace/catalogo.js', 'el catalogo publica lo que el flujo no publico',
    'const resultado = publicarEntrada(entrada, catalogo.siguiente);', 'const resultado = { ok: true, entrada };'],

  // ---- src/marketplace/niveles.ts : los dos niveles ----------------------
  ['src/marketplace/niveles.js', 'porNivel no separa los niveles',
    "return entradas.filter((e) => (esModulo(e.descriptor) ? 'modulo' : 'tool') === nivel);",
    'return entradas;'],
  ['src/marketplace/niveles.js', 'el descubrimiento son las tools',
    'return modulos(entradas);', 'return herramientas(entradas);'],
  ['src/marketplace/niveles.js', 'las tools de un modulo se repiten',
    'vistas.set(`${nodo.tool.id}@${nodo.tool.version}`, { id: nodo.tool.id, version: nodo.tool.version });',
    'vistas.set(nodo.node, { id: nodo.tool.id, version: nodo.tool.version });'],
];

/**
 * Corre la suite en el directorio dado.
 *
 * POR QUE EL GLOB SE PASA A NODE Y NO AL SHELL. Con `shell: true` el glob
 * `dist/test/*.test.js` lo expande quien reciba la linea de comandos: en
 * Linux, `/bin/sh`; en Windows, `cmd.exe` NO lo expande, y lo expande Node.
 * Es decir: en cada plataforma llega a Node una cosa distinta, y el
 * verificador deja de ser comparable entre maquinas.
 *
 * MEDIDO (2026-10-23). Con la lista explicita de archivos, que es lo que
 * produce la expansion del shell, **19 de los 142 mutantes sobreviven**; con
 * el patron, que expande Node, **los 142 mueren**. Los dos ejecutan los
 * mismos 263 tests y los dos dan 263 pass, y aun asi el resultado del
 * verificador es distinto. La instrumentacion muestra por que: con la lista,
 * «la mutacion SI se aplico · suite: # tests 263 · # pass 263 · # fail 0».
 * La mutacion se aplico y la suite paso: el verificador no la vio.
 *
 * ASI QUE: sin shell, y el patron lo expande Node en todas partes.
 *
 * Y DEVUELVE EL RESUMEN DE LA SALIDA. Cuando un mutante sobrevive, el
 * motivo importa: sin ver que corrio la suite no se puede distinguir «el
 * mutante no cambio nada» de «el mutante cambio algo y el test no lo nota».
 * Con el resumen, la distincion queda a la vista.
 */
function sha256HexOfText(t) {
  return createHash("sha256").update(t, "utf8").digest("hex");
}

/**
 * Corre la suite en el directorio dado.
 *
 * POR QUE NO HAY GLOB NI SHELL. Con `shell: true`, el glob
 * `dist/test/*.test.js` lo expande quien reciba la linea de comandos: en
 * Linux, `/bin/sh`; en Windows, `cmd.exe` NO lo expande, y lo que llega a
 * Node es un patron que no corresponde a ningun archivo. Node responde con
 * un error y sale con codigo 1. **Y un exit 1 significa «el test fallo», asi
 * que el harness contaba ESO como «el mutante murio».**
 *
 * MEDIDO (2026-10-23). Con `shell: true` en Windows: exit=1 y **salida
 * vacia**: no corrio ni un test, y los 142 mutantesudades «muertos». El
 * 142/142 que el repo reportaba desde L0 no era una medida: era la cuenta de
 * un comando de test que no arranco. En Linux, donde `/bin/sh` si expande,
 * los tests SI corren, y el numero real es otro.
 *
 * ASI QUE: la lista de archivos se expande aqui, y se le pasa a Node. Ademas
 * se LEE el conteo de tests de la salida, para poder distinguir tres cosas
 * que el codigo de salida no distingue:
 *   - la suite corrio y fallo: el mutante murio. (exit != 0)
 *   - la suite corrio y paso: el mutante sobrevivio. (exit == 0, tests > 0)
 *   - la suite no corrio: el mutante NO ES VERIFICABLE. (tests == 0)
 * El tercero no es un sobreviviente: es un hueco, y se cuenta como hueco.
 */
function runTests(dir) {
  const archivos = readdirSync(join(dir, 'dist', 'test'))
    .filter((f) => f.endsWith('.test.js'))
    .sort()
    .map((f) => join('dist', 'test', f));
  // Los tests del PIPELINE tambien cuentan. Antes el pipeline (los scripts que
  // generan la superficie) no tenia ninguna verificacion, y un mutante que
  // solo rompia el pipeline no lo detectaba nadie: el harness lo media como
  // un hueco, no como un sobreviviente.
  const dirScripts = join(dir, 'scripts');
  if (existsSync(dirScripts)) {
    for (const f of readdirSync(dirScripts).filter((f) => f.endsWith('.test.mjs')).sort()) {
      archivos.push(join('scripts', f));
    }
  }
  // Y los de las HERRAMIENTAS. El mecanismo de partes y el de coherencia
  // viven en tools/, y sin esto sus pruebas no contaban: un mutante de
  // tools/ no lo detectaba nadie, y el harness lo media como un hueco.
  const dirTools = join(dir, 'tools');
  if (existsSync(dirTools)) {
    for (const f of readdirSync(dirTools).filter((f) => f.endsWith('.test.mjs')).sort()) {
      archivos.push(join('tools', f));
    }
  }
  if (archivos.length === 0) {
    return { ok: false, arranco: false, tests: 0, resumen: 'dist/test no tiene archivos .test.js', status: null };
  }
  const res = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...archivos], {
    cwd: dir,
    encoding: 'utf8',
  });
  const salida = `${res.stdout ?? ''}${res.stderr ?? ''}`;
  const num = (re) => {
    const m = salida.match(re);
    return m ? Number(m[1]) : 0;
  };
  const tests = num(/^# tests (\d+)$/m);
  const resumen = salida.split('\n').filter((l) => /^# (tests|pass|fail)/.test(l)).join(' · ');
  return {
    ok: res.status === 0,
    // «arranco» es lo que faltaba: si los tests no llegaron a correr, el
    // resultado del comando NO dice nada sobre el mutante.
    arranco: tests > 0,
    tests,
    resumen: resumen || `exit=${res.status} · sin resumen`,
    status: res.status,
  };
}
function main() {
  const base = mkdtempSync(join(tmpdir(), 'vibe-mut-'));
  const resultados = [];
  let noAplicable = 0;

  // --solo N: corre UN mutante. La corrida completa son 142 mutantes y cada
  // uno lanza la suite entera: son minutos. Para cerrar un hueco concreto hace
  // falta un ciclo de segundos, y ese es el ciclo con el que se trabaja.
  const iSolo = process.argv.indexOf('--solo');
  const solo = iSolo >= 0 ? Number(process.argv[iSolo + 1]) : null;

  try {
    // LA LINEA BASE. Antes de mutar nada, se comprueba que la suite corre y
    // pasa en una copia intacta. Sin esto, un comando de test que no arranca
    // se convierte en «todos los mutantes murierony el verificador es
    // perfecto». Que es EXACTAMENTE lo que pasaba: el 142/142 de L0 a L2 era
    // la cuenta de un `node --test` que no encontraba el archivo.
    const dirBase = join(base, 'base');
    cpSync(dist, join(dirBase, 'dist'), { recursive: true });
    cpSync(join(root, 'scripts'), join(dirBase, 'scripts'), { recursive: true });
    cpSync(join(root, 'tools'), join(dirBase, 'tools'), { recursive: true });
    const linea = runTests(dirBase);
    rmSync(dirBase, { recursive: true, force: true });
    if (!linea.arranco) {
      console.error('\n  EL VERIFICADOR NO CORRE. La suite no arranco en la linea base.');
      console.error(`  ${linea.resumen}`);
      console.error('  Sin esta comprobacion, un comando de test que falla al arrancar');
      console.error('  se cuenta como «todos los mutantes murierony el verificador es');
      console.error('  perfecto». Eso es lo que paso, y por eso el numero decia 142/142.');
      console.error('\n  No se mide nada hasta que esto se arregle.\n');
      process.exit(1);
    }
    if (!linea.ok) {
      console.error('\n  LA LINEA BASE NO PASA. El harness mide sobre una suite que ya esta rota.');
      console.error(`  ${linea.resumen}\n`);
      process.exit(1);
    }
    console.log(`\n  linea base: ${linea.resumen}`);

    for (const [indice, [archivo, desc, buscar, reemplazar]] of MUTANTS.entries()) {
      if (solo !== null && indice !== solo) continue;
      const dir = join(base, `m${resultados.length}`);
      cpSync(dist, join(dir, 'dist'), { recursive: true });
      cpSync(join(root, 'scripts'), join(dir, 'scripts'), { recursive: true });
      cpSync(join(root, 'tools'), join(dir, 'tools'), { recursive: true });

      // El codigo de src se compila (vive en dist/), y scripts/ y tools/ son
      // JS plano que se copian tal cual. Antes solo se knew de scripts/.
      const ruta = archivo.startsWith('src/')
        ? join(dir, 'dist', archivo)
        : join(dir, archivo);
      const original = readFileSync(ruta, 'utf8');
      if (!original.includes(buscar)) {
        noAplicable++;
        resultados.push({ archivo, desc, estado: 'no-aplicable' });
        rmSync(dir, { recursive: true, force: true });
        continue;
      }
      const antes = sha256HexOfText(original);
      writeFileSync(ruta, original.replace(buscar, reemplazar));
      const despues = sha256HexOfText(readFileSync(ruta, 'utf8'));
      const corrida = runTests(dir);
      rmSync(dir, { recursive: true, force: true });
      if (!corrida.arranco) {
        // La suite no corrio. NO es un sobreviviente: es un hueco, y se cuenta
        // como hueco, igual que un patron que no aparece en el compilado.
        noAplicable++;
        resultados.push({ archivo, desc, estado: 'no-aplicable', motivo: 'la suite no corrio' });
        continue;
      }
      resultados.push({
        archivo,
        desc,
        estado: corrida.ok ? 'sobrevivio' : 'muerto',
        // La evidencia del por que: el hash del archivo mutado (si no cambio,
        // el mutante no se aplico) y el resumen de la suite (si la suite
        // paso, el mutante no lo nota).
        aplico: antes !== despues,
        resumen: corrida.resumen,
        status: corrida.status,
      });
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }

  const aplicables = resultados.filter((r) => r.estado !== 'no-aplicable');
  const muertos = aplicables.filter((r) => r.estado === 'muerto');
  const porPaquete = new Map();

  for (const r of resultados) {
    const cur = porPaquete.get(r.archivo) ?? { applicable: 0, killed: 0 };
    cur.applicable++;
    if (r.estado === 'muerto') cur.killed++;
    porPaquete.set(r.archivo, cur);
  }

  console.log('\n=== MUTATION TESTING · vibe-tools L0+L1 ===\n');
  for (const r of resultados) {
    const marca = r.estado === 'muerto' ? 'MUERTO     ' : r.estado === 'sobrevivio' ? 'SOBREVIVIO' : 'n/aplicable';
    console.log(`  [${marca}] ${r.archivo.padEnd(28)} ${r.desc}`);
  }

  console.log('\n--- por paquete ---');
  for (const [archivo, c] of porPaquete) {
    const score = (c.killed / c.applicable) * 100;
    const flag = score >= 80 ? 'OK ' : 'BAJO';
    console.log(`  [${flag}] ${archivo.padEnd(28)} ${c.killed}/${c.applicable} = ${score.toFixed(1)}%`);
  }

  const totalAplicables = aplicables.length;
  const score = totalAplicables === 0 ? 0 : (muertos.length / totalAplicables) * 100;
  console.log(`\n  TOTAL ${muertos.length}/${totalAplicables} = ${score.toFixed(1)}%  (umbral 80%)`);
  if (noAplicable > 0) console.log(`  patrones no encontrados en el compilado: ${noAplicable}`);

  const bajos = [...porPaquete.entries()].filter(([, c]) => (c.killed / c.applicable) * 100 < 80);
  const sobrevividos = resultados.filter((r) => r.estado === 'sobrevivio');

  // Modo JSON: igual que en el guard de presupuesto, la superficie publica
  // necesita los totales en forma machine-readable. Parsear la linea de
  // TOTAL con una regexp seria atar la verificacion al formato de una
  // salida humana, y ese es exactamente el enlace que se rompe en silencio.
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({
      mutantes: resultados.length,
      aplicables: totalAplicables,
      muertos: muertos.length,
      sobrevivientes: sobrevividos.length,
      no_aplicable: noAplicable,
      paquetes: porPaquete.size,
      score: Number(score.toFixed(1)),
      umbral: 80,
    }));
  }

  if (sobrevividos.length > 0 || bajos.length > 0 || noAplicable > 0) {
    console.log('\n  VEREDOR DEBIL — no se cierra el loop con esto:');
    for (const r of sobrevividos) {
      console.log(`    sobrevive: ${r.archivo} ${r.desc}`);
      console.log(`      la mutacion ${r.aplico ? "SI se aplico" : "NO se aplico"} · suite: ${r.resumen} · exit=${r.status}`);
    }
    for (const [a] of bajos) console.log(`    bajo 80%: ${a}`);
    if (noAplicable > 0) console.log(`    ${noAplicable} patron(es) no encontrado(s): el hueco no esta medido`);
    process.exit(1);
  }
}

main();
