/**
 * COMPARTIR — mutacion vs receta.
 *
 * El eje 2 ya sabia esto desde L0: SHARING deriva, total y no configurable, la
 * FORMA de compartir. Lo que faltaba era que la forma no hacia NADA. Aqui se le
 * da comportamiento, y hay una decision de diseno detras:
 *
 *   mutacion  el valor se REUSA. Mismo input, misma huella, mismo valor.
 *   receta     nunca se reusa, pero dos corridas SI se COMPARAN: una receta es
 *              una funcion del azar, y compararla con otra del mismo input es como
 *              se detecta que una receta es en realidad determinista.
 *   none       ni se reusa ni se compara. Una tool con estado produce salidas
 *              distintas porque su estado cambio, no porque tenga azar. Compararlas
 *              no dice nada, y peor: hace CREER que hay azar.
 *
 * Esa ultima distincion justifica que none sea un caso aparte. Si se comportara
 * igual que recipe, la derivacion de L0 seria tres nombres para dos comportamientos.
 *
 * LA CLAVE ES UNA HUELLA, NO TEXTO
 * Una clave de texto concatena id, version e input con un separador, y cualquier
 * author puede elegir un input con ese separador y colisionar con otro. Con un
 * sha256 no hay colision que fabricar.
 *
 * Y la cache se escribe SOLO desde una tool mutation: el valor de una recipe o de
 * una none depende del azar o del estado, no del input, y cachearlo publicaria un
 * valor como si fuera funcion del input.
 */

import { integrityOf, type ToolOutput } from '../contract.js';
import { sharingOf, type Determinism } from '../axes.js';

/** Que hay que hacer con el valor de un nodo. Derivado, nunca configurado. */
export interface SharePolicy {
  readonly kind: 'mutation' | 'recipe' | 'none';
  /** Su valor puede entrar a la cache. */
  readonly cache: boolean;
  /** Dos corridas del mismo input se pueden confrontar. */
  readonly comparable: boolean;
}

const POLICY = {
  mutation: { kind: 'mutation', cache: true, comparable: true },
  recipe: { kind: 'recipe', cache: false, comparable: true },
  none: { kind: 'none', cache: false, comparable: false },
} as const satisfies Record<ReturnType<typeof sharingOf>, SharePolicy>;

export function sharePolicy(determinism: Determinism): SharePolicy {
  return POLICY[sharingOf(determinism)];
}

/** Huella de un valor de entrada para una tool. Base de la cache de mutacion. */
export function shareKey(id: string, version: string, input: unknown): string {
  return integrityOf({ tool: `${id}@${version}`, input });
}

/**
 * Cache de valores de nodos `mutation`.
 *
 * Vive fuera del runner a proposito: el runner no debe decidir donde vive. Hoy es
 * memoria; cuando el marketplace necesite comparar forks, se le pasa otra cosa.
 */
export class ValueStore {
  readonly #byKey = new Map<string, unknown>();

  get size(): number {
    return this.#byKey.size;
  }

  /** `undefined` = no estaba. Un valor `undefined` de verdad no se puede cachear. */
  lookup(key: string): unknown {
    return this.#byKey.get(key);
  }

  has(key: string): boolean {
    return this.#byKey.has(key);
  }

  /**
   * Guarda SOLO si la politica lo permite. Devolver en falso no es un fallo: es la
   * respuesta honesta a "esta tool puede cachear su valor?", y el runner lo usa
   * para marcar la corrida.
   */
  record(key: string, value: unknown, policy: SharePolicy): boolean {
    if (!policy.cache) return false;
    this.#byKey.set(key, value);
    return true;
  }

  clear(): void {
    this.#byKey.clear();
  }
}

/**
 * Las salidas a servir desde cache, o `null` si hay que ejecutar.
 *
 * La respuesta NO la da la cache sino la politica: una tool `recipe` o `none`
 * tiene el valor en la cache y aun asi hay que ejecutar, porque lo que esta ahi
 * no es una funcion del input. Por eso la pregunta no es "esta el valor?" sino
 * "puede este valor servirse?".
 */
export function cachedOutputs(
  policy: SharePolicy,
  store: ValueStore,
  key: string | null,
): readonly ToolOutput[] | null {
  if (key === null || !policy.cache || !store.has(key)) return null;
  return store.lookup(key) as readonly ToolOutput[];
}
