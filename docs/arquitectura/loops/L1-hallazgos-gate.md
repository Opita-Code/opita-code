# L1 · Hallazgos del gate

> Parte 8 de 8 de L1. Hallazgos del código: [L1-hallazgos.md](L1-hallazgos.md) · Verificación: [L1-verificacion.md](L1-verificacion.md)
> Spec 536. Tarea S10.

Dos cosas, y las dos las produjo **el gate juzgando este propio loop**. Viven
aparte de los hallazgos del código, y no por estética: ver el hallazgo 2.

---

## 1. Un número cierto que no era verificable

`L1-verificacion.md` afirmaba «76 casos nuevos» y «164 en total». **Los dos
números eran ciertos.** Y el gate los marcó `drift_detected` 3/3.

El fallo no era la cifra. Era que el documento no hacía **reconciliable** la
cifra. Al contar por prefijos de nombre salían **165**, porque uno de los casos
de L0 se había renombrado a `L1-*` al cambiar su aserción, y ningún total lo
reflejaba.

El caso renombrado no se eliminó ni se relajó: **se fortaleció**. Antes probaba
que el mensaje de rechazo contuviera un texto; ahora comprueba el código de
fallo exacto y que el detalle diga qué le faltaba al host.

> **Una cifra que el lector no puede reconciliar no es un dato: es una
> decoración.**

Corregido poniendo la aritmética a la vista —88 + 76 = 164— más la nota de que un
caso se renombró y se fortaleció. Rejuzgado: `aligned` 3/3.

**Corolario:** renombrar un test mueve el conteo aunque no toque una línea de
código. Parece inocuo y no lo es. Cualquier informe que dé totales por categoría
tiene que declarar cómo se reconcilia con el total.

## 2. Un hallazgo no puede vivir en el documento que lo provoca

Patrón repetido en L0 y L1: un documento que afirma el veredicto del gate
**sobre sí mismo** alterna entre `drift`, `needs_human` y `aligned` con el mismo
contenido y casi el mismo intent. El README de L0 hizo cuatro juicios con cuatro
veredictos distintos sobre bytes idénticos.

La causa es estructural, no de redacción:

> **La afirmación se convierte en su propia evidencia.**

El juez la lee como contradicción porque no tiene contra qué verificarla, y con
eso el documento es **inejuzable por construcción**. Ninguna cantidad de
reescritura lo arregla.

**El arreglo es sacarle la afirmación** y apuntar al registro externo,
`dark_memory_judgment_history`. No es *rewriting*: es cambiar de qué es el
documento.

Lo que costó más fue dónde poner *este* hallazgo. Estaba en `L1-mutacion.md` —el
documento que el gate estaba juzgando— y siguió dando `drift_detected` 3/3 tras
dos reencuadres y una autocorrección del juez a `needs_human`.

> **Rejuzgar hasta obtener el veredicto que uno quiere es antipatrón.** Fijar el
> número de intentos —dos— y si no se resuelve, **reportar la inestabilidad como
> hallazgo**.

La inestabilidad *era* el hallazgo. Solo se hizo visible al parar.

## Lo que queda para L2

Tres propiedades del gate que ya no son hipotéticas:

1. Un intent tipo **checklist** produce neutralidad del NLI y sale `needs_human`.
   Un intent **narrativo** que explica el porqué produce entailment y sale
   `aligned`. Confirmado en cuatro archivos distintos.
2. Un intent que cita **evidencia ausente del artefacto** —un test, un commit,
   una corrida anterior— también produce neutralidad, porque el juez no tiene
   con qué verificarlo.
3. `degraded: true` con `modal_count: 0` es **fallo de infraestructura**, nunca
   drift. Ocurrió con cuatro documentos en L0 y se resolvió al reintentar.
