# L4-T5 · Los permisos, medidos

> Qué se comprobó de la puerta de permisos, y qué no se comprobó.

## LA MEDICIÓN, CONTRA QUÉ

El runtime de `vibe-tools`, en la máquina del operador: Node 24, sin Docker. La
puerta se midió con **tests** (cada comportamiento, con su nombre) y con
**mutación** (cada invariante, con un mutante escrito a mano que rompe
exactamente esa regla).

| Medida | Resultado |
|---|---|
| Tests de L4-T5 | **27**, todos en verde |
| Mutantes de L4-T5 | **16**, los 16 muertos |
| Paquetes nuevos | `src/permisos/{categorias,politica,puerta}.js` al 100% |
| Contrato | `ToolDescriptor` gana `context_profile` y `psychometrics` |

## LO QUE DEMUESTRA CADA PRUEBA

| Comportamiento | Qué se rompe si la puerta deja de mirarlo |
|---|---|
| Sin concesión no hay contexto | El deny by default del plan |
| La política vacía deniega igual | Que el deny dependa de un flag que se pueda olvidar |
| El techo declarado manda | Que una tool reciba más de lo que dice necesitar |
| La categoría concedida acota la pedida | Que se conceda de más por la puerta de atrás |
| Lo concedido es lo pedido, no el techo | Que una tool con permiso de historial reciba el historial entero al pedir preferencias |
| La psicometría no viene de la categoría | Que el dato sensible se cuele por el perfil de contexto |
| Una finalidad no autoriza la otra | Que C3 (personalizar) autorice C4 (misiones) |
| La psicometría exige declararse | Que el consentimiento baste sin que la tool lo pida |
| La escritura se concede aparte | Que escribir sea «leer más» |
| La versión no se hereda | Que cambiar el código conserve el permiso |
| El autor no se hereda | Que republicar con otro autor conserve el permiso |
| El contexto lleva solo lo concedido | Que la inyección sea un filtro y el dato entre antes de salir |
| Una decisión incoherente falla fuerte | Que un error del harness aparezca como un contexto vacío |

## LOS MUTANTES, Y POR QUÉ ESTÁN ESCRITOS A MANO

El runner no genera mutantes: cada uno es una sustitución literal elegida para
romper **una** regla. Por eso un mutante que sobrevive no es ruido, es un hueco.

**Y UNO SOBREVIVIÓ, Y NO ERA RUIDO.** La primera versión del módulo tenía dos
defensas del deny by default: la rama que pregunta «¿concedido?» y la
categoría `'none'` que no inyecta nada. Cada una tapaba a la otra: quitar una
no cambiaba el resultado, porque la otra seguía ahí. Dos defensas que se tapan
no se pueden medir, y el runner lo dijo: *«VEREDOR DÉBIL»*.

La solución no fue un mutante más, fue un cambio de código: las decisiones
pasaron a ser **uniones discriminadas** por `concedido`, de modo que el tipo
dice que una decisión denegada lleva `'none'`, y la categoría que no concede
**falla fuerte** en vez de devolver vacío. Con una sola defensa, quitarla se
nota, y el mutante muere.

## LO QUE EL JUEZ ENCONTRÓ, Y NO ERA DE ESTA TAREA

El juez lee los bytes de cada documento, y sobre lo que cambió dijo dos cosas
que eran verdad y que esta tarea no miraba:

- **La isla del paquete decia «Siguiente según el plan: L4»** mientras la de la
  raíz decía que L4 estaba en curso. Las dos islas usaban el mismo campo con
  dos significados distintos, y el generador tenía **dos copias** de la frase:
  la que usaba `generar-estado.mjs` y la que vivía en `estado-comun.mjs` sin
  que nadie la usara. Ahora las dos islas salen de `lineaAhora()`, que es la
  fuente única.
- **El README del paquete llevaba cifras escritas a mano** (371 pruebas, 207
  mutantes) junto a la isla generada con las nuevas (398, 223). Las cifras
  están en la isla; repetirlas a mano en la prosa es una segunda fuente de
  verdad que envejece. Salieron de la prosa.

Y una tercera cosa, que **no** era un defecto del artefacto: el mismo
`draft.ts` judges dos veces con el mismo criterio dio `drift_detected` y
`aligned`. La causa era el criterio, no el archivo: la pregunta que yo le hice
—«si puede dar el mismo resultado dos veces»— no es la del repo. La oficial
está en `L0-contratos.md`, eje 2: la clase de determinismo dice **cómo se
comparte** (mutación, receta o nada), no si repite resultado. Con el criterio
del repo, el veredicto es `aligned` y estable.

## LO QUE NO SE COMPROBÓ

- **El harness de verdad.** Aquí no hay memoria que inyectar: los campos los
  da el llamador. La integración con dark-memory es del producto.
- **La auditoría.** Cada inyección ought a dejar rastro (spec de boundary,
  sección 7), y eso lo escribe el harness, que es quien sabe qué se inyectó.
- **El aislamiento de la base.** Los cuatro tests de RLS se saltan sin Docker,
  y lo dicen en su nombre. El permiso y el aislamiento son capas distintas, y
  esta tarea no toca la segunda.
- **El juez.** El veredicto va en su registro, en el store del juez, fuera de
  este repositorio.

## EL CAMBIO DE CONTRATO, Y LO QUE COSTÓ

`ToolDescriptor` gana dos campos obligatorios: `context_profile` (el techo
declarado) y `psychometrics` (la capa aparte). Al ser obligatorios, el
compilador listó los veinte sitios que había que tocar, y ninguno se quedó
fuera. Es la razón de ser de que sean obligatorios y no opcionales: un perfil
que se puede omitir es un perfil que se puede olvidar.
