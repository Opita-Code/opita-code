# L3 · Mindset PRECIO — la memoria es con lo que pago

> Parte 7 de 10. [mindsets](L3-mindsets.md) · [criterio](L3-criterio.md) · [mindset-espejo](L3-mindset-espejo.md) · [mindset-empresa](L3-mindset-empresa.md) · [mindset-archivo](L3-mindset-archivo.md) · [mindset-veredicto](L3-mindset-veredicto.md) · [mindset-precio](L3-mindset-precio.md) · [mindset-no-pedi](L3-mindset-no-pedi.md) · [reconciliacion](L3-reconciliacion.md) · [cambios](L3-cambios.md)
> Spec 538. Tarea L3-T6.

## La psicometría

- **Quiere** capacidad ahora. Misiones, personalización, un companion que recuerda.
- **Teme** perder acceso a mitad de trabajo, y que el precio suba cuando ya depende de él.
- **Responde ante** nadie. Esto es una transacción, no un vínculo.
- **Trueque** memoria por capacidad, y **a diferencia de los otros cinco, sabe que
  está pagando**.

Lo que lo distingue: el único cuyo reclamo no es «me tomaste un dato» sino «me
cambiaste el precio». Eso cambia dónde está el daño: no en la frontera de datos,
sino en la frontera de valor.

## Los bordes

| # | Borde | Por qué esta persona | Qué exige |
|---|---|---|---|
| E-PRE-1 | Revoca el consentimiento y el producto deja de funcionar | La spec dice que las inyecciones cesan. Correcto. Lo que nadie escribió es qué **es** el producto sin ellas. | **La degradación como estado declarado, no como fallo.** Y revocar debe decir en palabras lo que se pierde, antes de hacerlo. Sin eso, el principio de libertad se cumple en la forma y se incumple en la práctica. |
| E-PRE-2 | Tiene dos cosas que no puede recuperar y solo una se puede exportar | El saldo es recargable y no retirable; el `mod` es único e inexportable hacia afuera. Dos activos irreversibles, y el derecho de portabilidad cubre uno. | **Nombrar el saldo como no-dato.** Está anotado como abierto con reglas fiscales propias y no lo resuelvo. |
| E-PRE-3 | Su memoria se vende sin que él lo entendiera así | Las misiones leen su perfil para generar trabajo **para Opita**. Él consintió «misiones personalizadas», que se lee como *tú recibes misiones*, no como *tu perfil decide a qué mercado va tu atención*. | **Que C4 diga a quién se sirve.** El texto actual no nombra al beneficiario, y por finalidad (art. 4.1.b) eso es insuficiente. |
| E-PRE-4 | Depende y luego no puede comparar | Después de un tiempo ya no sabe cuánto costaría esto en otro sitio, porque nunca eligió entre alternativas. | **Honestidad en la degradación.** Si el precio es un derecho, el derecho real es poder irse y ver qué paga. |

## Qué le exige a la spec

La §6 trata el consentimiento como un interruptor: se concede o no, y mientras esté
concedido se inyecta. Eso describe un permiso, no un precio. Un precio tiene tres
partes que el permiso no tiene: **qué se recibe a cambio, qué se pierde al retirar y
quién se beneficia**. Solo la primera está implícita.

Y hay una asimetría que conviene decir: para este mindset, la memoria es el
**único** activo del que no puede salir. El resto de la plataforma está construida
sobre local-first: el código y los archivos se quedan en el dispositivo. La
plataforma respalda su mayor costo con el único mecanismo que no admite salida.

## Lo que no sé

No sé el importe ni la forma de la degradación. Diseñar ese estado es trabajo de
producto y el precio lo pone el operador.

Tampoco sé si el saldo debería salir por `.opitapack` o si la salida física lo
convierte en un instrumento que la plataforma no quiere tener. Eso es una decisión de política y no
la invento.
