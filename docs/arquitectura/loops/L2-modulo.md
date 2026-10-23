# L2 · Ejecutar un módulo

> Parte 2 de 15. [Orden](L2-orden.md) · [Compartir](L2-compartir.md) · [Tools](L2-tools.md) · [Harness](L2-harness.md) · [Canónico](L2-canonico.md) · [Verificación](L2-verificacion.md) · [Aritmética](L2-aritmetica.md) · [Mutación](L2-mutacion.md) · [Presupuesto](L2-presupuesto.md) · [Hallazgo runner](L2-hallazgo-runner.md) · [Hallazgos](L2-hallazgos.md) · [Desviaciones](L2-desviaciones.md) · [Gate](L2-gate.md) · [Cierre](L2-cierre.md)
> Spec 537. Tareas L2-S2, L2-S4.

El plan de L0 era un documento. Estos cuatro archivos lo caminan.

| Archivo | Preocupación |
|---|---|
| `module/bind.ts` | llenar los puertos de entrada de un nodo |
| `module/share.ts` | qué se puede reusar y qué no |
| `module/run.ts` | el orden de los pasos |
| `module/outcome.ts` | el vocabulario de una corrida |
| `module/deliver.ts` | qué entregó, y si la magia cumplió su contrato |

## La secuencia

```
llenar -> reusar -> resolver -> correr -> coseer
```

**Llenar antes que resolver.** Un puerto sin valor es un error del autor, y no
tiene sentido descubrir después que la tool ni siquiera está registrada.

**Reusar antes que resolver.** El reuso es una decisión sobre la **corrida**, no
sobre la disponibilidad. Una tool registrada que no se ejecuta igual está
registrada.

## Para en el primer fallo

Un nodo que falló no tiene salidas, y el siguiente necesita salidas suyas.
Seguir sería correr el resto del grafo contra entradas ausentes, y el error que
llegaría al autor sería sobre el nodo equivocado.

No se degrada en silencio ni *«continúa para ver qué más pasa»*. El run dice
**qué** nodo falló, con **qué** código.

## Las entradas son obligatorias

El descriptor no distingue puerto opcional de puerto obligatorio, y agregar esa
bandera sería cambiar el contrato para tapar una decisión del runner. Se decidió
lo contrario: **todo puerto de entrada es obligatorio**.

Un puerto sin arista de entrada es un **punto de entrada del módulo**, y quien
corre el módulo tiene que decir qué valor entra.

> Un `undefined` silencioso sería la forma más cómoda de que una tool reciba
> `undefined` sin que nadie lo haya decidido.

## El fallo de una tool se propaga con su nombre

`run.ts` guarda el código exacto del sandbox (`E_HOST_UNSUPPORTED`,
`E_TOOL_ERROR`, `E_EFFECT_DENIED`) y además el detalle que escribió la tool. El
runner no reescribe el motivo: el detalle de una tool que dice *«unimplemented:
sin backend para net»* es más informativo que cualquier frase que el runner
pudiera inventar encima.

## La magia contra su contrato

`unemittedPorts` compara **los dos lados por primera vez**. El validador de L0
solo lee el descriptor; nadie había mirado lo que la magia devuelve.

Una tool que declara `svg` y no lo emite dejaría al downstream sin entrada, y el
módulo entregaría un artifact incompleto con veredicto `ok`. Ahora es
`E_PORT_NOT_EMITTED`, y el detalle nombra el puerto que falta.

> Por eso `deliver.ts` no convierte un puerto ausente en `undefined`: eso lo haría
> indistinguible de *«la tool emitió undefined»*. La ausencia se decide antes, con
> un código de fallo.

## La bitácora de L1 cruza el módulo

`NodeRun` lleva `attempts`, la bitácora de intentos de I/O del sandbox. Sin ella
el límite del módulo perdería la garantía de L1: un módulo entero podría haber
intentado salir por la red y el run no tendría dónde decirlo.

`deniedCount` sigue siendo la métrica de exfiltración, ahora después de cruzar el
módulo. En el caso canónico de investigación da **0**: hubo un cable que falta,
no un intento de salida.
