# L1 · El puerto de efectos

> Parte 2 de 5 de L1. Capacidades: [L1-capacidades.md](L1-capacidades.md) · Estática: [L1-estatica.md](L1-estatica.md) · Runner: [L1-runner.md](L1-runner.md) · Verificación: [L1-verificacion.md](L1-verificacion.md)
> Spec 536. Tarea S2.

## LA GARANTÍA DINÁMICA

Una tool nunca toca `fetch`, ni `fs`, ni `process`. Recibe un puerto, y ese es
todo lo que ve. La garantía no es una promesa del runtime: es un hecho sobre la
forma del objeto.

> **El puerto denegado no contiene ninguna referencia al host.**

No hay socket, no hay file handle, no hay process object que extraer.

## POR QUÉ NO ES SOLO "PERMISSION DENIED"

Denegar una llamada y nada más **no alcanza**, y el caso que lo demuestra es
precisamente el hostil: una tool que **ignora el valor de retorno**.

Si el denied fuera un permiso revocado sobre un objeto que igual existe,
`fx.net(url)` seguido de ignorar el resultado bastaría para exfiltrar. El
sistema devolvió un error; la tool no leyó el error.

Aquí no hay objeto. El puerto denegado es la **ausencia de poder**, no un poder
con un candado. Ignorar el retorno no abre nada porque no había nada que abrir.

## LAS TRES COSAS ORTogonALES

`ToolImpl` recibe tres parámetros que no se pueden confundir:

```ts
(input, ctx, effects) => ToolOutcome
```

| | Qué es |
|---|---|
| `input` | los datos |
| `ctx` | quién ejecuta |
| `effects` | lo que puede hacer |

Que los efectos sean un **parámetro** y no un campo del contexto es lo que
impide que una tool confunda "saber que existe la red" con "poder usarla".

## `denied` ≠ `unimplemented`

| `why` | Qué significa | ¿Quién falla? |
|---|---|---|
| `denied` | el sandbox no concede esa capacidad | el sandbox, funcionando |
| `unimplemented` | el sandbox la concede, pero el MVP no tiene backend | el MVP, sin transporte |

Confundirlos haría creer que el sandbox funciona cuando en realidad **nadie lo
probó**. En el MVP, T1 y T2 tienen política pero no transporte: decir la verdad
aquí es parte de la garantía.

Corolario: el backend **jamás** se invoca si la capacidad no está concedida. El
deniego ocurre antes de tocarlo, y hay un test que lo comprueba con un flag.

## AUDITORÍA

Todo intento queda registrado, concedido o denegado, en orden. Sin esto no se
puede afirmar que no hubo exfiltración: solo que no la hubo vista.

Dos detalles que parecen menores y no lo son:

1. `attempts` entrega una **copia del array**. Sin copiarlo, la tool tendría
   acceso al array interno y podría truncarlo.
2. Cada **entrada va congelada**. Copiar el array no protege los objetos: sin
   `Object.freeze`, mutar `attempts[0].granted` reescribe el registro interno.

El segundo lo encontró un test durante L1, y era un bug real: un rastro de
auditoría que se puede editar no es un rastro de auditoría.

## `sealedPort()`

Puerto mudo para tools de efecto `none`. No es una conveniencia: es el caso por
defecto de T0 y el único que el MVP ejecuta. Que exista un puerto "mudo"
explícito evita que el código tenga que fabricar un backend para no hacer nada.