# L5 · Los ámbitos: qué se mide de cada clase de artefacto

> [El pipeline](L5-pipeline.md) · [Las paradas](L5-needs-human.md) ·
> [El índice](INDICE.md)

## QUÉ ES UN ÁMBITO

Un ámbito es una clase de artefacto con su propia pregunta. No es una etiqueta
decorativa: dice **qué** mide el juez, **en qué unidad**, con **qué afirmación**,
**cuántas muestras** y **qué no ve**.

## POR QUÉ SE ASIGNA POR RUTA

Un ámbito que elige el autor es un ámbito que el autor puede bajar de exigencia
cuando el artefacto no pasa. Si el documento legal se pudiera declarar
«documento» en vez de «legal», el pipeline le pediría un veredicto que ese
documento no admite.

La ruta no tiene incentivo: es la misma antes y después de juzgar. Por eso la
tabla se consulta por ruta, y la ruta se normaliza antes de clasificarla
(separador, `./` y barras repetidas).

## LA TABLA

| Ámbito | Qué mide | Unidad | Muestras | Qué NO ve |
|---|---|---|---|---|
| `codigo` | que el archivo haga y explique lo que su afirmación dice | un archivo; si cruza el tope, sus partes | 3 | si corre; si el test afirma lo que dice; si el diseño es el mejor |
| `sql` | que la política que el SQL aplica sea la que declara | un archivo | 3 | si el motor la aplica; si el esquema aguanta carga |
| `documento` | que el documento sostenga la tesis de su intent | un documento; si cruza el tope, sus partes | 1 | la coherencia entre partes; si lo que afirma es verdad |
| `avance` | que el registro cuente el loop que dice contar | un archivo | 1 | las cifras; si el relato es el más claro |
| `canal` | que la adaptación del canal sea la que declara | un archivo | 1 | el alcance real de una publicación |
| `superficie` | que la superficie pública afirme lo que su fuente manda | un archivo | 1 | los números; si está al día |

El consenso no es una preferencia de calidad: es el coste que el riesgo
justifica. El código y el SQL piden tres muestras porque el plan pide
`stddev = 0`, y sin dos muestras no hay desviación que medir. Un documento no
necesita tres llamadas para decidir si afirma lo que su intent dice.

## LAS RAÍCES

| Prefijo | Ámbito |
|---|---|
| `vibe-tools/src/` | `codigo` |
| `vibe-tools/db/` | `sql` |
| `docs/arquitectura/loops/` | `documento` |
| `docs/avances/` | `avance` |
| `docs/canal/` | `canal` |

Los archivos sueltos del conjunto juzgable (`README.md`, `STATUS.md`,
`CONTRIBUTING.md`, los flujos de `.github`, `docs/controles.md` y
`docs/como-verificar.md`) se reconocen uno por uno, con su ámbito escrito. Si
un archivo suelto nuevo entra al conjunto, su ámbito se decide a mano, no por
parecido.

## UNA RUTA SIN ÁMBITO ES UNA PARADA

`ambitoDe` devuelve `null` para lo que no reconoce, y el pipeline lo convierte
en una parada. No hay ámbito por defecto: devolver `documento` para lo que no
se reconoce sería adivinar, y un pipeline que adivina el ámbito mide otra cosa
que la que dice medir.

La lista de lo que **no** se juzga vive en `tools/gate-budget.mjs`, con su
motivo escrito. Una ruta que no está ni en el conjunto juzgable ni en esa lista
no se juzga con la clase de al lado: se para, y quien la añada decide su
ámbito.

## LO QUE ESTE DISEÑO NO HACE

- **No decide qué archivos son juzgables.** Eso lo declara el guard de
  presupuesto, que es quien recorre el árbol.
- **No mide la coherencia entre artefactos.** Cada ámbito juzga su unidad.
- **No promete que el juez vea el conjunto.** Un documento partido se juzga por
  partes, y el agregado dice cuántas se sostienen.
