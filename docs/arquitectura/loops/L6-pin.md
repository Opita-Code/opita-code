# L6 · El pin: las tres propias siempre de primero

> [Publicar](L6-publicar.md) · [La licencia](L6-licencia.md) ·
> [El catálogo](L6-catalogo.md) · [La usabilidad](L6-usabilidad.md) ·
> [El cierre](L6-cierre.md) · [El índice](INDICE.md)

## QUÉ ES

Una regla del catálogo, no una preferencia de orden: las entradas propias
ocupan las primeras posiciones, **siempre**, sin excepción y sin rotación. Es
la decisión firme del operador, y en la arquitectura (§10) está marcada como
«no re-litigar».

## POR QUÉ LAS PROPIAS LAS DECIDE LA PLATAFORMA

Si el autor pudiera declarar su entrada como propia, publicar sería el acto de
concederse el pin, y el pin dejaría de significar nada: sería un campo de
texto que dice «yo primero».

Por eso las propias son un **conjunto que la plataforma declara** al construir
el catálogo, y una entrada de un tercero no puede auto-declarse propia ni
aunque lo pida. La propiedad la decide el catálogo, no la entrada.

## POR QUÉ NO HAY ROTACIÓN

Rotar es cambiar el orden con el tiempo. Un catálogo que rota tiene que
enseñar a la gente a buscar, y **el lugar de una cosa es información**: que la
tercera propia sea la tercera siempre significa que el sitio tiene un orden, y
un orden que cambia es ruido.

Sin rotación, el orden relativo de las propias es el de publicación y no se
toca. Y eso no es una promesa: está medido por una propiedad que dice que
**meter más terceros en el catálogo no cambia el bloque de las propias**.

## LO MEDIDO: UNA PROPIEDAD, NO UN EJEMPLO

El KPI del plan pide `property_check` de que las tres propias van antes que
cualquier tercero, siempre. Eso no se comprueba con un ejemplo: se comprueba
con una propiedad, sobre catálogos generados.

La propiedad se prueba con el generador sembrado del repo (`test/rng.ts`), con
seis semillas y doscientas rondas cada una. Dice tres cosas:

| Propiedad | Qué protege |
|---|---|
| Ningún tercero precede a una propia | el pin, en cualquier catálogo |
| El bloque de las propias no rota al entrar terceros | que «de primero» no sea «de primero hoy» |
| El bloque está ordenado por publicación | que el orden sea el de llegada |

Y una cuarta, que no es del pin sino del catálogo: **el listado es exactamente
lo publicado**. Lo suspendido y lo retirado no se listan, porque el catálogo es
lo que se puede usar, no lo que existió.

## LO QUE ESTÁ PENDIENTE

**Las tres propias concretas están por nombrar.** El mecanismo está medido y
funciona con cualquier conjunto de tres; los ids son decisión del operador, y
no se inventan: publicar como «propia» algo que no lo es sería el mismo error
que el pin promete evitar.

## LO QUE NO HACE

- **No rota, no ordena por nombre y no pondera.** El orden de los terceros es
  el de publicación, que es el único que no puede manipular quien publica.
- **No cuenta.** Las propias no son «más puntos» ni «más visibles»: están
  primero, y ya.
- **No decide cuáles son.** Decide cómo se ordenan las que la plataforma
  declara.
