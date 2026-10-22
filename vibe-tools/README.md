# vibe-tools

Runtime de tools componibles para Opita Code. **Contratos son datos; la magia es código.**

> Principio ancla: `vibe-tools = sistema de CONTRATOS CONFIABLES alrededor de MAGIA OPACA`

---

## Estado

**L0 cerrado** — contratos y type system. 88/88 tests · mutation 57/57 = 100% · gate 100% `aligned`.

Siguiente: **L1** — sandbox de 3 tiers (T0 WASM, T1 shim, T2 Firecracker).

| Loop | Qué | Doc |
|---|---|---|
| **L0** ✅ | Primitiva `VibeTool`, type system de 2 ejes, validador de composición | [L0.md](../docs/arquitectura/loops/L0.md) |
| L1 | Sandbox T0/T1/T2, detección de tier | pendiente |
| L2 | Grafo, módulos, caso canónico end-to-end | pendiente |
| L3 | Boundary MEMORY (bloqueante para publicar) | pendiente |
| L4 | Identidad: stub → 3 identidades | pendiente |
| L5 | Judge pipeline, costo de tokens | pendiente |
| L6 | Marketplace, PIN de las 3 propias | pendiente |
| L7 | Reputación y el ciclo completo | pendiente |
| L8 | SOTA: KYC OSS, anti-Sybil, progresión | pendiente |

Plan completo: [`docs/arquitectura/plan-iteracion-mvp.md`](../docs/arquitectura/plan-iteracion-mvp.md)

---

## Los dos ejes

**Eje 1 · qué produce** (vive en el puerto): `code · text · image · video · audio · multimodal`

**Eje 2 · determinismo** (vive en la herramienta):

| Eje 2 | Se comparte como |
|---|---|
| `deterministic` | **mutación** — fork idéntico |
| `stochastic` | **receta** — semilla y parámetros |
| `stateful` | **nada** — necesita runtime |

La derivación es total, exhaustiva, inyectiva y **no configurable**: si lo fuera, el determinismo podría mentir.

---

## Las 11 reglas de composición

Orden fijo; el primer rechazo es el veredicto.

`R0` nombres · `R1` duplicados · `R11` tier/efecto · `R2` extremos · `R3` puertos · `R4` eje 1 · `R5` determinismo · `R6` artifact terminal · `R7` sinks · `R8` terminales declaradas · `R9` entrega ≥1 artifact

Detalle y razonamiento: [L0.md](../docs/arquitectura/loops/L0.md)

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
    terminals.ts       R7, R8, R9
  graph.ts             orquestador: el orden fijo vive aquí
```

---

## Gate budget

Decisión del operador (opción A): **ningún artefacto juzgable supera 4096 bytes.** Con ese tope es un solo chunk, el `SpecIntent` aplica al artefacto completo y el veredicto es decidible.

```
ConsensusChunkSize = 4096        (drift_judge_consensus.go:126)
numChunks = min(N, ceil(len/4096))
provider.Score(ctx, chunkBytes, SpecIntent)   — el MISMO intent para cada chunk
```

Cada archivo de `src/` y cada documento de `docs/arquitectura/loops/` es una unidad juzgada, con su propio `SpecIntent`. Para cruzar el tope hay que **partir por concepto**, no subir el límite.

`npm run budget` falla el build si alguna unidad lo cruza. No hay manifiesto: un manifiesto se olvida actualizar.

**Presupuesto actual:** el más ajustado es `graph.ts` en 3569 B. L2 le mete orden topológico y detección de ciclos, así que **probablemente haya que partirlo**.

---

## Ejecutar

```bash
npm install
npm run budget   # todo artefacto juzgable cabe en un chunk
npm run test     # tsc + 88 tests
npm run mutate   # 57 mutantes; se niega a cerrar si alguno sobrevive
npm run check    # los tres
```