# Estado

> Actualizado el 2026-11-03. Generado desde `vibe-tools/estado.json`: no se edita a mano.

## Ahora

**L5 · Judge pipeline: publicar con confianza, y medir lo que cuesta.** El pipeline no existe todavia: hoy el juez se llama a mano, un documento por vez. Faltan el orquestador, la whitelist de modulos de backend y la medicion del coste por publicacion.

## Lo que ya funciona

| Loop | Que entrega | Cierre |
| --- | --- | --- |
| L0 | Cada herramienta declara que produce y si puede dar el mismo resultado dos veces. Con esa declaracion, el runtime sabe que esperar de ella antes de ejecutarla. | [L0-hallazgos.md](docs/arquitectura/loops/L0-hallazgos.md) |
| L1 | Cada herramienta vive en una caja. Solo puede hacer lo que su caja le concede, y el sistema lo comprueba antes de dejarla correr, no despues. Si una herramienta intenta salirse, la ejecucion falla aunque la herramienta hubiera funcionado. | [L1-hallazgos-gate.md](docs/arquitectura/loops/L1-hallazgos-gate.md) |
| L2 | Puedes encadenar herramientas y el orden nunca se equivoca. Si dos se necesitan entre si, el sistema te dice cuales son, en vez de fallar en silencio. Y si una herramienta usa otra, solo lo hace una vez: no hay doble cobro. | [L2-cierre.md](docs/arquitectura/loops/L2-cierre.md) |
| L3 | La memoria paso a ser tuya y de nadie mas. Las herramientas que instales en tu proyecto no pueden leerla ni reescribirla, y queda registrado quien pidio que y para que. Y los bordes ya no son de ingenieria: son de personas, seis formas distintas de entender «mi memoria», cada una con sus reglas. | [L3-cambios.md](docs/arquitectura/loops/L3-cambios.md) |
| L4 | La identidad deja de ser una cadena suelta: son tres tipos que no se cruzan, con la clave derivada del tipo y del identificador, y una puerta que los comprueba antes de dejar correr una herramienta. Y su verificacion tiene tres estados, con la evidencia que los respalda: el documento leido, el liveness, el cotejo y el screening. | [L4-cierre.md](docs/arquitectura/loops/L4-cierre.md) |

## La evidencia, medida

| Medida | Resultado |
| --- | --- |
| Tests | 426 de 426, 0 fallos |
| Mutantes | 242 de 242, 100% en 45 paquetes (umbral 80%) |
| Unidades juzgables | 165, y 0 exceden los 4096 B |
| Gates de loop | 5 loops cerrados |
| Veredicto del juez | 28 documentos con veredicto aligned vigente sobre el sha de hoy: los que L4-T5 y L4-T6 tocaron o crearon. Confianza 0.93 a 1.00 (nli_label entailment, provider judge-minimax). El registro de los loops anteriores vive en el store donde se cerraron, que esta maquina no tiene, y la CI no re-verifica ninguno de los dos. |

## Abierto

| Que falta | De quien |
| --- | --- |
| Los bindings reales de Pyodide, WebContainers y Firecracker | equipo |

## El detalle

El estado completo, con el por que de cada numero, esta en
[docs/avances.md](docs/avances.md). Los documentos tecnicos, con su razonamiento,
estan en [docs/arquitectura/loops/INDICE.md](docs/arquitectura/loops/INDICE.md).
