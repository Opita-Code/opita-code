# vibe-tools

Runtime de tools componibles para Opita Code.

> Principio ancla: `vibe-tools = sistema de CONTRATOS CONFIABLES alrededor de MAGIA OPACA`

---

## Estado

<!-- GENERADO:estado -->
**L0 cerrado** — Fundacion: los contratos.
**L1 cerrado** — Runtime: la caja de cada herramienta.
**L2 cerrado** — Composicion: encadenar sin equivocarse.
**L3 cerrado** — Boundary MEMORY: la memoria es tuya y de nadie mas.

291 tests · mutation 149/149 = 100% en 29 paquetes · 109 unidades juzgables.
Siguiente según el plan: **L4** — Identidad: un stub, y despues tres identidades.
<!-- /GENERADO:estado -->

> Este bloque se **genera** desde `estado.json` y lo verifica `npm run verificar-estado`. El
> estado publicado del repositorio entero esta en [STATUS.md](../STATUS.md).

> `RESEARCH` (T1) **no se puede ejecutar**: T1 concede `net` y no hay transporte.
> El caso canónico 3 existe para que ese hueco sea visible en cada corrida.
> Ver [L2-canonico](../docs/arquitectura/loops/L2-canonico.md).

Este índice **no afirma el resultado del gate sobre sí mismo**. El registro
autoritativo es `dark_memory_judgment_history` en dark-memory, proyecto
`opita-code`. Documento y veredicto sobre ese mismo documento son
autorreferenciales: el número queda falso en cuanto cambia.

---

## Documentos

Cada loop tiene sus documentos en [loops/INDICE.md](../docs/arquitectura/loops/INDICE.md),
divididos por preocupación: un documento que mezcla varias deja de ser juzgable de
forma estable.

Plan completo: [plan-iteracion-mvp.md](../docs/arquitectura/plan-iteracion-mvp.md)

---

## Estructura

```
src/
  axes.ts              los 2 ejes y su derivación
  hash.ts              sha256 puro (WASM / Lambda / microVM)
  canonical.ts         JSON estable, claves ordenadas
  contract.ts          descriptores + huella de integridad
  context.ts           ToolContext + sellado profundo
  tool.ts              ToolRegistry — resuelve y delega
  rules/               identity · edges · terminals · order · types
  graph.ts             orquestador: el orden fijo vive aquí
  module/              el grafo pasa de documento a ejecución
    bind.ts            llenar los puertos de entrada
    share.ts           mutación vs receta, y la cache
    run.ts             la caminata
    outcome.ts         el vocabulario de una corrida
    deliver.ts         qué entregó, y si la magia cumplió su contrato
    harness.ts         "responde en modo X"
  tools/               exec · render · draft · research
  canonical/           completo · receta · investigacion
  sandbox/
    capability.ts      efecto → capacidades, tier → concesiones
    tier.ts            qué puede ofrecer un host
    effects/port.ts    el vocabulario del puerto
    effects/create.ts  la fábrica y la bitácora inmutable
    runner.ts          las dos capas y la regla central
    wasm/binary.ts     LEB128 y primitivas del formato
    wasm/imports.ts    la sección donde vive todo el poder
    wasm/structure.ts  la tabla de secciones
    wasm/scan.ts       la política de lista blanca
```

---

## Comandos

```bash
npm install
npm run budget   # falla si un artefacto juzgable cruza 4096 B
npm run test     # tsc + 282 tests
npm run mutate   # 142 mutantes; se niega a cerrar si alguno sobrevive
npm run check    # los tres
```

Dos reglas de los últimos. Un patrón de mutante que no aparece en el compilado
**cuenta como hueco**, no como sobreviviente. Y `mutate` sale con error si hay
sobrevivientes, paquetes bajo 80%, **o un solo patrón no encontrado**: durante L0
y L1, ocho no aparecieron y todos revelaron huecos reales de verificación. L2 no
tuvo ninguno.
