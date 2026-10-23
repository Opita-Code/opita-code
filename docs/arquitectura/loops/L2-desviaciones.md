# L2 · Desviaciones del plan

> Parte 13 de 15. [Orden](L2-orden.md) · [Módulo](L2-modulo.md) · [Compartir](L2-compartir.md) · [Tools](L2-tools.md) · [Harness](L2-harness.md) · [Canónico](L2-canonico.md) · [Verificación](L2-verificacion.md) · [Aritmética](L2-aritmetica.md) · [Mutación](L2-mutacion.md) · [Presupuesto](L2-presupuesto.md) · [Hallazgo runner](L2-hallazgo-runner.md) · [Hallazgos](L2-hallazgos.md) · [Gate](L2-gate.md) · [Cierre](L2-cierre.md)
> Spec 537. Tarea L2-S11.

Cuatro desviaciones del plan (spec 534, L2-T1..T6). Todas declaradas y todas
con una razón verificable.

---

## 1. El hallazgo: en T0 una tool estocástica es inimplementable

No estaba en el plan. Salió de construir la cuarta tool.

Estocástica de verdad = dos corridas con el **mismo** input dan salidas distintas, y eso
exige azar. En T0 no hay: `Math.random()` es **entropía del host**, la lista blanca
de imports está vacía **por diseño**, y el sandbox no concede capacidades.

Una tool T0 que sorteara por dentro usaría un poder que su tier no le concede:
exactamente lo que L1 existe para impedir.

**La variabilidad de `DRAFT` está en el input.** El `nonce` es parte del input y
el mismo `(topic, nonce)` da siempre el mismo draft.

**Por qué sigue declarando `stochastic`:** la etiqueta describe **cómo se
puede compartir**, no lo que la tool hace hoy. Declarar `deterministic` una tool
que mañana tenga azar serviría de cache un valor que nadie podría detectar como
falso. **Sobre-declarar es el error barato.**

### La KPI del plan que no se pudo cumplir

> *«la tool determinista da el mismo output 10/10; la estocástica da outputs
> distintos 8/10»*

La segunda mitad **no es implementable honestamente en T0**. Y el caso canónico
estándar tampoco: R5 prohíbe que un nodo determinista consuma de uno estocástico, así
que una receta T0 no se encadena hacia `RENDER`.

**Lo que sí se midió**, y es más fuerte:

| Medido | Resultado |
|---|---|
| misma entrada → mismo output | 10/10 |
| 40 nonces distintos | varios borradores distintos |
| `reused` en la 2ª corrida | `false`: una receta se ejecuta siempre |

La distinción se prueba sobre `reused`, que es una **garantía del runtime**, no una
predicción sobre la salida. Una `recipe` que hoy sale pura igual se ejecuta de más, y
eso es lo que la hace segura.

---

## 2. Cuatro tools, no tres

El plan pedía las tres. Con solo esas, el caso canónico end-to-end **no se puede
completar**: su tercer nodo es T1 y T1 no tiene transporte. La KPI primaria y la
lista de tools eran incompatibles.

`DRAFT` —estocástica de T0— es lo que hace alcanzable la KPI **sin fabricar
nada**: la estocasticidad es ortogonal al efecto, así que una tool T0 puede ser
estocástica de verdad.

No es una cuarta feature: es la diferencia entre cumplir la KPI y declararla
inalcanzable.

## 3. Tres casos canónicos, no uno

Uno solo habría tenido que elegir entre **correr** y **fallar**, y son
incompatibles en un solo grafo: `RESEARCH` es T1 y no tiene transporte, `DRAFT` es
T0 y por R5 no se encadena con `RENDER`.

| Caso | Grafo | Resultado |
|---|---|---|
| 1 · completo | `EXEC` → `RENDER` | corre entero, entrega SVG |
| 2 · receta | `DRAFT` | corre entero, entrega texto |
| 3 · investigación | `EXEC` → `RESEARCH` | se detiene, tipado |

Tres casos cubren las tres formas de terminar una corrida. Detalle en
[L2-canonico.md](L2-canonico.md).

## 4. EXEC no es un intérprete de Python

El plan pedía *«python puro»*. Un intérprete necesita un runtime real, y Pyodide es T1,
que L1 dejó sin transporte. Poner algo que solo suma y llamar Python sería peor
que decir lo que hace: `EXEC` evalúa una expresión infija con `+ - * /`,
paréntesis y menos unario, y su descriptor no finge otra cosa.

---

Lo que este loop **no** movió, y lo que entrega a L3, están en
[L2-cierre.md](L2-cierre.md), junto con el resultado real del gate.