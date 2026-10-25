# Como se verifica

> Que corre, que mide cada cosa, y que NO puede ver cada guard. Un guard que
> no dice que no ve se cita como si lo cubriera todo. La tabla completa,
> control por control, esta en [controles.md](controles.md).

## Los comandos

```bash
cd vibe-tools
npm install
npm run check                     # contenido, prosa, presupuesto, tests y mutacion
npm run verificar-estado          # el estado publicado, contrastado contra la realidad
npm run generar-estado -- --check # la superficie escrita, contra la fuente
npm run generar-sitio -- --check  # el sitio en disco, contra la fuente
```

`npm run check` es lo que corre en cada push. `npm run verificar-estado` es el
guard de la superficie publica: mide lo que el repositorio afirma de si mismo y
**cae si un numero no cuadra**. Los dos `--check` comparan lo publicado con lo
que sale de la fuente, y caen si alguien edito a mano un archivo generado.

## Por que el estado no se escribe a mano

Porque envejece. El README del paquete decia «Siguiente: L3» cuando L3 ya estaba
cerrado y validado, y decia 67 unidades juzgables cuando eran 77. Dos numeros
falsos, ninguno detectado, porque no habia nada que los mirara.

Ahora el estado vive en un solo archivo, `vibe-tools/estado.json`, y de ahi se
genera todo lo que el mundo ve: `STATUS.md`, `docs/avances.md`, un archivo por
loop en `docs/avances/`, las islas generadas del `README.md`, las notas de
release y las paginas del sitio. Lo que no se puede medir se declara; lo que se
puede medir, se mide.

El guard mide de verdad: corre `node --test` con informe TAP, el runner de
mutacion en modo `--json`, y el guard de presupuesto en modo `--json`. No lee
numeros de un archivo de texto, porque atar una verificacion al formato de una
salida humana es el enlace que se rompe en silencio.

## Antes de commitear: lo que se verifica es el commit

```bash
git update-index --really-refresh   # fuerza la relectura de lo que git da por igual
git add -A
git diff --cached --stat             # esto es lo que se commitea, miralo
```

El paso del medio no es supersticion. Git no re-hashea un archivo cuyo tamano y
cuyo mtime coinciden con lo que su indice tiene registrado: da por hecho que no
cambio. Un numero que se puede cambiar **sin cambiar el tamano del archivo** es
el peor caso para esa comprobacion rapida.

Medido el 2026-10-25: el paso de 103 a 104 unidades juzgables es el mismo
numero de bytes, el mtime del archivo habia quedado igual al que el indice
tenia, y `git add -A` no lo vio. El commit salio con la fuente diciendo 103 y
la superficie escrita diciendo 104. El arbol de trabajo decia una cosa y el
commit otra.

Lo que lo atrapo fue la CI, y no por casualidad: **la CI hace checkout del
commit y lo mide ahi**, no en el arbol de trabajo de quien commitea. Un guard
que mirase el arbol de trabajo no lo habria visto, y ese fue el fallo entero.

Por eso la regla es doble: no dejar que el commit mienta, y medir el commit y
no el arbol.

## La regla que sostiene todo esto

**El guard caza el numero, la persona caza el recorte.** Son dos capas distintas
y la segunda no es opcional: un guard que se puede satisfacer editando el
contenido que deberia proteger no es un guard. Y al reves: un texto que el
guard no puede ver, como una prosa con el ingles mal puesto, solo lo caza la
lectura de vuelta. Por eso ninguna de las dos capas basta sola.

## La estabilidad de las medidas

Los finales de linea estan fijados a LF en `.gitattributes`. No es cosmetico: el
juez trocea el artefacto sobre los bytes **crudos**, y si el archivo trae CRLF
mide mas de lo que el guard permitio. Seis documentos estaban en esa banda de
divergencia, y uno de ellos salio neutral por el troceado, no por el documento.
La independencia del checkout se consigue **fijando** los finales de linea, no
normalizando dentro del guard: normalizar en el punto de medicion hacia el
guard estable y lo dejaba mintiendo sobre lo que el juez ve.
