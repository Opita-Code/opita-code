# Índice de documentos por loop

> Cada loop se divide por **preocupación**: un documento que mezcla varias deja de
> ser juzgable de forma estable. El punto de entrada es el
> [README de la raíz](../../../README.md), y este es el catálogo.

| Doc | Preocupación |
|---|---|
| [L0-contratos](L0-contratos.md) | Primitiva `VibeTool`, los dos ejes, integridad |
| [L0-composicion](L0-composicion.md) | Las 11 reglas y el veredicto |
| [L0-verificacion](L0-verificacion.md) | Métodos de verificación, gate budget |
| [L0-hallazgos](L0-hallazgos.md) | Los nueve hallazgos de L0 |
| [L1-capacidades](L1-capacidades.md) | Efecto vs capacidad, detección de tier |
| [L1-puerto](L1-puerto.md) | El puerto de efectos y la garantía dinámica |
| [L1-estatica](L1-estatica.md) | Lista blanca de imports WASM, vacía a propósito |
| [L1-runner](L1-runner.md) | Las dos capas, y lo que L1 **no** entrega |
| [L1-verificacion](L1-verificacion.md) | 76 unitarios, 14 propiedades |
| [L1-mutacion](L1-mutacion.md) | 105 mutantes, gate budget, gate de drift |
| [L1-hallazgos](L1-hallazgos.md) | Los cinco hallazgos de código y pruebas |
| [L1-hallazgos-gate](L1-hallazgos-gate.md) | Los dos hallazgos del gate, y lo que queda para L2 |
| [L2-orden](L2-orden.md) | Orden topológico, ciclos, y por qué R10 va donde va |
| [L2-modulo](L2-modulo.md) | El runner: llenar, reusar, correr, coseer |
| [L2-compartir](L2-compartir.md) | Mutación vs receta, y el hallazgo de T0 |
| [L2-tools](L2-tools.md) | Las cuatro tools base y lo que no fingen |
| [L2-harness](L2-harness.md) | «Responde en modo X», y la ambigüedad rechazada |
| [L2-canonico](L2-canonico.md) | Los tres casos canónicos y qué prueba cada uno |
| [L2-verificacion](L2-verificacion.md) | 99 unitarios y las properties P25–P34 |
| [L2-aritmetica](L2-aritmetica.md) | El total de 282 reconciliado por prefijo, por archivo y por loop |
| [L2-mutacion](L2-mutacion.md) | Los 142 mutantes y los que importan |
| [L2-presupuesto](L2-presupuesto.md) | El guard de 4096 B y las seis particiones |
| [L2-hallazgo-runner](L2-hallazgo-runner.md) | L1 cerró con el runner 53 B sobre el tope, y cómo se tapó |
| [L2-hallazgos](L2-hallazgos.md) | Los cuatro defectos, dos de ellos de L1 |
| [L2-desviaciones](L2-desviaciones.md) | Las cuatro desviaciones del plan, y por qué |
| [L2-gate](L2-gate.md) | El veredicto de las 30 unidades y las 6 que no llegaron |
| [L2-cierre](L2-cierre.md) | Lo que sigue igual y lo que queda para L3 |

## L3 · boundary MEMORY, derivado de la psicometría

| Doc | Preocupación |
|---|---|
| [L3-mindsets](L3-mindsets.md) | Por qué E1-E12 son de mecánica y de dónde salen los seis mindsets |
| [L3-criterio](L3-criterio.md) | Qué borde se escribe y hasta dónde llega |
| [L3-mindset-espejo](L3-mindset-espejo.md) | La memoria soy yo: rectificar, corregir, borrar |
| [L3-mindset-empresa](L3-mindset-empresa.md) | La memoria del proyecto: fundador y empleado |
| [L3-mindset-archivo](L3-mindset-archivo.md) | Esto lo van a leer otros: anonimato contra antifraude |
| [L3-mindset-veredicto](L3-mindset-veredicto.md) | La memoria me juzga: el flag que no se puede impugnar |
| [L3-mindset-precio](L3-mindset-precio.md) | La memoria es con lo que pago: qué se pierde al retirar |
| [L3-mindset-no-pedi](L3-mindset-no-pedi.md) | Esto se recogió y yo no lo autoricé |
| [L3-reconciliacion](L3-reconciliacion.md) | Qué sobrevive de las 8 reglas y los 12 bordes |
| [L3-cambios](L3-cambios.md) | Lo que hay que añadir, y lo que queda abierto para el operador |
| [decisiones](INDICE-decisiones.md) | A4, A5, A6, A7 y A9: las decisiones del operador, con las opciones |

## L4 · Identidad, de stub a tres identidades

| Doc | Preocupación |
|---|---|
| [L4-identidad](L4-identidad.md) | El stub legal, y el contexto sellado que lo lleva |
| [L4-identidades](L4-identidades.md) | Las tres identidades, la clave y la puerta |
| [L4-alcance](L4-alcance.md) | Qué cierra y qué no entrega |
| [L4-T2-matriz](L4-T2-matriz.md) | Las cinco señales del KYC y quién puede probarlas |
| [L4-T2-piezas](L4-T2-piezas.md) | Las piezas libres, con su licencia y su fecha |
| [L4-T2-decision](L4-T2-decision.md) | Qué se decide, qué no ve, y la respuesta del operador |
| [L4-verificacion](L4-verificacion.md) | Los tres estados del KYC, su evidencia y la puerta |
| [L4-T4-aislamiento](L4-T4-aislamiento.md) | El aislamiento lógico: RLS sobre `project_id`, y la auditoría |
| [L4-T4-verificacion](L4-T4-verificacion.md) | El aislamiento medido contra un Postgres real |

La superficie publica y los documentos transversales estan en
[INDICE-publico.md](INDICE-publico.md).
