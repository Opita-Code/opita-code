# vibe-tools

Runtime de tools componibles para Opita Code.

> Principio ancla: `vibe-tools = sistema de CONTRATOS CONFIABLES alrededor de MAGIA OPACA`

---

## Estado

**L0 cerrado.** 88/88 tests · mutation 57/57 = 100% en 11 paquetes.
Siguiente: **L1** — sandbox de 3 tiers.

Este índice **no afirma el resultado del gate sobre sí mismo**. El registro
autoritativo es `dark_memory_judgment_history` en dark-memory, proyecto
`opita-code`. Documento y veredicto sobre ese mismo documento son
autorreferenciales: el número queda falso en cuanto cambia.

---

## Documentos del loop

Cada documento cubre **una sola preocupación**. Eso no es estilo: un
documento que mezcla varias deixa de ser juzgable de forma estable.

| Doc | Preocupación |
|---|---|
| [L0-contratos](../docs/arquitectura/loops/L0-contratos.md) | Principio, primitiva `VibeTool`, los dos ejes, integridad |
| [L0-composicion](../docs/arquitectura/loops/L0-composicion.md) | Las 11 reglas de composición y el veredicto |
| [L0-verificacion](../docs/arquitectura/loops/L0-verificacion.md) | Los tres métodos de verificación y el gate budget |
| [L0-hallazgos](../docs/arquitectura/loops/L0-hallazgos.md) | Los nueve hallazgos que produjo la verificación |

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
  tool.ts              ToolRegistry (la magia)
  rules/
    types.ts           RejectCode, RuleResult, Checker
    identity.ts        R0, R1, R11
    edges.ts           R2..R6
    terminals.ts       R7..R9
  graph.ts             orquestador: el orden fijo vive aquí
```

---

## Comandos

```bash
npm install
npm run budget   # falla si un artefacto juzgable cruza 4096 B
npm run test     # tsc + 88 tests
npm run mutate   # 57 mutantes; se niega a cerrar si alguno sobrevive
npm run check    # los tres
```

Regla de los dos últimos: un patrón de mutante que no aparece en el
compilado **cuenta como hueco**, no como sobreviviente. Durante L0, cuatro
no aparecieron y revelaron que el sellado profundo y el orden del pipeline no
estaban verificados.