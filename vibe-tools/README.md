# vibe-tools

Runtime de tools componibles para Opita Code.

> Principio ancla: `vibe-tools = sistema de CONTRATOS CONFIABLES alrededor de MAGIA OPACA`

---

## Estado

**L0 cerrado** — contratos y type system.
**L1 cerrado** — sandbox: modelo de capacidades, puerto de efectos, validador
estático de imports WASM, detección de tier, runner.

164 tests · mutation 105/105 = 100% en 19 paquetes · 26 unidades juzgables.
Siguiente: **L2** — grafo, módulos, caso canónico end-to-end.

Este índice **no afirma el resultado del gate sobre sí mismo**. El registro
autoritativo es `dark_memory_judgment_history` en dark-memory, proyecto
`opita-code`. Documento y veredicto sobre ese mismo documento son
autorreferenciales: el número queda falso en cuanto cambia.

---

## Documentos de los loops

Cada documento cubre **una sola preocupación**. Eso no es estilo: un documento
que mezcla varias deja de ser juzgable de forma estable.

| Doc | Preocupación |
|---|---|
| [L0-contratos](../docs/arquitectura/loops/L0-contratos.md) | Primitiva `VibeTool`, los dos ejes, integridad |
| [L0-composicion](../docs/arquitectura/loops/L0-composicion.md) | Las 11 reglas y el veredicto |
| [L0-verificacion](../docs/arquitectura/loops/L0-verificacion.md) | Métodos de verificación, gate budget |
| [L0-hallazgos](../docs/arquitectura/loops/L0-hallazgos.md) | Los nueve hallazgos de L0 |
| [L1-capacidades](../docs/arquitectura/loops/L1-capacidades.md) | Efecto vs capacidad, detección de tier |
| [L1-puerto](../docs/arquitectura/loops/L1-puerto.md) | El puerto de efectos y la garantía dinámica |
| [L1-estatica](../docs/arquitectura/loops/L1-estatica.md) | Lista blanca de imports WASM, vacía a propósito |
| [L1-runner](../docs/arquitectura/loops/L1-runner.md) | Las dos capas, y lo que L1 **no** entrega |
| [L1-verificacion](../docs/arquitectura/loops/L1-verificacion.md) | 76 unitarios, 14 propiedades |
| [L1-mutacion](../docs/arquitectura/loops/L1-mutacion.md) | 105 mutantes, gate budget, gate de drift |
| [L1-hallazgos](../docs/arquitectura/loops/L1-hallazgos.md) | Los cinco hallazgos de código y pruebas |
| [L1-hallazgos-gate](../docs/arquitectura/loops/L1-hallazgos-gate.md) | Los dos hallazgos del gate, y lo que queda para L2 |

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
  rules/               identity · edges · terminals · types
  graph.ts             orquestador: el orden fijo vive aquí
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
npm run test     # tsc + 164 tests
npm run mutate   # 105 mutantes; se niega a cerrar si alguno sobrevive
npm run check    # los tres
```

Dos reglas de los últimos. Un patrón de mutante que no aparece en el compilado
**cuenta como hueco**, no como sobreviviente. Y `mutate` sale con error si hay
sobrevivientes, paquetes bajo 80%, **o un solo patrón no encontrado**: durante L0
y L1, ocho no aparecieron y todos revelaron huecos reales de verificación.