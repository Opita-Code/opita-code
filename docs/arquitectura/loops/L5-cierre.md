# L5 · El cierre: qué cierra este loop y qué deja abierto

> Parte final de L5. [El pipeline](L5-pipeline.md) · [Los ámbitos](L5-ambitos.md)
> · [Las paradas](L5-needs-human.md) · [El coste](L5-coste.md) · [La mutación
> del juez](L5-mutacion-juez.md) · [El índice](INDICE.md)

## LAS CINCO TAREAS

| Tarea | Qué entregó |
|---|---|
| L5-T1 | El pipeline: encargo, plan, correspondencia, transporte y decisión |
| L5-T2 | El coste: llamadas, bytes y latencia máxima; tokens y margen declarados no medibles |
| L5-T3 | Los ámbitos por ruta: qué mide cada clase, en qué unidad y con cuántas muestras |
| L5-T4 | Las paradas: infraestructura, semántico y disenso, cada una con su acción |
| L5-T5 | La mutación del juez: mutar el artefacto, y mutar el pipeline |

## LOS KPIs DEL PLAN, Y SU ESTADO REAL

| KPI | Estado medido |
|---|---|
| K3: 100% `aligned` con `stddev = 0`, `degraded = false` | **Cumple en el artefacto medido.** `whitelist.ts`: 3 de 3 `aligned` 0.99, `stddev` 0, `degraded` false |
| `mutation_score` del pipeline ≥ 80% | **Cumple.** 272 de 272 mutantes muertos, 100% |
| Coste de tokens medido y reportado | **No cumplible con este proveedor.** El juez no reporta uso |
| `needs_human` con superficie para el operador | **Cumple.** Tres motivos, cada uno con su acción |
| `drift_judge` sobre el diseño del loop | **Cumple.** Los seis documentos, con su veredicto |

**K3 no es un barrido de todo `vibe-tools`.** Se midió sobre el artefacto de
código que el loop entregó: `whitelist.ts` se
juzgó tres veces con el juez real y las tres dijeron `aligned` con confianza
0.99. Barrer todo el árbol serían cientos de llamadas.

## LO QUE SE MIDIÓ, CON SU NÚMERO

| Medida | Número |
|---|---|
| Tests del núcleo L5 | 65 |
| Tests del transporte contra el doble | 21 |
| Tests de todo el repositorio | 512, con 508 en verde y 4 saltados |
| Mutantes del pipeline | 272, todos muertos |
| Unidades juzgables | 187, ninguna sobre el tope |
| Llamadas al juez real | 3 para el código, 1 por documento |
| Latencia máxima medida | 7346 ms (tres muestras de 6763, 3814 y 7346) |

Los 4 tests saltados son los del aislamiento RLS: sin Docker en esta máquina,
el test lo dice en su nombre. No es un verde: es un test que no corrió, y se
declara.

## LO QUE EL LOOP DEJA ABIERTO

1. **El coste de tokens no está medido.** No hay dato del proveedor ni columna
   en la base. El pipeline declara `tokens: null` con su motivo, y el cargo se
   calcula con una tarifa que declare el operador. Cerrar esto exige un
   proveedor que reporte uso, o medirlo por fuera y anotarlo.
2. **El juez detecta la contradicción directa, no la debilitación sutil.** De
   tres mutaciones que contradecían el intent, dos cambiaron el veredicto. La
   tercera pasó también con tres muestras. Es un límite medido del juez, no un
   fallo del pipeline.
3. **El intent es el contrato.** Lo que el intent no menciona no se detecta.
   Escribir el intent es, por tanto, parte del trabajo, no un trámite.
4. **La coherencia entre partes no la ve nadie.** El agregado dice «N de N»,
   nunca «el documento está bien».

## LA LECCIÓN DEL LOOP

Dos defensas del mismo invariante no se miden: se tapan. La mutación destapó
dos ramas redundantes —la ruta absoluta y el empate— que sobrevivían porque la
comprobación de al lado ya cubría el caso. Se quitó la que no medía nada y se
conservó el mensaje, que es lo que lee el operador.

La segunda: **un test que depende de un proveedor se acaba saltando.** El
transporte se mide contra un doble del servidor, con la forma real de la
respuesta, para que la CI pueda afirmar algo sin cuota. El juez real se mide a
mano, y su veredicto vive en el store, no en el repositorio.

Y la tercera, medida: **la misma afirmación para todas las partes
produce deriva falsa.** Tres documentos correctos salieron `drift_detected`
porque cada fragmento se juzgó contra el intent del todo; con una
afirmación por parte, los tres salieron `aligned`. El plan exige una por parte y
rechaza el encargo si no cuadran.
