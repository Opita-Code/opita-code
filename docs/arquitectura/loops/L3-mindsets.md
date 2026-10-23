# L3 · Por qué los bordes se derivan de la gente

> Parte 1 de 10. [mindsets](L3-mindsets.md) · [criterio](L3-criterio.md) · [mindset-espejo](L3-mindset-espejo.md) · [mindset-empresa](L3-mindset-empresa.md) · [mindset-archivo](L3-mindset-archivo.md) · [mindset-veredicto](L3-mindset-veredicto.md) · [mindset-precio](L3-mindset-precio.md) · [mindset-no-pedi](L3-mindset-no-pedi.md) · [reconciliacion](L3-reconciliacion.md) · [cambios](L3-cambios.md)
> Spec 538. Tarea L3-T1.

El boundary `MEMORY` tiene 10077 B en
[boundary-memory-v1.md](../boundary-memory-v1.md) y el guard de presupuesto **no lo
juzga**: lo declaró no juzgable y escribió que se re-verifica en L3. Y sus 12 edge
cases no son de personas.

Este documento explica por qué, y de dónde salen los que sí.

---

## El diagnóstico: E1-E12 miran un solo lado

Los doce son correctos. Ninguno está mal. Lo que hacen es describir **qué pasa
cuando una tool cruza el límite con la memoria de la misma persona que la invoca**.
E1 pide contexto, E2 contexto vacío, E5 cruza identidades de la misma persona, E11
dos personas con la misma tool: en todos, el que pide y el dueño del dato son **la
misma persona**.

Eso es un caso, y es el fácil. El boundary se rompe cuando **quién pide, de quién
es el dato y quién lo lee no son la misma persona**, y esa combinación no aparece en
ninguna de las doce filas.

Peor: la spec habla siempre de «la persona», en singular y sin calificar. En
empresa hay **dos** personas con deseos opuestos sobre los mismos bytes. En
veredicto hay una persona y un algoritmo que no responde. En archivo hay una
persona y todos los demás. El singular esconde el problema.

## El eje del corte

No se corta por edad, ni por rol, ni por cohorte. Se corta por **qué cree esta
persona que su memoria es**:

> Una persona y su memoria se rompen cuando lo que el dato **es** y lo que la
> persona **cree que es** no coinciden. El corte es por la creencia, porque la
> creencia es lo que produce el reclamo.

De ahí salen seis, y cada uno nace de una evidencia ya guardada:

| Mindset | Creencia sobre su memoria | Evidencia que lo sostiene |
|---|---|---|
| **Espejo** | es mío y me representa | el export es derecho, no feature; art. 8 |
| **Empresa** | es del proyecto y yo soy un rol | fundador = admin; art. 10 confidencialidad |
| **Archivo** | lo van a leer otros | nombre público obligatorio; perfil anónimo |
| **Veredicto** | me juzga | psicometría es señal antifraude; D3 sensible |
| **Precio** | es con lo que pago | misiones sobre psicometría; saldo no retirable |
| **No pedí** | esto se recogió igual | KYC obligatorio **antes** de consentir |

Seis, y no más, porque seis son los que **cambian una decisión de diseño**. Un
mindset que no cambia nada no es un mindset: es un detalle de copy.

Cada mindset se razona en su documento: [espejo](L3-mindset-espejo.md),
[empresa](L3-mindset-empresa.md), [archivo](L3-mindset-archivo.md),
[veredicto](L3-mindset-veredicto.md), [precio](L3-mindset-precio.md),
[no pedí](L3-mindset-no-pedi.md).

## Qué queda de E1-E12

Los doce sobreviven como **pruebas de runtime**: son correctos y hacen falta. Lo
que cambia es que dejan de ser la *fuente* del diseño y pasan a ser su
*comprobación*. La spec de boundary los escribió antes de preguntarse quién los
iba a sufrir.

Qué sobrevive, qué se rompe y qué hay que añadir, regla por regla, está en
[reconciliación](L3-reconciliacion.md).

El criterio que decide qué borde se escribe y hasta dónde llega este
razonamiento está aparte, en [criterio](L3-criterio.md): los límites de un método
no son la misma afirmación que sus conclusiones, y mezclarlos hace que el lector
no pueda aceptarlos sin tirar el resto.
