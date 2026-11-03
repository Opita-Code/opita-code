# L4-T6 · El paquete `.opitapack`

> Qué es un paquete y qué lleva. [El índice](INDICE.md) ·
> [La instalación](L4-T6-instalar.md)

## QUÉ ES

Un paquete es **dato**: JSON puro, sin funciones, sin referencias, sin estado.
Es lo que lo hace publicable, versionable, hasheable y portable entre runtimes
sin reescribir nada, que es el mismo motivo por el que los descriptores de L0
son datos.

El nombre lo decidió el operador el 2026-10-26: «es mejor para nosotros los
humanos». El nombre de un formato lo lee una persona antes que un parser.

## LOS CUATRO CAMPOS

| Campo | Qué es |
|---|---|
| `formato` | Siempre `opitapack` |
| `formato_version` | La versión de las reglas del formato |
| `modulo` | El bundle: el grafo, sus nodos, y en cada nodo el descriptor de la tool |
| `huella` | El sha256 del módulo canónico |

**Por qué el paquete no lleva su propio nombre, versión ni autor.** El módulo
ya los tiene. Duplicarlos sería una segunda fuente de verdad para el mismo
dato: el paquete y el módulo podrían discrepar, y no habría quien lo notara.
El paquete identifica su módulo, no al revés.

**Por qué la versión del formato va dentro.** Un formato cambia sus reglas, y
el que lo lee necesita saber qué reglas se le aplican. La versión es un dato,
y va en el dato.

## LA HUELLA: QUÉ VERIFICA Y QUÉ NO

Detecta que **el contenido cambió por el camino**. Eso es lo que hace que un
paquete sea un artefacto y no un fichero cualquiera.

**No** verifica que el módulo sea el que su autor quiso: eso necesitaría una
firma, y aquí no hay ninguna. El autor viaja en el módulo, y el código se
resuelve por (id, version), como ya hace el registry desde L0.

## LO QUE EL PAQUETE NO LLEVA

- **La memoria del titular.** La exporta el companion (dark-memory), que es
  quien la tiene. Aquí no hay memoria, y un campo para ella sería una promesa
  que nadie puede cumplir.
- **El código de las tools.** La magia se resuelve por (id, version). El
  paquete lleva la promesa, no el cumplimiento.

## LO QUE NO ENTREGA

- **No resuelve magias.** Eso es del registry.
- **No escribe en ningún sitio.** Exportar y leer son operaciones puras: el
  harness es quien sabe dónde vive cada cosa.
- **No valida al exportar.** Exportar dice «esto es lo que hay»; la
  validación dice «esto está bien». Un módulo inválido se puede exportar, y
  por eso se puede mandar a alguien para que lo mire; no se puede instalar.
