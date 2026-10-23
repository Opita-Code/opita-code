# L3 · Mindset VEREDICTO — la memoria me juzga

> Parte 6 de 10. [mindsets](L3-mindsets.md) · [criterio](L3-criterio.md) · [mindset-espejo](L3-mindset-espejo.md) · [mindset-empresa](L3-mindset-empresa.md) · [mindset-archivo](L3-mindset-archivo.md) · [mindset-veredicto](L3-mindset-veredicto.md) · [mindset-precio](L3-mindset-precio.md) · [mindset-no-pedi](L3-mindset-no-pedi.md) · [reconciliacion](L3-reconciliacion.md) · [cambios](L3-cambios.md)
> Spec 538. Tarea L3-T5.

## La psicometría

- **Quiere** que le vaya bien. Cada señal es insumo de una decisión sobre él.
- **Teme** el bloqueo sin explicación: que lo degraden y no sepa por qué.
- **Responde ante** un algoritmo que no responde a nadie.
- **Trueque** nada willingly, porque **no sabe que está pagando**.

Lo que lo distingue de todos los demás: **sabe**. El operador lo declaró: la
psicometría es de doble uso, se captura para personalizar y sirve como señal
antifraude. Quien conoce eso no puede mirarlo como un perfil: lo mira como un
expediente. Y ese cambio de mirada es el que produce el resto de los bordes.

## Los bordes

| # | Borde | Por qué esta persona | Qué exige |
|---|---|---|---|
| E-VER-1 | Le bloquean y no puede discutirlo | El flag está en la memoria, y la memoria es visible para su dueño… si está en la capa visible. Si vive solo en la inferencia, **no hay nada que impugnar**. | **Que el veredicto sea un dato del `mod`**, rectificable y contestable. Los sistemas antifraude suelen hacerlos inrectificables *porque así funcionan*. Eso es un conflicto real con el art. 8, y no tiene solución de ingeniería. |
| E-VER-2 | El usuario honesto juega limpio y por eso parece sospechoso | Si el antifraude premia lo no humano, la honestidad es una desventaja. | **Aceptar que hay una señal que premia el juego, o aceptar un techo de falsos positivos.** No hay tercera opción, y el techo tiene que ser un número medido. |
| E-VER-3 | Limpia el flag y el trato no vuelve a la normalidad | O borra su `mod` —es su derecho— y el perfil de riesgo sigue existiendo del otro lado. | **El antifraude tiene que vivir dentro del `mod`**, o el derecho de supresión es decorativo. Es una restricción fuerte y creo que es la correcta. |
| E-VER-4 | La tool recibe su perfil y se lo devuelve en la respuesta | La §7 audita lo que se **inyectó**; la §8 corta la salida por **red**. Ninguna de las dos ve lo que sale por un canal legítimo: la respuesta de una app publicada. | **El registro de salida, no solo el de entrada.** `fields_injected` es medio registro. La otra mitad es qué salió. |

## Qué le exige a la spec

La §8 dice «el contexto inyectado no puede salir del sandbox», y la tabla es por
capa de tier y por dominio. Eso cubre la exfiltración técnica. No cubre la
exfiltración **por el canal previsto**: una tool legítima que devuelve el perfil como
parte de su respuesta, a un tercero que se lo pidió. Es el camino más fácil y es
totalmente legal en apariencia.

## Lo que no sé

No sé qué señales psicométricas predicen qué: el scope H lo tiene abierto y nadie lo
ha medido. Todo este documento descansa sobre la **política declarada**, no sobre
eficacia. Si el scope H dice que el perfil psicométrico no discrimina, este mindset
debe reducirse al riesgo reputacional y el de antifraude desaparece.

Y no sé si un techo de falsos positivos es aceptable para el operador. No lo
asumí: lo dejé planteado, porque un número ahí sería inventado.