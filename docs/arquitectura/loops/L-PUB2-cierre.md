# L-PUB2 · Cierre

> Parte 2 de 2. [Archivos](L-PUB2-archivos.md) · [Indice](INDICE-publico.md)
> Spec 550. Tareas P1 a P5.

Lo que esta unidad deja atras y lo que entrega.

> **El veredicto del gate sobre este documento no se afirma aqui.** Un documento
> que afirma su propio veredicto no es juzgable de forma estable. El registro
> autoritativo esta en `dark_memory_judgment_history`, en el proyecto
> `opita-code`.

## QUE ENTREGA

| Archivo | Que es |
|---|---|
| `docs/social-preview.html` | La fuente de la imagen. Texto que se lee. |
| `docs/social-preview.png` | La imagen, 1280x640, 65 KB, verificada. |
| `vibe-tools/tools/render-preview.mjs` | El renderizador, con las mediciones. |
| `vibe-tools/tools/cdp.mjs` | Cliente CDP minimo, sobre el `WebSocket` de Node. |
| `vibe-tools/tools/capturar.mjs` | Captura de cualquier pagina a cualquier tamano. |
| `vibe-tools/scripts/generar-sitio.mjs` | El sitio, desde la misma fuente. |
| `vibe-tools/scripts/estado-comun.mjs` | El vocabulario compartido de los dos generadores. |
| `site/` | Seis paginas: portada, avances, una por loop, y la imagen. |
| `LICENSE` | MIT. |
| `CONTRIBUTING.md` | Como contribuir, y que no esta listo. |
| `SECURITY.md` | El canal de reporte, y que cuenta como vulnerabilidad. |
| `CODE_OF_CONDUCT.md` | Contributor Covenant 2.1. |
| `.github/ISSUE_TEMPLATE/` | Bug y propuesta. |
| `.github/PULL_REQUEST_TEMPLATE.md` | Que cambia, por que, y que NO hace. |
| `.github/dependabot.yml` | Vigilancia de las dos dependencias de desarrollo. |
| `.github/workflows/pages.yml` | El despliegue del sitio. |

## LO QUE SE MIDIO

| Medida | Resultado |
|---|---|
| Imagen | 1280x640 exactos, 65 KB, contraste 18.62:1 y 9.58:1, los dos AAA |
| Tipografia a 400 px | nombre 24 px, subtitulo 12 px |
| Desbordamiento | ninguno, medido en el navegador antes de capturar |
| Sitio | 6 paginas, cero peticiones de red, nada se sale del lienzo |
| Licencia | MIT |

## LO QUE NO SE MOVIO

**La imagen no se sube sola.** GitHub solo la acepta por la interfaz web: se
comprobo que la API no tiene endpoint. La imagen esta lista y medida; subirla
son tres clics en *Settings → Social preview*. Es el unico paso que queda a
mano de toda la unidad.

**La plantilla de la imagen dice «vibe-studio runtime · arquitectura ·
cumplimiento»**, que es la descripcion que el operador ya habia puesto en el
repositorio. La frase que de verdad explica el proyecto —que la memoria se
inyecta como contexto y nunca se lee desde una herramienta— **no cabe** en una
imagen de 1280x640 sin volverse ilegible a 400 px, y esa es la dimension en la
que se ve. Por eso esa frase va en el sitio y en el README, no en la imagen.

**El canal de distribucion sigue siendo una decision del operador.** El sitio
es del repositorio; llegar a el desde fuera del mundo es otra cosa.

## LO QUE SIGUE SIENDO DEL OPERADOR

1. **La vision.** El README la declara como hueco, y el guard comprueba que
   el hueco no se pierda en una regeneracion.
2. **La licencia, si MIT no es lo que quiere.** Una palabra y se cambia.
3. **El canal de distribucion.**
4. **Si el documento legal de cumplimiento va publico.**
5. Las tres decisiones de L3.

## LA REGLA QUE ESTA UNIDAD DEJA ADOPTADA

**Un guard que mira donde no toca no es un guard.** El content-guard llevaba
dos dias cazando intrusiones de guion en `docs/`, y no miraba los archivos de
la raiz: justo los que se leen primero. El hueco no lo delato el guard, lo
delato el texto que el guard no miraba. Cuando se escribe algo nuevo, la
primera pregunta es **que zona deja de cubrir**, no solo si el codigo nuevo
funciona.
