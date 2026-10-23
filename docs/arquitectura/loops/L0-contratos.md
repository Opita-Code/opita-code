# L0 · Contratos y type system

> Parte 1 de 2 de L0. Loop L0 del plan de iteración (spec 534), cerrado bajo spec 535.
> Diseño: este archivo. Verificación: [L0-verificacion.md](L0-verificacion.md).
> Commit `0639b69`. **88/88 tests · mutation 57/57 = 100%.** Gate al cierre de L0: las 17 unidades de entonces en `aligned` 3/3. Esto es el registro de L0, no un estado vivo; la fuente es `dark_memory_judgment_history`.

## Principio

> `vibe-tools = sistema de CONTRATOS CONFIABLES alrededor de MAGIA OPACA`

| | Qué es | Dónde |
|---|---|---|
| **Contrato** | Descriptor JSON puro: sin funciones, sin referencias | `contract.ts` |
| **Magia** | El código que cumple ese contrato | `tool.ts` |

Un descriptor es un **valor**. Eso es lo que permite que el marketplace lo liste, que el juez lo verifique y que dos personas confirmen si hablan del mismo artefacto. La magia se une después, resuelta por `(id, version)`.

---

## L0-T1 — Primitiva `VibeTool`

```ts
interface ToolDescriptor {
  id: string; version: string; author: string; title: string;
  determinism: Determinism;   // eje 2
  tier: Tier;                 // T0 | T1 | T2
  effect: Effect;             // none | read | write | process
  inputs: Port[]; outputs: Port[];
}
```

### Refinamiento respecto a la decisión original

El **eje 1 (qué produce) baja de la herramienta al puerto**, porque la composición se comprueba puerto→puerto y ahí es donde el eje resulta comprobable. El **eje 2 (determinismo) se queda en la herramienta**, porque la regla de compartir es de la herramienta completa.

No contradice la decisión de los 2 ejes: **la hace ejecutable en vez de declarativa.**

### Integridad sin dependencias

`sha256` es TypeScript **puro**, no `node:crypto`. La huella tiene que dar el mismo resultado en WASM (T0), Lambda y microVM Firecracker; una API del host rompe esa garantía o obliga a una capa de compatibilidad que no queremos dentro del sandbox.

`canonicalize` ordena claves, así que la huella no depende del orden de inserción. El orden de los **puertos** sí es parte del descriptor: reordenar puertos da otra huella. Intencional — la huella identifica el descriptor tal cual es, no su equivalencia semántica.

### El sellado del contexto no es una convención

Congelar en `emptyContext` era una promesa sin respaldo: cualquier llamador podía construir un contexto con `injected` mutable, pasarlo a `run()`, y la tool lo mutaba.

Ahora `run()` **aplica** la inmutabilidad antes de entregar el contexto a la tool, con sellado **profundo** — un objeto anidado del contexto inyectado tampoco es mutable — sobre una copia, sin congelar el objeto del llamador.

El camino rápido usa un `WeakSet`, **no** `Object.isFrozen`. `isFrozen` solo mira la superficie: un `injected` congelado que contiene un objeto anidado mutable lo daba por sellado y se escapaba del sellado profundo por completo. **Ese bypass lo encontró el juez.**

La inmutabilidad del contexto es una regla del boundary (L3): se aplica en el registry, no se confía en el llamador.

---

## L0-T2 — Type system de 2 ejes

### Eje 1 · qué produce (en el puerto)

`code · text · image · video · audio · multimodal`

### Eje 2 · clase de determinismo (en la herramienta)

| Eje 2 | Se comparte como | Significado |
|---|---|---|
| `deterministic` | **mutación** | Fork idéntico. Se reproduce byte a byte. |
| `stochastic` | **receta** | Semilla y parámetros. Cada corrida difiere. |
| `stateful` | **nada** | Necesita runtime. No se forkea ni se reproduce. |

La derivación eje 2 → forma de compartir es **total, exhaustiva e inyectiva, y no es configurable**:

```ts
const SHARING = {
  deterministic: 'mutation',
  stochastic:    'recipe',
  stateful:      'none',
} as const satisfies Record<Determinism, string>;
```

No configurable **a propósito**: si lo fuera, el determinismo podría mentir. El tipo lo impide en compilación y la property P1 lo comprueba en runtime.

**Vibe-case NO participa.** Es selector de rúbrica del juez (gobernanza), no parte del lenguaje de contratos.

---
