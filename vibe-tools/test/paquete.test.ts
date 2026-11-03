import test from 'node:test';
import assert from 'node:assert/strict';

import type { Edge, ModuleDescriptor, ModuleNode, Port, ToolDescriptor } from '../src/contract.js';
import { integrityOf } from '../src/contract.js';
import {
  EXTENSION_PAQUETE,
  FORMATO_PAQUETE,
  leerPaquete,
  peticionesDe,
  validarPaquete,
  VERSION_FORMATO,
  type Paquete,
} from '../src/paquete/formato.js';
import { exportarPaquete, serializarPaquete } from '../src/paquete/exportar.js';
import { instalarPaquete } from '../src/paquete/instalar.js';
import { pedirContexto, pedirEscritura, pedirPsicometria } from '../src/permisos/puerta.js';

// ---------------------------------------------------------------------------
// El modulo de prueba
// ---------------------------------------------------------------------------

const p = (name: string, produces: Port['produces'], artifact = false): Port => ({
  name,
  produces,
  artifact,
});

const mk = (over: Partial<ToolDescriptor>): ToolDescriptor => ({
  id: 'tool',
  version: '0.1.0',
  author: 'opita',
  title: 't',
  determinism: 'deterministic',
  tier: 'T0',
  effect: 'none',
  context_profile: 'none',
  psychometrics: false,
  inputs: [],
  outputs: [],
  ...over,
});

/** La tool que PIDE: historial, psicometria y nada mas. */
const MISION = mk({
  id: 'opita.mision',
  version: '1.0.0',
  tier: 'T1',
  effect: 'read',
  context_profile: 'usage_history',
  psychometrics: true,
  inputs: [p('prompt', 'text')],
  outputs: [p('idea', 'text')],
});

/** La tool que NO pide nada. */
const ENTREGA = mk({
  id: 'opita.entrega',
  version: '1.0.0',
  inputs: [p('idea', 'text')],
  outputs: [p('salida', 'text', true)],
});

const e = (from: string, fromPort: string, to: string, toPort: string): Edge => ({
  from,
  fromPort,
  to,
  toPort,
});

const node = (n: string, tool: ToolDescriptor): ModuleNode => ({ node: n, tool });

/** Modulo valido: una tool que pide y otra que entrega. */
function modulo(): ModuleDescriptor {
  return {
    id: 'opita.misiones',
    version: '1.0.0',
    author: 'opita',
    title: 'misiones',
    nodes: [node('a', MISION), node('b', ENTREGA)],
    edges: [e('a', 'idea', 'b', 'idea')],
    sinks: ['b:salida'],
  };
}

const paqueteDe = (): Paquete => exportarPaquete(modulo());

// ---------------------------------------------------------------------------
// La forma
// ---------------------------------------------------------------------------

test('L4-T6 · el paquete tiene cuatro campos, y son los que el formato define', () => {
  const paquete = paqueteDe();
  assert.equal(paquete.formato, FORMATO_PAQUETE);
  assert.equal(paquete.formato_version, VERSION_FORMATO);
  assert.equal(paquete.huella, integrityOf(modulo()));
});

test('L4-T6 · el formato se llama opitapack, y el nombre del fichero lo dice', () => {
  assert.equal(FORMATO_PAQUETE, 'opitapack');
  assert.equal(EXTENSION_PAQUETE, '.opitapack');
});

test('L4-T6 · el paquete no repite el nombre, la version ni el autor del modulo', () => {
  const paquete = paqueteDe();
  assert.equal(paquete.modulo.id, 'opita.misiones');
  assert.equal(paquete.modulo.version, '1.0.0');
  assert.equal(paquete.modulo.author, 'opita');
  const claves = Object.keys(paquete).sort();
  assert.deepEqual(claves, ['formato', 'formato_version', 'huella', 'modulo']);
});

test('L4-T6 · un paquete con un campo que el formato no define no se instala', () => {
  const paquete = { ...paqueteDe(), concede_permisos: true } as unknown as Paquete;
  const instalacion = instalarPaquete(paquete);
  assert.equal(instalacion.ok, false);
  if (instalacion.ok) return;
  assert.equal(instalacion.motivo, 'E_CAMPO_DESCONOCIDO');
  assert.match(instalacion.detalle, /concede_permisos/);
});

test('L4-T6 · un paquete al que le falta un campo no se instala', () => {
  // Cada campo por separado, y no solo uno: un campo que falta puede tener
  // otra comprobacion que lo caza mas adelante, y con una sola comprobacion
  // el hueco no se ve. El motivo es el mismo para los cuatro.
  for (const campo of ['formato', 'formato_version', 'modulo', 'huella']) {
    const paquete = { ...paqueteDe() } as Record<string, unknown>;
    delete paquete[campo];
    const instalacion = instalarPaquete(paquete);
    assert.equal(instalacion.ok, false, `el paquete sin ${campo} se instalo`);
    if (instalacion.ok) continue;
    assert.equal(instalacion.motivo, 'E_CAMPO_AUSENTE', `sin ${campo}: motivo distinto`);
  }
});

test('L4-T6 · una huella que no es una cadena no se instala', () => {
  const paquete = { ...paqueteDe(), huella: 42 } as unknown as Paquete;
  const instalacion = instalarPaquete(paquete);
  assert.equal(instalacion.ok, false);
  if (instalacion.ok) return;
  assert.equal(instalacion.motivo, 'E_CAMPO_AUSENTE');
});

test('L4-T6 · un modulo que no es un modulo no se instala', () => {
  const paquete = { ...paqueteDe(), modulo: 'esto no es un modulo' } as unknown as Paquete;
  const instalacion = instalarPaquete(paquete);
  assert.equal(instalacion.ok, false);
  if (instalacion.ok) return;
  assert.equal(instalacion.motivo, 'E_CAMPO_AUSENTE');
});

test('L4-T6 · un paquete de otro formato no se lee como paquete', () => {
  const paquete = { ...paqueteDe(), formato: 'opitpack' } as unknown as Paquete;
  const instalacion = instalarPaquete(paquete);
  assert.equal(instalacion.ok, false);
  if (instalacion.ok) return;
  assert.equal(instalacion.motivo, 'E_FORMATO_AJENO');
});

test('L4-T6 · un paquete de otra version de formato no se lee como paquete', () => {
  const paquete = { ...paqueteDe(), formato_version: '2.0.0' } as unknown as Paquete;
  const instalacion = instalarPaquete(paquete);
  assert.equal(instalacion.ok, false);
  if (instalacion.ok) return;
  assert.equal(instalacion.motivo, 'E_VERSION_FORMATO');
});

test('L4-T6 · un paquete que no es JSON no se lee', () => {
  const lectura = leerPaquete('{esto no es json');
  assert.equal(lectura.ok, false);
  if (lectura.ok) return;
  assert.equal(lectura.motivo, 'E_LECTURA');
});

test('L4-T6 · el texto del paquete se lee y da el mismo paquete', () => {
  const paquete = paqueteDe();
  const lectura = leerPaquete(serializarPaquete(paquete));
  assert.equal(lectura.ok, true);
  if (!lectura.ok) return;
  assert.deepEqual(lectura.paquete, paquete);
});

// ---------------------------------------------------------------------------
// El export
// ---------------------------------------------------------------------------

test('L4-T6 · exportar es determinista: el mismo modulo da el mismo paquete', () => {
  assert.deepEqual(exportarPaquete(modulo()), exportarPaquete(modulo()));
});

test('L4-T6 · el texto del paquete es el canonico, no un JSON prettificado', () => {
  const texto = serializarPaquete(paqueteDe());
  assert.equal(texto, serializarPaquete(paqueteDe()));
  assert.equal(texto.includes('\n'), false);
});

test('L4-T6 · el canonico ordena las claves: el texto no depende del orden con que se armo', () => {
  const paquete = paqueteDe();
  // El mismo paquete, con las claves en otro orden. Un serializador que
  // respeta el orden de insercion daría dos textos distintos, y entonces la
  // huella del fichero dependeria de quien lo escribio.
  const reordenado = {
    huella: paquete.huella,
    modulo: paquete.modulo,
    formato_version: paquete.formato_version,
    formato: paquete.formato,
  } as unknown as Paquete;
  assert.equal(serializarPaquete(reordenado), serializarPaquete(paquete));
});

test('L4-T6 · la huella es la del modulo, y cambia si el modulo cambia', () => {
  const paquete = paqueteDe();
  const otro = exportarPaquete({ ...modulo(), title: 'otro' });
  assert.notEqual(paquete.huella, otro.huella);
});

// ---------------------------------------------------------------------------
// La instalacion
// ---------------------------------------------------------------------------

test('L4-T6 · un paquete valido se instala', () => {
  const instalacion = instalarPaquete(paqueteDe());
  assert.equal(instalacion.ok, true);
  if (!instalacion.ok) return;
  assert.equal(instalacion.modulo.id, 'opita.misiones');
  assert.deepEqual(instalacion.orden, ['a', 'b']);
});

test('L4-T6 · un modulo invalido no se instala', () => {
  const roto = { ...modulo(), nodes: [node('a', MISION), node('a', ENTREGA)] };
  const instalacion = instalarPaquete(exportarPaquete(roto));
  assert.equal(instalacion.ok, false);
  if (instalacion.ok) return;
  assert.equal(instalacion.motivo, 'E_MODULO_INVALIDO');
  assert.match(instalacion.detalle, /E_DUPLICATE_NODE/);
});

test('L4-T6 · un paquete alterado despues de exportado no se instala', () => {
  const paquete = paqueteDe();
  const alterado = { ...paquete, modulo: { ...paquete.modulo, title: 'otro' } };
  const instalacion = instalarPaquete(alterado);
  assert.equal(instalacion.ok, false);
  if (instalacion.ok) return;
  assert.equal(instalacion.motivo, 'E_HUELPA');
});

// ---------------------------------------------------------------------------
// Instalar no concede
// ---------------------------------------------------------------------------

test('L4-T6 · instalar no concede: la politica que sale esta vacia', () => {
  const instalacion = instalarPaquete(paqueteDe());
  assert.equal(instalacion.ok, true);
  if (!instalacion.ok) return;
  assert.deepEqual(instalacion.politica.concesiones, []);
});

test('L4-T6 · un paquete instalado no recibe contexto: lo deniega la puerta', () => {
  const instalacion = instalarPaquete(paqueteDe());
  assert.equal(instalacion.ok, true);
  if (!instalacion.ok) return;
  const decision = pedirContexto(MISION, instalacion.politica, 'preferences');
  assert.equal(decision.concedido, false);
  assert.equal(decision.motivo, 'E_SIN_CONCESION');
});

test('L4-T6 · un paquete instalado no recibe psicometria', () => {
  const instalacion = instalarPaquete(paqueteDe());
  assert.equal(instalacion.ok, true);
  if (!instalacion.ok) return;
  const decision = pedirPsicometria(MISION, instalacion.politica, 'personalizacion');
  assert.equal(decision.concedido, false);
  assert.equal(decision.motivo, 'E_SIN_CONCESION');
});

test('L4-T6 · un paquete instalado no puede escribir en la memoria', () => {
  const instalacion = instalarPaquete(paqueteDe());
  assert.equal(instalacion.ok, true);
  if (!instalacion.ok) return;
  const decision = pedirEscritura(MISION, instalacion.politica);
  assert.equal(decision.concedido, false);
  assert.equal(decision.motivo, 'E_SIN_CONCESION');
});

test('L4-T6 · instalar dos paquetes distintos da dos politicas igual de vacias', () => {
  const uno = instalarPaquete(paqueteDe());
  const otro = instalarPaquete(exportarPaquete({ ...modulo(), id: 'otro' }));
  assert.equal(uno.ok && otro.ok, true);
  if (!uno.ok || !otro.ok) return;
  assert.deepEqual(uno.politica.concesiones, []);
  assert.deepEqual(otro.politica.concesiones, []);
});

// ---------------------------------------------------------------------------
// Las peticiones
// ---------------------------------------------------------------------------

test('L4-T6 · las peticiones se derivan del modulo, y no se guardan en el paquete', () => {
  const paquete = paqueteDe();
  const peticiones = peticionesDe(paquete);
  assert.equal(peticiones.length, 1);
  assert.equal(peticiones[0]?.herramienta, 'opita.mision');
  assert.equal(peticiones[0]?.version, '1.0.0');
  assert.equal(peticiones[0]?.autor, 'opita');
  assert.equal(peticiones[0]?.contexto, 'usage_history');
  assert.equal(peticiones[0]?.psicometria, true);
  assert.equal('peticiones' in paquete, false);
});

test('L4-T6 · una tool que no pide nada no aparece en las peticiones', () => {
  const peticiones = peticionesDe(paqueteDe());
  const ids = peticiones.map((p) => p.herramienta);
  assert.equal(ids.includes('opita.entrega'), false);
});

test('L4-T6 · la psicometria es una capa aparte: no sale de la categoria de contexto', () => {
  const tool = mk({ id: 'x', context_profile: 'none', psychometrics: true });
  const mod: ModuleDescriptor = {
    ...modulo(),
    nodes: [node('a', tool)],
    edges: [],
    sinks: ['a:salida'],
  };
  const peticiones = peticionesDe(exportarPaquete(mod));
  assert.equal(peticiones.length, 1);
  assert.equal(peticiones[0]?.contexto, null);
  assert.equal(peticiones[0]?.psicometria, true);
});

test('L4-T6 · una tool con techo none y sin psicometria no pide nada', () => {
  const tool = mk({ id: 'x', context_profile: 'none', psychometrics: false });
  const mod: ModuleDescriptor = {
    ...modulo(),
    nodes: [node('a', tool)],
    edges: [],
    sinks: ['a:salida'],
  };
  assert.deepEqual(peticionesDe(exportarPaquete(mod)), []);
});

// ---------------------------------------------------------------------------
// La forma, mirada por separado
// ---------------------------------------------------------------------------

test('L4-T6 · validar la forma no juzga el modulo: solo mira los campos', () => {
  const roto = { ...modulo(), nodes: [node('a', MISION), node('a', ENTREGA)] };
  const validacion = validarPaquete(exportarPaquete(roto));
  assert.equal(validacion.ok, true);
});
