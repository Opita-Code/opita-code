# L4 · Identidad: el stub y el contexto que lo lleva

> Parte 1 de L4. [Las tres identidades](L4-identidades.md) · [El alcance](L4-alcance.md) ·
> [El índice](INDICE.md) · [El boundary](../../arquitectura/boundary-memory-v1.md)

## Lo que cierra

En L0 a L3 el runtime ejecutaba tools sin saber de quién era el dato que les
llegaba. `actorId` era una cadena, y nada más. Eso no alcanza para la regla
dura del boundary: **el contexto inyectado nunca cruza identidades**. Sin la
identidad dentro del contexto, esa regla no se puede escribir en ninguna
parte, porque no hay con qué compararla.

La brecha que L4 cierra, del plan: «una persona no existe en el sistema. Sin
identidad, no hay memoria por persona».

## Lo que entrega

**La identidad** (`src/identity.ts`): un identificador, un tipo (legal,
empresa, anónimo), la clave de aislamiento —el `projectId`, que es la misma
clave que usa el mod de dark-memory— y el estado del KYC.

**El stub legal**: una identidad con el KYC **simulado**. Suficiente para que
una persona tenga su propio mod. El KYC simulado es lo único honesto: decir
`verificada` sin stack de KYC sería una mentira publicable, y por eso hay un
test que falla si alguien lo sube de estado a mano.

**El contexto que la lleva**: `ToolContext.identity` es **obligatoria**. No es
un campo más: es la que hace que la separación de identidades tenga algo
contra lo que compararse.

## El hallazgo

El camino rápido del sellado devolvía el contexto **sin copiarlo**, y la
identidad quedaba en la mano del llamador.

La causa es la misma familia del bug que L0 ya había cerrado: `emptyContext`
marca su resultado como sellado, así que `sealContext` lo devuelve sin
tocarlo. Congelar la superficie del contexto no congela lo que hay dentro, y
`identity` es un objeto. La `projectId` es la clave de aislamiento: si una
tool puede cambiarla después de que el harness decidió el contexto, la
separación de identidades se deshace en vuelo.

La arreglo fue una copia congelada, en los dos caminos: el rápido y el
completo. Y el hallazgo tiene una segunda mitad: los tres mutantes que
probaban esa línea **sobrevivieron** al primer intento, porque mis tests
nunca llegaban a `sealContext` con un contexto armado a mano. El hueco estaba
en la verificación, no en el código. Hoy ese camino tiene su test.

## Lo que este archivo NO entrega, y por qué

| Queda fuera | Por qué |
|---|---|
| La regla de que el contexto no cruza identidades | Necesita el modelo de selección del harness (boundary, sección 2) y el caso de la empresa con rol verificado (E10) |
| El caso del anónimo y el antifraude | Resuelto con **A6 = 4**: [el alcance del antifraude](L4-identidades.md) |
| Los otros dos tipos de identidad | Resueltos en L4-T3: [las tres identidades](L4-identidades.md) |
| El KYC real | Es L4-T2, y es investigación: el stack OSS viable en Colombia |
| El aislamiento con RLS sobre `project_id` | Es del mod de dark-memory. Aquí va la especificación y la verificación, no el SQL |
| Los permisos por categoría | Es L4-T5, y necesita el modelo de permisos cerrado |
| El pool de nicknames del anónimo | El modelo del anónimo está en L4-T3; el pool sigue sin cerrarse |

## Lo que se midió

Nueve tests nuevos, y siete mutantes nuevos. Los siete mueren. En aquel
momento el total del repositorio quedaba en 149 de 149 mutantes.

Y una decisión de diseño que conviene dejar escrita: **la identidad se sella
en copia, y no se congela el objeto del llamador**. Congelar el objeto de
quien llama sería un efecto secundario inesperado: el llamador pierde un
objeto que es suyo. El contexto recibe una copia sellada, y el original
sigue siendo suyo.
