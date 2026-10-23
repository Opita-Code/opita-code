# L3 · Mindset ARCHIVO — esto lo van a leer otros

> Parte 5 de 10. [mindsets](L3-mindsets.md) · [criterio](L3-criterio.md) · [mindset-espejo](L3-mindset-espejo.md) · [mindset-empresa](L3-mindset-empresa.md) · [mindset-archivo](L3-mindset-archivo.md) · [mindset-veredicto](L3-mindset-veredicto.md) · [mindset-precio](L3-mindset-precio.md) · [mindset-no-pedi](L3-mindset-no-pedi.md) · [reconciliacion](L3-reconciliacion.md) · [cambios](L3-cambios.md)
> Spec 538. Tarea L3-T4.

## La psicometría

- **Quiere** ser encontrado y ser reconocible. La reputación es el activo.
- **Teme** que algo suyo se use fuera del contexto en que lo dijo.
- **Responde ante** gente que no sabe quién es.
- **Trueque** privacidad por visibilidad, y solo acepta el trueque en el campo de
  juego donde le sirve: entre pares, no frente a un tercero.

Lo que lo distingue: **cree que su memoria tiene forma pública**, y toda la spec
del boundary trata de inyección a tools. Nadie diseñó el otro sentido del flujo: lo
que sale hacia personas. La §7 audita entradas. No hay auditoría de salidas.

## Los bordes

| # | Borde | Por qué esta persona | Qué exige |
|---|---|---|---|
| E-ARC-1 | El perfil anónimo existe para que lo que haga no se pegue a su nombre legal | Para ser antifraude hay que localizar a la persona: psicometría, IP, dispositivo. Para que el anónimo sea anónimo hay que no hacerlo. | **Son el mismo dato en direcciones opuestas.** No hay implementación que cumpla ambos. Hay que elegir cuál se degrada y decirlo en voz alta. |
| E-ARC-2 | Su código es local y su ritmo de trabajo es público | El contenido creado se guarda local; el historial de usos va al `mod`. Cree que «lo que hago es mío» y su cadencia es una señal abierta. | **Separar el rastro de la obra del rastro del proceso**, y que sepa cuál se publica. |
| E-ARC-3 | Su reputación se infiere de memoria | El nivel y las misiones se derivan de historial y psicometría. Rectifica el historial → la reputación mostrada queda mal. | **Que el derivado público también caiga.** Aquí la rectificación transitiva deja de ser cortesía: es obligatoria, porque lo que se muestra a terceros es lo que se rectifica. |
| E-ARC-4 | El nombre del dueño de una empresa siempre es público | Es una regla deliberada de Opita Market, y contradice el «nunca» absoluto de la §4. | **Un cruce declarado, con un solo campo: el nombre público.** No «la memoria cruza», sino «un campo se publica». |

## Qué le exige a la spec

La §4 dice, en regla dura, que el contexto **nunca** cruza identidades. Eso es
cierto para la inyección y falso para el conjunto: E-ARC-4 es un cruce deliberado,
legítimo y ya decidido por el operador. Una spec que dice «nunca» mientras el
producto hace un cruce le enseña al implementador que la spec miente, y el
implementador deja de leerla.

Falta además una segunda capa de registro: la §7 dice qué se inyectó a una tool. No
dice qué se publicó a un humano, que es donde este mindset concentra su riesgo.

## Lo que no sé

No sé qué pasa con el archivo cuando se retira una app publicada, ni con la memoria
de los usuarios que ya la usaban. Está anotado como abierto desde antes de este
loop y no lo invento aquí.

Tampoco sé si el nombre público debería contar como un cuarto dato de la identidad
legal, o si es una cuarta identidad. Hoy vive en los dos sitios y en ninguno con
claridad.