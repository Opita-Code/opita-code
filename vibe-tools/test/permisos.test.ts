import test from 'node:test';
import assert from 'node:assert/strict';

import type { ToolDescriptor } from '../src/contract.js';
import { contextoPermitido, type CamposPorCategoria } from '../src/permisos/contexto.js';
import {
  alcanza,
  ESCALERA,
  mayor,
  menor,
  posicion,
  SIN_PERMISO,
  type Categoria,
  type Finalidad,
} from '../src/permisos/categorias.js';
import { buscarConcesion, POLITICA_VACIA, type Concesion, type Politica } from '../src/permisos/politica.js';
import {
  pedirContexto,
  pedirEscritura,
  pedirPsicometria,
  permisoDe,
  type DecisionContexto,
} from '../src/permisos/puerta.js';
import { IDENTIDAD } from './identity-fixture.js';

function tool(over: Partial<ToolDescriptor> = {}): ToolDescriptor {
  return {
    id: 'opita.mision',
    version: '0.1.0',
    author: 'opita',
    title: 'tool de prueba',
    determinism: 'deterministic',
    tier: 'T0',
    effect: 'none',
    context_profile: 'none',
    psychometrics: false,
    inputs: [],
    outputs: [],
    ...over,
  };
}

function concesion(over: Partial<Concesion> = {}): Concesion {
  return {
    herramienta: 'opita.mision',
    version: '0.1.0',
    autor: 'opita',
    categoria: 'none',
    psicometria: [],
    escritura: false,
    ...over,
  };
}

function politica(concesiones: readonly Concesion[]): Politica {
  return { concesiones };
}

const CAMPOS: CamposPorCategoria = {
  preferencias: { idioma: 'es' },
  historial: { visitas: 3 },
  psicometria: { rasgo: 'constante' },
};

test('L4-T5 · sin concesion no hay contexto: la tool no recibe nada', () => {
  const decision = pedirContexto(tool({ context_profile: 'usage_history' }), POLITICA_VACIA, 'preferences');
  assert.equal(decision.concedido, false);
  assert.equal(decision.motivo, 'E_SIN_CONCESION');
  assert.equal(decision.categoria, 'none');
});

test('L4-T5 · el deny by default no necesita ningun flag que se pueda olvidar', () => {
  const decision = pedirContexto(tool({ context_profile: 'usage_history' }), politica([]), 'usage_history');
  assert.equal(decision.concedido, false);
  assert.equal(decision.motivo, 'E_SIN_CONCESION');
});

test('L4-T5 · el techo declarado manda: la tool no recibe lo que no declara', () => {
  const p = politica([concesion({ categoria: 'usage_history' })]);
  const decision = pedirContexto(tool({ context_profile: 'none' }), p, 'preferences');
  assert.equal(decision.concedido, false);
  assert.equal(decision.motivo, 'E_TECHO_DECLARADO');
});

test('L4-T5 · la categoria concedida acota la que se pide', () => {
  const p = politica([concesion({ categoria: 'preferences' })]);
  const decision = pedirContexto(tool({ context_profile: 'usage_history' }), p, 'usage_history');
  assert.equal(decision.concedido, false);
  assert.equal(decision.motivo, 'E_CATEGORIA_NO_CONCEDIDA');
});

test('L4-T5 · lo concedido es lo que se pidio, no el techo entero', () => {
  const p = politica([concesion({ categoria: 'usage_history' })]);
  const decision = pedirContexto(tool({ context_profile: 'usage_history' }), p, 'preferences');
  assert.equal(decision.concedido, true);
  assert.equal(decision.motivo, 'E_CONCEDIDO');
  assert.equal(decision.categoria, 'preferences');
});

test('L4-T5 · la psicometria no viene de la categoria', () => {
  const p = politica([concesion({ categoria: 'usage_history', psicometria: ['personalizacion'] })]);
  const decision = pedirPsicometria(
    tool({ context_profile: 'usage_history', psychometrics: true }),
    p,
    'personalizacion',
  );
  assert.equal(decision.concedido, true);
  assert.equal(decision.finalidad, 'personalizacion');
});

test('L4-T5 · el consentimiento de una finalidad no autoriza la otra', () => {
  const p = politica([concesion({ categoria: 'usage_history', psicometria: ['personalizacion'] })]);
  const decision = pedirPsicometria(
    tool({ context_profile: 'usage_history', psychometrics: true }),
    p,
    'engagement',
  );
  assert.equal(decision.concedido, false);
  assert.equal(decision.motivo, 'E_FINALIDAD_NO_CONSENTIDA');
});

test('L4-T5 · la psicometria exige que la tool la declare', () => {
  const p = politica([concesion({ categoria: 'usage_history', psicometria: ['personalizacion'] })]);
  const decision = pedirPsicometria(
    tool({ context_profile: 'usage_history', psychometrics: false }),
    p,
    'personalizacion',
  );
  assert.equal(decision.concedido, false);
  assert.equal(decision.motivo, 'E_PSICOMETRIA_NO_DECLARADA');
});

test('L4-T5 · la escritura se concede aparte del contexto', () => {
  const p = politica([concesion({ categoria: 'usage_history' })]);
  const decision = pedirEscritura(tool({ context_profile: 'usage_history' }), p);
  assert.equal(decision.concedido, false);
  assert.equal(decision.motivo, 'E_ESCRITURA_NO_CONCEDIDA');
});

test('L4-T5 · la escritura concedida no depende de la categoria', () => {
  const p = politica([concesion({ categoria: 'none', escritura: true })]);
  const decision = pedirEscritura(tool(), p);
  assert.equal(decision.concedido, true);
  assert.equal(decision.motivo, 'E_CONCEDIDO');
});

test('L4-T5 · la concesion es de una version: otra version no la hereda', () => {
  const p = politica([concesion({ version: '0.1.0', categoria: 'usage_history' })]);
  const decision = pedirContexto(
    tool({ version: '0.2.0', context_profile: 'usage_history' }),
    p,
    'preferences',
  );
  assert.equal(decision.concedido, false);
  assert.equal(decision.motivo, 'E_SIN_CONCESION');
});

test('L4-T5 · la concesion es de un autor: otro autor no la hereda', () => {
  const p = politica([concesion({ autor: 'opita', categoria: 'usage_history' })]);
  const decision = pedirContexto(
    tool({ author: 'tercero', context_profile: 'usage_history' }),
    p,
    'preferences',
  );
  assert.equal(decision.concedido, false);
  assert.equal(decision.motivo, 'E_SIN_CONCESION');
});

test('L4-T5 · el contexto inyectado lleva solo los campos concedidos', () => {
  const p = politica([concesion({ categoria: 'usage_history' })]);
  const descriptor = tool({ context_profile: 'usage_history' });
  const ctx = contextoPermitido(
    'actor-1',
    IDENTIDAD,
    pedirContexto(descriptor, p, 'preferences'),
    pedirPsicometria(descriptor, p, 'personalizacion'),
    CAMPOS,
  );
  assert.equal(ctx.profile, 'preferences');
  assert.deepEqual(ctx.injected, { idioma: 'es' });
});

test('L4-T5 · sin decision el contexto no lleva nada', () => {
  const descriptor = tool({ context_profile: 'usage_history' });
  const ctx = contextoPermitido(
    'actor-1',
    IDENTIDAD,
    pedirContexto(descriptor, POLITICA_VACIA, 'usage_history'),
    pedirPsicometria(descriptor, POLITICA_VACIA, 'personalizacion'),
    CAMPOS,
  );
  assert.equal(ctx.profile, 'none');
  assert.deepEqual(Object.keys(ctx.injected), []);
});

test('L4-T5 · la categoria historial trae tambien las preferencias', () => {
  const p = politica([concesion({ categoria: 'usage_history' })]);
  const descriptor = tool({ context_profile: 'usage_history' });
  const ctx = contextoPermitido(
    'actor-1',
    IDENTIDAD,
    pedirContexto(descriptor, p, 'usage_history'),
    pedirPsicometria(descriptor, p, 'personalizacion'),
    CAMPOS,
  );
  assert.equal(ctx.profile, 'usage_history');
  assert.deepEqual(ctx.injected, { idioma: 'es', visitas: 3 });
});

test('L4-T5 · el psicometrico entra solo con su decision, y con su finalidad', () => {
  const p = politica([concesion({ categoria: 'usage_history', psicometria: ['personalizacion'] })]);
  const descriptor = tool({ context_profile: 'usage_history', psychometrics: true });
  const ctx = contextoPermitido(
    'actor-1',
    IDENTIDAD,
    pedirContexto(descriptor, p, 'preferences'),
    pedirPsicometria(descriptor, p, 'personalizacion'),
    CAMPOS,
  );
  assert.deepEqual(ctx.injected, { idioma: 'es', psicometria: { rasgo: 'constante' } });
});

test('L4-T5 · el contexto sin psicometria concedido no lleva el campo', () => {
  const p = politica([concesion({ categoria: 'usage_history' })]);
  const descriptor = tool({ context_profile: 'usage_history', psychometrics: true });
  const ctx = contextoPermitido(
    'actor-1',
    IDENTIDAD,
    pedirContexto(descriptor, p, 'usage_history'),
    pedirPsicometria(descriptor, p, 'personalizacion'),
    CAMPOS,
  );
  assert.deepEqual(Object.keys(ctx.injected).includes('psicometria'), false);
});

test('L4-T5 · el permiso efectivo es el mas bajo de los dos techos', () => {
  const p = politica([concesion({ categoria: 'usage_history' })]);
  const permiso = permisoDe(tool({ context_profile: 'preferences' }), p);
  assert.equal(permiso.categoria, 'preferences');
  assert.equal(permiso.escritura, false);
});

test('L4-T5 · sin concesion el permiso efectivo no concede nada', () => {
  const permiso = permisoDe(tool({ context_profile: 'usage_history' }), POLITICA_VACIA);
  assert.equal(permiso.categoria, 'none');
  assert.deepEqual(permiso.psicometria, []);
  assert.equal(permiso.escritura, false);
});

test('L4-T5 · la escala es monotona: historial alcanza a preferencias y no al reves', () => {
  assert.equal(alcanza('usage_history', 'preferences'), true);
  assert.equal(alcanza('preferences', 'usage_history'), false);
  assert.equal(alcanza('preferences', 'none'), true);
});

test('L4-T5 · el techo mas bajo manda entre las dos categorias', () => {
  assert.equal(menor('usage_history', 'preferences'), 'preferences');
  assert.equal(menor('preferences', 'usage_history'), 'preferences');
  assert.equal(mayor('usage_history', 'preferences'), 'usage_history');
});

test('L4-T5 · una categoria que no esta en la escala es un error, no un valor bajo', () => {
  assert.throws(() => posicion('inventada' as Categoria), /categoria de contexto desconocida/);
});

test('L4-T5 · la escala tiene tres peldanos y el orden es el dato', () => {
  assert.deepEqual(ESCALERA, ['none', 'preferences', 'usage_history']);
  assert.equal(posicion('none'), 0);
  assert.equal(posicion('usage_history'), 2);
});

test('L4-T5 · la concesion se busca por id, version y autor a la vez', () => {
  const p = politica([concesion({ herramienta: 'otra', categoria: 'usage_history' })]);
  assert.equal(buscarConcesion(p, tool()), undefined);
});

test('L4-T5 · una finalidad desconocida no se concede', () => {
  const p = politica([
    concesion({ categoria: 'usage_history', psicometria: ['inventada' as Finalidad] }),
  ]);
  const permiso = permisoDe(tool({ context_profile: 'usage_history', psychometrics: true }), p);
  assert.deepEqual(permiso.psicometria, []);
});

test('L4-T5 · una decision incoherente falla en voz alta, no inyecta en silencio', () => {
  // El tipo dice que una decision denegada lleva 'none', pero un valor que
  // no pasa por el compilador puede mentir. Y el repositorio no confía en el
  // llamador: si llega una decision que dice 'concedido' con una categoria
  // que no concede, eso es un error del harness, y un error que se calla
  // aparece como un contexto vacio que nadie sabe explicar.
  const incoherente = {
    concedido: true,
    motivo: 'E_CONCEDIDO',
    categoria: 'none',
  } as unknown as DecisionContexto;
  assert.throws(
    () =>
      contextoPermitido(
        'actor-1',
        IDENTIDAD,
        incoherente,
        pedirPsicometria(tool(), POLITICA_VACIA, 'personalizacion'),
        CAMPOS,
      ),
    /categoria no concedible/,
  );
});

test('L4-T5 · el permiso vacio esta congelado: nadie lo muta en caliente', () => {
  assert.equal(Object.isFrozen(SIN_PERMISO), true);
  assert.equal(Object.isFrozen(SIN_PERMISO.psicometria), true);
});
