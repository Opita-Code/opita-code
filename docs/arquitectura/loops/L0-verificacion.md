# L0 · Verificación

> Parte 3 de 4 de L0. Contratos: [L0-contratos.md](L0-contratos.md) · Composición: [L0-composicion.md](L0-composicion.md) · Hallazgos: [L0-hallazgos.md](L0-hallazgos.md)
> Commit `0639b69`. Tarea L0-T4. **88/88 tests.** El `mutation 57/57 = 100%` de esta linea era falso: el verificador no ejecutaba los tests. Ver [L-CI-verificador](L-CI-verificador.md).

Skill `llm-testing`: mínimo 2 métodos por artefacto. Aquí van tres.

## 1. Unitarios — 78 casos, uno por regla

Cada regla tiene su caso con **código de rechazo exacto**. Un rechazo con el código correcto pero el detalle equivocado no pasa: los tests comparan `code`, `detail` y `at`.

## 2. Property-based — 10 invariantes × 6 semillas

| # | Invariante |
|---|---|
| P1 | `sharingOf` es total e inyectiva |
| P2 | `canonicalize` es punto fijo de su forma ordenada; el hash sobrevive al reordenamiento de claves |
| P3 | sha256 puro coincide con `node:crypto` en entradas aleatorias |
| P4 | la validación es pura: mismo módulo con claves reordenadas → mismo veredicto |
| P5 | fuzz: todo rechazo tiene código del union y nunca lanza excepción |
| P6 | ningún módulo aceptado tiene un artifact con arista saliente |
| P7 | todo módulo aceptado declara sus terminales y entrega un artifact |
| P8 | todo módulo aceptado respeta tier/efecto |
| P9 | cambiar un solo campo del contrato cambia la huella |
| P10 | los 18 pares (determinismo × producción) quedan cubiertos |

El PRNG es **sembrado y determinista a propósito**: una suite que falla al azar contradiría la propiedad del producto que protege.

## 3. Mutation testing — 57 mutantes (el 100% no era una medida)

| Paquete | Muertos | Paquete | Muertos |
|---|---|---|---|
| `rules/edges.js` | 9/9 | `graph.js` | 5/5 |
| `rules/terminals.js` | 8/8 | `rules/types.js` | 2/2 |
| `hash.js` | 7/7 | `contract.js` | 3/3 |
| `rules/identity.js` | 5/5 | `canonical.js` | 3/3 |
| `context.js` | 5/5 | `axes.js` | 5/5 |
| `tool.js` | 5/5 | **TOTAL** | **57/57** |

Un test suite que pasa no demuestra nada sobre si los tests detectan errores. Los 57 mutantes borran, invierten o alteran una regla concreta del compilado; si el suite entero pasara con cualquiera, el hueco está en los tests, no en el código.

Umbral de la skill: 80% por paquete. El resultado está en **100% en los once**.

---

## El harness se niega a cerrar

Un patrón que no aparece en el compilado se reporta `no-aplicable` y **cuenta como hueco**, no como sobreviviente. `npm run mutate` sale con código 1 si hay sobrevivientes, paquetes bajo 80%, **o un solo patrón no encontrado**.

Durante L0, cuatro patrones no aparecieron y revelaron que el sellado profundo y el orden del pipeline no estaban realmente verificados. Sin esa regla, el 100% que reporté antes habría sido parcialmente inventado.

---

## Gate budget

Decisión del operador (opción A): ningún artefacto juzgable supera **4096 bytes**, que es `ConsensusChunkSize`. Con ese tope es un solo chunk, el `SpecIntent` aplica al artefacto completo, y el veredicto es decidible.

`npm run budget` falla el build si alguna unidad lo cruza. No hay manifiesto — un manifiesto se olvida actualizar, y lo que se olvida no se verifica.

Unidades: cada archivo de `src/`, cada doc de `docs/arquitectura/loops/`, y el README. Los documentos de la fase 1 están clasificados **no juzgables** con motivo explícito, impreso en cada corrida para que la clasificación no se pudra.

**Presupuesto al cierre de L0:** el más ajustado era `graph.ts` en 3569 B, y L2 le mete orden topológico y detección de ciclos, así que probablemente haya que partirlo. *(Tras L1 el más ajustado del repo pasó a ser `hash.ts` en 3716 B; `graph.ts` sigue en 3569 B, sin cambios.)*