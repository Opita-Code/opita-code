# L-PUB2 · La comunidad

> Parte 2 de 3. [Archivos](L-PUB2-archivos.md) · [Guard](L-PUB2-guard.md) · [Índice](INDICE-publico.md)
> Spec 550. Tareas P1 a P5.

## 3. LA LICENCIA

Faltaba. En un repositorio público, sin licencia, el default legal es **todos
los derechos reservados**: nadie puede usar el código. Y el proyecto es
explícitamente «open source como base, fork y adaptación», así que la ausencia
de licencia contradecía lo que el proyecto dice ser.

Se eligió **MIT**, que es lo que corresponde a esa intención: uso, copia,
modificación y republicación, con la condición de conservar la licencia. Es
una decisión del operador y basta con una palabra para cambiarla (Apache-2.0 si
hace falta el grant explícito de patentes).

## 4. LOS ARCHIVOS DE LA COMUNIDAD

Tres, y cada uno dice la verdad sobre el proyecto:

- `CONTRIBUTING.md`: cómo se ejecuta, qué se espera de un cambio, y **qué
  partes del proyecto todavía no funcionan**. Esa última lista es lo más
  importante del archivo: sin ella, alguien pierde un día en algo que no está
  listo.
- `SECURITY.md`: el canal de reporte, que es la divulgación privada de
  vulnerabilidades de GitHub (habilitada en el repositorio). El archivo
  distingue lo que **sí** es una vulnerabilidad aquí —un camino por el que una
  herramienta lee o escribe la memoria sin permiso— de lo que **no** lo es: un
  hueco declarado, como la herramienta de búsqueda que todavía no tiene
  transporte.
- `CODE_OF_CONDUCT.md`: el Contributor Covenant 2.1.

## 5. LAS PLANTILLAS DE GITHUB

Dos formularios de issue (un bug y una propuesta, con el loop al que pertenece
cada propuesta), una plantilla de pull request que exige decir **qué no hace**
el cambio, y dependabot.
