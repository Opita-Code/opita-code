# L4-T5 · Los permisos: quién puede leer qué

> Qué decide la puerta de permisos, por qué son tres preguntas y no una, y qué
> no entrega. [El índice](INDICE.md) · [Las tres identidades](L4-identidades.md)

## LAS TRES PREGUNTAS

| Pregunta | Qué concede | Por qué va aparte |
|---|---|---|
| Contexto | Una categoría de memoria | El techo declarado es lo que la tool dice que necesita |
| Psicometría | Una finalidad, con su consentimiento | Es dato sensible (Ley 1581 art. 5), y el consentimiento es por finalidad |
| Escritura | Poder escribir en la memoria | Escribir no es «leer más» |

La psicometría **no** es un peldaño más de la escala de contexto. La spec de
boundary la declaraba como un cuarto valor de la misma unión
(`psychometric_optin`), y una unión no puede decir las dos cosas que una tool
de misiones necesita a la vez: historial **y** psicometría. Por eso es una capa
aparte, con su campo y su motivo de denegación.

## LA ESCALA, Y POR QUÉ ES MONÓTONA

`none` < `preferences` < `usage_history`. Quien tiene el historial puede
recomputar las preferencias, así que separarlas daría la sensación de un
permiso más fino sin serlo. Conceder historial concede también preferencias;
pedir preferencias con el historial concedido **no** mete el historial, porque
lo concedido es lo que se pidió, no el techo.

## LOS DOS TECHOS, Y EL PERMISO EFECTIVO

- **El techo declarado**: el perfil que la tool declara en su contrato. Es lo
  que dice necesitar.
- **La concesión**: lo que el operador concedió.

El permiso efectivo es el más bajo de los dos. Y la razón de la denegación
distingue cuál de los dos faltaba, porque mandar a la persona a cambiar el
sitio equivocado es un fallo de la puerta, no de quien la usa.

## DENY BY DEFAULT, SIN NINGÚN FLAG

Una política vacía es una política válida: no hay casilla que se pueda dejar
sin marcar. Una tool sin concesión no tiene permiso de nada, y una tool de
tercero sin concesión explícita tampoco.

La concesión lleva **id, versión y autor**. Por id solo, cambiar el código de
una tool conservaría su permiso; el permiso se concedió a un binario, no a un
nombre. Sin el autor, republicar con otro autor lo conservaría, y el autor es
quien responde por el código.

## LA INYECCIÓN NO ES UN FILTRO

Un filtro quita lo que no debe, y para quitarlo primero hay que tenerlo: el
dato entra en el proceso y sale de él. Aquí los campos no concedidos **ni se
copian**. No hay copia, no hay memoria intermedia, no hay un instante en el que
el dato sensible estuvo en el contexto.

## LO QUE NO ENTREGA

- **No lee la memoria.** Los campos los da el harness, único actor con
  autoridad de selección.
- **No audita.** La auditoría de cada inyección la escribe el harness, que es
  quien sabe qué se inyectó.
- **No aplica las mutaciones.** Decide; aplicar la decisión es del harness.
- **No sabe quién es la persona.** La consentimiento y la verdad los conoce el
  harness, no el runtime.

## LO QUE SE MEDIÓ

27 tests y 16 mutantes, todos en verde: 223 mutantes de 223 en 42 paquetes, y
398 tests de los que 4 se saltan (los de RLS, sin Docker). El detalle de qué
demuestra cada uno, y el hueco que dejó un mutante vivo y cómo se cerró, está
en [la verificación](L4-T5-verificacion.md).
