# La dirección y la arquitectura del juez

> Dónde está el juez en el framework, qué certifica, qué no, y hacia dónde va.
> Transversal. La regla que lo hace operable: [judge por partes](judge-partes.md).

## Qué es el juez, y qué no es

**Es** un verificador de que un artefacto **afirma** lo que su SpecIntent
decía que afirmara. No verifica que sea verdad, ni que sea bueno: verifica
una relación entre un texto y una hipótesis.

**No es** un aprobador. Un aprobador dice «esto está bien»; el juez dice
«esto dice lo que se esperaba que dijera». La segunda es verificable; la
primera no.

## Dónde vive: en la capa de confianza, no en la de producto

| Capa | Qué verifica | Qué no verifica |
|---|---|---|
| **El guard** | la forma: integridad, presupuesto, los números declarados contra los medidos | si el texto dice la verdad |
| **El juez** | la relación entre el artefacto y su hipótesis | si la hipótesis era la correcta |
| **La persona** | el recorte: si lo que se certifica es lo que quería | — |

La regla que las ata: **el guard caza el número, la persona caza el recorte, y
el juez caza la deriva.** Por eso el veredicto del juez nunca es el
veredicto: es una de las tres cosas que tienen que pasar.

## La arquitectura, en cinco piezas

1. **La spec** declara la hipótesis: el SpecIntent. Una afirmación central
   por parte.
2. **La matriz** declara las dimensiones de la spec antes de que exista: las
   partes, la afirmación de cada una y el tamaño proyectado. La calcula el
   pipeline que genera los artefactos.
3. **El artefacto** llega con su tamaño real. Lo declarado se mide después, y
   si la diferencia sale de la banda, la estimación estaba mala.
4. **El juez** certifica cada parte contra su afirmación.
5. **El agregado** dice «N de N partes», con nombre. Y la **coherencia entre
   partes** la verifica otra capa, porque el juez por partes no la ve.

## Lo que la evidencia dice del juez, medido

| Dato | Medido |
|---|---|
| El SpecIntent decide el veredicto | 5 intentos, mismo sha: 5 alinearon con una sola afirmación, 2 neutraron con enumeraciones |
| Un artefacto de 5067 B | `aligned`, confianza 1.000, sin truncar, 45,8 s: el tope de 4096 B es nuestro, no del juez |
| La degradación | rate limit del proveedor → `needs_human` con confianza 0 y **sin proveedor**: es infraestructura, no veredicto |
| El falso positivo | rows 482/1985/2013/2016/2017: el juez declined certificar buenos artefactos, y el operador lo sobrescribió dos veces |
| El chunking | lo hace el proveedor (`num_chunks`, `chunked_size`), no el MCP |

## Las cuatro direcciones

**1. El spec es la pieza que se trabaja, no el prompt.** Lo que hoy hace que
un veredicto sea «neutral» en vez de «aligned» es la forma del spec: cuatro
párrafos con enumeraciones dan neutralidad; uno con una afirmación
central da entailment. Es la palanca más barata y la más medida.

**2. Un artefacto, una afirmación.** Si una parte afirma tres cosas, el juez
tiene que decidir si las tres están; y si no, no hay veredicto que
signifique. La matriz obliga a esto: una parte sin afirmación se marca, y
una que se pasa del tope se lista para partirla.

**3. La degradación se nombra, no se disfraza.** Un `needs_human` por rate
limit no es un veredicto desfavorable: es «no se pudo medir». Que el veredicto
traiga el proveedor y la confianza es lo que permite distinguir las dos cosas.

**4. El juez sube de categoría: de verificador a capa.** Hoy es la puerta de
entrada de la confianza del framework y es la capa más débil de las tres: da
falsos positivos y neutralidades. La dirección: la confianza del repositorio
**no dependa de él**.

## Lo que esta dirección NO promete

- **No un juez más exacto.** La exactitud la tiene el proveedor; el
  framework decide qué le pregunta y cómo lee la respuesta.
- **No menos juez.** Un framework sin verificador de deriva no sabe si su
  documentación se quedó vieja.
- **No que el agregado resuelva la coherencia.** Lo que el juez por partes
  no ve, lo ven las otras capas.
