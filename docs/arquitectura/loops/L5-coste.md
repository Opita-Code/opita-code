# L5 · El coste: lo que se mide, y lo que no

> [El pipeline](L5-pipeline.md) · [Las paradas](L5-needs-human.md) ·
> [El cierre](L5-cierre.md) · [El índice](INDICE.md)

## LO QUE SE MIDE

| Dato | Cómo | Ejemplo medido |
|---|---|---|
| Llamadas | las decide el plan: partes × consenso | 3 para un archivo de código en una parte |
| Bytes | la suma de las partes enviadas, por muestra | 9396 B (3132 B × 3) |
| Latencia | el **máximo** de las muestras, no la suma | 7346 ms |

Las tres muestras del archivo de código midieron 6763, 3814 y 7346 ms. Sumarlas
daría 17923 ms, y eso contaría tres veces lo que probablemente fue una sola
medida del servidor. El pipeline publica el máximo y, aparte, la dispersión,
para que quien lo lea pueda ver si el servidor está repitiendo el valor.

## LO QUE NO SE MIDE

**Tokens.** La respuesta del juez trae veredicto, confianza, proveedor, modelo
y latencia, y ningún conteo de tokens. Tampoco queda en la base: la tabla de
evaluaciones no tiene una columna de uso.

Y no se proyecta. Un divisor de «4 bytes por token» es una convención, no una
medida, y escribirla como coste sería un número inventado con otro nombre. El
pipeline declara `tokens: null` con su motivo.

**Margen.** Margen es cargo menos coste, y el coste del proveedor no está
medido. Devolver un margen con un coste inventado sería peor que no devolver
ninguno. Sale `null` con su motivo.

## EL CARGO SÍ SE PUEDE CALCULAR

El cargo es lo que se le cobra a quien publica, y sale de una tarifa que el
operador declara por llamada. No hay tarifa por defecto: inventarla sería
publicar un precio que nadie decidió.

```bash
node tools/juez-correr.mjs --ruta <rel> --afirmacion "<texto>" \
  --tarifa 0.5 --moneda COP
```

El cargo es `llamadas × tarifa`. El margen sigue siendo `null`, porque el coste
del proveedor no está medido.

## EL KPI DEL PLAN, Y SU ESTADO

El plan pide «coste de tokens: medido y reportado por publicación». **No es
cumplible con este proveedor.** El juez no reporta uso, y la base no lo guarda.
Se declara incumplido en [el cierre](L5-cierre.md), en vez de publicar una
proyección con nombre de medida.

Lo que sí se entrega es el coste que se puede medir: llamadas, bytes y latencia
máxima, por publicación, con el cargo calculable a partir de una tarifa
declarada.

## LO QUE ESTE MECANISMO NO HACE

- **No mide el coste del proveedor.** No hay dato, y no se inventa.
- **No presupuesta.** Dice lo que costó una publicación, no lo que costará la
  siguiente.
- **No bloquea por coste.** El plan decide cuántas muestras por riesgo; el
  gasto se reporta, no se negocia después de ver el veredicto.
