# L6 · La usabilidad: lo que un recorrido mide y lo que no

> [Publicar](L6-publicar.md) · [La licencia](L6-licencia.md) · [El pin](L6-pin.md) ·
> [El catálogo](L6-catalogo.md) · [El cierre](L6-cierre.md) ·
> [El índice](INDICE.md)

## QUÉ ES

El plan pide un KPI que no es de código: **«flujo de publicación completo sin
fricción»**, con estrategia de *persona-based usability* y cinco psicometrías.

Y aquí está lo importante, y es la regla del repo aplicada a un KPI que no se
puede medir solo: **un número que no se ha medido no se escribe como
afirmación**. Este documento no dice que el flujo no tenga fricción. Dice que
**el instrumento está escrito** y que **el recorrido lo tiene que hacer una
persona**.

## POR QUÉ NO PUEDE MEDIRLO EL AGENTE

La fricción de un flujo se mide con la reacción de quien lo recorre: dónde se
detiene, qué lee dos veces, qué no entiende. Un agente que recorre su propio
diseño no se detiene en ninguna parte: conoce las respuestas antes de
preguntar. Medir eso y publicarlo como «sin fricción» sería la forma más
barata de mentir y la más difícil de detectar, porque el número saldría
perfecto.

## EL INSTRUMENTO: CINCO PSICOMETRÍAS

El plan pide cinco. Estas son las cinco, con lo que se pregunta y lo que se
anota. No hay LOGGER de respuestas: se anotan las cinco, y se leen juntas.

| # | Qué se pregunta | Qué se anota |
|---|---|---|
| 1 | ¿Sabías que se podía publicar aquí? | sí / no / «ni idea» |
| 2 | ¿Qué creías que hacía el botón de publicar? | la frase literal |
| 3 | ¿Dónde te has parado? | el paso, o «ninguno» |
| 4 | ¿Qué te ha faltado? | la frase literal |
| 5 | ¿Lo publicarías tú? | sí / no / «depende» |

La quinta es la que importa: mide la intención, que es lo que el marketplace
vende. Un recorrido sin paradas y con un «no» en la quinta es un flujo que
funciona y no convence, y esos dos fallos se ven distinto en el código.

## EL RECORRIDO

Sin personas detrás, esto es un guion de cinco pasos, y cada uno tiene lo que
tiene que pasar:

1. **Crear.** Escribir un módulo o elegir una tool. La huella sale sola: nadie
   la escribe.
2. **Validar.** Si algo falla, el mensaje dice qué: la huella no coincide, las
   reglas de L0 no pasan, la lista blanca no admite una tool, o las
   afirmaciones no son una por parte.
3. **Juzgar.** El veredicto llega con su confianza y, si no es `publicar`, con
   la acción para el operador. Aquí es donde una persona tiene que entender
   qué hacer con un `corregir`.
4. **Licenciar.** Aceptar los términos: distribuir y aparecer, con la reserva
   de suspender y retirar, y **sin** transferencia de propiedad.
5. **Publicar.** Y la entrada aparece en el catálogo, en su sitio, con su
   distintivo.

## LO QUE ESTÁ DECLARADO

**Este KPI no está medido.** Está escrito el instrumento, y está escrito por
qué no se puede medir sin una persona. Hasta que alguien recorra el flujo y
anote las cinco respuestas, la cifra no existe, y el cierre del loop lo
declara como no cumplido en vez de darlo por bueno.

Es la misma regla que el resto del repo: lo que no se midió, se declara. Y es
la diferencia entre un marketplace medido y un marketplace prometido.

## LO QUE NO HACE

- **No sustituye a los tests.** Los tests dicen que el flujo no tiene atajos;
  la usabilidad dice si se entiende sin saber nada del runtime.
- **No es una nota de releasing.** No hay captura, ni vídeo, ni guion: hay cinco
  preguntas y un sitio donde anotar lo que se respondió.
