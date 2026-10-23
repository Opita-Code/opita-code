# L1 · Capacidades y detección de tier

> Parte 1 de 5 de L1. Puerto: [L1-puerto.md](L1-puerto.md) · Estática: [L1-estatica.md](L1-estatica.md) · Runner: [L1-runner.md](L1-runner.md) · Verificación: [L1-verificacion.md](L1-verificacion.md)
> Spec 536. Tareas S1 y S4.

## POR QUÉ EFECTO Y CAPACIDAD SON DOS COSAS

L0 declaró que T0 no puede hacer I/O. Eso era una **declaración**, no una
garantía: nada la vivía. L1 la convierte en mecanismo, y para eso hay que
nombrar por separado dos cosas que se confundían:

| | Qué es | Quién lo decide |
|---|---|---|
| **Efecto** | lo que la tool **declara** en su descriptor | el autor de la tool |
| **Capacidad** | lo que el sandbox **concede** en la ejecución | el host |

Un efecto se **deriva** a capacidades; el sandbox concede capacidades. Se comprueba
en runtime que lo exigido esté dentro de lo concedido. Los dos niveles existen
porque se pueden desalinear: una tool que declara `read` en un host que no
concede `fs` es un rechazo tipado, no un crash ni un permiso silencioso.

## LAS TABLAS

**Qué exige cada efecto** — total, exhaustiva, **no configurable**:

| Efecto | Exige |
|---|---|
| `none` | nada |
| `read` | `fs` |
| `write` | `fs`, `net` |
| `process` | `fs`, `net`, `process` |

**Qué concede cada tier**:

| Tier | Concede | Por qué |
|---|---|---|
| **T0** | **nada** | No "pocas": ninguna. Es la definición del tier. |
| **T1** | `net`, `fs` | Nunca `process`: un proceso real exige un kernel que el shim del navegador no tiene. |
| **T2** | `net`, `fs`, `process` | Una microVM sí tiene kernel. |

**No configurables**, por la misma razón que `SHARING` en L0: si el mapeo fuera
ajustable, el sandbox sería tan fuerte como el ajuste. El código decide qué
implica `write`, no el autor del descriptor.

Las capacidades nombrables son exactamente tres: `net`, `fs`, `process`.
Monotónicas: el efecto más fuerte exige todo lo que exigen los más débiles.

## QUE PUEDE OFRECER UN HOST

| Tier | Exige del host |
|---|---|
| T0 | `wasm` |
| T1 | `wasm`, `shim`, `memfs` |
| T2 | `microvm` |

**T2 no exige WASM ni shim.** Una microVM corre su propio kernel y su propio
runtime; alinearla con la arquitectura del navegador sería un error de diseño.

**No se "elige el mejor tier"**: el tier lo declara la tool. Una tool T0 tiene
que correr en T0 aunque el host pueda con T2, por dos razones. La primera es que
T2 tiene kernel y T0 no, así que correr en T2 fingiría garantías que no existen.
La segunda es que el tier va en la huella del artefacto: si corriera en el host
más potente, la reproducibilidad dependería de la máquina de quien lo comparta.

## LA REGLA GRUESA Y LA FINA NO PUEDEN DISCREPAR

`axes.tierAllows` (L0, contractual) y `effectAllowed` (L1, granular) son dos
capas. Una property los iguala en los 12 pares (tier, efecto). Si divergieran, la
divergencia sería el bug, no una de las dos reglas.

## Hosts de referencia

`client` (solo WASM), `clientFull` (WASM + shim + memfs), `backend` (microVM),
`none`. Los dos últimos existen para poder **ejercitar la política completa sin
tener Pyodide, WebContainers ni Firecracker**. Si el modelo no se puede probar
con un host falso, no se puede probar en absoluto.
