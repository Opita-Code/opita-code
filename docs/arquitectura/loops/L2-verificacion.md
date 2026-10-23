# L2 · Verificación: unitarios y properties

> Parte 7 de 15. [Orden](L2-orden.md) · [Módulo](L2-modulo.md) · [Compartir](L2-compartir.md) · [Tools](L2-tools.md) · [Harness](L2-harness.md) · [Canónico](L2-canonico.md) · [Aritmética](L2-aritmetica.md) · [Mutación](L2-mutacion.md) · [Presupuesto](L2-presupuesto.md) · [Hallazgo runner](L2-hallazgo-runner.md) · [Hallazgos](L2-hallazgos.md) · [Desviaciones](L2-desviaciones.md) · [Gate](L2-gate.md) · [Cierre](L2-cierre.md)
> Spec 537. Tarea L2-S11.

Los tres métodos del loop, como en L0 y L1. Este cubre los dos que se apoyan en
la suite; el tercero está en
[mutación y presupuesto](L2-mutacion.md), porque mutación y gate budget son una
sola preocupación y no caben aquí sin amputarse.

---

## 1. Unitarios — 99 casos nuevos

| Archivo | Qué cubre | Casos |
|---|---|---|
| `order.test.ts` | orden topológico, desempate, ciclos, predecesores distintos | 19 |
| `module.test.ts` | los tres casos canónicos, harness, entradas, reuso | 27 |
| `share.test.ts` | la política, la clave, la cache | 13 |
| `tools.test.ts` | las cuatro tools y el escapado | 30 |
| `property-module.test.ts` | P25–P34 sobre 6 semillas | 10 |

La aritmética por prefijo está en [L2-canonico.md](L2-canonico.md):
**263 = 88 de L0 + 76 de L1 + 99 de L2**. Y la reconciliación por archivo, que
es la que se puede reproducir sin el historial de renombres, está en
[aritmética](L2-aritmetica.md). Las dos vías dan el mismo total.

## 2. Properties — P25 a P34

| # | Invariante |
|---|---|
| P25 | el orden topológico respeta **cada** arista, en 300 grafos |
| P26 | el orden es una permutación: no pierde, no repite, no inventa |
| P27 | mismo descriptor, mismo orden, siempre |
| P28 | sin aristas, el orden **es** el de declaración |
| P29 | un módulo que falló no tiene entregas, en 200 corridas |
| P30 | la bitácora de intentos nunca crece sin control |
| P31 | con la misma cache, la segunda corrida **sí** reutiliza |
| P32 | la política sale siempre del determinismo declarado |
| P33 | `renderSvg` **nunca** deja markup crudo, sobre 600 textos |
| P34 | `EXEC` nunca lanza: o da valor o da `ok:false` |

Seis semillas, PRNG sembrado, por la misma razón de siempre: una suite que falla
al azar contradiría la propiedad que protege.

### Por qué hay que sembrar

Un PRNG sin semilla hace que un fallo aparezca una vez de cada veinte. En un
sistema cuyo producto es *mismo contrato, mismo resultado*, una suite que falla
al azar no es un annoyance: es el suite diciendo que el producto puede fallar al
azar. `Rng` lleva su propia razón escrita en la cabecera, y esa razón es la
justificación del método, no un comentario de estilo.

### P33 es la que sostiene a `RENDER`

Un escapado con un hueco **no falla la mitad de las veces**: pasa el 90% de los
entradas y rompe justo el que importa. Un test de ejemplo con `<` no lo
detecta, porque `<` sale bien.

Por eso el property mete `onload=`, `=`, comillas y `/`: son las piezas que arman
un atributo o cierran una etiqueta. Y por eso el unitario y el property no se
redundan — el unitario dice **qué** se rompió, el property que no se escape.
Ver el mutante que los dos matan en
[mutación](L2-mutacion.md).

### P29 distingue dos fallos que se parecían

El módulo canónico tiene dos formas de parar antes de entregar: que falte el
puerto de entrada, o que la herramienta falle. En la primera **no se ejecuta
nada**; en la segunda se ejecutó un nodo y se detuvo. La property no comprueba
que `deliveries` esté vacío —comproba que en el primer caso no hay ni una
corrida registrada, y que en el segundo hay exactamente una, la que falló.