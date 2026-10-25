# L-PUB · Lo que no se movió, y lo que sigue abierto

> [Cierre](L-PUB-cierre.md) · [Correcciones](L-PUB-correcciones.md) · [Índice](INDICE-publico.md)
> Spec 540.

## Lo que no se movió

**El veredicto del juez no corre en CI.** El gate de drift vive en
`dark-memory-mcp`, que no es parte de este repositorio. Los cuatro guards que
sí corren en CI son locales y deterministas; el juez necesita el binario del
MCP y una credencial. Es un hueco real y declarado: hoy CI verifica el código,
no el texto.

**La imagen de social preview no se sube desde la API.** GitHub solo la acepta
por la interfaz web. El repositorio tiene hoy la autogenerada, que sale con el
nombre, la descripción, las estrellas y el lenguaje. Se puede mejorar sin
subir nada, tocando descripción y topics.

**La página estática no se construye.** El canal de distribución es una decisión
abierta del operador, y montar el contenedor antes de decidir el canal sería
decidir por él.

## Lo que sigue abierto, y sigue siendo del operador

1. **La visión.** El para qué de Opita Code, a quien le duele y por qué se
   construye. No sale de los documentos: sale del operador. El README la
   declara como hueco, y el guard comprueba que el hueco no se pierda.
2. **El canal de distribución.** GitHub es el argumento, no el canal de la
   audiencia que no programa.
3. **La licencia.** Sin licencia, el default legal en un repo público es todos
   los derechos reservados.
4. **Si el documento legal de cumplimiento va público.**
5. Las tres decisiones de L3, que este loop no abre ni cierra: el eje por
   creencia, cuál se degrada entre anonimato y antifraude, y el sexto
   consentimiento con su techo de falsos positivos.
