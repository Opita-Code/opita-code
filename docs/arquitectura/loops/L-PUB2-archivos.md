# L-PUB2 · Los archivos que faltaban

> Parte 1 de 2. [Cierre](L-PUB2-cierre.md) · [Índice](INDICE-publico.md)
> Spec 550. Tareas P1 a P5.

Qué le faltaba a un repositorio público para que un desconocido entre con
confianza y se quede. Todo lo de aquí se **midió** antes de escribirlo, y nada
se escribe a mano: lo que se puede derivar, se deriva.

## 1. LA IMAGEN QUE SE VE AL COMPARTIR EL ENLACE

No existía. Y es lo primero que ve alguien: un segundo entero decide si esto
es real o no.

Ahora hay dos archivos: `docs/social-preview.html`, que es la **fuente**, y
`docs/social-preview.png`, que es el resultado. Un PNG suelto en el repo es
un binario que nadie puede revisar ni reproducir; con la fuente al lado, la
imagen es un texto que se lee y un comando que se corre.

- `vibe-tools/tools/render-preview.mjs` la produce, y **verifica** lo que
  entrega: lienzo de 1280x640 exactos, peso por debajo de 1 MB, y el contraste
  de los pares de color que el propio HTML declara. La razón WCAG se calcula
  en el script, no se supone: 18.62:1 el texto principal y 9.58:1 el acento,
  los dos AAA. La paleta de Opita ya tenía su propia auditoría, y da mejor
  sobre negro puro; sobre el negro de la marca el número es menor y también
  AAA.
- Los colores son los de la marca (`opita-security/brand-assets/palette/`):
  negro `#0D0D0D` de fondo, `#FAFAFA` de texto, verde `#00D084` de acento. No
  se inventa una paleta.
- **La imagen no se sube con la API.** Se comprobó: `PUT`, `POST` y `PATCH`
  sobre `repos/{owner}/{repo}/social-preview` devuelven 404, y la documentación
  oficial solo describe la interfaz web. GitHub ya genera una automática, y esa
  sale con la descripción, las estrellas, el lenguaje y los topics: por eso se
  mejoraron esos dos últimos antes que cualquier otra cosa.

## 2. EL SITIO

El README es la puerta del repositorio: se ve cuando alguien ya sabe que esto
es un repositorio. El sitio es donde se llega desde un enlace, y tiene que
contestar en el primer vistazo que es esto y que está vivo.

`vibe-tools/scripts/generar-sitio.mjs` lo produce desde la **misma** fuente
que el README: seis páginas (la portada, el índice de avances, una por loop y
la imagen). No puede divergir del README porque sale de la misma línea, y el
modo `--check` lo verifica en la CI.

Cero peticiones de red: ni un CDN de fuentes, ni scripts, ni imágenes
externas. Un sitio que depende de la red no se ve igual en todas partes.

## 3. LA LICENCIA

Faltaba. En un repositorio público, sin licencia, el default legal es **todos
los derechos reservados**: nadie puede usar el código. Y el proyecto es
explícitamente «open source como base, fork y adaptación», así que la ausencia
de licencia contradecía lo que el proyecto dice ser.

Se eligió **MIT**, que es lo que corresponde a esa intención: uso, copia,
modificación y republicación, con la condición de conservar la licencia. Es
una decisión del operador y basta con una palabra para cambiarla (Apache-2.0 si
hace falta el grant explícito de patentes).

> **Lo que quedó vigente es otra.** El operador cambió la licencia después de
> este loop: hoy es **PolyForm Noncommercial 1.0.0**, con la restricción de uso
> comercial. Está en [la licencia](../../licencia.md). Lo que se eligió aquí
> fue el primer candidato, y se cambió; lo que no cambió es el motivo.

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

## 6. EL GUARD QUE YA NO SE QUEDA EN MIRANDO LO DE ARRIBA

Al escribir estos archivos aparecieron **cinco caracteres de otro sistema de
escritura dentro de dos palabras**: tres árabes en `CODE_OF_CONDUCT.md` y dos
en `SECURITY.md`. Los había escrito yo.

El content-guard caza la intrusión de guión, pero **no miraba los archivos de
la raíz**: la cobertura era `docs/` y `vibe-tools/src/`. Es decir, el guard
tenía un hueco justo donde estaba la superficie pública.

Corregido: ahora cubre la raíz, el sitio y `estado.json`. Y se **probó**:
se metió una intrusión de propósito en `SECURITY.md` y el guard la vio.
