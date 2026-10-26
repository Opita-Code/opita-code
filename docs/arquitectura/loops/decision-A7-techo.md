# L3 · Decisión A7, segunda mitad: el techo de falsos positivos

> La pregunta que quedó abierta en L3, con la evidencia, las opciones y lo que
> costaría cada una. Es tuya: [lo que L3 dejó abierto](L3-cambios.md). La
> otra mitad —el sexto consentimiento— está en
> [A7-consentimiento](decision-A7-consentimiento.md).

## La pregunta, tal como está declarada

| | |
|---|---|
| Id | A7 |
| Quién decide | el operador |
| Qué bloquea | la capa psicométrica |
| La pregunta | el techo de falsos positivos |

**Y esto no es una decisión.** El techo no se decide: se mide. Por eso este
documento es distinto del otro, y por eso se separa.

## La evidencia

> El usuario honesto juega limpio y por eso parece sospechoso. Si el
> antifraude premia lo no humano, la honestidad es una desventaja. **Aceptar
> que hay una señal que premia el juego, o aceptar un techo de falsos
> positivos. No hay tercera opción, y el techo tiene que ser un número
> medido.**
> — E-VER-2, `L3-mindset-veredicto.md`

Y la otra mitad del mismo nudo, que va con el flag:

> El flag está en la memoria, y la memoria es visible para su dueño… si está
> en la capa visible. Si vive solo en la inferencia, **no hay nada que
> impugnar**. Que el veredicto sea un dato del `mod`, rectificable y
> contestable. Los sistemas antifraude suelen hacerlos inrectificables
> *porque así funcionan*. **Eso es un conflicto real con el art. 8, y no tiene
> solución de ingeniería.**
> — E-VER-1

## Por qué el techo no se puede decidir hoy

Porque **no hay clasificador que medir**. El repo no publica números sin
medir, y un techo sin clasificador detrás es un número inventado con
nombre de dato. La fecha honesta del techo es la fecha en que exista el
clasificador.

## Lo que sí se puede decidir hoy

**Opción T1 — la regla, y el techo para cuando exista el clasificador.**
Escribo la regla ahora y el número se mide después:

1. Ningún clasificador se publica sin techo medido.
2. El techo se mide sobre la población que va a juzgar, y se publica con su
   método, no solo con su número.
3. El techo es una decisión de producto con un número medido detrás, no un
   número de producto.

**Opción T2 — fijar el techo ahora, como supuesto.** Se escribe un número y
se marca como **asumido**, no medido. Consecuencia: el documento legal y el
README van a publicar un número sin medir, que es justo lo que este repo no
hace. Lo dejo aquí porque es tu derecho escribirlo, pero te aviso del
precio.

## La observación que vale más que las dos opciones

**El techo es una consecuencia de la decisión de A6, no una decisión
aparte.**

Con **A6 = opción 4** (el anónimo no se localiza y el flag es
rectificable), el clasificador solo ve identidades legales: son pocas,
verificables y el techo es un problema medible en un conjunto acotado.

Con **A6 = opción 1** (el antifraude localiza), el clasificador ve el
tráfico anónimo, y el techo deja de ser un número y pasa a ser una pregunta
sin respuesta razonable: cada falso positivo sobre un perfil anónimo hiere
a alguien que, por definición, no tiene cómo defenderse.

O sea: **la elección de A6 decide el techo, no al revés.** Por eso el orden
correcto es resolver A6 primero.

## Qué necesito de ti

**A7-B: T1 o T2.** Y, si T1, queda escrito el compromiso: el techo se mide
antes de publicar el clasificador, y el número no existe hasta entonces.

Y una pregunta que va con A6 y que **no es una preferencia**: ¿el flag de
antifraude sigue siendo rectificable? El art. 8 lo exige, así que la
respuesta esperada es sí, y lo que necesito es que quede dicho y no supuesto.
