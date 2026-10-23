# L2 · Mutación vs receta

> Parte 3 de 15. [Orden](L2-orden.md) · [Módulo](L2-modulo.md) · [Tools](L2-tools.md) · [Harness](L2-harness.md) · [Canónico](L2-canonico.md) · [Verificación](L2-verificacion.md) · [Aritmética](L2-aritmetica.md) · [Mutación](L2-mutacion.md) · [Presupuesto](L2-presupuesto.md) · [Hallazgo runner](L2-hallazgo-runner.md) · [Hallazgos](L2-hallazgos.md) · [Desviaciones](L2-desviaciones.md) · [Gate](L2-gate.md) · [Cierre](L2-cierre.md)
> Spec 537. Tareas L2-S3 y L2-S6.

## Lo que faltaba

`SHARING` de L0 ya derivaba, total y no configurable, la **forma** de compartir.
Lo que faltaba era que la forma no hacía **nada**. Era una tabla que nadie leía.

| Determinismo | Forma | Cachea | comparable |
|---|---|---|---|
| `deterministic` | `mutation` | sí | sí |
| `stochastic` | `recipe` | no | sí |
| `stateful` | `none` | no | **no** |

## Por qué `none` existe como caso aparte

Una tool con estado produce salidas distintas entre corridas porque **su estado
cambió**, no porque tenga azar. Comparar dos de sus corridas no dice nada, y
peor: hace **creer** que hay azar.

Si `none` se comportara como `recipe`, la derivación de L0 serían tres nombres
para dos comportamientos y habría que explicar la diferencia a mano. El tercer
caso compra una distinción real.

## La clave es una huella, no texto

La clave es `integrityOf({tool, input})`, un sha256.

Una clave de texto concatena id, versión e input con un separador, y cualquier
autor puede elegir un input que **contenga ese separador** y colisionar con otro.
Con una huella no hay colisión que fabricar.

Y la cache la escribe **solo** una tool `mutation`. El valor de una `recipe`
depende del azar y el de una `none` del estado: ninguno es función del input, y
cachearlos publicaría un valor como si lo fuera.

## El hallazgo: en T0 una tool estocástica es inimplementable

> Esto no estaba en el plan. Salió de construir la cuarta tool.

Estocástica de verdad significa que dos corridas con el **mismo** input dan
salidas distintas, y eso exige una fuente de azar. En T0 no hay ninguna:

- `Math.random()` es **entropía del host**.
- La lista blanca de imports está vacía **por diseño**.
- El sandbox no concede capacidades.

Una tool T0 que sorteara por dentro estaría usando un poder que el tier no le
concede: exactamente lo que L1 existe para impedir.

**Así que la variabilidad de `DRAFT` está en el input, no en ella.** El `nonce`
es parte del input y el mismo `(topic, nonce)` da siempre el mismo draft.

## Por qué sigue declarando `stochastic`

Porque la etiqueta no describe lo que la tool hace **hoy**: describe **cómo se
puede compartir**, y ahí el error va en una sola dirección.

| | Si el error es... | Costo |
|---|---|---|
| `deterministic` sobre una tool que mañana tiene azar | el valor se sirve de cache y **nadie lo puede saber** | tardío y feo |
| `stochastic` sobre una tool que hoy es pura | se ejecuta de más | barato y visible |

**Sobre-declarar es el error barato.** Y si mañana `DRAFT` gana una fuente de
azar legítima —un T1 con red, un backend— el contrato ya dice `recipe` y el
runtime ya la trata como no cacheable. No hay que migrar nada.

## Lo que el KPI del plan decía y lo que se midió

El plan pedía: *«la tool determinista da el mismo output 10/10; la estocástica da
outputs distintos 8/10»*.

La segunda mitad **no es implementable honestamente en T0**, y el caso canónico
estándar tampoco: R5 prohíbe que un nodo determinista consuma de uno estocástico,
así que una receta T0 no se puede encadenar hacia `RENDER`.

Lo que sí se midió, y es más fuerte:

- misma entrada → mismo output **10/10** (`DRAFT` con el mismo `nonce`);
- 40 nonces distintos → **varios** borradores distintos;
- `reused` es `false` en las dos corridas: una receta **se ejecuta siempre**,
  aunque hoy su salida sea una función pura del input.

La distinción mutación/receta se prueba sobre `reused`, que es una **garantía de
comportamiento del runtime**, no una predicción sobre la salida.
