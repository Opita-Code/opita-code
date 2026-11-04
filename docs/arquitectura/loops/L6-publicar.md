# L6 · Publicar un módulo: el flujo que no tiene atajos

> [La licencia](L6-licencia.md) · [El pin](L6-pin.md) ·
> [El catálogo](L6-catalogo.md) · [La usabilidad](L6-usabilidad.md) ·
> [El cierre](L6-cierre.md) · [El índice](INDICE.md)

## QUÉ ES

El marketplace es el intercambio de contratos: el sitio donde un módulo se
crea, se valida, se licencia y aparece. Antes de L6 el runtime sabía encadenar
tools, compartir valores y componer módulos: `module/` camina el grafo,
`paquete/` lo lleva a otro sitio, `juez/` decide si un artefacto se publica.
Lo que no existía era **la puerta**: el sitio donde una cosa creada por alguien
se convierte en algo que otra persona puede usar.

L6-T1 es esa puerta. Y es un flujo, no una función: una publicación son cinco
estados y cuatro transiciones, y cada transición tiene un precondito.

## EL FLUJO

| Estado | Se llega | Qué lo exige |
|---|---|---|
| `creado` | al crear la entrada | nada: es el punto de partida |
| `validado` | `validar` | la huella, las reglas de L0, la lista blanca y las afirmaciones |
| `juzgado` | `juzgar` | un veredicto `publicar` **de esta entrada** |
| `licenciado` | `aceptarLicencia` | la licencia de distribución, aceptada |
| `publicado` | `publicar` | el número que asigna el catálogo |

Y sobre lo publicado, dos salidas que son de la plataforma, no del autor:
`publicado → suspendido → retirado`.

Cada paso tiene un precondito y el paso que no se cumple devuelve un error con
el estado que falta. Publicar sin validar es publicar lo que sea; publicar sin
licencia es publicar sin que el autor sepa que se publica; publicar sin
veredicto es publicar sin que nadie haya mirado. **Una puerta que se puede
saltar no es una puerta.**

## LAS CUATRO COMPROBACIONES DE LA VALIDACIÓN

En este orden, y el primero que falla es el veredicto:

1. **La huella.** El descriptor tiene que ser el que se publicó. Va primero
   porque validar las reglas de un contenido alterado es medir otra cosa: si
   alguien cambió el módulo por el camino, la pregunta relevante no es si el
   módulo es válido, sino si es el que te mandaron. Es el orden que ya usa
   `paquete/instalar.ts`.
2. **Las reglas.** Un módulo tiene que ser un módulo: las once reglas de L0. Una
   tool suelta tiene que entregar algo y no prometer lo que su tier no
   sostiene — una tool T0 que declara red es un error de contrato, y `axes.ts`
   dice que se rechaza *al publicar*.
3. **La lista blanca.** Un módulo que declara un nodo T2 solo corre con las
   tools que la plataforma permite en backend. Hoy esa lista está **vacía a
   propósito**, así que hoy no se publica un módulo con backend: y el rechazo
   dice qué tool falta por decidir, que es información, no un fallo.
4. **Las afirmaciones.** Una por parte. Es la misma regla que L5 aplica en el
   pipeline, y por el mismo motivo: pasar la misma afirmación a todas las
   partes produce deriva **falsa**.

## EL MANIFIESTO: UNA PARTE POR NODO

Lo que el juez lee no es el código de la tool —la magia se resuelve por
`(id, version)` en el registry— ni una prosa que escribe el autor, que sería
juzgarse a sí mismo. Es la **declaración** del descriptor: puertos, tipos,
tier, efecto, contexto, y el determinismo.

De un módulo sale **una parte por nodo**, en el orden de declaración. El nodo
es la unidad de comportamiento: un puerto no es una afirmación que se pueda
sostener ni refutar, y «produce texto» no dice nada. Y las afirmaciones son
una por nodo: «este nodo calcula», «este nodo busca».

## EL VEREDICTO TIENE QUE SER DE ESTA ENTRADA

El veredicto llega con las partes que el juez miró: su número y su sha. Si la
entrada cambió después, ese veredicto ya no habla de esto, y aplicarlo sería
publicar el juicio de otra cosa. Es la misma regla que L5 aplica en el
pipeline —una medida de otro sha es un fallo de quien llamó, no un juicio— y
aquí se aplica en la frontera: un veredicto ajeno es un **error**, no un
«publicar».

## LO QUE NO HACE

- **No llama al juez.** Produce la solicitud —encargo, partes y riesgo alto— y
  quien publica la entrega al pipeline de L5. El marketplace no tiene I/O.
- **No decide el ámbito.** El ámbito lo saca L5 de la ruta del manifiesto, y
  una ruta sin ámbito es una **parada**, no un ámbito por defecto.
- **No concede permisos.** Publicar no concede nada: instalar tampoco, y por el
  mismo motivo.
- **No toca la base de datos.** El catálogo es una estructura en memoria, como
  el resto del runtime.
