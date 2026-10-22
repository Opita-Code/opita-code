# L0 — Fundación: contratos y type system

> Loop L0 del plan de iteración (spec 534). Tareas L0-T1 … L0-T4.
> **Estado:** cerrado. 88/88 tests verdes · mutation score 100% (45/45).

---

## Principio

> `vibe-tools = sistema de CONTRATOS CONFIABLES alrededor de MAGIA OPACA`

Este loop construye solo los contratos. La magia se une después.

| | Qué es | Dónde vive | Por qué |
|---|---|---|---|
| **Contrato** | Descriptor JSON puro: `id`, `version`, ejes, puertos, tier, efecto | `src/contract.ts` | Publicable, versionable, hasheable, portable entre T0 / Lambda / Firecracker sin reescribir |
| **Magia** | El código que cumple ese contrato | `src/tool.ts` | Resuelto por `(id, version)`. El registry es el único que junta ambos |

Un descriptor **no tiene funciones ni referencias**. Es un valor. Eso es lo que permite que el marketplace lo liste, que el juez lo verifique y que dos personas comparen si hablan del mismo artefacto.

---

## L0-T1 — Primitiva `VibeTool`

```ts
interface ToolDescriptor {
  id: string; version: string; author: string; title: string;
  determinism: Determinism;        // eje 2
  tier: Tier;                      // T0 | T1 | T2
  effect: Effect;                  // none | read | write | process
  inputs: Port[]; outputs: Port[];
}
```

**Refinamiento de diseño respecto a la decisión original:** el eje 1 (qué produce) **no está en la herramienta, está en el puerto**. Razón: la composición se comprueba puerto→puerto, así que es el puerto donde el eje tiene que ser comprobable. El eje 2 (determinismo) **sí está en la herramienta**, porque la regla de compartir (mutación / receta / nada) es una propiedad de la herramienta completa.

Esto no contradice la decisión de los 2 ejes. La hace ejecutable.

### Integridad sin dependencias

`sha256` es una implementación pura en TypeScript (`src/contract.ts`), no `node:crypto`. Razón: la huella tiene que dar **el mismo resultado** dentro de WASM (T0), en Lambda y en una microVM. Traer una API del host rompe esa garantía o obliga a una capa de compatibilidad.

`canonicalize()` produce JSON con claves ordenadas. **El orden de los puertos ES parte del descriptor**: reordenar puertos da otra huella. Intencional — la huella identifica el descriptor tal cual es, no su equivalencia semántica.

### El sellado del contexto no es una convención

`Object.freeze` en `emptyContext` era una promesa sin respaldo: cualquier llamador podía construir un `ToolContext` con `injected` mutable, pasarlo a `run()`, y la tool lo mutaba.

Ahora `run()` **aplica** la inmutabilidad antes de entregar el contexto a la tool, con sellado **profundo** — un objeto anidado del contexto inyectado tampoco es mutable — sobre una copia, sin congelar el objeto del llamador.

El camino rápido usa un `WeakSet`, **no** `Object.isFrozen`. `isFrozen` solo mira la superficie: un `injected` congelado que contiene un objeto anidado mutable lo daba por sellado y se escapaba del sellado profundo por completo. Ese bypass lo encontró el juez.

**La inmutabilidad del contexto es una regla del boundary (L3), así que se aplica en el registry en vez de confiar en el llamador.**

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

La derivación eje 2 → forma de compartir es **total, exhaustiva e inyectiva**, y no es configurable:

```ts
const SHARING = {
  deterministic: 'mutation',
  stochastic:    'recipe',
  stateful:      'none',
} as const satisfies Record<Determinism, string>;
```

No es configurable **a propósito**: si lo fuera, el determinismo podría mentir. El tipo lo impide en compilación, y `P1` lo comprueba en runtime.

**Vibe-case NO participa.** Es selector de rúbrica del juez (gobernanza), no parte del lenguaje de contratos.

---

## L0-T3 — Validación de composición

Once reglas, **en orden fijo**. El orden importa: el primer rechazo es el veredicto. Fijarlo es lo que hace la función determinista y testeable.

| # | Regla | Código de rechazo |
|---|---|---|
| R0 | ids y nombres de puerto sin `:` | `E_BAD_REF` |
| R1 | no hay nodos duplicados | `E_DUPLICATE_NODE` |
| R2 | los extremos de cada arista existen | `E_DANGLING_NODE` |
| R3 | los puertos existen | `E_PORT_NOT_FOUND` |
| R4 | **eje 1 coincide puerto a puerto** | `E_AXIS_MISMATCH` |
| R5 | una tool determinista solo consume entradas deterministas | `E_NONDETERMINISTIC_INPUT` |
| R6 | **un artifact no alimenta otro nodo** | `E_ARTIFACT_NOT_TERMINAL` |
| R7 | todo sink existe y es terminal | `E_SINK_NOT_FOUND` / `E_SINK_NOT_TERMINAL` |
| R8 | toda salida sin arista saliente se declara sink | `E_UNDECLARED_SINK` |
| R9 | el módulo entrega al menos un artifact | `E_NO_ARTIFACT` |
| R11 | el tier admite el efecto declarado | `E_TIER_EFFECT` |

Tres deserve explicación:

**R4** es la regla que hace que el type system sea un type system. `code` no conecta a un puerto `text`. Si conectara, el error se descubre ejecutando, que es tarde y caro.

**R5** protege la promesa de determinismo. Una herramienta `deterministic` que consume de una `stochastic` no es determinista — es una mentira. El validador la rechaza en composición, no en runtime. La dirección inversa sí se permite: lo estocástico puede consumir lo determinista.

**R6 + R9** son el contrato canónico entero: *el código compone, los artifacts terminan*. R6 impide que un artifact se siga composing. R9 impide que exista un módulo que no entrega nada a un humano — un módulo sin artifact no es un módulo, es un segmento suelto.

---

## L0-T4 — Verificación

Skill `llm-testing`, mínimo 2 métodos por artefacto. Aquí van tres.

### 1. Tests unitarios — 78 casos, uno por regla

Cada regla tiene su caso con **código de rechazo exacto**. Un rechazo con el código correcto pero el detalle equivocado no pasa: los tests comparan `code`, `detail` y `at`.

### 2. Property-based — 10 invariantes, 6 semillas

| # | Invariante |
|---|---|
| P1 | `sharingOf` es total e inyectiva |
| P2 | `canonicalize` es punto fijo de su forma ordenada; el hash sobrevive al reordenamiento de claves |
| P3 | sha256 puro coincide con `node:crypto` en entradas aleatorias |
| P4 | la validación es pura: mismo módulo (con claves reordenadas) → mismo veredicto |
| P5 | fuzz: todo rechazo tiene código del union y nunca lanza excepción |
| P6 | ningún módulo aceptado tiene un artifact con arista saliente |
| P7 | todo módulo aceptado declara todas sus terminales y entrega un artifact |
| P8 | todo módulo aceptado respeta tier/efecto |
| P9 | cambiar un solo campo del contrato cambia la huella |
| P10 | los 18 pares (determinismo × producción) quedan cubiertos |

El PRNG es **sembrado y determinista a propósito**: una suite que falla al azar contradiría la propiedad del producto que protege.

### 3. Mutation testing — 45 mutantes, 100%

| Paquete | Mutantes | Muertos | Score |
|---|---|---|---|
| `graph.js` | 20 | 20 | **100.0%** |
| `contract.js` | 11 | 11 | **100.0%** |
| `tool.js` | 9 | 9 | **100.0%** |
| `axes.js` | 5 | 5 | **100.0%** |
| **TOTAL** | **45** | **45** | **100.0%** |

Umbral de la skill: 80%. Un test suite que pasa no demuestra nada sobre si los tests detectan errores. Los 45 mutantes borran, invierten o alteran una regla concreta del código compilado; si el suite entero pasara con cualquiera de ellos, el hueco está en los tests, no en el código.

**Cero mutantes `no-aplicable`.** El harness reporta los patrones que no encuentran en el compilado en vez de contarlos como sobrevivientes — durante el loop, dos de ellos fallaron y revelaron que el sellado profundo no estaba realmente verificado.

### Errores que la verificación encontró durante el loop

**Ocho hallazgos reales.** Ninguno estaba en el runtime de la regla de composición; seis estaban en los propios tests, uno en una constante, y **uno era un agujero de seguridad en el boundary** que encontró el juez. Se registran porque son el argumento de por qué esta verificación sirve.

1. **Constante SHA-256 mal puesta.** El test de 1 byte comparaba contra el hash de `"abc"`. Constante inventada. Corregido contra `node:crypto`.
2. **Propiedad falsa: "canonicalize es idempotente".** No lo es: devuelve una *cadena*, y canonizar esa cadena la vuelve a escapar. La propiedad real —y la que importa— es que la forma ordenada ya no cambia al volver a canonizar.
3. **Propiedad mal formulada: "el veredicto es idéntico byte a byte".** `JSON.stringify` del resultado incluye el eco del módulo, que conserva el orden de inserción de claves. La huella **sí** era idéntica. Se comparó la proyección del veredicto, no el eco.
4. **Mensaje de código contra enum.** El test buscaba `estocastica`; el validador emite el literal del enum `stochastic`. El código estaba bien, la expectativa mal.
5. **Mutación posible-identidad.** `mutateOneField` podía elegir el valor original y el test moría solo. Ahora la mutación garantiza cambio no idéntico.
6. **Mutantes `no-aplicable`.** Dos patrones de `sealContext` no aparecían en el compilado: el sellado profundo no estaba verificado y el harness no lo decía con suficiente claridad.
7. **Agujero de boundary (encontrado por el juez).** `sealContext` hacía early-return con `Object.isFrozen`, que solo mira la superficie. Un `injected` congelado con un objeto anidado mutable se escapaba del sellado profundo. **Cerrado con `WeakSet`.**
8. **Límite de chunking del gate.** `ConsensusChunkSize = 4096` y cada chunk se evalúa contra el mismo `SpecIntent`. Ver abajo.

---

## KPIs de L0

| KPI | Umbral | Resultado |
|---|---|---|
| K2 · mutation score por paquete | ≥ 80% | **100%** (45/45) |
| Tests verdes | todos | **88/88** |
| Property-based invariantes | todos | **10/10** |
| K6 · dependencias rotas | 0 | 0 |
| K3 · juez íntegro | 100% `aligned` | **parcial** — ver abajo |

### K3 — resultado honesto, no completo

| Artefacto | Bytes | Chunks | Veredicto |
|---|---|---|---|
| `src/axes.ts` | 2 527 | 1 | `aligned` 3/3 · frac 1.0 · stddev 0 · `degraded: false` |
| `src/tool.ts` | 4 204 | **2** | `needs_human` 2/2 — por chunking, no por drift |
| `src/graph.ts` | 7 945 | **2** | `aligned` (artefacto completo) · chunk 1 `needs_human` |
| `src/contract.ts` | 8 282 | **3** | no-Alcanzado |

**Por qué el límite existe:** `ConsensusChunkSize = 4096` (`internal/orchestration/drift_judge_consensus.go:126`) y `numChunks = min(N, ceil(len/4096))`. Cada chunk se evalúa contra el **mismo** `SpecIntent` (línea 511) sin recalibrarlo.

Un artefacto de 8 KB juzgado por partes contra una intención del artefacto entero siempre va a producir contradicción, y la autocrítica del juez la atribuye correctamente a la evidencia:

> `self_critique_override: [principle 3] NLI contradiction implies evidence wrong, not artifact`

**Consecuencia para K3:** el 100% `aligned` con `stddev = 0` solo es alcanzable de forma significativa en artefactos ≤ 4096 bytes. Los documentos de arquitectura —que por naturaleza son largos— no pueden obtenerlo con una intención de artefacto completo.

Decisión pendiente del operador, material de L5. Registrada como finding pineado.

---

## Lo que L0 NO hace

- No ejecuta código. Eso es L1 (sandbox T0/T1/T2).
- No compone en runtime. Eso es L2 (grafo, orden topológico, detección de ciclos).
- No lee ni escribe memoria. Eso es L3 (boundary, perfiles, `mutation_request`).
- No juzga artefactos publicados. Eso es L5.

`src/tool.ts` ya incorpora una restricción del MVP: **el registry solo ejecuta T0**. Una tool T1/T2 devuelve `{ok: false, error: "fuera de T0"}` en vez de intentarlo.

---

## Ejecutar

```bash
npm install
npm run test     # tsc + 88 tests
npm run mutate   # 45 mutantes
npm run check    # ambos
```