# L4 · Las tres identidades

> Parte 2 de L4. [El stub](L4-identidad.md) · [El alcance](L4-alcance.md) · [El
> índice](INDICE.md) · [El boundary](../../arquitectura/boundary-memory-v1.md)

## Lo que cierra

L4-T1 metió **una** identidad en el contexto: el stub legal, con el KYC
simulado. L4-T3 mete **las tres**, y con ellas convierte en tipo una regla que
hasta ahora era prosa: la §4 del boundary, «el contexto inyectado nunca cruza
identidades».

La regla era verdad, pero no tenía forma. `Identity` era una interfaz con
`kind: string` y `projectId: string`: los tres tipos eran el mismo tipo con
distinto texto, y nada impedía que una identidad legal apuntara al mod de una
empresa. Ahora los tres tipos son un **union discriminado**, y lo que el tipo
no lleva no se puede llevar.

## El modelo: un union, no tres campos

| Tipo | Lo que lleva | Lo que NO lleva |
|---|---|---|
| legal | id, clave, KYC | el rol, el RUT, la empresa a la que pertenece |
| empresa | id, clave, razón social | el nombre de la persona legal, el rol de quien opera |
| anónimo | id, clave, nickname | localizadores (psicometría, IP, dispositivo) |

Cada fila es una interfaz distinta, y el union las une. El compilador pasa a
ser el guard: una identidad de empresa con un `kyc` es un error de
compilación, no una disciplina.

**Lo que no está en la identidad, y por qué.** El **rol** de quien opera llega
como aserción verificada, nunca como contexto (T11): si fuera contexto, una
tool de la empresa sabría quién es el dueño, y la separación estaría escrita
pero rota. El **nombre público del dueño** (E-ARC-4) es un cruce declarado de
*publicación*, no de contexto, y por eso no es un campo de la identidad: de
esa forma es «un campo se publica» y no «la memoria cruza».

## La clave se deriva, no se pasa

Cada tipo tiene su prefijo (`identity:legal:`, `identity:org:`,
`identity:anon:`, del documento legal §3.1) y la clave se construye con el
tipo y el id. Antes `projectId` era una cadena libre que metía el llamador.

Eso era el agujero: no había dónde mirar. Ahora la clave no se puede
equivocar al construirla, y el validador la comprueba al recibirla, porque el
compilador no ve un objeto armado a mano.

## La puerta: lo que llega de afuera se comprueba

El repositorio no confía en el llamador, y L4-T1 mostró que un contexto se
puede construir sin pasar por la fábrica. Así que la puerta comprueba la
identidad **antes de sellar**, en los dos caminos (`emptyContext` y
`sealContext`), y falla con el motivo y no en silencio.

Si la identidad no sirve, la tool no corre: el sandbox devuelve
`E_IDENTITY_INVALID`. Es una precondición denegada, no un fallo de la tool,
que ni llegó a ejecutarse.

Los siete motivos: `E_NAMESPACE`, `E_CAMPO_EXTRA`, `E_KYC_INVALIDO`,
`E_KYC_SIN_STACK`, `E_RAZON_SOCIAL_VACIA`, `E_NICKNAME_VACIO`,
`E_ANONIMO_LOCALIZABLE`.

## Dónde llega el antifraude

A6 = opción 4: **el antifraude se degrada**. El clasificador opera sobre
identidades legales, que son pocas y verificables; la empresa y el anónimo
quedan fuera de su alcance. El flag, cuando exista, es un dato del mod,
rectificable y contestable (art. 8).

El precio, dicho en voz alta: **el perfil anónimo es el punto más débil del
sistema**. Es el único que no se puede defender y el único que no deja rastro
para defenderse. Y por eso el tipo anónimo no tiene dónde guardar un
localizador: el validador rechaza un `ip` en el perfil con
`E_ANONIMO_LOCALIZABLE`.
