# L5 · El pipeline del juez: de la promesa a la decisión

> [Los ámbitos](L5-ambitos.md) · [Las paradas](L5-needs-human.md) ·
> [El coste](L5-coste.md) · [La mutación del juez](L5-mutacion-juez.md) ·
> [El cierre](L5-cierre.md) · [El índice](INDICE.md)

## QUÉ ES

Un pipeline es la pieza que convierte un artefacto en una decisión: publicar,
corregir o parar. No es el juez. Es lo que decide **qué** preguntarle, **cuántas
veces** preguntárselo y **qué hacer** con la respuesta.

Antes de L5 el juez se llamaba a mano, un documento por vez. Eso mide una
respuesta, no una publicación: no dice si el artefacto cabe en el tope, ni si
la muestra es de este contenido, ni qué se hace cuando el proveedor no
responde.

## LAS SEIS FASES

| Fase | Quién | Qué decide |
|---|---|---|
| 1. Revisar | `encargo.ts` | ámbito, tipo de evaluación y afirmación, sin gastar una llamada |
| 2. Planificar | `pipeline.ts` | partes, muestras por parte y bytes enviados |
| 3. Medir | `juez-correr.mjs` | una llamada por muestra, con `artifact_ref` |
| 4. Comprobar | `pipeline.ts` | que la medida sea de **este** plan: parte, sha, bytes y muestras |
| 5. Agregar | `medida.ts` | alineado, deriva o parada, según la regla del judge por partes |
| 6. Decidir | `pipeline.ts` | publicar, corregir o parar, y la acción para el operador |

La fase 3 es la única que habla con el servidor. Las otras cinco son código
determinista: se miden sin proveedor.

## EL PLAN ES EL CONTRATO

El número de muestras lo decide el plan, no el transporte. El ámbito pone la
base y el riesgo la sube: `codigo` y `sql` piden tres muestras; `documento`,
`avance`, `canal` y `superficie`, una; `riesgo: alto` sube cualquiera a tres.

Si lo eligiera el transporte, quien llama podría bajar el coste bajando las
muestras sin que el plan lo viera. El plan publica `llamadas = partes ×
consenso` y `bytes = bytes de las partes × consenso`, y el transporte ejecuta
exactamente eso. Y lleva **una afirmación por parte**: la misma para todas
convierte el veredicto de un fragmento en ruido.

## LA CORRESPONDENCIA ES UN `throw`

Una medida que no corresponde al plan no es un juicio sobre el artefacto: es un
fallo de quien llamó. Publicar el veredicto de otro sha es el error que el
pipeline existe para evitar, y devolverlo como «parada» lo dejaría en el mismo
saco que un `needs_human` legítimo.

Por eso `comprobarCorrespondencia` lanza `MedidaIncoherenteError` cuando
cambian las partes, el sha, los bytes o el número de muestras. No hay un estado
intermedio que se pueda citar como bueno.

## EL TRANSPORTE: `artifact_ref`, NO `content`

Medido el 2026-11-03. `drift_judge` con `content` no usa el mismo camino:
devuelve el razonamiento crudo del modelo dentro de `verdict_json`, con otro
esquema (`persona_id`, `harness_id`), una confianza distinta y **ningún** campo
`verdict` en el sobre. Un cliente que lea `data.verdict` recibe `undefined`.

Con `artifact_ref` la respuesta es la del juez: veredicto, confianza,
proveedor, sha del artefacto y latencia. Por eso cada parte se escribe en un
fichero temporal y se pasa por referencia.

El transporte también comprueba que las partes releídas dan el original byte a
byte. Sin eso, el veredicto es de algo que no es el artefacto.

## LO MEDIDO

| Artefacto | Ámbito | Muestras | Resultado | Latencia |
|---|---|---|---|---|
| `gate-veredictos.md` (3047 B) | documento | 1 | `aligned` 0.99 | 2943 ms |
| `whitelist.ts` (3132 B) | código | 3 | 3 × `aligned` 0.99, `stddev` 0 | 7346 ms (máximo) |

La latencia publicada es el **máximo** de las muestras, no la suma: el
servidor repite a veces el mismo valor, y sumarlas contaría dos veces una sola
medida.

## LO QUE NO HACE

- **No parte el artefacto.** Eso es `tools/juez-partes.mjs`, la única
  implementación de la partida por concepto.
- **No llama al juez.** Eso es `tools/juez-correr.mjs`, el único que habla con
  el servidor.
- **No concede permisos.** Eso es la puerta de L4-T5.
