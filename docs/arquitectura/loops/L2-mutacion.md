# L2 · Mutación

> Parte 9 de 15. [Orden](L2-orden.md) · [Módulo](L2-modulo.md) · [Compartir](L2-compartir.md) · [Tools](L2-tools.md) · [Harness](L2-harness.md) · [Canónico](L2-canonico.md) · [Verificación](L2-verificacion.md) · [Aritmética](L2-aritmetica.md) · [Presupuesto](L2-presupuesto.md) · [Hallazgo runner](L2-hallazgo-runner.md) · [Hallazgos](L2-hallazgos.md) · [Desviaciones](L2-desviaciones.md) · [Gate](L2-gate.md) · [Cierre](L2-cierre.md)
> Spec 537. Tarea L2-S11.

El tercer método. Los otros dos —unitarios y properties— están en
[verificación](L2-verificacion.md); el guard de presupuesto, que es otra
preocupación, en [presupuesto](L2-presupuesto.md).

---

## 142/142 = 100%

28 paquetes. **37 mutantes nuevos, todos muertos a la primera**, 0 sobrevivientes,
0 no-aplicables.

Un test suite que pasa no demuestra nada sobre si los tests detectan errores. Un
mutante que sobrevive es un hueco en la verificación, y un patrón que no aparece
en el compilado **cuenta como hueco también**: durante L0 y L1, ocho no
aparecieron y los ocho revelaron huecos reales.

| Paquete | Mutantes | Qué mata |
|---|---|---|
| `module/run.js` | 7 | parar en el primer fallo, no entregar tras fallar, cruzar contrato/magia |
| `module/share.js` | 7 | que una receta cachee, que `none` sea comparable, la colisión de la clave |
| `rules/order.js` | 6 | borrar la detección de ciclos, desempate alfabético, predecesores contados por arista |
| `tools/render.js` | 5 | **el `&` escapado al final**, `<` y `>` crudos, la comilla sin escapar |
| `module/harness.js` | 4 | sortear entre dos entregas del mismo modo |
| `tools/draft.js` | 3 | quitar el separador NUL, sacar el tema de la semilla |
| `module/bind.js` | 3 | aceptar un puerto sin valor, invertir el feeder |
| `module/deliver.js` | 2 | que toda tool cumpla su contrato, entregar desde un nodo que falló |

## El mutante del escapado

Invertir el orden de dos `replace` **parece inocuo**. El código sigue
devolviendo una cadena, la herramienta sigue devolviendo `ok: true`, y el
artifact sigue siendo un SVG. Lo único que cambia es que un texto legítimo con
un `<` se convierte en `&amp;lt;` y aparece ampersand doble donde no debe.

Es el mutante que más gusta porque es invisible en una revisión de código y
obvio en una de bytes. Lo matan los dos métodos: el test de ejemplo
—`escapeXml('<')` devuelve `&lt;` y no `&amp;lt;`— y la property de 600 textos.

**Ninguno de los dos alcanza solo.** El unitario dice *qué* se rompió; la
property dice que no se escape. Un escapado con un hueco no falla la mitad de las
veces: pasa el 90% de las entradas y rompe justo el que importa.

## Los otros que importan

**`rules/order.js`, predecesores contados por arista.** El mutante hace que un
nodo con tres puertos del mismo upstream tenga grado de entrada 3 y nunca llegue
a estar listo. El módulo es **válido** y se rechaza con `E_CYCLE`. Sin ese
mutante, la suite seguiría verde con el bug puesto.

**`module/run.js`, entregar tras fallar.** Sustituye el ternario que vacía
`deliveries` por un llenado directo. El módulo entrega un artifact a medias con
veredicto `ok:false`, y un consumidor no puede distinguir «no hay artifact» de
«el artifact es este». Es el modo de falla más caro que tiene el runner.

**`tools/draft.js`, quitar el separador NUL.** `("ab","c")` y `("a","bc")` dan
la misma semilla, y dos entradas distintas producen el mismo borrador. Nadie lo
notaría mirando la salida: la salida sigue siendo un texto coherente.

**`module/share.js`, la clave sin el input.** Deja la clave dependiendo solo de
identificador y versión solamente. Dos entradas distintas sirven el mismo valor
cacheado, y el nodo entrega el resultado de otra entrada sin que nada lo note.

## Por qué mutan el compilado y no el fuente

Porque mutar sin recompilar mantiene el ciclo en segundos en lugar de minutos.
Con 142 mutantes y 28 paquetes, la diferencia es la diferencia entre correr la
verificación mientras se escribe un comentario o esperar a que termine el
build.