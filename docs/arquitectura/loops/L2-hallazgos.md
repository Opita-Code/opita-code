# L2 · Hallazgos

> Parte 12 de 15. [Orden](L2-orden.md) · [Módulo](L2-modulo.md) · [Compartir](L2-compartir.md) · [Tools](L2-tools.md) · [Harness](L2-harness.md) · [Canónico](L2-canonico.md) · [Verificación](L2-verificacion.md) · [Aritmética](L2-aritmetica.md) · [Mutación](L2-mutacion.md) · [Presupuesto](L2-presupuesto.md) · [Hallazgo runner](L2-hallazgo-runner.md) · [Desviaciones](L2-desviaciones.md) · [Gate](L2-gate.md) · [Cierre](L2-cierre.md)
> Spec 537. Tarea L2-S11.

Cuatro defectos. **Ninguno en el diseño de los módulos**: el grafo, el runner, la
política de compartir y el harness salieron como se pensaron. Dos son hallazgos
**de L1** y los encontró el código de L2. El quinto, el que salió de la
**desviación del plan**, está en [L2-desviaciones.md](L2-desviaciones.md).

---

## 1. La bitácora de L1 solo existía en el fallo

`SandboxOutcome` llevaba `attempts` en la rama de error y **no** en la de éxito.

Un run que intentó I/O y le fue concedido no dejaba rastro, y `deniedCount` —que
solo cuenta los **denegados**— no lo ve. Una traza de auditoría que solo existe
cuando algo va mal no es una traza de auditoría.

Descubierto porque `NodeRun` debía llevar los intentos para que la garantía de L1
cruce el módulo, y el compilador dijo que la rama de éxito no los tenía.

**Cerrado.** La rama de éxito también los lleva, y hay un test que lo comprueba
en el caso canónico de investigación: el intento de red está registrado con
`granted: true`.

## 2. El orden de las reglas escondía la causa raíz

R10 (orden topológico) estaba **al final** de la tubería, después de las reglas de
terminales. Un ciclo no tiene terminal, así que **R7d cortaba primero** con
`E_SINK_NOT_TERMINAL` y el autor leía *«este sink no es terminal»* en vez de
*«tienes un ciclo»*.

`E_CYCLE` era casi inalcanzable para el caso que le daba raison d'être.

**Cerrado:** R10 va entre las aristas y las terminales, y hay un test que lo
declara — *«un ciclo puro se reporta como E_CYCLE y no como SINK_NOT_TERMINAL»* —
con un `dibuja2` no terminal y un `assert.doesNotMatch(detail, /SINK/)`.

> Un hallazgo sobre L0, encontrado por código de L2. **El orden de las reglas no es
> cosmético: cambia lo que el autor lee.**

## 4. R5 me corrigió el diseño del caso canónico

El primer borrador del caso canónico era `DRAFT` → `RENDER`. El validador lo
rechazó con `E_NONDETERMINISTIC_INPUT`: una tool determinista no puede consumir de
una estocástica.

**L0 tenía razón y yo estaba equivocado.** Si `RENDER` dependiera de un draft que
cambia cada corrida, `RENDER` no podría ser determinista, y el artifact entero
dejaría de ser un fork reproducible — que es justo lo que un artifact
determinista promete.

Costó un caso canónico reescrito y **un módulo entero con él**, porque RENDER
también estaba en la cadena del caso de investigación. La regla hizo su trabajo
antes de que nadie la tocara.

## 4. El separador de la semilla, mal documentado

Escribí en `draft.ts` que el separador impedía que `("ab","c")` y `("a","bc")`
dieran la misma semilla, y **el código usaba un espacio**. Con un espacio sí
colisionan.

Lo encontré leyendo lo que había escrito, no lo que había compilado. Corregido a
`\0`, y ahora hay un test y un mutante que lo matan.

> El comentario iba a durar más que el bug.

---
