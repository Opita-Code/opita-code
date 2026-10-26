# Estado

> Actualizado el 2026-10-26. Generado desde `vibe-tools/estado.json`: no se edita a mano.

## Ahora

**L4 · Identidad: las tres identidades y la puerta que las comprueba.** En curso: L4-T4 (RLS sobre project_id), L4-T5 (los permisos) y L4-T6 (exportar el .opitpack).

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
| Tests | 316 de 316, 0 fallos |
| Mutantes | 176 de 176, 100% en 33 paquetes (umbral 80%) |
| Unidades juzgables | 126, y 0 exceden los 4096 B |
| Gates de loop | 4 loops cerrados |
| Veredicto del juez | 28 de 28 partes en aligned: 10 de L3, 14 de L4-T3 y 4 de L4-T2. Confidence 1.0000, nli_label entailment, provider chat-minimax. |

## Abierto

| Que falta | De quien |
| --- | --- |
| Si el documento legal de cumplimiento va publico | operador |
| Los bindings reales de Pyodide, WebContainers y Firecracker | equipo |
| Que se puede publicar de una identidad legal sin registro oficial | operador |

## El detalle

El estado completo, con el por que de cada numero, esta en
[docs/avances.md](docs/avances.md). Los documentos tecnicos, con su razonamiento,
estan en [docs/arquitectura/loops/INDICE.md](docs/arquitectura/loops/INDICE.md).
