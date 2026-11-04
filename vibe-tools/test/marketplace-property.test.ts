/**
 * L6 · Propiedad del pin: las tres propias SIEMPRE de primero.
 *
 * El PRNG va sembrado por la misma razon que en L0 y L2: una suite que falla
 * al azar contradiria la propiedad que protege. Aqui la propiedad es la que el
 * plan pide como KPI: `property_check` de que las tres propias van antes que
 * cualquier tercero, siempre.
 *
 * Lo que se protege, en tres afirmaciones:
 *
 *   1. NINGUN TERCERO PRECEDE A UNA PROPIA. Ni uno, ni una vez.
 *   2. EL BLOQUE DE LAS PROPIAS NO ROTA. Su orden es el de publicacion, y meter
 *      mas terceros en el catalogo no lo cambia. Sin esto, "de primero" seria
 *      "de primero hoy".
 *   3. LO QUE NO ESTA PUBLICADO NO SE LISTA. El listado es lo que se puede
 *      usar, no lo que existio.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import type { Entrada } from '../src/marketplace/entrada.js';
import { esPropia, listarConPin } from '../src/marketplace/pin.js';
import { Rng } from './rng.js';

const SEEDS = [1, 7, 42, 1337, 90210, 0xdeadbeef];
const PROPIAS = ['propia.una', 'propia.dos', 'propia.tres'];

/** Una entrada de catalogo con la forma que le importa al pin. */
function entrada(id: string, secuencia: number, estado: Entrada['estado']): Entrada {
  return {
    id,
    version: '1.0.0',
    autor: 'alguien',
    titulo: id,
    nivel: 'modulo',
    clase: 'recipe',
    huella: 'x'.repeat(64),
    descriptor: {
      id,
      version: '1.0.0',
      author: 'alguien',
      title: id,
      nodes: [],
      edges: [],
      sinks: [],
    },
    estado,
    afirmaciones: [],
    secuencia,
    motivo: null,
  };
}

/** Un catalogo aleatorio: propias, terceros, y algunos que no estan publicados. */
function catalogoAleatorio(r: Rng): { entradas: Entrada[]; } {
  const cuantosTerceros = 1 + r.int(12);
  const entradas: Entrada[] = [];
  for (const id of PROPIAS) {
    entradas.push(entrada(id, 1 + r.int(50), r.bool() ? 'publicado' : 'suspendido'));
  }
  for (let i = 0; i < cuantosTerceros; i++) {
    const estado = r.int(10) < 8 ? 'publicado' : r.pick(['suspendido', 'retirado', 'creado'] as const);
    entradas.push(entrada(`tercero.${i}`, 1 + r.int(50), estado));
  }
  // Barajar el catalogo: el orden de entrada NO es el orden de publicacion.
  for (let i = entradas.length - 1; i > 0; i--) {
    const j = r.int(i + 1);
    const a = entradas[i] as Entrada;
    const b = entradas[j] as Entrada;
    entradas[i] = b;
    entradas[j] = a;
  }
  return { entradas };
}

test('L6 ·Property · ninguna entrada de un tercero precede a una propia', () => {
  for (const semilla of SEEDS) {
    const r = new Rng(semilla);
    for (let ronda = 0; ronda < 200; ronda++) {
      const { entradas } = catalogoAleatorio(r);
      const listado = listarConPin(entradas, PROPIAS);
      const primeraDeTerceros = listado.findIndex((e) => !esPropia(e, PROPIAS));
      if (primeraDeTerceros < 0) continue;
      for (let i = primeraDeTerceros; i < listado.length; i++) {
        const entradaEnPosicion = listado[i] as Entrada;
        assert.equal(
          esPropia(entradaEnPosicion, PROPIAS),
          false,
          `la entrada ${entradaEnPosicion.id} de un tercero quedo antes que una propia (semilla ${semilla})`,
        );
      }
      for (let i = 0; i < primeraDeTerceros; i++) {
        const entradaEnPosicion = listado[i] as Entrada;
        assert.equal(
          esPropia(entradaEnPosicion, PROPIAS),
          true,
          `la entrada ${entradaEnPosicion.id} de un tercero quedo antes que una propia (semilla ${semilla})`,
        );
      }
    }
  }
});

test('L6 ·Property · las tres propias ocupan las tres primeras posiciones', () => {
  for (const semilla of SEEDS) {
    const r = new Rng(semilla);
    for (let ronda = 0; ronda < 200; ronda++) {
      const { entradas } = catalogoAleatorio(r);
      const propiasPublicadas = entradas.filter(
        (e) => esPropia(e, PROPIAS) && e.estado === 'publicado',
      );
      const listado = listarConPin(entradas, PROPIAS);
      assert.equal(listado.length, propiasPublicadas.length + entradas.filter((e) => !esPropia(e, PROPIAS) && e.estado === 'publicado').length);
      for (let i = 0; i < propiasPublicadas.length; i++) {
        assert.equal(esPropia(listado[i] as Entrada, PROPIAS), true);
      }
    }
  }
});

test('L6 ·Property · el bloque de las propias no rota cuando entran terceros', () => {
  for (const semilla of SEEDS) {
    const r = new Rng(semilla);
    for (let ronda = 0; ronda < 200; ronda++) {
      const { entradas } = catalogoAleatorio(r);
      const antes = listarConPin(entradas, PROPIAS).filter((e) => esPropia(e, PROPIAS));
      const conMasTerceros = [
        ...entradas,
        entrada('tercero.nuevo', 99, 'publicado'),
        entrada('tercero.otro', 100, 'publicado'),
      ];
      const despues = listarConPin(conMasTerceros, PROPIAS).filter((e) => esPropia(e, PROPIAS));
      assert.deepEqual(
        despues.map((e) => e.id),
        antes.map((e) => e.id),
        `el bloque de las propias cambio al meter terceros (semilla ${semilla})`,
      );
    }
  }
});

test('L6 ·Property · el bloque de las propias esta ordenado por publicacion', () => {
  for (const semilla of SEEDS) {
    const r = new Rng(semilla);
    for (let ronda = 0; ronda < 200; ronda++) {
      const { entradas } = catalogoAleatorio(r);
      const bloque = listarConPin(entradas, PROPIAS).filter((e) => esPropia(e, PROPIAS));
      for (let i = 1; i < bloque.length; i++) {
        const anterior = bloque[i - 1] as Entrada;
        const actual = bloque[i] as Entrada;
        assert.ok(
          (anterior.secuencia ?? 0) <= (actual.secuencia ?? 0),
          `las propias no estan en orden de publicacion (semilla ${semilla})`,
        );
      }
    }
  }
});

test('L6 ·Property · el listado es exactamente lo publicado', () => {
  for (const semilla of SEEDS) {
    const r = new Rng(semilla);
    for (let ronda = 0; ronda < 200; ronda++) {
      const { entradas } = catalogoAleatorio(r);
      const listado = listarConPin(entradas, PROPIAS);
      const publicadas = entradas.filter((e) => e.estado === 'publicado');
      assert.equal(listado.length, publicadas.length);
      for (const entrada of listado) {
        assert.equal(entrada.estado, 'publicado');
      }
    }
  }
});
