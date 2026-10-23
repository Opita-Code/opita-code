# L2 · El harness

> Parte 5 de 15. [Orden](L2-orden.md) · [Módulo](L2-modulo.md) · [Compartir](L2-compartir.md) · [Tools](L2-tools.md) · [Canónico](L2-canonico.md) · [Verificación](L2-verificacion.md) · [Aritmética](L2-aritmetica.md) · [Mutación](L2-mutacion.md) · [Presupuesto](L2-presupuesto.md) · [Hallazgo runner](L2-hallazgo-runner.md) · [Hallazgos](L2-hallazgos.md) · [Desviaciones](L2-desviaciones.md) · [Gate](L2-gate.md) · [Cierre](L2-cierre.md)
> Spec 537. Tarea L2-S5.

Le das un módulo compilado y una clase de producción; te devuelve la entrega que
produce ese modo. Es el ciclo de misiones: uno pide *«dame una imagen»* y no
necesita saber qué nodo del grafo la produjo.

## Rechaza la ambigüedad en vez de resolverla

Si dos entregas producen `image`, elegir la primera es una moneda al aire, y el
autor que lo lea no tiene forma de saber que hubo un sorteo. Se devuelve
`E_AMBIGUOUS_MODE` **con los `nodo:puerto` en el detalle**, para que el mismo
error que lo dispara diga también cómo arreglarlo.

## Mira la corrida antes que el modo

Un módulo que falló no tiene nada que preguntar, y su error es más informativo
que *«no encuentro una entrega de ese modo»*. El run viaja con el error: sin él,
nadie sabe dónde se detuvo.

## El contexto entra por parámetro y se pasa

El harness **no** define perfiles ni crea contextos: los perfiles de identidad
son L3. El contexto del llamador viaja intacto hasta las tools, y el sandbox lo
sella en cada `run()` como hacía en L1.

Un harness que fabricara su propio perfil estaría inventando una identidad que
nadie eligió.

## No hay modo *«el que quiera»*

Pedir el artifact sin decir de qué clase sería dejar que el módulo decida por el
consumo, y el consumidor es quien sabe qué quiere mostrar. Además sería una
cuarta forma de compartir que el type system de L0 no conoce.
