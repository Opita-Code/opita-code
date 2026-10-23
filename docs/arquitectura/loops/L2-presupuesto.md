# L2 · Presupuesto del gate

> Parte 10 de 15. [Orden](L2-orden.md) · [Módulo](L2-modulo.md) · [Compartir](L2-compartir.md) · [Tools](L2-tools.md) · [Harness](L2-harness.md) · [Canónico](L2-canonico.md) · [Verificación](L2-verificacion.md) · [Aritmética](L2-aritmetica.md) · [Mutación](L2-mutacion.md) · [Hallazgo runner](L2-hallazgo-runner.md) · [Hallazgos](L2-hallazgos.md) · [Desviaciones](L2-desviaciones.md) · [Gate](L2-gate.md) · [Cierre](L2-cierre.md)
> Spec 537. Tarea L2-S11.

El guard: ningún artefacto juzgable supera **4096 B**, y el enforcement está en
`tools/gate-budget.mjs`, que falla el build. Sin manifiesto: el gate mira los
archivos, no una lista que alguien pueda olvidar actualizar.

65 unidades juzgables, 0 exceden.

---

## Seis artefactos se partieron, ninguno por recorte

| Se partió en | Porque |
|---|---|
| `module/run.ts` → `bind` · `share` · `outcome` · `deliver` · `harness` | llenar · qué se reusa · vocabulario · qué entregó · modo X |
| `README.md` → `README` + `INDICE.md` | punto de entrada y catálogo son dos cosas |
| `L2-tools-harness.md` → `L2-tools` + `L2-harness` | las tools y el harness no comparten preocupación |
| `L2-hallazgos.md` → `L2-hallazgos` + `L2-desviaciones` | lo que se rompió y lo que se decidió distinto |
| `L2-mutacion.md` → `L2-mutacion` + `L2-presupuesto` | el método y la propiedad del registro |
| `sandbox/runner.ts` → `runner` + `outcome` | la caminata y el veredicto |

`rules/order.ts`, los cuatro archivos de tools y los tres canónicos son
**archivos nuevos**, no particiones: `order.ts` es una regla nueva con su código
de rechazo, y la cuarta tool y el tercer caso canónico no reemplazan nada.

## Las dos formas de cruzar el tope, y por qué una es mala

**Partir por concepto.** El archivo sigue diciendo todo lo que decía,
repartido donde cada mitad se puede leer y juzgar sola. Cada unidad gana.

**Amputar el texto.** Es la que casi se cuela aquí, y es la que este loop
casi cometió dos veces: recortar un documento entero para que el número pase, y
después reponerlo en versión corta. El presupuesto es un guard, y a veces se
empieza a editar para satisfacer al guard en vez de para el lector.

La diferencia no es de bytes. Un documento al que se le quita una tabla para que
entre no es **más** juzgable: es menos legible, y el juez va a leer un
documento al que le faltan cosas sin saber que le faltan.

El guard no mide dificultad. Mide que el artefacto quepa en un fragmento para
que el juez lo lea entero. Esa es toda su función, y por eso no autoriza a
cortar: autoriza a **repartir**.

## Lo que este loop costó

**Seis particiones**, no cinco: se añadió `sandbox/outcome.ts` al cerrar el
hallazgo de L1.

La sexta es la única que el guard **forzó** y que yo no habría hecho: `runner.ts`
llevaba una prolijidad de comentarios que parece justificada en el sitio y no lo
está en ninguna parte. Nadie lo habría partido por legibilidad.

Y aquí está el límite honesto del guard: **no distingue una partición buena de
una mala.** Yo argumenté que partir `module/run.ts` en cinco era bueno porque
cada mitad tiene una preocupación sola. El guard no opinaba —vio bytes. Pude
haber cortado por la frontera equivocada y me habría aprobado igual.

Sobre el tope mismo, la respuesta corta a por qué 4096: **no es mío.** Es
`ConsensusChunkSize` del juez Go, y su adopción fue decisión del operador
(opción A). No es una regla de tamaño de archivo, es una regla de fidelidad: con
ese tope el artefacto es **un chunk** y el `SpecIntent` aplica al artefacto
completo; con dos, el mismo intent escrito sobre el todo se aplica a fragmentos y
el juez reporta una contradicción que es artefacto del troceado. Subirlo no
relaja el presupuesto: cambia el artefacto que el juez ve.
