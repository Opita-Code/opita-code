/**
 * L6 · El marketplace: la entrada, el flujo y el pin.
 *
 * Cada test dice un comportamiento. Los que importan de verdad son los que
 * separan tres cosas que se confunden: una entrada que no se puede publicar
 * por su ESTADO, una que no se puede publicar porque no VALIDA, y una que no
 * se puede publicar porque el veredicto es de OTRO artefacto.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import type { ModuleDescriptor, ToolDescriptor } from '../src/contract.js';
import { integrityOf } from '../src/contract.js';
import type { Publicacion } from '../src/juez/pipeline.js';
import { DRAFT_DESCRIPTOR } from '../src/tools/draft.js';
import { EXEC_DESCRIPTOR } from '../src/tools/exec.js';
import { RESEARCH_DESCRIPTOR } from '../src/tools/research.js';

import { claseDeModulo, claseDeTool } from '../src/marketplace/clase.js';
import { crearEntrada, esModulo, nivelDe, type Entrada } from '../src/marketplace/entrada.js';
import { describirTool, partesDe } from '../src/marketplace/manifiesto.js';
import { solicitudDe, validarEntrada } from '../src/marketplace/validar.js';
import {
  CONCESIONES,
  RESERVAS,
  licenciaDe,
  comprobarLicencia,
} from '../src/marketplace/licencia.js';
import {
  aceptarLicencia,
  juzgar,
  publicar,
  retirar,
  suspender,
  validar,
} from '../src/marketplace/publicar.js';
import { esPropia, listarConPin } from '../src/marketplace/pin.js';
import { catalogoVacio, publicarEn, sustituir, listar } from '../src/marketplace/catalogo.js';
import { descubrimiento, herramientas, herramientasDe, modulos, porNivel } from '../src/marketplace/niveles.js';

// ---------------------------------------------------------------------------
// Las piezas de prueba
// ---------------------------------------------------------------------------

const toolDeterminista = (): ToolDescriptor => ({
  id: 'tercero.suma',
  version: '1.0.0',
  author: 'tercero',
  title: 'suma dos numeros',
  determinism: 'deterministic',
  tier: 'T0',
  effect: 'none',
  context_profile: 'none',
  psychometrics: false,
  inputs: [
    { name: 'a', produces: 'text', artifact: false },
    { name: 'b', produces: 'text', artifact: false },
  ],
  outputs: [{ name: 'suma', produces: 'text', artifact: true }],
});

const toolConEstado = (): ToolDescriptor => ({
  ...toolDeterminista(),
  id: 'tercero.contador',
  title: 'cuenta y guarda el estado',
  determinism: 'stateful',
});

const toolSinEntrega = (): ToolDescriptor => ({
  ...toolDeterminista(),
  id: 'tercero.vacia',
  outputs: [{ name: 'algo', produces: 'text', artifact: false }],
});

const toolConRedEnT0 = (): ToolDescriptor => ({
  ...toolDeterminista(),
  id: 'tercero.red',
  tier: 'T0',
  effect: 'read',
});

const moduloDeDosNodos = (): ModuleDescriptor => ({
  id: 'tercero.calcula-y-busca',
  version: '1.0.0',
  author: 'tercero',
  title: 'calcula y busca',
  nodes: [
    { node: 'calcula', tool: EXEC_DESCRIPTOR },
    { node: 'busca', tool: RESEARCH_DESCRIPTOR },
  ],
  edges: [{ from: 'calcula', fromPort: 'value', to: 'busca', toPort: 'query' }],
  sinks: ['busca:notes'],
});

const moduloConEstado = (): ModuleDescriptor => ({
  id: 'tercero.con-estado',
  version: '1.0.0',
  author: 'tercero',
  title: 'cuenta y redacta',
  nodes: [
    { node: 'cuenta', tool: toolConEstado() },
    { node: 'redacta', tool: DRAFT_DESCRIPTOR },
  ],
  edges: [{ from: 'cuenta', fromPort: 'suma', to: 'redacta', toPort: 'topic' }],
  sinks: ['redacta:draft'],
});

const moduloInvalido = (): ModuleDescriptor => ({
  ...moduloDeDosNodos(),
  edges: [{ from: 'nodo-que-no-existe', fromPort: 'value', to: 'busca', toPort: 'query' }],
});

/** Un veredicto del juez sobre las partes que se le pasaron. */
const veredicto = (
  partes: readonly { n: number; titulo: string; bytes: number; sha: string }[],
  decision: 'publicar' | 'corregir' | 'parar' = 'publicar',
): Publicacion => ({
  ruta: 'vibe-tools/src/marketplace/manifiesto.md',
  ambito: 'codigo',
  consenso: 3,
  partes: partes.map((p) => ({ n: p.n, titulo: p.titulo, bytes: p.bytes, sha: p.sha })),
  agregado:
    decision === 'publicar'
      ? { tipo: 'alineado', partes: partes.length, confianzaMinima: 1, stddevMaximo: 0 }
      : { tipo: 'deriva', partes: [1], razon: 'la parte no sostiene la afirmacion' },
  decision,
  accion: 'corrige el artefacto y vuelve a publicar',
  coste: { llamadas: 3, bytes: 120, latenciaMs: 900, tokens: null, motivoTokens: 'no medido' },
});

/** Una entrada de tool, con una afirmacion por parte. */
const entradaDeTool = (): Entrada => crearEntrada(toolDeterminista(), ['esta tool suma dos numeros']);

/** Una entrada de modulo, con una afirmacion por nodo. */
const entradaDeModulo = (): Entrada =>
  crearEntrada(moduloDeDosNodos(), ['este nodo evalua la expresion', 'este nodo busca notas']);

/** Una entrada que llega hasta `licenciado`. */
const entradaLicenciada = (): Entrada => {
  const entrada = entradaDeModulo();
  const validada = validar(entrada);
  assert.ok(validada.ok);
  const juzgada = juzgar(validada.entrada, veredicto(partesDe(validada.entrada)));
  assert.ok(juzgada.ok);
  const licenciada = aceptarLicencia(juzgada.entrada, licenciaDe(juzgada.entrada.autor));
  assert.ok(licenciada.ok);
  return licenciada.entrada;
};

/** Una entrada que llega hasta `publicado`, con la secuencia que se le pase. */
const entradaPublicada = (secuencia = 1): Entrada => {
  const publicada = publicar(entradaLicenciada(), secuencia);
  assert.ok(publicada.ok);
  return publicada.entrada;
};

// ---------------------------------------------------------------------------
// L6-T1 · La entrada
// ---------------------------------------------------------------------------

test('L6 · la entrada deriva id, version, autor y titulo del descriptor', () => {
  const entrada = entradaDeTool();
  assert.equal(entrada.id, 'tercero.suma');
  assert.equal(entrada.version, '1.0.0');
  assert.equal(entrada.autor, 'tercero');
  assert.equal(entrada.titulo, 'suma dos numeros');
});

test('L6 · la huella es la del descriptor canonico, no una que se escriba', () => {
  const descriptor = toolDeterminista();
  const entrada = crearEntrada(descriptor, ['afirmacion']);
  assert.equal(entrada.huella, integrityOf(descriptor));
});

test('L6 · el nivel se deriva de la forma del descriptor', () => {
  assert.equal(nivelDe(toolDeterminista()), 'tool');
  assert.equal(nivelDe(moduloDeDosNodos()), 'modulo');
  assert.equal(esModulo(moduloDeDosNodos()), true);
  assert.equal(esModulo(toolDeterminista()), false);
});

test('L6 · la clase de una tool sale del eje 2', () => {
  assert.equal(claseDeTool('deterministic'), 'mutation');
  assert.equal(claseDeTool('stochastic'), 'recipe');
  assert.equal(claseDeTool('stateful'), 'none');
});

test('L6 · la clase de un modulo gana la mas restrictiva de sus nodos', () => {
  assert.equal(claseDeModulo(moduloDeDosNodos()), 'recipe');
  assert.equal(claseDeModulo(moduloConEstado()), 'none');
});

test('L6 · un modulo con un nodo con estado NO es una mutacion', () => {
  const entrada = crearEntrada(moduloConEstado(), ['cuenta', 'redacta']);
  assert.equal(entrada.clase, 'none');
});

test('L6 · el manifiesto tiene una parte por nodo, y el sha es el de su texto', () => {
  const partes = partesDe(entradaDeModulo());
  assert.equal(partes.length, 2);
  assert.equal(partes[0]?.titulo, 'calcula');
  assert.equal(partes[1]?.titulo, 'busca');
  assert.match(partes[0]?.sha ?? '', /^[0-9a-f]{64}$/);
});

test('L6 · una tool atomica da una sola parte', () => {
  const partes = partesDe(entradaDeTool());
  assert.equal(partes.length, 1);
});

test('L6 · el manifiesto dice lo que el descriptor declara, no lo que el autor quiera', () => {
  const texto = describirTool(DRAFT_DESCRIPTOR, 'tool');
  assert.match(texto, /tool: opita\.draft@0\.1\.0/);
  assert.match(texto, /determinismo: stochastic/);
  assert.match(texto, /salidas: draft:text \(entregable\)/);
});

// ---------------------------------------------------------------------------
// L6-T1 · La validacion
// ---------------------------------------------------------------------------

test('L6 · una entrada bien formada valida', () => {
  const revision = validarEntrada(entradaDeModulo());
  assert.equal(revision.ok, true);
});

test('L6 · una huella que no es la del descriptor se rechaza', () => {
  const entrada = { ...entradaDeTool(), huella: '0'.repeat(64) };
  const revision = validarEntrada(entrada);
  assert.equal(revision.ok, false);
  assert.equal(revision.ok === false && revision.rechazo.motivo, 'huella_distinta');
});

test('L6 · un modulo que no pasa las reglas de L0 se rechaza con su codigo', () => {
  const entrada = crearEntrada(moduloInvalido(), ['calcula', 'busca']);
  const revision = validarEntrada(entrada);
  assert.equal(revision.ok, false);
  assert.equal(revision.ok === false && revision.rechazo.motivo, 'modulo_invalido');
});

test('L6 · un modulo con un nodo T2 no se publica: la lista blanca esta vacia', () => {
  const conBackend: ModuleDescriptor = {
    ...moduloDeDosNodos(),
    nodes: [
      { node: 'calcula', tool: { ...EXEC_DESCRIPTOR, tier: 'T2' } },
      { node: 'busca', tool: RESEARCH_DESCRIPTOR },
    ],
  };
  const entrada = crearEntrada(conBackend, ['calcula', 'busca']);
  const revision = validarEntrada(entrada);
  assert.equal(revision.ok, false);
  assert.equal(revision.ok === false && revision.rechazo.motivo, 'tool_no_permitida');
});

test('L6 · una tool que no entrega nada no se publica', () => {
  const entrada = crearEntrada(toolSinEntrega(), ['afirmacion']);
  const revision = validarEntrada(entrada);
  assert.equal(revision.ok, false);
  assert.equal(revision.ok === false && revision.rechazo.motivo, 'herramienta_invalida');
});

test('L6 · una tool T0 que declara red no se publica: es un error de contrato', () => {
  const entrada = crearEntrada(toolConRedEnT0(), ['afirmacion']);
  const revision = validarEntrada(entrada);
  assert.equal(revision.ok, false);
  assert.equal(revision.ok === false && revision.rechazo.motivo, 'herramienta_invalida');
});

test('L6 · el numero de afirmaciones tiene que ser el de partes', () => {
  const entrada = crearEntrada(moduloDeDosNodos(), ['una sola']);
  const revision = validarEntrada(entrada);
  assert.equal(revision.ok, false);
  assert.equal(revision.ok === false && revision.rechazo.motivo, 'afirmaciones_por_parte');
});

test('L6 · una afirmacion vacia se rechaza antes de llamar al juez', () => {
  const entrada = crearEntrada(toolDeterminista(), ['   ']);
  const revision = validarEntrada(entrada);
  assert.equal(revision.ok, false);
  assert.equal(revision.ok === false && revision.rechazo.motivo, 'afirmacion_vacia');
});

test('L6 · la solicitud lleva una afirmacion por parte y riesgo alto', () => {
  const entrada = entradaDeModulo();
  const solicitud = solicitudDe(entrada, 'vibe-tools/src/marketplace/manifiesto.md');
  assert.equal(solicitud.encargo.afirmaciones.length, solicitud.partes.length);
  assert.equal(solicitud.encargo.riesgo, 'alto');
  assert.equal(solicitud.encargo.evalType, 'drift_judge');
});

// ---------------------------------------------------------------------------
// L6-T1 · El flujo
// ---------------------------------------------------------------------------

test('L6 · el flujo va de creado a publicado, paso a paso', () => {
  const creada = entradaDeModulo();
  assert.equal(creada.estado, 'creado');

  const validada = validar(creada);
  assert.ok(validada.ok);
  assert.equal(validada.entrada.estado, 'validado');

  const juzgada = juzgar(validada.entrada, veredicto(partesDe(validada.entrada)));
  assert.ok(juzgada.ok);
  assert.equal(juzgada.entrada.estado, 'juzgado');

  const licenciada = aceptarLicencia(juzgada.entrada, licenciaDe(juzgada.entrada.autor));
  assert.ok(licenciada.ok);
  assert.equal(licenciada.entrada.estado, 'licenciado');

  const publicada = publicar(licenciada.entrada, 7);
  assert.ok(publicada.ok);
  assert.equal(publicada.entrada.estado, 'publicado');
  assert.equal(publicada.entrada.secuencia, 7);
});

test('L6 · no se puede publicar saltandose un paso', () => {
  const creada = entradaDeModulo();
  const resultado = publicar(creada, 1);
  assert.equal(resultado.ok, false);
  assert.equal(resultado.ok === false && resultado.motivo, 'estado_invalido');
});

test('L6 · no se puede judged sin validar', () => {
  const creada = entradaDeModulo();
  const resultado = juzgar(creada, veredicto(partesDe(creada)));
  assert.equal(resultado.ok, false);
  assert.equal(resultado.ok === false && resultado.motivo, 'estado_invalido');
});

test('L6 · no se puede validar dos veces', () => {
  const validada = validar(entradaDeModulo());
  assert.ok(validada.ok);
  const resultado = validar(validada.entrada);
  assert.equal(resultado.ok, false);
  assert.equal(resultado.ok === false && resultado.motivo, 'estado_invalido');
});

test('L6 · un veredicto de OTRO artefacto no publica: el sha no coincide', () => {
  const validada = validar(entradaDeModulo());
  assert.ok(validada.ok);
  const otro = partesDe(entradaDeTool());
  const resultado = juzgar(validada.entrada, veredicto(otro));
  assert.equal(resultado.ok, false);
  assert.equal(resultado.ok === false && resultado.motivo, 'veredicto_de_otra_entrada');
});

test('L6 · un veredicto con el mismo numero de partes pero otro sha no publica', () => {
  const validada = validar(entradaDeModulo());
  assert.ok(validada.ok);
  const partes = partesDe(validada.entrada);
  const conOtroSha = partes.map((p, i) => ({ ...p, sha: i === 0 ? 'a'.repeat(64) : p.sha }));
  const resultado = juzgar(validada.entrada, veredicto(conOtroSha));
  assert.equal(resultado.ok, false);
  assert.equal(resultado.ok === false && resultado.motivo, 'veredicto_de_otra_entrada');
});

test('L6 · un veredicto con drift no publica y trae la accion del operador', () => {
  const validada = validar(entradaDeModulo());
  assert.ok(validada.ok);
  const partes = partesDe(validada.entrada);
  const resultado = juzgar(validada.entrada, veredicto(partes, 'corregir'));
  assert.equal(resultado.ok, false);
  assert.equal(resultado.ok === false && resultado.motivo, 'veredicto_no_publica');
  assert.match(resultado.ok === false ? resultado.detalle : '', /corrige/);
});

test('L6 · una parada del juez no publica', () => {
  const validada = validar(entradaDeModulo());
  assert.ok(validada.ok);
  const partes = partesDe(validada.entrada);
  const resultado = juzgar(validada.entrada, veredicto(partes, 'parar'));
  assert.equal(resultado.ok, false);
});

test('L6 · la licencia de otro autor no se acepta', () => {
  const entrada = entradaDeModulo();
  const validada = validar(entrada);
  assert.ok(validada.ok);
  const juzgada = juzgar(validada.entrada, veredicto(partesDe(validada.entrada)));
  assert.ok(juzgada.ok);
  const resultado = aceptarLicencia(juzgada.entrada, licenciaDe('otro'));
  assert.equal(resultado.ok, false);
  assert.equal(resultado.ok === false && resultado.motivo, 'licencia_invalida');
});

test('L6 · una licencia que transfiere la propiedad no se acepta', () => {
  const entrada = entradaDeModulo();
  const licencia = { ...licenciaDe(entrada.autor), transferencia: 'completa' as never };
  const resultado = aceptarLicencia({ ...entrada, estado: 'juzgado' }, licencia);
  assert.equal(resultado.ok, false);
  assert.equal(resultado.ok === false && resultado.motivo, 'licencia_invalida');
});

test('L6 · una licencia que no reserva la suspension no se acepta', () => {
  const entrada = entradaDeModulo();
  const licencia = { ...licenciaDe(entrada.autor), reserva: ['retirar'] as const };
  const resultado = aceptarLicencia({ ...entrada, estado: 'juzgado' }, licencia);
  assert.equal(resultado.ok, false);
});

test('L6 · una licencia que no concede la distribucion no se acepta', () => {
  const entrada = entradaDeModulo();
  const licencia = { ...licenciaDe(entrada.autor), concede: ['mostrar'] as const };
  const resultado = aceptarLicencia({ ...entrada, estado: 'juzgado' }, licencia);
  assert.equal(resultado.ok, false);
});

test('L6 · una suspension sin motivo no es una suspension', () => {
  const publicada = entradaPublicada();
  const resultado = suspender(publicada, '   ');
  assert.equal(resultado.ok, false);
});

test('L6 · la licencia concede y reserva lo que tiene que conceder y reservar', () => {
  const licencia = licenciaDe('tercero');
  assert.equal(licencia.transferencia, 'ninguna');
  assert.deepEqual([...licencia.concede], [...CONCESIONES]);
  assert.deepEqual([...licencia.reserva], [...RESERVAS]);
  assert.equal(comprobarLicencia(licencia, 'tercero').ok, true);
});

test('L6 · suspender y retirar no cambian el autor: se retira la distribucion', () => {
  const publicada = entradaPublicada();
  const suspendida = suspender(publicada, 'incumple las reglas del catalogo');
  assert.ok(suspendida.ok);
  assert.equal(suspendida.entrada.estado, 'suspendido');
  assert.equal(suspendida.entrada.autor, publicada.autor);
  assert.equal(suspendida.entrada.motivo, 'incumple las reglas del catalogo');

  const retirada = retirar(suspendida.entrada, 'reincidencia');
  assert.ok(retirada.ok);
  assert.equal(retirada.entrada.estado, 'retirado');
  assert.equal(retirada.entrada.autor, publicada.autor);
});

test('L6 · una retirada sin motivo no es una retirada', () => {
  const publicada = entradaPublicada();
  const resultado = retirar(publicada, '  ');
  assert.equal(resultado.ok, false);
});

test('L6 · no se retira lo que no esta publicado', () => {
  const creada = entradaDeTool();
  const resultado = retirar(creada, 'lo que sea');
  assert.equal(resultado.ok, false);
});

// ---------------------------------------------------------------------------
// L6-T3 · El pin
// ---------------------------------------------------------------------------

test('L6 · las propias van primero, y las de un tercero no se auto-declaran', () => {
  const propias = ['propia.una', 'propia.dos'];
  const entradaPropia = { ...entradaPublicada(), id: 'propia.una' };
  const entradaTercera = { ...entradaPublicada(), id: 'tercera.una' };
  assert.equal(esPropia(entradaPropia, propias), true);
  assert.equal(esPropia(entradaTercera, propias), false);
  const listado = listarConPin([entradaTercera, entradaPropia], propias);
  assert.equal(listado[0]?.id, 'propia.una');
});

test('L6 · lo que no esta publicado no se lista', () => {
  const entrada = entradaPublicada();
  const suspendida = suspender(entrada, 'motivo');
  assert.ok(suspendida.ok);
  assert.equal(listarConPin([suspendida.entrada], []).length, 0);
});

// ---------------------------------------------------------------------------
// L6-T4 · El catalogo
// ---------------------------------------------------------------------------

test('L6 · el catalogo numera por publicaciones, no por intentos', () => {
  let catalogo = catalogoVacio([]);
  const resultado = publicarEn(catalogo, entradaLicenciada());
  assert.ok(resultado.ok);
  catalogo = resultado.catalogo;
  assert.equal(catalogo.siguiente, 2);
  assert.equal(catalogo.entradas[0]?.secuencia, 1);
});

test('L6 · el catalogo no publica lo que el flujo no publico', () => {
  const catalogo = catalogoVacio([]);
  const resultado = publicarEn(catalogo, entradaDeTool());
  assert.equal(resultado.ok, false);
});

test('L6 · sustituir cambia el estado en el registro y no borra la entrada', () => {
  let catalogo = catalogoVacio([]);
  const publicada = entradaPublicada();
  const resultado = publicarEn(catalogo, entradaLicenciada());
  assert.ok(resultado.ok);
  catalogo = resultado.catalogo;
  const suspendida = suspender(publicada, 'motivo');
  assert.ok(suspendida.ok);
  const cambio = sustituir(catalogo, suspendida.entrada);
  assert.ok(cambio.ok);
  assert.equal(cambio.catalogo.entradas[0]?.estado, 'suspendido');
  assert.equal(cambio.catalogo.entradas[0]?.autor, publicada.autor);
});

test('L6 · sustituir una entrada que no existe es un fallo, no un silencio', () => {
  const catalogo = catalogoVacio([]);
  const resultado = sustituir(catalogo, entradaPublicada());
  assert.equal(resultado.ok, false);
});

test('L6 · el listado del catalogo es lo publicado, con el pin aplicado', () => {
  let catalogo = catalogoVacio(['propia.una']);
  const propia = { ...entradaPublicada(), id: 'propia.una' };
  const tercera = { ...entradaPublicada(), id: 'tercera.una', secuencia: 2 };
  const primera = publicarEn(catalogo, entradaLicenciada());
  assert.ok(primera.ok);
  catalogo = primera.catalogo;
  const segunda = publicarEn(catalogo, entradaLicenciada());
  assert.ok(segunda.ok);
  catalogo = segunda.catalogo;
  const conIds = {
    ...catalogo,
    entradas: [propia, tercera],
  };
  const listado = listar(conIds);
  assert.equal(listado.length, 2);
  assert.equal(listado[0]?.id, 'propia.una');
  assert.equal(listado[1]?.id, 'tercera.una');
});

// ---------------------------------------------------------------------------
// L6-T5 · Los niveles
// ---------------------------------------------------------------------------

test('L6 · los dos niveles se separan: modulos y tools atomicas', () => {
  const modulo = entradaDeModulo();
  const tool = entradaDeTool();
  assert.equal(porNivel([modulo, tool], 'modulo').length, 1);
  assert.equal(porNivel([modulo, tool], 'tool').length, 1);
  assert.equal(modulos([modulo, tool]).length, 1);
  assert.equal(herramientas([modulo, tool]).length, 1);
});

test('L6 · el descubrimiento son los modulos: es la unidad principal', () => {
  const modulo = entradaDeModulo();
  const tool = entradaDeTool();
  assert.deepEqual(
    descubrimiento([modulo, tool]).map((e) => e.id),
    [modulo.id],
  );
});

test('L6 · las tools de un modulo son las de sus nodos, sin repetir', () => {
  const modulo: ModuleDescriptor = {
    ...moduloDeDosNodos(),
    nodes: [
      { node: 'calcula', tool: EXEC_DESCRIPTOR },
      { node: 'otra', tool: EXEC_DESCRIPTOR },
      { node: 'busca', tool: RESEARCH_DESCRIPTOR },
    ],
  };
  const entrada = crearEntrada(modulo, ['a', 'b', 'c']);
  const vistas = herramientasDe(entrada);
  assert.equal(vistas.length, 2);
  assert.deepEqual(vistas.map((t) => t.id).sort(), ['opita.exec', 'opita.research']);
});

test('L6 · una tool atomica no tiene tools: no es un modulo', () => {
  assert.deepEqual(herramientasDe(entradaDeTool()), []);
});
