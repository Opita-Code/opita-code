/**
 * Generador pseudoaleatorio sembrado. Determinista a proposito: una suite
 * de tests que falla al azar contradiria justamente la propiedad del producto
 * que esta suite protege (mismo contrato -> mismo resultado).
 */
export class Rng {
  #state: number;

  constructor(seed: number) {
    this.#state = seed >>> 0 || 0x9e3779b9;
  }

  next(): number {
    let x = this.#state;
    x ^= x << 13;
    x >>>= 0;
    x ^= x >>> 17;
    x ^= x << 5;
    x >>>= 0;
    this.#state = x;
    return x >>> 0;
  }

  int(maxExclusive: number): number {
    if (maxExclusive <= 0) return 0;
    return this.next() % maxExclusive;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('pick sobre lista vacia');
    return items[this.int(items.length)] as T;
  }

  bool(): boolean {
    return this.int(2) === 1;
  }
}