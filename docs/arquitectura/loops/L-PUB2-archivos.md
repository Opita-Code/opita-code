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

La licencia, los archivos de la comunidad y las plantillas de GitHub están en
[comunidad](L-PUB2-comunidad.md). El hueco del guard, que apareció al escribir
esos archivos, está en [guard](L-PUB2-guard.md).
