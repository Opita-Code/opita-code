# Cómo se verifica

> Qué corre, qué mide cada cosa, y qué NO puede ver cada guard. Un guard que
> no dice que no ve se cita como si lo cubriera todo. La tabla completa,
> control por control, está en [controles.md](controles.md).

## Los comandos

```bash
cd vibe-tools
npm install
npm run check                     # contenido, prosa, presupuesto, tests y mutación
npm run verificar-estado          # el estado publicado, contrastado contra la realidad
npm run generar-estado -- --check # la superficie escrita, contra la fuente
npm run generar-sitio -- --check  # el sitio en disco, contra la fuente
```

`npm run check` es lo que corre en cada push. `npm run verificar-estado` es el
guard de la superficie pública: mide lo que el repositorio afirma de sí mismo y
**cae si un número no cuadra**. Los dos `--check` comparan lo publicado con lo
que sale de la fuente, y caen si alguien editó a mano un archivo generado.

## Por qué el estado no se escribe a mano

Porque envejece. El README del paquete decía «Siguiente: L3» cuando L3 ya estaba
cerrado y validado, y decía 67 unidades juzgables cuando eran 77. Dos números
falsos, ninguno detectado, porque no había nada que los mirara.

Ahora el estado vive en un solo archivo, `vibe-tools/estado.json`, y de ahí se
genera todo lo que el mundo ve: `STATUS.md`, `docs/avances.md`, un archivo por
loop en `docs/avances/`, las islas generadas del `README.md`, las notas de
release y las páginas del sitio. Lo que no se puede medir se declara; lo que se
puede medir, se mide.

El guard mide de verdad: corre `node --test` con informe TAP, el runner de
mutación en modo `--json`, y el guard de presupuesto en modo `--json`. No lee
números de un archivo de texto, porque atar una verificación al formato de una
salida humana es el enlace que se rompe en silencio.

## Antes de commitear: lo que se verifica es el commit

```bash
git update-index --really-refresh   # fuerza la relectura de lo que git da por igual
git add -A
git diff --cached --stat             # esto es lo que se commitea, míralo
```

El paso del medio no es superstición. Git no re-hashea un archivo cuyo tamaño y
cuyo mtime coinciden con lo que su índice tiene registrado: da por hecho que no
cambió. Un número que se puede cambiar **sin cambiar el tamaño del archivo** es
el peor caso para esa comprobación rápida.

Medido el 2026-10-25: el paso de 103 a 104 unidades juzgables es el mismo
número de bytes, el mtime del archivo había quedado igual al que el índice
tenía, y `git add -A` no lo vio. El commit salió con la fuente diciendo 103 y
la superficie escrita diciendo 104. El árbol de trabajo decía una cosa y el
commit otra.

Lo que lo atrapó fue la CI, y no por casualidad: **la CI hace checkout del
commit y lo mide ahí**, no en el árbol de trabajo de quien commitea. Un guard
que mirase el árbol de trabajo no lo habría visto, y ese fue el fallo entero.

Por eso la regla es doble: no dejar que el commit mienta, y medir el commit y
no el árbol.

## La regla que sostiene todo esto

**El guard caza el número, la persona caza el recorte.** Son dos capas distintas
y la segunda no es opcional: un guard que se puede satisfacer editando el
contenido que debería proteger no es un guard. Y al revés: un texto que el
guard no puede ver, como una prosa con el inglés mal puesto, solo lo caza la
lectura de vuelta. Por eso ninguna de las dos capas basta sola.

## La estabilidad de las medidas

Los finales de línea están fijados a LF en `.gitattributes`. No es cosmético: el
juez trocea el artefacto sobre los bytes **crudos**, y si el archivo trae CRLF
mide más de lo que el guard permitió. Seis documentos estaban en esa banda de
divergencia, y uno de ellos salió neutral por el troceado, no por el documento.
La independencia del checkout se consigue **fijando** los finales de línea, no
normalizando dentro del guard: normalizar en el punto de medición hacia el
guard estable y lo dejaba mintiendo sobre lo que el juez ve.
