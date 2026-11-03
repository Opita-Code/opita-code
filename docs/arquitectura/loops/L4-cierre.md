# L4 · El cierre: qué cierra este loop y qué deja abierto

> Parte final de L4. [El alcance](L4-alcance.md) · [Los permisos](L4-T5-permisos.md)
> · [El paquete](L4-T6-paquete.md) · [El índice](INDICE.md)

## LAS SEIS TAREAS

| Tarea | Qué entregó |
|---|---|
| L4-T1 | El stub legal y el contexto sellado que lo lleva |
| L4-T2 | La matriz del stack libre de KYC, y con A1 la verificación documental |
| L4-T3 | Las tres identidades, la clave derivada del tipo y del identificador, y la puerta que las comprueba |
| L4-T4 | El aislamiento lógico: RLS sobre `project_id`, medido contra un Postgres real |
| L4-T5 | La puerta de permisos: deny by default, por categoría, con la psicometría aparte |
| L4-T6 | El formato `.opitapack`: exportar, verificar e instalar sin conceder |

## LOS CUATRO KPIs DEL PLAN, Y SU ESTADO REAL

| KPI | Estado medido |
|---|---|
| KYC: stack viable o decisión documentada de por qué no | **Cumple.** A1 |
| Aislamiento: el acceso cruzado falla el 100% | **Cumple.** Las cuatro operaciones, contra un Postgres real |
| Las 4 condiciones de admisibilidad legal: 4/4 verdes | **3 de 4.** El cifrado no es comprobable |
| `drift_judge` sobre el documento legal | **No cumplible.** Ese documento no es juzgable |

**POR QUÉ EL TERCER KPI NO DA 4 DE 4.** Las cuatro condiciones son las de §3.2
del documento legal: autorización en la capa de acceso, cifrado en reposo y en
tránsito, auditoría de todo acceso, y tests de aislamiento automatizados. Tres
se cumplen en el código. La del cifrado **no es comprobable**: no hay
infraestructura en producción, y no se mide lo que no existe.

**POR QUÉ EL CUARTO KPI NO ES CUMPLIBLE.** El plan pide un `drift_judge` sobre
`cumplimiento-aislamiento-datos-v1.md`, y ese documento está **fuera del
conjunto juzgable**: el guard de presupuesto lo excluye con el motivo de que
es texto legal y necesita un abogado, no un juez LLM. Un KPI que apunta a un
documento que el gate no juzga no se cumple por escrito: se declara.

## LO QUE L4 NO ENTREGA

Lo que ya no es de este runtime, en detalle, está en [el alcance](L4-alcance.md).
Lo que cambia con este cierre:

- **El registro durable** del pool cerrado de nicknames, y el límite de tres
  empresas por persona, son del harness, que es quien sabe de personas.
- **El veredicto del juez sobre el documento legal**, porque ese documento no
  es juzgable. Lo que sí se midió es el estado real del sistema, y está
  escrito en su §13.
- **El cifrado en reposo y en tránsito**, con su KMS y su rotación: es
  infraestructura, y hay que decidir dónde vive.
- **La revisión de abogado** del §7 del documento legal. Declarar conformidad
  la exige, y ningún código la suple.

## LO QUE SIGUE

**L5 · Judge pipeline.** El juez deja de ser una llamada suelta: hay un
orquestador que decide, con consenso cuando el riesgo lo pide, y que sabe
decir «esto no lo puedo decidir» sin inventarse un veredicto. Y el coste de
cada veredicto, medido, porque un juez que no se mide es un juez que no se
puede pagar.
