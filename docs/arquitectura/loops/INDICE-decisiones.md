# Índice de las decisiones abiertas del operador

> Las tres preguntas que L3 dejó abiertas, escritas con la evidencia que el
> repositorio ya tenía, las opciones y lo que costaría cada una. Cada
> documento es una decisión: [el catálogo por loop](INDICE.md).

| Decisión | Qué pregunta | Documento |
|---|---|---|
| A5 | El eje del corte: por creencia, y no por edad, rol o cohorte | [A5](decision-A5.md) |
| A6 | Cuál se degrada si hay que elegir: el anonimato o el antifraude | [A6](decision-A6.md) |
| A7 | El sexto consentimiento en contexto de organización | [A7-consentimiento](decision-A7-consentimiento.md) |
| A7 | El techo de falsos positivos, y si el flag es rectificable | [A7-techo](decision-A7-techo.md) |

## Cómo se responden

Cada documento termina con **qué necesito de ti**, con las opciones numeradas.
La respuesta se escribe en la fuente (`vibe-tools/estado.json`, la lista
`abiertos`), y a partir de ahí L4 puede arrancar: la identidad real necesita
las tres.

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
