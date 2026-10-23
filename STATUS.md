# Estado

> Actualizado el 2026-10-23. Generado desde `vibe-tools/estado.json`: no se edita a mano.

## Ahora

**L4 · Identidad: un stub, y despues tres identidades.** Es el siguiente loop del plan. Arranca cuando esten resueltas las tres decisiones abiertas de L3.

## Lo que ya funciona

| Loop | Que entrega | Cierre |
| --- | --- | --- |
| L0 | Cada herramienta declara que produce y si puede dar el mismo resultado dos veces. Con esa declaracion, el runtime sabe que esperar de ella antes de ejecutarla. | [L0-hallazgos.md](docs/arquitectura/loops/L0-hallazgos.md) |
| L1 | Cada herramienta vive en una caja. Solo puede hacer lo que su caja le concede, y el sistema lo comprueba antes de dejarla correr, no despues. Si una herramienta intenta salirse, la ejecucion falla aunque la herramienta hubiera funcionado. | [L1-hallazgos-gate.md](docs/arquitectura/loops/L1-hallazgos-gate.md) |
| L2 | Puedes encadenar herramientas y el orden nunca se equivoca. Si dos se necesitan entre si, el sistema te dice cuales son, en vez de fallar en silencio. Y si una herramienta usa otra, solo lo hace una vez: no hay doble cobro. | [L2-cierre.md](docs/arquitectura/loops/L2-cierre.md) |
| L3 | La memoria paso a ser tuya y de nadie mas. Las herramientas que instales en tu proyecto no pueden leerla ni reescribirla, y queda registrado quien pidio que y para que. Y los bordes ya no son de ingenieria: son de personas, seis formas distintas de entender «mi memoria», cada una con sus reglas. | [L3-cambios.md](docs/arquitectura/loops/L3-cambios.md) |

## La evidencia, medida

| Medida | Resultado |
| --- | --- |
| Tests | 263 de 263, 0 fallos |
| Mutantes | 123 de 142, 86.6% en 28 paquetes (umbral 80%) |
| Unidades juzgables | 102, y 0 exceden los 4096 B |
| Gates de loop | 4 loops cerrados |
| Veredicto del juez | 10 de 10 documentos de L3 en aligned, confidence 1.0000, nli_label entailment, provider chat-minimax, model MiniMax-M3, sin degraded. |

## Abierto

| Que falta | De quien |
| --- | --- |
| La vision: por que existe Opita Code, que problema ve, a quien le duele | operador |
| El canal de distribucion: GitHub es el argumento, no es el canal de la audiencia | operador |
| La licencia del repo | operador |
| Si el documento legal de cumplimiento va publico | operador |
| El eje del corte de L3: por creencia, y no por edad, rol o cohorte | operador |
| Cual se degrada si hay que elegir: el anonimato o el antifraude | operador |
| El sexto consentimiento, en contexto de organizacion, y el techo de falsos positivos | operador |
| Los bindings reales de Pyodide, WebContainers y Firecracker | equipo |

## El detalle

El estado completo, con el por que de cada numero, esta en
[docs/avances.md](docs/avances.md). Los documentos tecnicos, con su razonamiento,
estan en [docs/arquitectura/loops/INDICE.md](docs/arquitectura/loops/INDICE.md).
