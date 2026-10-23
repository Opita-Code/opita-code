# Cómo leer un veredicto del gate

> Documento transversal. No pertenece a un loop: es lo que los tres han
> aprendido sobre el juez, y estaba re-derivándose cada vez.

---

## Los cuatro veredictos no significan lo que parece

| Veredicto | Qué significa | Qué hacer |
|---|---|---|
| `aligned`, `frac 1.0`, `stddev 0`, `degraded false` | el estándar, y el **único** concluyente | cerrar |
| `drift` consistente | hay un número o una afirmación real que no cuadra | **arreglar, no discutir** |
| `needs_human` | el juez **no pudo afirmar nada** | revisar el intent antes que el artefacto |
| `drift` ↔ `needs_human` alternando | el juez no está mirando lo que yo creo | parar y reportarlo |

Los dos últimos se confunden todo el tiempo y **no son lo mismo**:
`needs_human` no significa «está bien», significa que el juez no emitió juicio.

Y hay una diferencia que no es del gate sino de la infraestructura:
**`degraded: true` con `modal_count < n` es fallo de la máquina, nunca drift.**
Hay que reintentar, no actuar.

## Las dos causas de `needs_human`, confirmadas en tres loops

1. **El intent cita evidencia que no está en el artefacto.** Un test, un mutante,
   un commit, una historia. El juez no puede verificarla, entonces no afirma
   nada: la neutro.
2. **El intent es una lista en vez de un porqué.** Enumerar *qué* hace un archivo
   lo vuelve neutro; narrar **por qué** cada cosa está donde está, no.

La segunda es la más cara de pillar, porque el intent enumerado *parece*
completo. Se corrigió en `graph.ts` y `sandbox/runner.ts` en L2 sin tocar una
sola línea del artefacto.

## La regla de dos intentos

**Dos juicios por unidad.** Superada, se para y se reporta.

No es prudencia decorativa: un gate que se negocia hasta dar `aligned` deja de
ser un gate, y quien lea el historial después no puede distinguir un `aligned`
ganado de un `aligned` encontrado. La diferencia entre las dos cosas es
justamente el valor del gate.

## Lo que este gate todavía no explica

En L0 y L1 la inestabilidad apareció en documentos **autorreferenciales**: el
README de L0 afirmaba su propio veredicto, que es inejuzgable por construcción.

**L2 desmintió esa explicación como causa suficiente.** `canonical/completo.ts`
—un módulo— e `INDICE.md` —una tabla de enlaces— no afirman nada sobre su
veredicto y alternaron igual, con el contenido verificado mecánicamente.

La autorreferencia agrava el problema, pero no lo causa. Hay algo más en el juez
que no sabemos nombrar, y la afirmación honesta sobre eso es: **desconocemos la
causa, y el síntoma es más ancho de lo que creíamos.** Apuntarlo vale más que
una explicación inventada.

## Lo que el juez sí es bueno detecting

Todo lo que el gate encontró como `drift` en L0, L1 y L2 fue un **número sin
medir**. Cero falsos positivos semánticos en tres loops.

Esa asimetría es la información útil: el juez es un detector de afirmaciones
numéricas verificables. Cuando hay que desconfiar de algo es de la semántica, no
de las cifras.
