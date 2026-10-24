# L2 · Aritmética reconciliable

> Parte 8 de 15. [Orden](L2-orden.md) · [Módulo](L2-modulo.md) · [Compartir](L2-compartir.md) · [Tools](L2-tools.md) · [Harness](L2-harness.md) · [Canónico](L2-canonico.md) · [Verificación](L2-verificacion.md) · [Mutación](L2-mutacion.md) · [Presupuesto](L2-presupuesto.md) · [Hallazgo runner](L2-hallazgo-runner.md) · [Hallazgos](L2-hallazgos.md) · [Desviaciones](L2-desviaciones.md) · [Gate](L2-gate.md) · [Cierre](L2-cierre.md)
> Spec 537. Tarea L2-S11.

El total de 282 aparece en varios documentos, y cada uno lo daba por su cuenta.
Eso está bien mientras las cifras **reconcilien entre sí**; el día que dejen de
reconciliar, el número pasa a ser decoración y hay que encontrar cuál de los dos
está mintiendo. Este documento es el que las reconcilia.

---

## Vía 1 — por prefijo

El desglose nominal. Y **esta vez los prefijos cuadran sin nota al pie**:

```
78  L0-*      \  los 88 de L0: 78 con nombre + 10 properties con nombre P*
87  L1-*       |
10  P*        /
107 L2-*
─────
282
```

## Vía 2 — por archivo

La que se reproduce sin consultar el historial de renombres, sumando
`node --test` sobre cada `dist/test/*.test.js`:

| Grupo | Archivos | Casos |
|---|---|---|
| L0 | axes 12 · contract 21 · tool 16 · graph 29 | 78 |
| L1 | capability 11 · sandbox 15 · effects 12 · wasm 24 · property-sandbox 14 | 76 |
| **L2** | **order 19 · module 27 · share 13 · tools 30 · property-module 10** | **99** |
| P (L0) | property | 10 |
| L-CI | verification-gaps 19 | 19 |
| | **total** | **282** |

## El total por loop

```
88  casos de L0, intactos
+76  casos de L1
=164 al cierre de L1
+99  casos nuevos de L2
+19 casos de L-CI
=282 total
```

Ni uno de los 282 tests de L0 ni de L1 fue tocado en este loop — `git diff`
contra `456ad85` sale vacío. No hubo renombrado, ni eliminación, ni relajación.

## Por qué no coinciden fila a fila

Porque **no deben**. La vía por prefijo cuenta casos renombrados: un test que
cambió de `L0-77` a `L1-88` mueve el conteo aunque no se haya tocado una línea
de su código. La vía por archivo cuenta dónde viven hoy los casos.

| | L0 | L1 | L2 | L-CI | Total |
|---|---|---|---|---|---|
| Por prefijo | 88 | 87 | 107 | 0 | 282 |
| Por archivo | 78 + 10 P | 76 | 99 | 19 | 282 |

Lo único que es invariante es el **total**, y las dos vías lo dan. Eso es
precisamente el corolario del error de L1, que renombró un test sin que ningún
total lo reflejara y por eso el gate le dio drift sobre una cifra que era cierta.

Lo que separa las dos filas son los **19 de L-CI** y el test renombrado. Por
archivo, `verification-gaps.test.ts` es un grupo propio. Por prefijo, sus 19
tests se reparten 1 en L0, 10 en L1 y 8 en L2, porque cada test lleva el nombre
del loop cuyo codigo cubre. Y el test renombrado cuenta en L1 por su nombre y
en L0 por su archivo, que es `tool.test.ts`. En L0 las dos cosas se compensan y
la columna cuadra: 88 de un lado y 88 del otro, con un test distinto en cada
uno.

Cada vía sirve para algo que la otra no:
- **Por prefijo** → detecta un renombrado o una prueba eliminada de un sitio.
- **Por archivo** → verifica el total sin depender de cómo se llaman los tests.

Ninguna de las dos sirve sola, y por eso este loop publica las dos.

## La regla, en una línea

**Un documento que da totales por categoría tiene que hacerlos reconciliables
por más de una vía.** Si solo hay una, cualquier cifra es plausible y ninguna es
comprobable.
