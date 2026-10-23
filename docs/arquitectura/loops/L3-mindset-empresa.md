# L3 · Mindset EMPRESA — la memoria es del proyecto y yo soy un rol

> Parte 4 de 10. [mindsets](L3-mindsets.md) · [criterio](L3-criterio.md) · [mindset-espejo](L3-mindset-espejo.md) · [mindset-empresa](L3-mindset-empresa.md) · [mindset-archivo](L3-mindset-archivo.md) · [mindset-veredicto](L3-mindset-veredicto.md) · [mindset-precio](L3-mindset-precio.md) · [mindset-no-pedi](L3-mindset-no-pedi.md) · [reconciliacion](L3-reconciliacion.md) · [cambios](L3-cambios.md)
> Spec 538. Tarea L3-T3.

## La psicometría

Aquí hay **dos personas** en el mismo escenario, con deseos opuestos sobre los mismos
bytes. La spec habla de «la persona» en singular y por eso ninguna de las dos cabe.

- **El fundador** quiere que el equipo compartido sepa. La memoria de la organización
  vale más que la suya. Teme que un empleado se vaya y se lleve el conocimiento.
- **El empleado** no eligió esto. Consintió su propio `mod`. No consintió estar en el
  `mod` de una empresa que no es suya.

Lo que los distingue: el fundador **es dueño de la organización y no de sus
empleados**, y casi todo el diseño asume que confunden las dos cosas.

## Los bordes

| # | Borde | Por qué estas dos personas | Qué exige |
|---|---|---|---|
| E-EMP-1 | El fundador es también la identidad legal y necesita que la tool lo sepa | El boundary prohíbe cruzar identidades. Pero alguien tiene que probar que es el fundador, y esa prueba va de la identidad legal a la de empresa. | **Un salto (assertion) que no es contexto**: «actor X tiene rol Y en la organización Z, verificado en T». Verificable, no inyectable, y opaco para la tool. |
| E-EMP-2 | El empleado nunca autorizó que su conducta se guardara en la organización | Los consentimientos C1-C5 cubren a *la persona* y su propio uso. Ninguno cubre «mi forma de trabajar es un activo de mi empleador». | **Un sexto consentimiento o una base legal distinta.** Es un hueco legal, no de ingeniería, y no lo cierro yo. |
| E-EMP-3 | El empleado se va | El fundador quiere que la memoria quede; el empleado quiere que la suya salga. Dos derechos incompatibles sobre los mismos bytes. | **Salida bilateral**: export individual *y* export de lo derivado de mí en el `mod` de la organización. La organización conserva agregado no reidentificable. |
| E-EMP-4 | Una tool publicada de un tercero escribe en la memoria de la empresa | El fundador es admin, pero la mutación no viene de él: viene de una tool que él no escribió. | **Admin no es autor.** El poder del fundador es sobre *quién entra*, no sobre *qué dice la memoria de la organización*. Sin esa separación, publicar una app es un canal de escritura en la memoria. |

## Qué le exige a la spec

1. La §4 dice «nunca cruza identidades», y E10 dice «solo si hay rol verificado».
   Ninguna de las dos dice **cómo llega el rol** sin convertirse en contexto. E10
   presupone lo que hay que construir.
2. La §5 dice que la tool no escribe porque escribiría la memoria de quien la
   instala. Eso evita que una tool cualquiera escriba, y no evita que una tool de
   *empresa* escriba en el `mod` de la empresa. La amenaza real no es el atacante
   externo: es un servicio autorizado que hace lo que su rol le permite.

## Lo que no sé

No sé si el marco colombiano permite el tratamiento en contexto de organización
con base distinta del consentimiento, y no lo voy a afirmar. Es una pregunta para
abogado, y está en el scope I.

Tampoco sé si el fundador, que es dueño, admin y usuario a la vez, tiene los mismos
derechos sobre el `mod` de su empresa que sobre su `mod` personal. Puede que no, y
si no los tiene, el orden de las identidades está mal puesto.