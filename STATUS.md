# Estado

> Actualizado el 2026-10-28. Generado desde `vibe-tools/estado.json`: no se edita a mano.

## Ahora

**L4 · Identidad: las tres identidades y la puerta que las comprueba.** En curso: L4-T6 (export .opitapack).

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
| Tests | 398 de 398, 0 fallos |
| Mutantes | 223 de 223, 100% en 42 paquetes (umbral 80%) |
| Unidades juzgables | 152, y 0 exceden los 4096 B |
| Gates de loop | 4 loops cerrados |
| Veredicto del juez | 64 de 64 partes de 51 documentos estan en aligned con el sha de hoy; y los 17 que L4-T5 toco o creo se volvieron a juzgar en el store de esta maquina (confidence 0.93 a 1.00, nli_label entailment, provider chat-minimax). El registro vive en el store del juez, fuera de este repositorio, y la CI no lo re-verifica. |

## Abierto

| Que falta | De quien |
| --- | --- |
| Los bindings reales de Pyodide, WebContainers y Firecracker | equipo |

## El detalle

El estado completo, con el por que de cada numero, esta en
[docs/avances.md](docs/avances.md). Los documentos tecnicos, con su razonamiento,
estan en [docs/arquitectura/loops/INDICE.md](docs/arquitectura/loops/INDICE.md).
