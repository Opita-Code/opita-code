# El canal

> Cómo se distribuye Opita Code: Facebook, Instagram y LinkedIn. Decidido por
> el operador el 2026-10-25. GitHub es el argumento, el sitio es la puerta sin
> cuenta, el canal es el disparador y el release es el archivo.

## Las reglas, y de dónde salen

- **Cada plataforma lleva su propia adaptación nativa.** El mismo texto
  copiado entre plataformas se penaliza, y el texto de Instagram y LinkedIn no
  tienen ni la misma forma ni el mismo registro.
- **El enlace no va en el cuerpo del post.** En LinkedIn un enlace externo en
  el texto cuesta entre un 40 % y un 60 % de alcance: va en el primer
  comentario. En Instagram el enlace del caption ni siquiera es pulsable: va
  en la bio.
- **Las cifras son las medidas.** 328 pruebas, 190 de 190 mutaciones
  detectadas, 129 unidades juzgables. Si un número no está medido, no se
  escribe.
- **La distribución es manual.** La máquina no publica: la persona copia y
  pega. Por eso no aplican las reglas de sigilo del navegador: no hay
  automatización que detectar.

## Las bios, y dónde va el enlace

El enlace es el sitio: `https://opita-code.github.io/opita-code/`. Es la puerta
sin cuenta, y lleva la fecha de la última medición. El repositorio es el
argumento para quien quiera leer el código, pero el que llega por el canal
no sabe programar: por eso el enlace no es el repositorio.

| Plataforma | Dónde va el enlace | Texto |
|---|---|---|
| Facebook | campo «sitio web» | Opita Code: el lugar donde tu memoria te pertenece |
| Instagram | enlace de la bio | Opita Code: el lugar donde tu memoria te pertenece. Sin saber programar. |
| LinkedIn | campo «sitio web» + primer comentario del post | La memoria de una persona, en el sitio equivocado. Cómo se está construyendo, con los números medidos |

## Los horarios, y el orden

America/Bogota. Los tres no el mismo día: el mismo avance contándose tres
veces el mismo día se parece a un spam.

| Día | Plataforma | Hora |
|---|---|---|
| martes | Instagram | 11:00 - 13:00 |
| miércoles | Facebook | 9:00 - 11:00 |
| jueves | LinkedIn | 8:00 - 10:00 |

## La cadencia

Una entrada por plataforma por semana, con significado. Es la que se puede
sostener un año, que es la única que importa: una frecuencia que se agota
deja de existir, y un canal muerto no es un canal pequeño, es un canal que
avisa de nada.

## Las entradas

Cada entrada es un documento: lo que se publicó, en cada plataforma, con el
texto exacto. El índice está en [canal/INDICE.md](canal/INDICE.md).

Y una entrada entra en el índice **cuando se publica**, no antes. El índice es
el registro de lo publicado, y el guard de cifras lo usa para saber qué medir:
lo que todavía no está en el índice va a salir, y sus cifras tienen que ser las
de hoy; lo que ya está, es un registro y sus cifras son las de aquel día.

## Las imágenes, y por qué hay una por plataforma

La tarjeta dice lo que el proyecto promete, y esa frase sale de la fuente: el
renderizador la toma de `vibe-tools/estado.json`. Si la promesa cambia, la
imagen cambia, y no puede quedar una frase vieja que diga otra cosa.

Un HTML, cuatro formatos. El diseño se mide en unidades de lienzo, así que lo
que se lee a 400 px de ancho (lo que muestra un feed) se lee igual en todos:

| Archivo | Lienzo | Para |
|---|---|---|
| `docs/social-preview.png` | 1280x640 | la vista previa de un enlace: GitHub y el og:image del sitio |
| `docs/posts/instagram.png` | 1080x1350 | Instagram, 4:5 |
| `docs/posts/linkedin.png` | 1200x627 | LinkedIn, 1.91:1 |
| `docs/posts/facebook.png` | 1080x1080 | Facebook y el perfil de Instagram, 1:1 |

La fuente es `docs/social-preview.html` y el procedimiento es
`vibe-tools/tools/render-preview.mjs`, que ademas mide el contraste, comprueba
que nada se sale del lienzo y falla si el PNG pesa mas de 1 MB.

## Las cuentas

Facebook y LinkedIn en las personales; Instagram en la del proyecto
(`opita_dev`). Y en la del proyecto el post no dice «mi bio», porque la que
habla es Opita Code y no una persona.
