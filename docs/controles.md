# Los controles

> Qué corre en cada push, qué mide cada cosa, y qué NO puede ver cada una. Un
> control que no dice que no ve se cita como si lo cubriera todo.

## La tabla

| Control | Qué mide | Qué NO ve |
|---|---|---|
| `content` | intrusión de otro guión, caracteres de reemplazo, marcadores pendientes, tablas con columnas distintas, bloques sin cerrar, enlaces internos rotos, enlaces con la caja equivocada, URLs con acento, comandos npm que no existen, falta de título de primer nivel, finales de línea CRLF | si el texto dice la verdad; si una frase está bien escrita |
| `prosa` | voseo, caracteres invisibles, palabras repetidas, inglés no técnico, espacios al final, tabuladores, falta de salto final, títulos duplicados o de nivel saltado, líneas en blanco de más | la ortografía de una frase; y una línea larga es un aviso, no un fallo |
| `cifras` | que las cifras del kit del canal coincidan con la fuente: pruebas, pruebas en verde, mutaciones, unidades juzgables, decisiones abiertas y documentos del juez | las cifras que la prosa nombra con otras palabras; un número mal escrito que no esté en la tabla de reglas del guard |
| `budget` | los bytes crudos de cada artefacto juzgable, contra el tope de 4096 B | si el contenido es el correcto; si el artefacto está partido por donde tiene una sola responsabilidad |
| `test` | que la suite pase | si los tests afirman lo que dicen afirmar |
| `mutate` | que los mutantes mueran: si un test sobrevive a una mutación, no está mirando | que el diseño sea el mejor; el umbral es 80% por paquete |
| `verificar-estado` | que los números publicados cuadren con la realidad medida, que cada loop declarado cerrado tenga su documento, y que la superficie generada esté al día | que el veredicto del juez sea el que se cita (vive en la base de dark-memory, no en el repo) |
| `generar-estado --check` | que lo escrito (README, STATUS, avances) sea exactamente lo que sale de la fuente | que los números sean ciertos; eso lo mide `verificar-estado` contra la realidad |
| `generar-sitio --check` | que las páginas del sitio sean exactamente las que sale de la fuente | que los números sean ciertos; eso lo mide `verificar-estado` contra la realidad |

## QUÉ CORRE, Y EN QUÉ ORDEN

1. `npm run content && npm run prosa` — los dos guards de texto.
2. `npm run check` — cifras, presupuesto, tests y mutación. Repite los de texto.
3. `npm run verificar-estado` — el estado publicado contra la realidad.
4. `npm run generar-estado -- --check` — la superficie escrita contra la fuente.
5. `node scripts/generar-sitio.mjs --check` — el sitio en disco contra la fuente.

## EL KIT DEL CANAL, QUE NO SE GENERA

La superficie publicada se genera desde la fuente y `--check` la contrasta. El
kit del canal es la excepción: cada plataforma lleva su propia adaptación
nativa, y una prosa generada no sirve para un post. Por eso sus cifras se
miden aparte, con `cifras`.

El 2026-10-25 hizo falta: iba a publicarse diciendo «104 unidades juzgables»
cuando la fuente ya decía 107, y «104 documentos verificados por un juez
automático» cuando el juez había resuelto 10. Tres defectos en una línea, y
ninguno visible al leerla.

## POR QUÉ ESTA TABLA NO ES UNA GARANTÍA

Cada control ve una clase de defecto y no ve las demás. `content` no juzga si
el texto dice la verdad; `budget` no juzga si el contenido es el correcto;
`mutate` no juzga si el diseño es el mejor. Por eso el repo tiene dos capas y
no una: **el guard caza el número, la persona caza el recorte.**

Y hay una tercera, que es la que importa: lo que no se puede medir no se
publica como si estuviera medido. Por eso esta tabla dice también lo que cada
control NO ve: es lo que evita citar un control como si cubriera todo.
