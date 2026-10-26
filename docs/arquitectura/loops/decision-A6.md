# L3 · Decisión A6: el anonimato contra el antifraude

> La pregunta que quedó abierta en L3, con la evidencia, las opciones y lo que
> costaría cada una. Es tuya: [lo que L3 dejó abierto](L3-cambios.md). La
> otra mitad de esta pregunta —si el flag de antifraude es rectificable— está
> en [A7-techo](decision-A7-techo.md), porque es una obligación del art. 8
> y no una preferencia.

## La pregunta, tal como está declarada

| | |
|---|---|
| Id | A6 |
| Quién decide | el operador |
| Qué bloquea | el diseño del mod antifraude |
| La pregunta | cuál se degrada si hay que elegir: el anonimato o el antifraude |

## Lo que YA está decidido, y no se vuelve a discutir

- El **perfil anónimo existe**, y su razón es una: para que lo que haga no se
  pegue a su nombre legal (E-ARC-1).
- El **boundary** es duro: el contexto inyectado nunca cruza identidades, y
  para el anónimo «nada del legal ni de la empresa» (boundary §4).
- El **antifraude no es un deber legal hacia la persona**: es una decisión
  del producto sobre su riesgo. El derecho de rectificación (art. 8) sí lo es.

## La evidencia: el nudo, en una línea

> Para ser antifraude hay que localizar a la persona: psicometría, IP,
> dispositivo. Para que el anónimo sea anónimo hay que no hacerlo. **Son el
> mismo dato en direcciones opuestas. No hay implementación que cumpla
> ambos.** Hay que elegir cuál se degrada y decirlo en voz alta.
> — E-ARC-1, `L3-mindset-archivo.md`

## Las opciones

**Opción 1 — se degrada el anonimato.** El antifraude localiza: psicometría,
IP, dispositivo. El perfil anónimo sigue existiendo, pero no es anónimo, y
el cruce deja de ser taboo: hay que declararlo, como ya se hace con el
nombre público del dueño de una empresa (E-ARC-4: «un cruce declarado, con
un solo campo»). Y el dato psicométrico —D3, sensible bajo la Ley 1581—
entra en el perfil anónimo, lo que cambia su base legal y su consentimiento.

**Opción 2 — se degrada el antifraude.** El perfil anónimo no se localiza:
nada de psicometría, IP ni dispositivo. El abuso que pasa por ese perfil no
se detecta, y el perfil se vuelve el punto más débil del sistema. No es
gratis: es decidir que el sitio se va a usar para lo que no se puede hacer en
la identidad legal.

**Opción 3 — se degrada el flag.** El veredicto de antifraude es un dato del
`mod`, rectificable y contestable. El antifraude pierde dientes —quien abusa
puede limpiar su marca— y el riesgo se traslada a la identidad legal, que sí
se puede impugnar. La objeción fuerte: con el flag rectificable, el
antifraude es decorativo.

**Opción 4 — la 2 y la 3 juntas.** El anónimo no se localiza **y** el flag es
rectificable: el antifraude aplica solo donde la identidad es rectificable, y
el anónimo queda fuera de su alcance.

## Mi recomendación

**Opción 4, y el precio dicho en voz alta: el perfil anónimo es el punto más
débil del sistema.**

La razón es el orden de las obligaciones. El anonimato es una promesa
pública del producto y la Ley protege el dato desde el lado de la persona;
el antifraude no es un deber legal hacia nadie, es una decisión del producto
sobre su riesgo. Cuando las dos chocan, se degrada la que el producto
eligió, no la que protege la ley.

Y hay una razón técnica que empuja lo mismo: **la opción 1 mete el dato
psicométrico dentro del perfil anónimo**, y eso no es un problema de diseño,
es un problema de base legal y de consentimiento (D3 es sensible, y el
documento legal del repo ya lo clasifica así). La opción 1 no es «el
antifraude localiza»: es «el antifraude hace que el dato sensible cruce a la
identidad equivocada».

Lo que no quiero es que elijas por default. El repo lo dice en E-ARC-1: hay
que elegir cuál se degrada **y decirlo en voz alta en lugar de que se degrade
solo**. Elegir la 4 significa que el perfil anónimo es donde se abusa, y que
eso es una decisión y no un accidente.

## Qué necesito de ti

**A6: 1, 2, 3 o 4.**
