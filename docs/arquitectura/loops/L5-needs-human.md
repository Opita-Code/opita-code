# L5 · Las paradas: cuando el juez no decide

> [El pipeline](L5-pipeline.md) · [Los ámbitos](L5-ambitos.md) ·
> [El coste](L5-coste.md) · [El índice](INDICE.md)

## TRES VEREDICTOS, Y UNA COSA QUE NO ES UN VEREDICTO

| Palabra | Qué significa | Qué hacer |
|---|---|---|
| `aligned` | el artefacto afirma lo que el intent decía | publicar |
| `drift_detected` | hay algo que no cuadra | corregir el artefacto, máximo dos intentos |
| `needs_human` | el juez **no pudo decidir** | depende de la causa |
| disenso | las muestras no coinciden entre sí | parar y reportar |

`needs_human` no es «está bien» ni «está mal»: es una medida que no se tomó.
Confundirlo con un aprobado publica sin veredicto; confundirlo con una deriva
reescribe un artefacto que estaba bien.

## LAS DOS CAUSAS DE `needs_human`

| Causa | Cómo se reconoce | Qué se toca |
|---|---|---|
| infraestructura | muestra degradada, sin proveedor, respuesta malformada o timeout | nada: se reintenta cuando el proveedor responda |
| semántico | el juez respondió, con su proveedor y su confianza, y no pudo sostener la afirmación | el intent, antes que el artefacto |

Medido en esta máquina: una cuota agotada devuelve `needs_human` con confianza
0 y **sin** proveedor. Un juicio semántico devuelve `needs_human` con proveedor
y confianza. El patrón es el que separa las dos causas, y por eso la
clasificación es código y no prosa.

**El proveedor sale solo de `verdict_json.provider_id`.** El sobre trae un
campo `provider` que nombra el proveedor del camino por contenido, no el juez
que emitió el veredicto. Tomarlo como prueba convertiría una cuota caída en una
parada semántica.

## EL ORDEN DE LAS COMPROBACIONES ES LA REGLA

1. **Sin muestras:** no hay medida. Parada.
2. **Cualquier muestra degradada o sin proveedor:** parada por infraestructura,
   **antes** de mirar el veredicto. Un `drift_detected` de una muestra
   degradada no es una deriva: es una muestra que no vale.
3. **Si las muestras no coinciden:** disenso. No se elige la mayoría, porque la
   minoría es justamente lo que hay que mirar.
4. **Con todas de acuerdo:** `aligned`, deriva o `needs_human` semántico.

## EL AGREGADO ES TAN FUERTE COMO SU PARTE MÁS DÉBIL

El agregado de un artefacto partido publica «N de N partes», con nombre, y
nunca «el documento está bien».

- Una **deriva** manda: si una parte no se sostiene, el artefacto no pasa.
- Una **parada** deja el agregado incompleto. Un agregado incompleto no es un
  aprobado.
- Solo es `aligned` si **todas** las partes lo están. Y publica la confianza
  **mínima** y el `stddev` **máximo**, no la media: una media alta esconde la
  parte que casi no pasa.

## LA ACCIÓN, NO EL CÓDIGO

La superficie de L5-T4 no es un código de error: es la instrucción. Para una
parada por infraestructura, «no es drift: reintentar sin tocar el artefacto».
Para una semántica, «revisar el intent antes que el artefacto». Para un
disenso, «parar y reportar: el juez no está mirando lo que uno cree».

## LA REGLA QUE ORDENA LA REVISIÓN

Ante una deriva, primero la pregunta es si está mal el artefacto. Después, si
está mal la pregunta. Un intent que enumera, que cita evidencia ausente o que
pide una comparación que el artefacto no contiene produce neutralidad o deriva
sin que el artefacto tenga un defecto.

## LO QUE ESTA CLASIFICACIÓN NO VE

- **No distingue una debilidad del juez de la varianza de una sola llamada.**
  Con una muestra no hay dispersión que medir; por eso el código pide tres.
- **No certifica la coherencia entre partes.** Eso no lo ve el juez.
- **No convierte un disenso en una decisión.** Lo para, y decide el operador.
