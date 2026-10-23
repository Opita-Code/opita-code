# L-PUB2 · La comunidad

> Parte 2 de 3. [Archivos](L-PUB2-archivos.md) · [Guard](L-PUB2-guard.md) · [Indice](INDICE-publico.md)
> Spec 550. Tareas P1 a P5.

## 3. LA LICENCIA

Faltaba. En un repositorio publico, sin licencia, el default legal es **todos
los derechos reservados**: nadie puede usar el codigo. Y el proyecto es
explicitamente «open source como base, fork y adaptacion», asi que la ausencia
de licencia contradecía lo que el proyecto dice ser.

Se eligio **MIT**, que es lo que corresponde a esa intencion: uso, copia,
modificacion y republicacion, con la condicion de conservar la licencia. Es
una decision del operador y basta con una palabra para cambiarla (Apache-2.0 si
hace falta el grant explicito de patentes).

## 4. LOS ARCHIVOS DE LA COMUNIDAD

Tres, y cada uno dice la verdad sobre el proyecto:

- `CONTRIBUTING.md`: como se ejecuta, que se espera de un cambio, y **que
  partes del proyecto todavia no funcionan**. Esa ultima lista es lo mas
  importante del archivo: sin ella, alguien pierde un dia en algo que no esta
  listo.
- `SECURITY.md`: el canal de reporte, que es la divulgacion privada de
  vulnerabilidades de GitHub (habilitada en el repositorio). El archivo
  distingue lo que **si** es una vulnerabilidad aqui —un camino por el que una
  herramienta lee o escribe la memoria sin permiso— de lo que **no** lo es: un
  hueco declarado, como la herramienta de busqueda que todavia no tiene
  transporte.
- `CODE_OF_CONDUCT.md`: el Contributor Covenant 2.1.

## 5. LAS PLANTILLAS DE GITHUB

Dos formularios de issue (un bug y una propuesta, con el loop al que pertenece
cada propuesta), una plantilla de pull request que exige decir **que no hace**
el cambio, y dependabot.
