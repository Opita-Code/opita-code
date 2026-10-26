# L4 · La verificación de la identidad legal: los tres estados y su evidencia

> Parte 7 de L4. [Las tres identidades](L4-identidades.md) · [La decisión del stack](L4-T2-decision.md) ·
> [El alcance](L4-alcance.md) · [El índice de L4](INDICE-L4.md)

## Lo que cierra

A1 (2026-10-26) autorizó a publicar la **verificación documental**: el documento
leído, el liveness, el cotejo del rostro y el screening. Antes el runtime tenía
un solo estado de KYC, `simulada`, y la fábrica legal no aceptaba ningún otro.
Ahora hay tres estados, y cada uno dice qué se comprobó.

| Estado | Qué dice | Qué lo respalda |
|---|---|---|
| `simulada` | Que no se comprobó nada | nada: es el único estado sin evidencia |
| `documental` | Las cuatro señales del stack libre | la evidencia: señales, stack y fecha |
| `verificada` | Las cuatro y la registral | la misma evidencia, con la señal registral |

## La evidencia, y por qué es un union

La evidencia es lo que se comprobó, quién lo comprobó y cuándo. Y el estado es
un **union**, no una cadena: `simulada` no tiene campo de evidencia, y los
otros dos la tienen porque sin ella no hay respaldo. Un estado sin evidencia
sería una cadena libre, y cualquiera podría subirlo a mano: la puerta no
tendría nada que mirar.

La evidencia sale **copiada y congelada**, por dentro: el array de señales es
un objeto más, y congelar solo la superficie dejaría las señales mutables.

## La puerta del KYC, y sus cuatro motivos

| Motivo | Qué significa |
|---|---|
| `E_KYC_INVALIDO` | El estado no existe, o la evidencia tiene una forma que no se reconoce |
| `E_KYC_SIN_STACK` | Dice estar verificada y no hay quien lo respalde |
| `E_KYC_SIN_SENALES` | Faltan las señales que ese estado exige |
| `E_KYC_CON_EVIDENCIA` | Dice no estar verificada y trae pruebas encima |

Los cuatro se suman a los cinco de la identidad, y son nueve en total: el
catálogo está en [las tres identidades](L4-identidades.md).

## Y el congelado que ya faltaba

La evidencia es un objeto dentro de la identidad, y eso devolvió el bug de
L4-T1: congelar la superficie del contexto no congela lo que hay dentro. La
identidad se copia ahora **en cascada** al sellar, y el objeto del llamador
sigue siendo suyo. Sin eso, una tool podía cambiar las señales del KYC después
de que el harness decidió el contexto.

## Qué NO ve

- **No comprueba que el stack haya hecho lo que dice.** Comprueba la forma, no
  la verdad: la honestidad del stack es del harness.
- **No sabe si el registro oficial existe.** La señal registral la trae quien
  contrató el servicio, y el runtime solo comprueba que la señal esté.
- **No sabe si la fecha es la de la comprobación.** Solo que tiene forma de
  fecha.
- **No mira quién es la persona.** Eso lo sabe el harness, el único actor con
  autoridad de selección.
