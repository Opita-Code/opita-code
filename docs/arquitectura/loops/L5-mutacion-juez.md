# L5 · Mutar el artefacto: lo que el juez detecta y lo que no

> [El pipeline](L5-pipeline.md) · [Las paradas](L5-needs-human.md) ·
> [El cierre](L5-cierre.md) · [El índice](INDICE.md)

## QUÉ SE MUTÓ

El documento `gate-veredictos.md` (3047 B, ámbito `documento`, una muestra) se
juzgó primero entero. Después se aplicó una mutación por corrida y se volvió a
juzgar con el mismo intent:

> el documento explica como leer un veredicto del gate: aligned es el unico
> concluyente, needs_human no es un aprobado sino la ausencia de juicio, y la
> regla es de dos juicios por unidad

| Mutación | Contradice el intent | Veredicto | Confianza |
|---|---|---|---|
| A · `needs_human` pasa a ser un aprobado | sí | `drift_detected` | 0.95 |
| B · la regla pasa de dos juicios a uno | sí | `drift_detected` | 0.98 |
| C · `aligned` deja de ser el único concluyente | sí | `aligned` | 0.98 |
| D · cambia un número que el intent no menciona | no | `aligned` | 0.99 |
| E · cambio benigno de ortografía | no | `aligned` | 0.99 |

## LO MEDIDO

**2 de 5 mutaciones cambian el veredicto.** De las tres que contradicen el
intent, **2 se detectan**. La tercera (C) se volvió a juzgar con tres muestras
y las tres dijeron `aligned` 0.99: no es varianza de una sola llamada, es que
el juez no leyó «un veredicto concluyente más» como una contradicción de
«el único concluyente».

Las dos mutaciones que no tocan el intent (D y E) no se detectan, y eso es
correcto: el juez mide lo que el intent afirma, no «todo lo que el documento
dice».

## LO QUE ESTO DICE DEL JUEZ

- **Detecta la contradicción directa.** Cuando el artefacto niega lo que el
  intent afirma, el veredicto cambia.
- **No detecta la debilitación sutil.** Quitar «el único» o introducir una
  ambigüedad no basta. El juez lee la frase como compatible.
- **No detecta lo que el intent no menciona.** Un número cambiado fuera del
  intent pasa. Eso no es un defecto del juez: es el contrato del intent.

La consecuencia práctica: **el intent es el contrato**. Un intent que no dice
lo que de verdad hay que comprobar deja fuera del veredicto todo lo que no
nombra. Y un intent que pide una comparación que el artefacto no contiene
produce neutralidad, no detección.

## LO QUE ESTA MEDICIÓN NO MIDE

- **Un documento, un intent, una corrida por mutación.** No es una medida de la
  calidad del juez en general; es lo que pasó con este documento y este intent.
- **No separa la debilidad del juez de la redacción de la mutación.** La
  mutación C se redactó como una frase ambigua; otra redacción podría cambiar
  el resultado.
- **No mide la coherencia entre partes.** Cada mutación se juzgó sobre el
  documento entero en una parte.

## EL PIPELINE, MUTADO

El código del pipeline también se muta, con el runner del repositorio. Son
**272 mutantes** y **272 mueren**: 100%, por encima del umbral de 80%.

La primera corrida dejó dos supervivientes, y los dos eran reales: una rama que
rechazaba rutas absolutas y otra que detectaba empates. Las dos eran una
segunda defensa del mismo invariante —la tabla de prefijos ya rechazaba la ruta
absoluta, y `maximo < m.length` ya detectaba el empate—, así que el mutante
sobrevivía porque el veredicto no cambiaba. Se quitó la defensa redundante y se
conservó el mensaje del empate, que es la superficie que lee el operador. Dos
defensas del mismo invariante no se miden: se tapan.
