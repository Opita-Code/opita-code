# Spec 533 — MVP de vibe-tools

> Estado: propuesta para el juez. 11 tareas, 1 criterio de éxito.

---

## Hipótesis a validar

Si una persona construye una vibe-tool en vibe-studio, la publica, pasa el juez, y gana reputación visible en Opita Trabajos, entonces el marketplace tiene una razón de ser y el ciclo de valor funciona sin pago.

---

## Dentro del alcance

1. Primitiva `VibeTool` = función tipada. Sin protocolo.
2. Type system de **2 ejes**: qué produce × clase de determinismo.
3. Reglas: el código compone y los artifacts **terminan**; el juez verifica el **artifact** no el proceso; determinista → mutación, estocástica → receta.
4. Sandbox **solo T0**: WASM en cliente, tools puras sin I/O.
5. 3 tools atómicas mínimas: `EXEC`, `RENDER`, `RESEARCH`.
6. 1 módulo end-to-end: tool + harness que compone las 3.
7. Judge pipeline: `drift_judge` + `consensus n=3` + check de whitelist. Cuesta tokens.
8. Marketplace local: publicar + 3 propias pinned primero + terceros debajo.
9. Flujo de reputación: publicar → sello del juez → reputación visible con badge.
10. Boundary `MEMORY` mínimo: contexto inyectado, `context_profile=none`.
11. Identidad única stub: legal/KYC simulado.

## Fuera del alcance (explícito)

3 identidades · empresas · organigrama · Opita Saldo · misiones LLM · sandbox T1/T2 · Firecracker · multi-idioma · móvil · levels y logros · KYC real · mod completo

---

## Tareas

| # | Descripción | Depende de |
|---|---|---|
| T1 | Primitiva `VibeTool`: id, version, author, eje1, eje2, `input_schema`, `output_schema`, `run(input, ctx)` | — |
| T2 | Type system 2 ejes: la composición rechaza módulos mal ajustados. Firma validada en cliente WASM, determinismo en frontera | — |
| T3 | Composición: tools que producen artifact son nodos terminales. Grafo | T1, T2 |
| T4 | Runtime T0: ejecutar tool pura en WASM. Sin I/O, sin red. Fallback claro si requiere T1/T2 | — |
| T5 | 3 tools atómicas: `EXEC` (python puro, determinista), `RENDER` (preview, determinista), `RESEARCH` (estocástica) | — |
| T6 | Módulo end-to-end: las 3 tools + harness. **Caso de uso canónico del marketplace** | T3, T4, T5 |
| T7 | Judge pipeline: drift + consensus n=3 + whitelist. Cada verificación consume tokens | T6 |
| T8 | Marketplace local: publicar, 3 propias pinned primero, terceros debajo | T6 |
| T9 | Reputación: publicar → sello del juez → número de reputación visible con badge | T7, T8 |
| T10 | Boundary `MEMORY` mínimo: contexto inyectado por el harness, `context_profile=none`. La tool nunca lee. Smoke test de inaccesibilidad | T6 |
| T11 | Identidad única stub: legal/KYC simulado, suficiente para una persona con mod propio | T9 |

---

## Criterio de éxito

**Una persona externa, sin ayuda, construye una vibe-tool, la publica, ve el sello del juez, y su reputación sube. Si no puede, el ciclo está roto.**

## Riesgo principal

Si el harness de misiones no se puede construir dentro de vibe-tools, ninguna app de terceros se podrá. **T6 es el caso de uso canónico que valida la tesis del marketplace.**