/**
 * L5-T3 · EL AMBITO: que se mide de cada clase de artefacto.
 *
 * QUE ES. Un ambito es una clase de artefacto con su propia pregunta. No es
 * una etiqueta decorativa: dice QUE mide el juez, EN QUE UNIDAD, con QUE
 * afirmacion, CUANTAS muestras y QUE NO VE. Y se asigna por RUTA, con una
 * tabla, para que la clase no se negocie despues de ver el veredicto.
 *
 * POR QUE SE ASIGNA POR RUTA Y NO POR LO QUE DICE EL AUTOR.
 *
 *   Un ambito que el autor elige es un ambito que el autor puede bajar de
 *   exigencia cuando el artefacto no pasa. Si el documento legal se pudiera
 *   declarar "documento" en vez de "legal", el pipeline le pediria un
 *   veredicto que ese documento no admite. La ruta no tiene incentivo: es la
 *   misma antes y despues de juzgar.
 *
 * POR QUE UNA RUTA SIN AMBITO NO TIENE AMBITO POR DEFECTO.
 *
 *   Devolver `documento` para lo que no se reconoce seria adivinar, y un
 *   pipeline que adivina el ambito mide otra cosa que la que dice medir. La
 *   respuesta a una ruta desconocida es `null`, y el pipeline la convierte en
 *   una PARADA: quien anade un conjunto juzgable nuevo decide su ambito, y no
 *   lo hereda de una coincidencia de prefijos.
 *
 * ESTE ARCHIVO ES LA TABLA. La resolucion de una ruta a su ambito vive en
 * `ruta-de-ambito.ts`: son dos conceptos, y el tope de 4096 B que el juez
 * aplica a cada parte los separa. La tabla dice QUE mide cada clase; la
 * resolucion dice CUAL le toca a una ruta.
 *
 * LO QUE ESTE ARCHIVO NO HACE. No decide que archivos son juzgables: eso lo
 * declara el guard de presupuesto (`tools/gate-budget.mjs`), que es quien
 * recorre el arbol. Aqui solo se dice COMO se juzga lo que ya se juzga.
 */

export const AMBITOS = ['codigo', 'sql', 'documento', 'avance', 'canal', 'superficie'] as const;

export type Ambito = (typeof AMBITOS)[number];

/** El techo de contexto que declara cada ambito, y lo que NO ve. */
export interface DefinicionDeAmbito {
  /** Que relacion mide el juez en esta clase. */
  readonly queMide: string;
  /** Quien asigna el ambito. Hoy: la ruta, con esta tabla. */
  readonly quienAsigna: string;
  /** La unidad que se le entrega al juez. */
  readonly unidad: string;
  /** La forma que tiene que tener la afirmacion central. */
  readonly afirmacion: string;
  /** Las muestras por defecto. El riesgo alto la sube a 3. */
  readonly consenso: 1 | 3;
  /** Lo que el veredicto de esta clase NO dice. */
  readonly noVe: readonly string[];
}

/**
 * LA TABLA. Cada fila es una clase, y cada clase tiene una pregunta distinta.
 *
 * `consenso` no es una preferencia de calidad: es el coste que el riesgo
 * justifica. El codigo y el SQL de `vibe-tools` son los artefactos sobre los
 * que el plan pide K3 con `stddev = 0`, y sin dos muestras no hay desviacion
 * que medir. Un documento no necesita tres llamadas para decidir si afirma lo
 * que su intent dice, y pedirlas seria pagar tres veces la misma pregunta.
 */
export const DEFINICIONES: Readonly<Record<Ambito, DefinicionDeAmbito>> = Object.freeze({
  codigo: {
    queMide: 'que el archivo haga y explique lo que su afirmacion dice, con el porque de cada decision',
    quienAsigna: 'la ruta: todo lo que vive bajo vibe-tools/src',
    unidad: 'un archivo; si cruza el tope, sus partes por concepto',
    afirmacion: 'una sola, sobre lo que el codigo hace y por que esta asi',
    consenso: 3,
    noVe: [
      'si el codigo corre (eso lo miden los tests)',
      'si el test que lo cubre afirma lo que dice afirmar (eso lo mide la mutacion)',
      'si el diseño es el mejor',
    ],
  },
  sql: {
    queMide: 'que la politica que el SQL hace cumplir sea la que su afirmacion declara',
    quienAsigna: 'la ruta: todo lo que vive bajo vibe-tools/db',
    unidad: 'un archivo',
    afirmacion: 'una sola, sobre la politica que el SQL aplica',
    consenso: 3,
    noVe: [
      'si el motor la aplica: eso lo mide el test de aislamiento contra un Postgres real',
      'si el esquema aguanta carga',
    ],
  },
  documento: {
    queMide: 'que el documento sostenga la tesis que su intent declara',
    quienAsigna: 'la ruta: todo lo que vive bajo docs/arquitectura/loops',
    unidad: 'un documento; si cruza el tope, sus partes por concepto',
    afirmacion: 'una sola, sobre la tesis del documento',
    consenso: 1,
    noVe: [
      'la coherencia entre sus partes: el juez no ve el conjunto',
      'si lo que afirma es verdad: eso lo miden los guards y la persona',
    ],
  },
  avance: {
    queMide: 'que el registro en lenguaje llano cuente el loop que dice contar',
    quienAsigna: 'la ruta: docs/avances.md y docs/avances/',
    unidad: 'un archivo',
    afirmacion: 'una sola, sobre lo que el loop entrego',
    consenso: 1,
    noVe: [
      'las cifras: las mide el guard de estado, no el juez',
      'si el relato es el mas claro posible',
    ],
  },
  canal: {
    queMide: 'que la adaptacion del canal sea la que su afirmacion declara',
    quienAsigna: 'la ruta: docs/canal.md y docs/canal/',
    unidad: 'un archivo',
    afirmacion: 'una sola, sobre la adaptacion y su por que',
    consenso: 1,
    noVe: ['el alcance real de una publicacion', 'si el texto funciona con el publico'],
  },
  superficie: {
    queMide: 'que la superficie publica afirme lo que su fuente manda afirmar',
    quienAsigna: 'la ruta: la raiz del repositorio, vibe-tools/README.md y los flujos de .github',
    unidad: 'un archivo',
    afirmacion: 'una sola, sobre lo que la superficie declara',
    consenso: 1,
    noVe: [
      'los numeros: los mide verificar-estado contra la realidad',
      'que la superficie generada este al dia: eso lo mide generar-estado --check',
    ],
  },
});
