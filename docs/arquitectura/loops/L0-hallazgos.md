# L0 · Hallazgos de la verificación

> Parte 4 de 4 de L0. Diseño: [L0-contratos.md](L0-contratos.md) · Verificación: [L0-verificacion.md](L0-verificacion.md)
> Commit `0639b69`.

Nueve hallazgos. **Ninguno en la lógica de composición**: seis en los propios tests, uno en una constante mal puesta, uno de seguridad en el boundary encontrado por el juez, y uno estructural del split.

Se registran porque son el argumento de por qué esta verificación sirve.

## 1. Constante SHA-256 mal puesta

El test de un byte comparaba contra el hash de `"abc"`. Constante inventada, escrita de memoria. Corregido contra `node:crypto`.

## 2. Propiedad falsa: "canonicalize es idempotente"

No lo es: devuelve una **cadena**, y canonizar esa cadena la vuelve a escapar. La propiedad real —y la que importa— es que la forma ordenada ya no cambia al volver a canonizar:

```ts
canonicalize(JSON.parse(canonicalize(v))) === canonicalize(v)
```

Corregí la propiedad, no la aserción.

## 3. Propiedad mal formulada: "el veredicto es idéntico byte a byte"

`JSON.stringify` del resultado incluye el eco del módulo, que conserva el orden de inserción de claves. La huella **sí** era idéntica en ambos casos. Se comparó la proyección del veredicto —lo que la validación afirma— y no el eco.

## 4. Test contra enum

El test buscaba el mensaje `estocastica`; el validador emite el literal del enum `stochastic`. El código estaba bien, la expectativa mal.

## 5. Mutación posible-identidad

`mutateOneField` podía elegir el valor original —3 clases de determinismo, 1000 autores: colisión trivial— y el test moría solo. Ahora la mutación garantiza cambio no idéntico.

## 6. Mutantes `no-aplicable`: el sellado profundo no estaba medido

Dos patrones de `sealContext` no aparecían en el compilado. El harness los reportaba aparte y eso no era suficiente: un patrón no encontrado **cuenta como hueco, no como sobreviviente**. Ahora `npm run mutate` **se niega a cerrar el loop** si aparece uno.

Cuatro de ellos aparecieron durante el split final y revelaron que el sellado profundo y el orden del pipeline no estaban realmente verificados.

## 7. Agujero de boundary — encontrado por el juez

`sealContext` hacía early-return con `Object.isFrozen`. `isFrozen` **solo mira la superficie**: un `ToolContext` con `injected` congelado pero con un objeto anidado mutable **se escapaba del sellado profundo por completo**.

Mis 83 tests no lo veían. `consensus n=3` devolvió `drift_detected 3/3`, `frac 1.0`, `stddev 0` — señal consistente, no ruido.

**Cerrado:** `WeakSet` en vez de `Object.isFrozen`, sellado profundo en `run()` sobre una copia. 5 tests y 9 mutantes nuevos, todos muertos.

**Lección que se Lleva:** la inmutabilidad del contexto es una regla del boundary (L3). Se aplica en el registry; no se confía en el llamador.

## 8. Bug introducido por el split de reglas

Al partir `graph.ts` en `rules/*.ts`, `ruleNoDuplicates` pasó a consultar `state.byId` — que el orquestador **ya colapsaba** al pre-indexar. En la versión monolítica `byId` se construía incrementalmente dentro de R1.

Consecuencia: R1 veía todo nodo como presente y **rechazaba todos los módulos**, no solo los duplicados. 19 tests cayeron de golpe.

Lo detectó la suite. La regla ahora cuenta los ids por su cuenta y no depende de cómo se construyó el índice.

**Lección:** partir un conjunto de reglas **cambia el contrato entre la regla y el estado**. Un archivo de reglas no puede asumir que el estado se construyó para servirle.

## 9. Límite de 4096 del gate

`ConsensusChunkSize = 4096`, `numChunks = min(N, ceil(len/4096))`, y **cada chunk se evalúa contra el mismo `SpecIntent`**. Un artefacto de 8 KB juzgado por partes contra una intención del artefacto entero siempre produce contradicción, y la autocrítica del juez la atribuye correctamente a la evidencia.

Resuelto con la decisión de **gate budget**: ningún artefacto juzgable pasa de 4096 B, y `tools/gate-budget.mjs` falla el build si alguno lo cruza.