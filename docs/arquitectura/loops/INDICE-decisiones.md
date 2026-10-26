# Índice de las decisiones del operador

> Las preguntas que L3 dejó abiertas, escritas con la evidencia que el
> repositorio ya tenía, las opciones y lo que costaría cada una. Cada
> documento es una decisión: [el catálogo por loop](INDICE.md). Las cuatro
> están contestadas desde el 2026-10-26.

| Decisión | Qué pregunta | Respuesta | Documento |
|---|---|---|---|
| A5 | El eje del corte: por creencia, y no por edad, rol o cohorte | Opción 1: se confirma el corte por creencia | [A5](decision-A5.md) |
| A6 | Cuál se degrada si hay que elegir: el anonimato o el antifraude | Opción 4: se degrada el antifraude | [A6](decision-A6.md) |
| A7 (C6) | El sexto consentimiento en contexto de organización | A1: un C6 propio y separado | [A7-consentimiento](decision-A7-consentimiento.md) |
| A7 (techo) | El techo de falsos positivos, y si el flag es rectificable | T1: la regla ahora, el techo medido cuando exista el clasificador | [A7-techo](decision-A7-techo.md) |

## Dónde vive cada respuesta

Las respuestas no son prosa: son código. [L4-alcance](L4-alcance.md) dice qué
cambió en el repositorio con cada una, y [L4-identidades](L4-identidades.md)
describe el modelo que las sostiene.

## Y por qué están partidas en cuatro documentos

A7 son **dos cosas de naturalezas distintas**: un consentimiento es una
decisión, y un techo de falsos positivos es una **medición** que además
depende de A6. Juntas en un documento, ninguna de las dos se puede leer sin
la otra. Y el documento de A7-techo dice algo que conviene ver por separado:
**el techo no se decide hoy, porque no hay clasificador que medir**, y el
número no existe hasta que exista.

## Y una advertencia sobre el método

Cada documento dice qué está **ya decidido** y no se vuelve a discutir. Es
la parte que más tiempo ahorra: la pregunta de A6 no es «¿qué es el
anonimato?», que está decidido, sino **cuál de dos cosas se degrada**.
