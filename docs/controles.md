# Los controles

> Qué corre en cada push, qué mide cada cosa, y qué NO puede ver cada una. Un
> control que no dice qué no ve se cita como si lo cubriera todo.

## La tabla

| Control | Qué mide | Qué NO ve |
|---|---|---|
| `content` | intrusión de otro guión, caracteres de reemplazo, marcadores pendientes, tablas con columnas distintas, bloques sin cerrar, enlaces internos rotos, enlaces con la caja equivocada, URLs con acento, comandos npm que no existen, falta de título de primer nivel, finales de línea CRLF | si el texto dice la verdad; si una frase está bien escrita |
| `prosa` | voseo, caracteres invisibles, palabras repetidas, inglés no técnico, espacios al final, tabuladores, falta de salto final, títulos duplicados o de nivel saltado, líneas en blanco de más | la ortografía de una frase; y una línea larga es un aviso, no un fallo |
| `cifras` | que las cifras del kit del canal coincidan con la fuente: pruebas, pruebas en verde, mutaciones, unidades juzgables, decisiones abiertas y documentos del juez | las cifras que la prosa nombra con otras palabras; un número mal escrito que no esté en la tabla de reglas del guard |
| `coherencia` | que las constantes declaradas —hoy, el tope de 4096 B— coincidan con la fuente en todos los documentos juzgables, y que una contradicción entre dos partes se note con archivo y línea | las contradicciones sobre lo que nadie declaró: no lee ideas; y los contadores en los registros históricos, a propósito: un contador envejece y un registro con la cifra de su día es fiel |
| `budget` | la parte más grande que vería el juez de cada artefacto juzgable, contra el tope de 4096 B, y que el conteo de partes sea el declarado | si el contenido es el correcto; si la partida es por concepto y no por bytes |
| `test` | que las cuatro suites pasen: la de unidad, la de integración, la del pipeline y la del mecanismo de partes | si los tests afirman lo que dicen afirmar; y sin Docker, el aislamiento no se midió: el test se salta y lo dice en su nombre |
| `mutate` | que los mutantes mueran: si un test sobrevive a una mutación, no está mirando | que el diseño sea el mejor; el umbral es 80% por paquete |
| `verificar-estado` | que los números publicados cuadren con la realidad medida, que cada loop cerrado tenga su documento, y que la superficie generada esté al día | que el veredicto del juez sea el que se cita (vive en la base de dark-memory, no en el repo) |
| `generar-estado --check` | que lo escrito (README, STATUS, avances, la matriz de las specs) sea exactamente lo que sale de la fuente | que los números sean ciertos; eso lo mide `verificar-estado` contra la realidad |
| `generar-sitio --check` | que las páginas del sitio sean exactamente las que sale de la fuente | que los números sean ciertos; eso lo mide `verificar-estado` contra la realidad |
| `identidad` (runtime) | que la identidad sea del tipo que dice, con la clave derivada y con la evidencia de su estado | si el id existe, ni el contenido inyectado, ni el pool, ni que el stack sea honesto |

## QUÉ CORRE, Y EN QUÉ ORDEN

1. `npm run content && npm run prosa` — los dos guards de texto.
2. `npm run check` — cifras, presupuesto, tests y mutación. Repite los de texto.
3. `npm run verificar-estado` — el estado publicado contra la realidad.
4. `npm run generar-estado -- --check` — la superficie escrita contra la fuente.
5. `node scripts/generar-sitio.mjs --check` — el sitio en disco contra la fuente.

La última fila no corre en CI: vive en el runtime ([L4-alcance](arquitectura/loops/L4-alcance.md)).

## EL KIT DEL CANAL, QUE NO SE GENERA

La superficie publicada se genera desde la fuente y `--check` la contrasta. El
kit del canal es la excepción: cada plataforma lleva su propia adaptación
nativa, y una prosa generada no sirve para un post. Sus cifras se miden
aparte, con `cifras`.

El 2026-10-25 hizo falta: iba a publicarse diciendo «104 unidades juzgables»
cuando la fuente ya decía 107. Un número falso, y ni se veía al leerlo.

Y qué se mide lo decide el índice del canal: lo publicado es un registro y no
se vuelve a mirar; lo que no sale se mide contra la fuente de hoy. La regla
está en [canal.md](canal.md).

## LA PARTIDA ES SOLO PARA EL JUEZ

Decisión del operador (2026-10-27). El documento vive entero en el repositorio,
con su prosa completa. Lo que se parte es lo que ve el juez, en el momento de
juzgarse: y un script recompone las partes y las verifica contra el original.

El motivo es que partir en el repositorio obligaba a recortar la prosa de
otros documentos para que un índice quepa. Un tope de bytes terminó decidiendo
la forma del árbol de archivos, y eso está al revés: el tope existe para que el
veredicto signifique algo, no para que los documentos se partan.

| Pieza | Qué hace |
|---|---|
| `vibe-tools/tools/juez-partes.mjs` | parte un artefacto por concepto, recompone las partes y compara el sha con el original |
| `vibe-tools/tools/gate-budget.mjs` | mide la parte más grande de cada artefacto y contrasta el conteo de partes con el declarado |

El corte va en los títulos: un concepto es un título y lo que va debajo, y en
el código una declaración de nivel superior. Si un concepto no cabe solo, el
script falla y lo dice, porque partir ese concepto por bytes sería amputar: un
veredicto sobre un trozo de una idea.

Y la comprobación que sostiene todo: **las partes tienen que dar el original
byte a byte.** Se comprueba con el sha, y una parte editada a mano se delata
porque no lleva la cabecera.

Lo que esto NO verifica: que las partes sean coherentes entre sí. Eso no lo
certifica nadie ([el judge por partes](arquitectura/loops/judge-partes.md)), y la
composición solo demuestra que las partes son el original.

## POR QUÉ NO ES UNA GARANTÍA

Cada control ve una clase de defecto y no ve las demás. `content` no juzga si
el texto dice la verdad; `budget` no juzga si el contenido es el correcto;
`mutate` no juzga si el diseño es el mejor. Por eso hay dos capas: **el guard
caza el número, la persona caza el recorte.**

Y hay una tercera, la que importa: lo que no se puede medir no se publica como
si estuviera medido. Por eso esta tabla dice lo que cada control NO ve.
