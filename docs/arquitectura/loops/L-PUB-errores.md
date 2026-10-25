# L-PUB · Errores de este loop

> Parte 2 de 2. [Correcciones](L-PUB-correcciones.md) · [Cierre](L-PUB-cierre.md) · [Índice](INDICE-publico.md)
> Spec 540. Tareas P1 a P7.

## Los errores que cometí dentro de esta unidad

Cuatro, y el guard los atrapó a todos:

1. **La sustitución dentro del JSON.** Al portabilizar la sonda, metí la raíz
   del repo con barras invertidas dentro del texto JSON serializado. En JSON la
   barra es un carácter de escape, así que `C:\Users\nicou` se leía como
   `C:<salto>Users<retorno>nicou`, y el servidor se colgaba. La lección: si se
   sustituye dentro de una representación, hay que respetar la representación.
   Se sustituye sobre los **valores**, no sobre el texto.
2. **Un identificador de una letra de diferencia.** El mismo nombre escrito de
   dos maneras, y el que se usaba no era el que se había declarado: uno tenía
   once letras y el otro diez. Lo produjo el error más tonto posible y se vio
   en la primera corrida.
3. **El README en 4249 B.** El tope son 4096. No se amortiguó: se acortó la
   sección de visión, que duplicaba el texto de la fuente, y la verificación se
   movió a su propio documento. **Partir por concepto, nunca amputar.**
4. **Un número viejo en la fuente.** Al meter la superficie nueva dentro del
   gate, las unidades juzgables pasaron de 77 a 85 y la fuente seguía diciendo
   77. **El guard lo dijo en la primera corrida**, que es exactamente lo que
   existe para decir eso.

Y uno de la sesión anterior, que este loop hereda: la sonda no hacía lo que su
nombre prometía porque el judge resolvía el artefacto contra el directorio de
trabajo del proceso, no contra el repositorio. Por eso la ruta tiene que ser
absoluta, y por eso ahora se deriva de la ubicación del propio archivo.
