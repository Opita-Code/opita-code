/**
 * L6-T4 · EL CATALOGO: lo que hay publicado y en que orden.
 *
 * QUE ES. El conjunto de entradas y el orden en que se ven. Y el catalogo es
 * la plataforma, no el autor: por eso el conjunto de propias vive aqui y no
 * en la entrada, y por eso el numero de publicacion lo emite el catalogo.
 *
 * POR QUE EL CATALOGO NUMERA Y NO QUIEN PUBLICA.
 *
 *   El numero de publicacion es el unico dato que ordena el listado sin que
 *   nadie pueda elegirlo. Si lo escribiera quien publica, "publicar antes"
 *   seria "escribir un numero mas pequeno", y el orden del catalogo seria un
 *   campo de texto. El numero lo emite el catalogo, que es el unico que sabe
 *   cuanto se ha publicado.
 *
 * POR QUE EL CATALOGO NO GUARDA UNA COPIA DE LAS ENTRADAS.
 *
 *   Guarda la entrada, si, pero la publica como dato: el listado se construye
 *   a partir de las entradas y del pin, en el momento. Una vista cacheada
 *   seria un segundo estado que puede quedar viejo sin que nadie lo note, y
 *   el pin es una regla que se aplica, no un estado que se recuerda.
 *
 * LO QUE ESTE ARCHIVO NO HACE. No valida, no juzga, no licencia: el flujo es
 * de `publicar.ts`, y aqui solo se guarda lo que el flujo produjo.
 */

import type { Entrada } from './entrada.js';
import { listarConPin, type Propias } from './pin.js';
import { publicar as publicarEntrada, type ResultadoDelFlujo } from './publicar.js';

/** El catalogo: las entradas, las propias y el proximo numero. */
export interface Catalogo {
  readonly entradas: readonly Entrada[];
  /** Las entradas que la plataforma declara propias. */
  readonly propias: Propias;
  /** El proximo numero de publicacion. Empieza en 1. */
  readonly siguiente: number;
}

/** Un catalogo vacio. Las propias se declaran al construirlo. */
export function catalogoVacio(propias: Propias = []): Catalogo {
  return { entradas: [], propias, siguiente: 1 };
}

export type ResultadoDeCatalogo =
  | { readonly ok: true; readonly catalogo: Catalogo; readonly entrada: Entrada }
  | { readonly ok: false; readonly motivo: string; readonly detalle: string };

/**
 * Publica una entrada en el catalogo: le asigna el numero y la guarda.
 *
 * La numeracion va por entradas PUBLICADAS, no por intentos: una entrada que
 * no llega a publicarse no gasta numero. El numero es el orden, y el orden
 * tiene que reflejar lo que se publico, no lo que se intento.
 */
export function publicarEn(catalogo: Catalogo, entrada: Entrada): ResultadoDeCatalogo {
  const resultado: ResultadoDelFlujo = publicarEntrada(entrada, catalogo.siguiente);
  if (!resultado.ok) {
    return { ok: false, motivo: resultado.motivo, detalle: resultado.detalle };
  }
  return {
    ok: true,
    entrada: resultado.entrada,
    catalogo: {
      entradas: [...catalogo.entradas, resultado.entrada],
      propias: catalogo.propias,
      siguiente: catalogo.siguiente + 1,
    },
  };
}

/**
 * Sustituye una entrada por otra version de si misma.
 *
 * Es lo que necesitan la suspension y la retirada: la entrada no desaparece
 * del registro (el autor no se borra), cambia de estado. Si no esta, es un
 * fallo del que llama, no una operacion que no hace nada.
 */
export function sustituir(catalogo: Catalogo, entrada: Entrada): ResultadoDeCatalogo {
  const indice = catalogo.entradas.findIndex((e) => e.id === entrada.id);
  if (indice < 0) {
    return {
      ok: false,
      motivo: 'entrada_inexistente',
      detalle: `el catalogo no tiene la entrada ${entrada.id}`,
    };
  }
  const entradas = [...catalogo.entradas];
  entradas[indice] = entrada;
  return { ok: true, catalogo: { ...catalogo, entradas }, entrada };
}

/**
 * El listado: lo publicado, con el pin aplicado.
 *
 * Lo que sale de aqui es lo que el usuario ve. Lo demas esta en el registro,
 * pero no se muestra.
 */
export function listar(catalogo: Catalogo): readonly Entrada[] {
  return listarConPin(catalogo.entradas, catalogo.propias);
}
