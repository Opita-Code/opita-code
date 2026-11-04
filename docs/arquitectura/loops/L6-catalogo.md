# L6 · El catálogo: dos niveles y un distintivo

> [Publicar](L6-publicar.md) · [La licencia](L6-licencia.md) · [El pin](L6-pin.md) ·
> [La usabilidad](L6-usabilidad.md) · [El cierre](L6-cierre.md) ·
> [El índice](INDICE.md)

## QUÉ ES

El conjunto de lo publicado, en el orden en que se ve. Y tiene dos niveles,
porque se publican dos cosas:

| Nivel | Qué es | Para qué |
|---|---|---|
| **módulo** | un grafo de tools, un flujo terminado | es la unidad **principal** de descubrimiento |
| **tool atómica** | una pieza suelta | es el ladrillo que se reutiliza |

Publicar los dos no es un añadido: el módulo es el producto y la tool el
ladrillo. Un módulo se arma en segundos si otra persona ya publicó las tres
tools que necesita, y eso es el marketplace funcionando.

## EL DESCUBRIMIENTO SON LOS MÓDULOS

El plan dice que el módulo es la unidad principal de descubrimiento, y eso es
una decisión de producto. Por eso tiene función propia (`descubrimiento`) y no
es un alias: si algún día el descubrimiento cambia, el cambio está en esa
función y en ningún otro sitio.

## LAS TOOLS DE UN MÓDULO SON LAS DE SUS NODOS

Los dos niveles no son dos mundos: el módulo **usa** tools, y las lleva
dentro —sus nodos—. La tool atómica es la misma pieza cuando se publica sola.
Por eso las tools de un módulo se leen de sus nodos, y no de un registro
aparte: la tool está donde está de verdad.

Se deduplican por `(id, version)`: un módulo puede usar la misma tool en dos
nodos, y quien descubre el módulo no necesita verla dos veces. La deduplicación
es del mapa, no de un filtro aparte —dos defensas del mismo invariante
sobran—.

## EL DISTINTIVO: MUTATION O RECIPE

El eje 2 ya lo sabía desde L0: una tool determinista se comparte como
**mutación** (fork idéntico, es tuya) y una estocástica solo como **receta**
(cada corrida da otra cosa). En el catálogo ese distintivo es lo que el usuario
ve, así que vive en la entrada.

El vocabulario es el del eje 2, sin traducir: `mutation`, `recipe`, `none`.
Una palabra, un valor; el distintivo del catálogo y el eje 2 son la misma cosa
con dos caras.

## UN MÓDULO NO TIENE EJE 2 PROPIO, Y GANA EL MÁS RESTRICTIVO

El eje 2 es de la **tool**. Un módulo es un grafo, y cada nodo tiene el suyo:
el módulo no puede declarar un determinismo que no es suyo, porque lo tendría
que inventar.

Así que la clase de un módulo se deriva de sus nodos, y **gana el más
restrictivo**: si algún nodo tiene estado, el módulo es `none`; si no, si
alguno es estocástico, es `recipe`; si todos son deterministas, `mutation`.

Y no es una sutileza. Un módulo con un nodo estocástico **no es un fork
idéntico**: dos corridas tuyas dan resultados distintos. Decir `mutation` ahí
sería una promesa que el módulo no puede cumplir, y el distintivo **es** una
promesa.

## LO QUE NO HACE

- **No guarda una vista cacheada.** El listado se construye en el momento, a
  partir de las entradas y del pin: una vista cacheada sería un segundo estado
  que puede quedar viejo sin que nadie lo note.
- **No ordena por nombre.** Ordenar por nombre sería ordenar por algo que el
  autor eligió, y «quién se publica primero» sería «quién se llama primero».
- **No mezcla los niveles.** Son dos listas, no una con etiquetas.
