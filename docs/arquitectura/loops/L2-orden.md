# L2 · Orden de ejecución

> Parte 1 de 15. [Módulo](L2-modulo.md) · [Compartir](L2-compartir.md) · [Tools](L2-tools.md) · [Harness](L2-harness.md) · [Canónico](L2-canonico.md) · [Verificación](L2-verificacion.md) · [Aritmética](L2-aritmetica.md) · [Mutación](L2-mutacion.md) · [Presupuesto](L2-presupuesto.md) · [Hallazgo runner](L2-hallazgo-runner.md) · [Hallazgos](L2-hallazgos.md) · [Desviaciones](L2-desviaciones.md) · [Gate](L2-gate.md) · [Cierre](L2-cierre.md)
> Spec 537. Tarea L2-S1.

## El hueco que cierra

`CompiledModule.executionOrder` en L0 era `mod.nodes.map((n) => n.node)`. Eso
no es un plan de ejecución: es el orden en que el **autor escribió** el
descriptor. Un módulo puede declarar `dibuja` antes que `calcula` y aun así tener
que correr `calcula` primero, y el plan de L0 no lo sabía.

## R10 · la regla

Es una regla como las otras, con su código de rechazo y su lugar en la tabla, en
`rules/order.ts`. **Agregarla como una función más dentro del orquestador sería
lo contrario de lo que hizo L0 al partir `graph.ts` en `rules/*`.**

Kahn con barrido en orden de declaración: el primer nodo sin predecesores
pendientes gana.

## El desempate no es alfabético

Puede haber varios nodos listos a la vez, y hay que elegir.

Elegir por nombre agregaría una clave de orden que el autor **no escribió** y que
el sandbox no puede verificar. Elegir por el orden del descriptor usa la
información que el autor **sí** escribió, y hace que el plan sea función del
descriptor y nada más. Sin esa segunda clave, dos implementaciones del mismo
algoritmo dan el mismo plan.

```
mod.nodes.map(n => n.node)          // L0: la forma del descriptor
[...names].sort()                   // una clave que el autor no escribio
barrido sobre names                 // L2: lo que el autor escribio
```

## Predecesores distintos, no aristas

Un nodo puede recibir tres puertos del mismo upstream. Eso es **un**
predecesor. Contando aristas, ese nodo tendría grado de entrada 3 y nunca llegaría
a estar listo: el módulo válido se rechazaría con `E_CYCLE`.

Hay un mutante que hace exactamente eso, y muere.

## R10 va antes que las terminales — y eso no es cosmético

Un ciclo **no tiene terminal**. Si R10 corriera al final de la tubería, R7d
cortaría primero con `E_SINK_NOT_TERMINAL` y el autor leería *«este sink no es
terminal»* en vez de *«tienes un ciclo»*.

Síntoma y causa raíz dan códigos distintos, y dar el síntoma esconde el problema.
Por eso el orden de las reglas no es alfabético y mover uno **cambia lo que el
autor lee**. La razón completa está en `rules/order.ts`.

## El conjunto que se reporta es el remanente, no el ciclo

Lo que se nombra es lo que **no se pudo ordenar**: el ciclo más todo lo que
depende de él. Y el detalle lo dice con esas palabras.

Reportar *«el ciclo»* y entregar el remanente sería mentir por la forma. Un autor
que busca el nodo culpable y no lo encuentra pierde la confianza en el mensaje,
que es justo lo que un mensaje de validador tiene que ganarse.

## Un test que no tenía dientes

El test de L0 que afirma `executionOrder === ['a','b','c','d']` **no probaba
nada** de esto: en ese módulo el orden de declaración ya era topológico, así que
devolver `mod.nodes.map(...)` daba el mismo resultado. El bug de L0 era invisible
por construcción.

Los tests de L2 parten el orden de declaración del orden topológico a propósito.
Y el caso canónico declara sus nodos al revés todos los días, así que si el orden
volviera a ser el de declaración, **el caso canónico entregaría un artifact
vacío**.