# L-PUB · Errores de este loop

> Parte 2 de 2. [Correcciones](L-PUB-correcciones.md) · [Cierre](L-PUB-cierre.md) · [Indice](INDICE-publico.md)
> Spec 540. Tareas P1 a P7.

## Los errores que cometi dentro de esta unidad

Cuatro, y el guard los atrapo a todos:

1. **La sustitucion dentro del JSON.** Al portabilizar la sonda, meti la raiz
   del repo con barras invertidas dentro del texto JSON serializado. En JSON la
   barra es un caracter de escape, asi que `C:\Users\nicou` se leia como
   `C:<salto>Users<retorno>nicou`, y el servidor se colgaba. La leccion: si se
   sustituye dentro de una representacion, hay que respetar la representacion.
   Se sustituye sobre los **valores**, no sobre el texto.
2. **Un identificador de una letra de diferencia.** El mismo nombre escrito de
   dos maneras, y el que se usaba no era el que se habia declarado: uno tenia
   once letras y el otro diez. Lo produjo el error mas tonto posible y se vio
   en la primera corrida.
3. **El README en 4249 B.** El tope son 4096. No se amortiguo: se acorto la
   seccion de vision, que duplicaba el texto de la fuente, y la verificacion se
   movio a su propio documento. **Partir por concepto, nunca amputar.**
4. **Un numero viejo en la fuente.** Al meter la superficie nueva dentro del
   gate, las unidades juzgables pasaron de 77 a 85 y la fuente seguia diciendo
   77. **El guard lo dijo en la primera corrida**, que es exactamente lo que
   existe para decir eso.

Y uno de la sesion anterior, que este loop hereda: la sonda no hacia lo que su
nombre prometia porque el judge resolvia el artefacto contra el directorio de
trabajo del proceso, no contra el repositorio. Por eso la ruta tiene que ser
absoluta, y por eso ahora se deriva de la ubicacion del propio archivo.
