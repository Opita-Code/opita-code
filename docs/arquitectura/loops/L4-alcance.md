# L4 · El alcance: qué cierra esta parte y qué no

> Parte 3 de L4. [Las tres identidades](L4-identidades.md) · [El stub](L4-identidad.md)
> · [El índice](INDICE.md)

## Las tres decisiones que este loop cierra

L3 dejó tres preguntas abiertas (A5, A6 y A7). El operador las respondió el
2026-10-26, y las respuestas son código, no prosa:

| Decisión | Qué se decidió | Dónde vive |
|---|---|---|
| A5 | El corte por creencia se confirma: los tres tipos no cambian | el union discriminado |
| A6 | Se degrada el antifraude; el anónimo no se localiza | `ALCANCE_ANTIFRAUDE` |
| A7 (C6) | Sexto consentimiento propio y separado; el producto funciona igual si el empleado dice que no | el rol no viaja en la identidad |
| A7 (techo) | La regla ahora, el techo medido cuando exista el clasificador | no hay techo: sería un número inventado |

## Lo que L4-T3 NO entrega

- **El KYC registral.** L4-T2 confirmó que el stack libre cubre cuatro de las
  cinco señales y no la registral, porque esa señal es un contrato con la
  Registraduría. Con A1, la identidad legal lleva verificación **documental**,
  con su evidencia; la señal registral queda como una costura declarada y
  opcional. Está en [la verificación](L4-verificacion.md).
- **El pool cerrado de nicknames.** Es una lista, y el «nunca reciclado» exige
  un registro con estado durable: no es cosa del runtime. Lo que sí está es la
  inmutabilidad, en código: la identidad sale congelada.
- **El límite de tres empresas por persona**, que el anónimo sea uno por
  persona, y el fundador como administrador. Son del harness, que es quien sabe
  de personas; el runtime solo ve identificadores.
- **El techo de falsos positivos.** A7 = T1: la regla ahora, el techo medido
  cuando exista el clasificador.

## Qué NO ve el guard de la puerta

Comprueba la **forma**, no la verdad: no sabe si el id existe, ni si el
nickname viene de un pool cerrado, ni si la razón social es la registrada.
Eso lo sabe el harness, el único actor con autoridad de selección.

Y no comprueba el contenido: que el contexto inyectado no cruce identidades
es una pregunta de selección, no de forma. El guard no lo ve, y por eso no
se cita como si lo cubriera.

## Lo que se midió

14 tests nuevos y 21 mutantes nuevos. Los 21 mueren, y la cuenta no cerró
hasta que los tres mutantes de L4-T1 —que apuntaban al código que este loop
reescribió— se apuntaron al nuevo: un mutante cuyo patrón no aparece no está
medido, y el harness no se cierra con huecos.

Y el juez: **14 de 14 partes en `aligned`**, con confianza 1.0000 y
`nli_label entailment`. Una de las catorce salió `needs_human` con el proveedor
caído, y en el segundo intento salió `aligned`: eso fue infraestructura, no
veredicto.

## Y lo que midió L4-T2

L4-T2 fue investigación, y por eso no dejó tests ni mutantes: no cambió el
código. Midió once piezas contra la API de GitHub (licencia, estrellas y última
subida), dos catálogos de datos abiertos, los límites de AWS Lambda y el README
de dos proyectos. Su entregable son tres documentos: [la matriz](L4-T2-matriz.md),
[las piezas](L4-T2-piezas.md) y [la decisión](L4-T2-decision.md).

Y A1, que es su consecuencia: doce tests nuevos y catorce mutantes nuevos, y
los catorce mueren. La cuenta no cerró a la primera: un mutante sobrevivió
porque el test usaba una cadena con «cotes» y no con «cotejo», y el mutante no
tenía nada que distinguir. Un test que no distingue dos comportamientos no
mira nada.

## Y lo que queda para el siguiente

L4-T4 (aislamiento lógico con RLS sobre `project_id`) y L4-T5 (permisos) ya
no dependen de una decisión abierta del operador: las tres identidades están
escritas y A5, A6 y A7 están contestadas. L4-T6 (exportar el `.opitapack`)
sigue abierto. De las preguntas del operador sobre la identidad, ninguna: A9
se respondió con A1 —se publica la verificación documental— y A4 con la
opción 2 —el documento legal se publica con su estado real—.
