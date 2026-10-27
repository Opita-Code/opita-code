# Plan de Iteración — vibe-tools MVP (v3 completo)

> **Estado:** plan de ejecución. Cada loop es un spec vibe-flow con sus propias tareas, sus tests y sus KPIs.
> Criterio deicia global: **el ciclo `crear → publicar → juez → reputación → puertas en Opita Trabajos`** funciona de punta a punta con una persona real.
> Verificado por: el juez (drift + consensus n=3), mutation testing, property-based checks, y persona-based usability.

---

## 0. Criterios de excelencia (KPIs medibles)

Definí 6 KPIs globales. **El proyecto no se declara MVP-terminado si alguno falla.**

| # | KPI | Métrica | Umbral |
|---|---|---|---|
| **K1** | **Ciclo completo** | Persona externa construye → publica → ve sello → reputación sube, **sin ayuda** | 5 de 5 personas lo logran sin asistencia |
| **K2** | **Verificador confiable** | Mutation score del test suite de vibe-tools | ≥ 80% per package |
| **K3** | **Juez íntegro** | Drift consensus sobre artifacts de vibe-tools | 100% `aligned`, `stddev = 0`, `degraded = false` |
| **K4** | **Aislamiento** | Tests de boundary MEMORY (E1–E12 del spec) | 8 de 8 verdes |
| **K5** | **Usabilidad real** | Hallazgos `severity ≥ 12` (critical) bloqueando el loop | 0 |
| **K6** | **Consistencia** | Orden de loops: cada loop depende solo de loops previos cerrados | 0 dependencias rotas |

**Regla de oro (skill llm-testing):** al menos 2 métodos de verificación por artifact. Mutation testing es primario cuando hay lógica. Si el juez da `drift_detected` → fix + re-publish. Si da `needs_human` → STOP y superficie al operador.

---

## Orden de loops — por qué este orden

Cada loop cierra un **gap de conocimiento** antes del loop que lo necesita. La lógica de
dependencias:

```
L0 (Fundación)  → (type system, primitiva)
   ↓
L1 (Runtime)    →  (sandbox T0/T1/T2, ejecución)
   ↓
L2 (Composición)→  (módulos, harness, caso canónico)
   ↓
L3 (Boundary)   →  (MEMORY inyectada — CRÍTICO, antes de publicar apps)
   ↓
L4 (Identidad)  →  (1 stub → 3 identidades)
   ↓
L5 (Juez)       →  (pipeline completo con costo de tokens)
   ↓
L6 (Marketplace)→  (publicar, pinned, lista de terceros)
   ↓
L7 (Reputación) →  (sello → reputación → camino a Trabajos)
   ↓
L8 (SOTA)       →  (los 3 bloques de investigación, cuando el diseño lo pida)
   ↓
L9 (Escala)     →  (T2 real, wallet, móvil, multi-idioma)
```

**L8 (SOTA) va después de L7, no antes.** ¿Por qué? Porque el SOTA KYC/seguridad/progresión ahora informs the DESIGN de identidad y marketplace. Pero el MVP valida el CICLO con stubs. Si el ciclo no funciona, el SOTA es prematuro. SOTA entra cuando el ciclo está probado y necesitamos tomar decisiones de producción con datos reales.

**Excepción:** L8.2 (KYC OSS Colombia) sí entra antes de L4 (identidad real), porque la decisión "1 stub vs 3 identidades" depende de saber si el stack OSS es viable.

---

## L0 — Fundación: primitiva y type system

**Gap que cierra:** no existe la primitiva sobre la que construir todo.

| Tarea | Descripción | Depende |
|---|---|---|
| L0-T1 | Tipo `VibeTool`: id, version, author, eje1 (qué produce), eje2 (determinismo), input_schema, output_schema, `run(input, ctx)` | — |
| L0-T2 | Type system de 2 ejes: enum de producción (code/text/image/video/audio/multimodal) y enum de determinismo (determinista/estocástica/con-estado) | L0-T1 |
| L0-T3 | Validación de composición: un módulo cuyo contrato no encaja es rechazado con error tipado | L0-T2 |
| L0-T4 | Tests unitarios: firma válida, firma inválida, mismatched determinismo | L0-T2 |

**KPIs del loop:**
- `mutation_score` del type system ≥ 80%
- `property_check`: toda tool tiene exactamente 1 eje1 y 1 eje2; todo módulo declara consumes/produces
- `drift_judge` sobre el diseño del type system: `aligned`

**Estrategia de testing:** mutation testing sobre el validador de composición (mutar el eje2 debe romper el type check). Property-based: los invariantes del schema.

---

## L1 — Runtime: sandbox de 3 tiers

**Gap que cierra:** no se ejecuta código. Sin ejecución, no hay nada.

| Tarea | Descripción | Depende |
|---|---|---|
| L1-T1 | Sandbox **T0**: WASM en cliente, tools puras sin I/O. Integración Pyodide fork (base OSS, adaptado) | L0-T1 |
| L1-T2 | Sandbox **T1**: WASM + shim de red (patrón WebContainers fork), allowlist de dominios | L1-T1 |
| L1-T3 | Sandbox **T2**: microVM Firecracker para backend real (Market, Trabajos, wallet) | L1-T1 |
| L1-T4 | Detección de tier: qué tool requiere qué tier. Fallback claro si pide T2 desde T0 | L1-T1 |
| L1-T5 | Tests de aislamiento de red T1: intentar exfiltrar a dominio no permitido falla en el shim | L1-T2 |

**KPIs del loop:**
- Los 3 tiers ejecutan la misma tool pura y dan resultado idéntico
- `property_check`: ninguna tool T0 puede hacer I/O de red (verificable por análisis)
- Test de exfiltración T1: 100% bloqueado
- `drift_judge` sobre el diseño del sandbox: `aligned`

**Estrategia de testing:** property-based para aislamiento de red; manual para aislamiento de microVM (property-based no aplica a boundaries de hardware).

---

## L2 — Composición: módulos y harness

**Gap que cierra:** no hay módulos. El caso canónico (módulo end-to-end) valida la tesis del marketplace.

| Tarea | Descripción | Depende |
|---|---|---|
| L2-T1 | Representación del grafo: nodos (tools) y aristas (composición). Nodos de artifact = terminales | L0-T3 |
| L2-T2 | Composición: un módulo compone tools validando contratos. Artifact termina, no se compone hacia adentro | L2-T1 |
| L2-T3 | 3 tools atómicas bases: `EXEC` (python puro, det), `RENDER` (preview, det), `RESEARCH` (estocástica) | L1-T1 |
| L2-T4 | Harness: responde en modo X con el contexto inyectado. Es el `HARNESS` del ciclo de misiones | L2-T2 |
| L2-T5 | **Módulo end-to-end (CASO CANÓNICO)**: las 3 tools + harness. Si esto se construye aquí, cualquier app de terceros se puede construir | L2-T2, L2-T3, L2-T4 |
| L2-T6 | Distinción mutación vs receta: determinista → mutación (fork idéntico); estocástica → receta (cada corrida distinta) | L2-T2 |

**KPIs del loop:**
- **El caso canónico L2-T5 se construye dentro de vibe-tools** — es el criterio de éxito primario de todo el MVP
- `mutation_score` del type check de composición ≥ 80%
- `property_check`: un módulo con nodo artifact en posición interna es rechazado
- Test determinismo: la misma tool determinista da el mismo output 10/10; la estocástica da outputs distintos 8/10
- `drift_judge` sobre el diseño de módulos: `aligned`

**Estrategia de testing:** mutation testing sobre la regla "artifact termina"; property-based sobre cardinalidad del grafo.

---

## L3 — Boundary MEMORY (CRÍTICO)

**Gap que cierra:** no hay aislamiento de datos. **Este loop es bloqueante para publicar apps de terceros** — sin boundary, no se puede abrir el marketplace.

| Tarea | Descripción | Depende |
|---|---|---|
| L3-T1 | Contexto inyectado: el harness inyecta, la tool recibe solo lectura. `context_profile` por tool | L2-T4 |
| L3-T2 | Minimización: la tool recibe solo el contexto mínimo. `profile=none` es el default | L3-T1 |
| L3-T3 | Separación de identidades: el contexto nunca cruza legal/empresa/anónimo | L3-T1 |
| L3-T4 | Inmutabilidad: la tool emite `mutation_request`, el harness valida. La tool nunca escribe directo | L3-T1 |
| L3-T5 | No exfiltración: el contexto no sale del sandbox sin pasar el shim | L1-T2, L3-T1 |
| L3-T6 | Smoke test de inaccesibilidad: la tool no puede leer la memoria, verificado en runtime | L3-T1 |
| L3-T7 | Los 8 tests obligatorios de `boundary-memory-v1.md` | L3-T1..T6 |

**KPIs del loop:**
- **K4 = 8 de 8 tests verdes** (obligatorio, no negociable)
- `property_check`: contexto inyectado es inmutable (mutación detectada 100%)
- Test de no-exfiltración: 100% bloqueado
- Test de separación de identidades: cruzar identidad da contexto vacío, 100%
- `drift_judge` sobre `boundary-memory-v1.md`: `aligned`

**Estrategia de testing:** los 8 tests son property-based (invariantes de seguridad). Mutation testing sobre el validador de permisos.

---

## L4 — Identidad: de stub a 3 identidades

**Gap que cierra:** una persona no existe en el sistema. Sin identidad, no hay memoria por persona.

| Tarea | Descripción | Depende |
|---|---|---|
| L4-T1 | 1 identidad stub: legal/KYC simulado. Suficiente para una persona con mod propio | L2-T5 |
| L4-T2 | **SOTA KYC OSS Colombia** (investigación): stack viable de código abierto para cédula, liveness, screening. Si el stack es insuficiente → replantear identidad | L4-T1 |
| L4-T3 | 3 identidades: legal (KYC real), empresa (máx 3, fundador=admin), anónimo (1, nickname inmutable de pool cerrado) | L4-T2 |
| L4-T4 | Aislamiento lógico: RLS de PostgreSQL en AWS sobre `project_id`. 4 condiciones de admisibilidad legal | L4-T3 |
| L4-T5 | Permisos: deny by default, agrupados por categoría, psicométrico separado | L4-T3 |
| L4-T6 | Export `.opitapack`: derecho de portabilidad (art. 8 Ley 1581) | L4-T4 |

**El formato se llama `.opitapack`.** Lo decidió el operador el 2026-10-26 con
una razón corta: «es mejor para nosotros los humanos». El nombre anterior era
`.opitpack`, y el formato todavía no existe (es L4-T6), así que el cambio no
rompe nada publicado.

**KPIs del loop:**
- KYC stack OSS viable **O** decisión documentada de por qué no
- Test de aislamiento RLS: intento de acceso cruzado entre `project_id` falla 100%
- Test de las 4 condiciones de admisibilidad legal: 4/4 verdes
- `drift_judge` sobre `cumplimiento-aislamiento-datos-v1.md`: `aligned`

**Estrategia de testing:** property-based sobre RLS (invariantes de aislamiento); revisión legal del spec (no automatizable).

---

## L5 — Judge pipeline

**Gap que cierra:** el juez no es un producto. Publicar sin juez es publicar sin confianza.

| Tarea | Descripción | Depende |
|---|---|---|
| L5-T1 | Pipeline completo: `drift_judge` + `consensus n=3` + check de whitelist de módulos backend | L2-T5 |
| L5-T2 | **Costo de tokens**: el juez consume tokens. Mecanismo de cobro integrado al modelo de "margen de opita" | L5-T1 |
| L5-T3 | Spec de medición por ámbito/categoría: qué mide el juez, quién asigna el ámbito, cómo se puntúa | L5-T1 |
| L5-T4 | Manejo de `needs_human`: cuando el juez no puede decidir, no es drift. Superficie al operador | L5-T1 |
| L5-T5 | Tests del juez: mutar un artifact debe cambiar el veredicto (mutation testing del juez) | L5-T1 |

**KPIs del loop:**
- **K3 = 100% `aligned` con `stddev = 0`, `degraded = false`** sobre artifacts de vibe-tools
- `mutation_score` del pipeline del juez ≥ 80% (si el juez no detecta una mutación del artifact, es débil)
- Costo de tokens: medido y reportado por publicación
- `drift_judge` sobre el diseño del pipeline: `aligned`

**Estrategia de testing:** **mutation testing del juez** — este es el test más crítico del MVP. Mutar el artifact y verificar que el veredicto cambia es lo que prueba que el juez sirve. Property-based: el juez nunca da veredicto contradictorio.

---

## L6 — Marketplace

**Gap que cierra:** no hay dónde publicar. El marketplace es el mecanismo del ciclo.

| Tarea | Descripción | Depende |
|---|---|---|
| L6-T1 | Publicar módulo: flujo crear → validar → aceptar licencia de distribución → publicar | L5-T1 |
| L6-T2 | Licencia de distribución: no transfiere propiedad, pero da derecho a suspender/remover | L6-T1 |
| L6-T3 | **Pin: las 3 propias SIEMPRE primero**, sin excepción, sin rotación. Decisión firme del operador | L6-T1 |
| L6-T4 | Lista de terceros debajo, con distintivo mutación vs receta | L6-T1, L2-T6 |
| L6-T5 | 2 niveles: se publican tools atómicas y módulos. Módulo = unidad principal de descubrimiento | L6-T1 |

**KPIs del loop:**
- Pin verificado: las 3 propias siempre en posición 1, 100% de las veces
- Flujo de publicación completo sin fricción (persona lo recorre sin ayuda)
- `property_check`: 3 propias pinned antes de cualquier tercero, siempre
- `drift_judge` sobre el diseño del marketplace: `aligned`

**Estrategia de testing:** persona-based usability (5 psicometrías). Property-based sobre el orden del pin.

---

## L7 — Reputación: el ciclo completo

**Gap que cierra:** no hay incentivo. Sin reputación, nadie publica.

| Tarea | Descripción | Depende |
|---|---|---|
| L7-T1 | Sello de calidad: publicar → sello del juez → insignia visible | L5-T1, L6-T1 |
| L7-T2 | Número de reputación: sube con el sello, visible con badge | L7-T1 |
| L7-T3 | **Ciclo completo**: la reputación de vibe-tools se traduce en puntaje en Opita Trabajos | L7-T2 |
| L7-T4 | Nivel transversal: 2 monedas (reputación permanente + impulso semanal), 1 visible | L7-T2 |
| L7-T5 | Misiones mínimas (sin LLM por ahora): umbral baja, hook de engagement | L7-T4 |

**KPIs del loop:**
- **K1 = 5 de 5 personas externas recorren el ciclo completo sin ayuda** (el KPI principal)
- El ciclo `crear → publicar → sello → reputación → Trabajos` es observable end-to-end
- `mutation_score` del cálculo de reputación ≥ 80% (no hay forma de Reputation inflable)
- Usabilidad: 0 hallazgos `severity ≥ 12`
- `drift_judge` sobre el diseño de gamificación: `aligned`

**Estrategia de testing:** persona-based usability testing (el método de 10 personas del skill llm-testing). Este loop es donde K1 se verifica.

---

## L8 — SOTA: los 3 bloques de investigación

**Gap que cierra:** decisiones de producción tomadas con datos reales, no con hipótesis.

| Tarea | Descripción | Depende |
|---|---|---|
| L8-T1 | **SOTA KYC OSS Colombia**: ya parcialmente en L4-T2. Profundizar: liveness, face-match, screening de listas | L4-T2 |
| L8-T2 | **SOTA seguridad tiempo real con LLM** (anti-Sybil): device fingerprinting, behavioral biometrics, IP reputation, psicometría como señal antifraude. Patrón de dos capas: reglas deterministas para 99%, LLM para el 1% ambiguo | L4-T3 |
| L8-T3 | **SOTA progresión de larga duración**: validar el modelo de 2 monedas contra evidencia de la industria. Riot quitó el tope en 2024 — ¿qué más funciona? | L7-T4 |

**KPIs del loop:**
- Cada bloque produce una matriz de **señal × costo × efficacy × viabilidad serverless**
- Cada decisión de diseño de L4-L7 que dependía de SOTA se confirma o se replantea
- `drift_judge` sobre la investigación: `aligned` (el research es el artifact, no el código)

**Estrategia de testing:** no es código — es research. El "test" es la triangulación: ¿el SOTA confirma nuestra decisión? Si no, se replantea.

---

## L9 — Escala (post-MVP)

**Gap que cierra:** esto ya no es MVP. Es producción.

| Tarea | Descripción |
|---|---|
| L9-T1 | T2 real: Market, Trabajos, Wallet con backend Firecracker |
| L9-T2 | Organigrama en tiempo real vía chat (extensión del companion) |
| L9-T3 | Misiones LLM por psicometría con consentimiento separado (C4) |
| L9-T4 | Móvil nativo |
| L9-T5 | Multi-idioma |
| L9-T6 | Wallet Opita Saldo (no retirable) |
| L9-T7 | Pipeline de validación del régimen DENTRO en producción |

**Fuera del MVP. Es lo que sigue después de K1 = 5/5.**

---

## Resumen de loops

| Loop | Nombre | Tareas | KPI principal | Bloquea a |
|---|---|---|---|---|
| L0 | Fundación (type system) | 4 | mutation ≥ 80% | L1, L2 |
| L1 | Runtime (sandbox 3 tiers) | 5 | aislamiento T1 | L2 |
| L2 | Composición (módulos) | 6 | **caso canónico se construye** | L3, L4 |
| L3 | Boundary MEMORY | 7 | **K4 = 8/8 tests** | L4, L6 |
| L4 | Identidad (1 stub → 3) | 6 | RLS aislamiento | L5, L6 |
| L5 | Judge pipeline | 5 | **K3 = 100% aligned** | L6, L7 |
| L6 | Marketplace | 5 | pin siempre primero | L7 |
| L7 | Reputación (ciclo) | 5 | **K1 = 5/5 personas** | L8, L9 |
| L8 | SOTA (3 bloques) | 3 | matrices de señal | L9 |
| L9 | Escala | 7 | producción | — |

**Total: 49 tareas en 10 loops.**

---

## Criterio de "MVP terminado"

El MVP se declara terminado cuando **K1 se cumple**: 5 personas externas, sin ayuda, recorren el ciclo `crear → publicar → sello → reputación → Trabajos`. **Y todos los KPIs K1–K6 están en verde.**

No antes.
