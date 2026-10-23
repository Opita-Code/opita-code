# L3 · Mindset ESPEJO — la memoria soy yo y me representa

> Parte 3 de 10. [mindsets](L3-mindsets.md) · [criterio](L3-criterio.md) · [mindset-espejo](L3-mindset-espejo.md) · [mindset-empresa](L3-mindset-empresa.md) · [mindset-archivo](L3-mindset-archivo.md) · [mindset-veredicto](L3-mindset-veredicto.md) · [mindset-precio](L3-mindset-precio.md) · [mindset-no-pedi](L3-mindset-no-pedi.md) · [reconciliacion](L3-reconciliacion.md) · [cambios](L3-cambios.md)
> Spec 538. Tarea L3-T2.

## La psicometría

- **Quiere** que la plataforma lo sepa, para no volver a preguntárselo. El valor no
  es la obediencia: es que no le repitan lo que ya dijo.
- **Teme** que la plataforma afirme algo que no es, y que eso le cueste.
- **Responde ante** sí mismo. Nadie más lee esto todavía.
- **Trueque** privacidad por no repetirse, y lo hace creyendo que el trueque es
  privado.

Lo que lo distingue de los otros cinco: **es el único que disputa la memoria**. Los
demás la dan por dada. Este la audita, y por eso todo el sistema tiene que poder
mostrarle de dónde salió cada afirmación.

## Los bordes

| # | Borde | Por qué esta persona | Qué exige |
|---|---|---|---|
| E-ESP-1 | Corrige un hecho y lo ya pensado sigue igual | Rectificar no es cambiar un campo: es que lo inferido con el dato viejo deje de circular. El `mod` guarda la conclusión sin guardar de qué salió. | **Proveniencia en cada inferencia**, para poder tumbarla. |
| E-ESP-2 | Pide por qué la plataforma cree esto | Si la respuesta es «lo inferimos», no hay nada que impugnar. Y si además no sabe qué se sabría de él, rectifica a ciegas. | **Auditoría en las dos direcciones**: qué se inyectó a la tool —eso §7 lo hace— y qué se le dijo a la persona de sí misma, que no existe. |
| E-ESP-3 | Corrige y no sabe si el sistema lo tomó | `rectificado` y `corregido` son estados distintos. Sin ellos, rectificar es indistinguible de que nadie escuchara. | **Estado explícito de rectificación**, no una entrada de log. |
| E-ESP-4 | Borra y no sabe si el sistema dejó de saber | La supresión dice borrar el `mod`. Pero D4 historial, D3 psicometría y D8 reputación son derivados. Si quedan, «borrado» no significa lo que parece. | **Que «borrado» sea comprobable.** Qué sobrevive a la supresión es decisión legal: queda abierto. |
| E-ESP-5 | Trae su memoria de otro lado y espera que sea la misma | Claude, notas, otro agente. Nadie diseñó la importación, y lo importado no trae la procedencia ni las finalidades que aquí sí se exigen. | **Importar es un tratamiento declarado**, o no importar. |

## Qué le exige a la spec

1. §7 audita solo hacia afuera —qué vio la tool—. Le falta la otra mitad: qué se
   le Barron a la persona sobre sí misma. Sin eso el derecho de rectificar es
   ejercitable pero inútil, porque no hay contra qué ejercerlo.
2. El `mod` guarda `decision`, `semantic` y `episodic` sin relación entre ellos. La
   rectificación transitiva exige esa relación y hoy no existe: no se puede
   invalidar lo que salió de un dato que ya se rectificó, porque no se sabe qué
   salió.

## Lo que no sé

Si la rectificación tiene que alcanzar también lo **publicado** —reputación,
nivel— es una decisión legal abierta, y está en [archivo](L3-mindset-archivo.md).

Tampoco sé si la proveniencia por inferencia sobrevive al `semantic`: puede que el
modelo no guarde de dónde salió una afirmación, y entonces el diseño correcto no
sea guardar la procedencia sino **no inferir**. Eso no lo decido yo: es una decisión
sobre qué se sacrifica.
