/**
 * L5-T2 · EL COSTE: lo que se puede medir, y lo que no.
 *
 * Un veredicto cuesta tokens, y un juez que no se mide es un juez que no se
 * puede pagar. Pero el coste tiene una parte que este runtime NO PUEDE
 * MEDIR, y el mecanismo entero depende de decirlo en vez de disfrazarlo.
 *
 * LO MEDIDO, medido contra el juez real de esta maquina:
 *
 *   - LLAMADAS: las decide el plan (partes x consenso). Es un numero exacto.
 *   - BYTES: la suma de las partes que se envian, por muestra. Exacto.
 *   - LATENCIA: la respuesta del juez trae `latency_ms` por muestra. Se toma
 *     el MAXIMO, no la suma: medido con n=3, el servidor repite el mismo
 *     valor en las tres muestras (14294, 14294, 14294), asi que sumarlas
 *     contaria tres veces lo que probablemente fue una sola medida.
 *
 * LO NO MEDIDO:
 *
 *   - TOKENS. La respuesta del juez trae veredicto, confianza, proveedor,
 *     modelo y latencia, y NINGUN conteo de tokens. Tampoco queda en la base:
 *     la tabla de evaluaciones no tiene una columna de usage. Y no se
 *     proyecta: un divisor de "4 bytes por token" es una convencion, no una
 *     medida, y escribirla como coste seria un numero inventado con otro
 *     nombre. Se declara `tokens: null` y el motivo.
 *
 * EL CARGO SI SE PUEDE CALCULAR. El cargo es lo que se le cobra a quien
 * publica, y sale de una tarifa que el operador declara por llamada. Eso es
 * dato, no una garantia del framework.
 *
 * EL MARGEN NO SE PUEDE CALCULAR, y es la consecuencia de lo anterior:
 * margen = cargo - coste, y el coste del proveedor no esta medido. Devolver
 * un margen con un coste inventado seria peor que no devolver ninguno. El
 * margen sale `null` con su motivo, y el KPI del plan que pide el coste de
 * tokens medido se declara incumplido en el cierre del loop.
 */

import { desviacion, type MedidaDeParte } from './medida.js';

/** Lo que el plan ya sabe antes de llamar: llamadas y bytes. */
export interface Volumen {
  readonly llamadas: number;
  readonly bytes: number;
}

export interface Coste {
  /** Medido: las llamadas que el plan manda. */
  readonly llamadas: number;
  /** Medido: bytes enviados, sumando todas las muestras. */
  readonly bytes: number;
  /** Medido si alguna muestra trae latencia: el maximo observado. */
  readonly latenciaMs: number | null;
  /** NO medido: el proveedor no reporta usage. Siempre `null`. */
  readonly tokens: null;
  readonly motivoTokens: string;
}

const MOTIVO_TOKENS =
  'el proveedor no reporta usage y la base no guarda tokens: se mide lo que se puede medir y no se proyecta lo que nadie midio';

/**
 * El coste de una publicacion.
 *
 * `latenciaMs` es el maximo de las latencias que trajeron las muestras, o
 * `null` si ninguna trajo. La desviacion de las latencias se publica aparte
 * por quien quiera ver si el servidor esta repitiendo el valor.
 */
export function costeDe(volumen: Volumen, medidas: readonly MedidaDeParte[]): Coste {
  const latencias = medidas
    .flatMap((m) => m.muestras.map((s) => s.latenciaMs))
    .filter((x): x is number => x !== null && Number.isFinite(x));
  return {
    llamadas: volumen.llamadas,
    bytes: volumen.bytes,
    latenciaMs: latencias.length === 0 ? null : Math.max(...latencias),
    tokens: null,
    motivoTokens: MOTIVO_TOKENS,
  };
}

/** La desviacion de las latencias: 0 cuando el servidor repite el mismo valor. */
export function dispersionDeLatencia(medidas: readonly MedidaDeParte[]): number {
  const latencias = medidas
    .flatMap((m) => m.muestras.map((s) => s.latenciaMs))
    .filter((x): x is number => x !== null && Number.isFinite(x));
  return desviacion(latencias);
}

/** La tarifa la declara el operador. No hay una por defecto: seria inventarla. */
export interface Tarifa {
  readonly porLlamada: number;
  readonly moneda: string;
}

export interface Cargo {
  readonly llamadas: number;
  readonly total: number;
  readonly moneda: string;
  /** NO calculable: falta el coste del proveedor. */
  readonly margen: null;
  readonly motivoMargen: string;
}

const MOTIVO_MARGEN =
  'el margen es cargo menos coste, y el coste del proveedor no esta medido: sin tokens no hay margen que calcular';

/** Lo que se cobra por publicar, con la tarifa declarada. */
export function cobrar(coste: Coste, tarifa: Tarifa): Cargo {
  return {
    llamadas: coste.llamadas,
    total: Math.round(coste.llamadas * tarifa.porLlamada * 1e4) / 1e4,
    moneda: tarifa.moneda,
    margen: null,
    motivoMargen: MOTIVO_MARGEN,
  };
}
