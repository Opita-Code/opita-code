# L3 · Qué hay que cambiar en la spec

> Parte 10 de 10. [mindsets](L3-mindsets.md) · [criterio](L3-criterio.md) · [mindset-espejo](L3-mindset-espejo.md) · [mindset-empresa](L3-mindset-empresa.md) · [mindset-archivo](L3-mindset-archivo.md) · [mindset-veredicto](L3-mindset-veredicto.md) · [mindset-precio](L3-mindset-precio.md) · [mindset-no-pedi](L3-mindset-no-pedi.md) · [reconciliacion](L3-reconciliacion.md) · [cambios](L3-cambios.md)
> Spec 538. Tarea L3-T8.

Lo que la spec tiene que absorber después de contrastarla con seis personas. Va
aparte de [reconciliación](L3-reconciliacion.md) porque son cosas distintas:
aquella **audita lo que ya está escrito**, esta **es la lista de lo que falta**.

---

## Lo que hay que añadir a la spec

Cuatro cosas, y solo dos son técnicas:

1. **Procedencia por campo**: declarado, observado o inferido, con su base. Es lo
   que hace respondibles el derecho de rectificación y el de supresión, y hoy el
   `mod` no lo tiene.
2. **Registro de salida**, no solo de entrada. `fields_injected` es la mitad del
   dato.
3. **La aserción de rol**, que no es contexto y no es inyectable.
4. **Un sexto consentimiento**, o una base legal distinta, para el tratamiento en
   contexto de organización. Esto no lo puedo cerrar yo: es una pregunta de abogado,
   y es el hueco más grande que salió de los seis documentos.

## Lo que queda abierto para el operador

Tres cosas, y las tres son decisiones suyas:

1. **El eje del corte.** Eligí la creencia sobre qué es la memoria. Es defendible
   y está razonado, pero es una elección entre varias posibles, y cambiarlo cambia
   los seis documentos.
2. **Anonimato contra antifraude.** No hay implementación que cumpla ambos. Hay que
   decidir cuál se degrada, y decirlo en voz alta en lugar de que se degrade solo.
3. **El sexto consentimiento y el techo de falsos positivos.** Los dos son números y
   políticas que no voy a inventar.
