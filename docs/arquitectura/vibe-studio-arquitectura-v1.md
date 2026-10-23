# Vibe Studio — Arquitectura v1 (propuesta inicial)

> Estado: **propuesta inicial**, derivada de las decisiones cerradas en sesión.
> Todo lo que sigue traza a una decisión persistida en dark-memory project `opita-code`.
> Los puntos marcados `[DECISION PENDIENTE]` requieren cierre antes de construir.

---

## 0. Principio rector

**Opita Code no es "4 apps que comparten una API". Es 1 plataforma (Vibe Studio) con N despliegues, y un marketplace donde la gente publica apps construidas sobre esa misma plataforma.**

Corolario: Vibe Studio está en el *critical path* de todo el ecosistema. Si Vibe Studio se construye
bien, Opita Trabajos y Opita Market son relativamente baratos encima. Si falla, no hay ecosistema.

---

## 1. Capas del sistema

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA 6 — MARKETPLACE          opitacode.com                │
│  3 apps propias PINNED primero · apps de terceros debajo   │
├─────────────────────────────────────────────────────────────┤
│  CAPA 5 — GAMIFICACIÓN         harness de misiones          │
│  por app + transversal · 2 monedas · 1 visible              │
├─────────────────────────────────────────────────────────────┤
│  CAPA 4 — SUPERFICIE DE AUTORÍA (Vibe Studio UI)           │
│  chat-aside · canvas de módulos · editor de código · preview│
├─────────────────────────────────────────────────────────────┤
│  CAPA 3 — RUNTIME DE VIBE STUDIO                            │
│  módulos componibles · sets nombrados · mutación event-sourced│
├─────────────────────────────────────────────────────────────┤
│  CAPA 2 — PERMISOS            deny by default               │
│  capability grants agrupados · consentimiento psicométrico   │
├─────────────────────────────────────────────────────────────┤
│  CAPA 1 — IDENTIDAD            3 identidades por persona    │
│  legal/KYC · empresa (máx 3) · anónimo (1, nickname fijo)  │
├─────────────────────────────────────────────────────────────┤
│  CAPA 0 — SUBSTRATO            dark-memory v4, por persona  │
│  mod propio · semantic/episodic/procedural · export          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. CAPA 0 — Substrate: dark-memory por persona

Decisiones cerradas:

- dark-memory v4 es el substrate de **todo** chat en Opita Code.
- Cada persona tiene un **mod propio** que ordena: decisiones (`decision`), preferencias (`semantic`), usos (`episodic`), reglas interiorizadas (`procedural`).
- **El mod es exportable** (derecho de portabilidad, Ley 1581/2012).
- Cada chat = 1 sesión dark-memory: `session_start` al abrir, `heartbeat` en conversaciones largas, `session_close(clean)` al cerrar.
- Audit trail por defecto para todos los chats.

`[DECISION PENDIENTE — CRÍTICA] Aislamiento físico del mod`

| Opción | Descripción | Costo | Blast radius |
|---|---|---|---|
| (a) | 1 instancia dark-memory, `project_id` por persona (aislamiento lógico) | Bajo | Un bug de aislamiento expone todas las memorias |
| (b) | 1 instancia, `project_id` por cohorte + `agent_id` por persona | Muy bajo | Similar a (a), granularidad menor |
| (c) | Instancia dark-memory dedicada por persona | Alto | Contenido a la persona |

**Pregunta abierta al operador.** Esto define costo, cumplimiento de Ley 1581 (aislamiento de datos personales) y dónde vive el `mod` cuando exportas.

`[DECISION PENDIENTE] ¿El mod es importable?`
Si sí → hay que sandboxearlo (un mod importado es prompt injection contra el companion a escala). Si
no → hay que documentar por qué no.

---

## 3. CAPA 1 — Identidad: 3 identidades por persona

Cada persona tiene **3 identidades simultáneas** que nunca se mezclan ni se cruzan entre sí:

### (1) Identidad Legal / KYC
- Obligatoria, fuerte, **stack 100% OpenSource** (requisito duro).
- Alcance: documento de identidad colombiano, liveness/face-match, screening de listas (sanctions/PEP), validación contra registros públicos.
- Es el "yo real". Puede registrar hasta **3 empresas** de por vida.
- Base legal: Ley 1581 de 2012 (datos sensibles).

`[BLOQUEANTE]` Requiere el bloque de investigación SOTA #2 (KYC OpenSource Colombia).

### (2) Identidad Empresa
- Hasta **3 empresas por persona**, de por vida. La 4ª+ tiene costo (importe TBD).
- El **fundador** (quien la registró) administra roles y permisos.
- Las personas operan dentro de la empresa bajo esos roles.
- Las empresas pueden **vibe-codear workspaces de sus empleados** en Vibe Studio.
- Las empresas publican trabajos en Opita Trabajos.
- **Los dueños siempre aparecen con nombre público** — regla dura de Opita Market.
- **El organigrama se discute y diseña en tiempo real vía chat** con el companion.
  (extensión del companion, no feature aparte)

### (3) Perfil Anónimo
- **1 por persona.**
- Nickname **INMUTABLE** una vez escogido.
- Escogido de un **pool cerrado de nombres opita** (no generación libre).
- **Anti-Sybil:** un humano = 1 identidad legal + 3 empresas + 1 anónimo = 5 identidades máximo. El nickname no se recicla.

`[PENDIENTE]` Diseño del pool: cantidad, fuente, criterio de asignación, unicidad, momento de asignación.
`[PENDIENTE]` Enlace legal↔anónimo en backend (aunque nunca se exponga públicamente) para evitar multi-cuenta.
`[PENDIENTE]` Importe del costo de la 4ª+ empresa.

---

## 4. CAPA 2 — Permisos: deny by default

Modelo de permisos estilo sistema operativo móvil, con 3 reglas duras:

1. **Deny by default.** Sin aceptación explícita, la app no accede.
2. **Permiso-de-app ≠ titular-del-dato.** Una app de un tercero puede pedir permiso para leer la
memoria de quien la usa, pero el dato es de la persona, no de quien escribió la app. El nivel base
de confianza **no es igual para todos**.
3. **Permisos agrupados por categoría**, no granulares — para evitar fatiga de consentimiento (si
pides 8 permisos uno por uno, la gente deja de leer y acepta todo, y el deny-by-default se vuelve
accept-all en la práctica).

**Línea esperada de confianza:**

| Tipo de app | Acceso a memoria del companion |
|---|---|
| Propias (Vibe Studio, Trabajos, Market) | Sí — para eso existen |
| Terceros | Deny by default → requiere aceptación explícita |

**Consentimiento psicométrico:** separado y explícito, en la pantalla propia de la persona. No va dentro de "acepto términos". Aplica tanto a personalización de la experiencia como a generación de misiones (uso con fines de engagement).

`[ESPECIFICACIÓN DEDICADA REQUERIDA]` El operador decidió: razonar y documentar el modelo completo **sin dejar gaps ni edge cases ignorados**. Requiere spec propio, no una fila de memoria. Se abre después del nivel transversal.

---

## 5. CAPA 3 — Runtime de Vibe Studio

### 5.1 Modelo de composición

- **Módulo** = unidad funcional mínima.
- Los módulos se **componen en sets nombrados**:
  - Set de desarrollo web = investigación + visibilidad (live webpage) + chat-aside
  - Set de backend = visualización de flujo de lógica en tiempo real + chat
- El usuario vibe-codea su tool y la **muta** a necesidad, de manera ordenada.

### 5.2 Mutación en tiempo real, ordenada

Decisión: la mutación es en tiempo real y ordenada. Esto implica un modelo **event-sourced**, no
snapshot-based:
- Cada mutación es un evento reproducible.
- El grafo de flujo se reconstruye desde el stream.
- Backend: event store (DynamoDB Streams / EventBridge como source of truth).
- Push a clientes: API Gateway WebSocket.

`[DECISION PENDIENTE]` CRDT opcional si la colaboración multi-autor es relevante.

### 5.3 ⚠️ Dónde se ejecuta el código de terceros

**Esta es la decisión técnica más grande del sistema y sigue abierta.**

| Opción | Descripción | Pros | Contras |
|---|---|---|---|
| (a) | Sandbox en navegador (WebContainers / iframe) | Barato, aislado por naturaleza, sin costo server-side | Solo frontend; sin backend real |
| (b) | Lambda por invocación con aislamiento estricto | Serverless nativo, barato a baja concurrencia | Cold starts, sin estado durable |
| (c) | Lambda con sandbox durable por app (Firecracker microVM) | Aislamiento fuerte, permite backend real | Caro, cold start largo |
| (d) | Híbrido: frontend en navegador, backend en Lambda | Alineado con el modelo "2 vistas" (web vs backend) | Más superficie de infraestructura |

**Impacto directo:** Opita Trabajos y Opita Market necesitan backend real (vacantes, pagos, saldo). El sandbox solo-navegador (a) **no alcanza**. Entre (b), (c) y (d), la decisión define el costo por usuario activo y el modelo de aislamiento real.

---

## 6. CAPA 4 — Superficie de autoría

Cuatro elementos que el operador ha nombrado:

| Elemento | Función | Estado |
|---|---|---|
| **chat-aside** (panel derecho) | Ancla de adopción — muscle memory Claude/ChatGPT/Codex/opencode/Copilot | Confirmado |
| **canvas de módulos** | Composición visual drag-and-drop de módulos | `[PENDIENTE Q6]` ¿existe como vista propia? |
| **editor de código en vivo** | Opcional, para quien quiera ver el código | Confirmado |
| **preview nativo** | Renderiza páginas web frontend dentro de la app | Confirmado |

- Default **sin código** (LLM-driven). El editor de código es opt-in.
- Idioma: **español neutro nativo + multi-idioma nativo** desde el día 1.
- Multi-tenant visual: sesiones simultáneas de chat/taller — research pendiente.

`[PENDIENTE Q6]` ¿2, 3 o 4 vistas coexistiendo? (las cuatro están Above; falta decidir si el canvas es vista de primera clase)
`[PENDIENTE Q4]` Tono del chat LLM (formal / informal-técnico / casual-cerano) — idioma ya resuelto, tono no.

---

## 7. CAPA 5 — Marketplace (opitacode.com)

### 7.1 Flujo de publicación

```
crear en Vibe Studio → validar → aceptar licencia de distribución → publicar en opitacode.com
```

### 7.2 Propiedad intelectual

- **El usuario es dueño de su código** desde que escribe el prompt.
- Opita Code **publica**, no posee.
- Toda modificación y desarrollo pertenece a quien envía el prompt y hace trabajar el modelo.
- Opita Code **NO puede forkear ni modificar** apps de terceros.
- **Opita Code SÍ puede suspender o remover** una app publicada (seguridad, KYC fallido del autor, violación de términos) — esto va explícito en la licencia de distribución.

`[PENDIENTE scope I]` Definir términos de la licencia de distribución:
- Causales de suspensión y si es preventiva o reactiva.
- Proceso de apelación del autor.
- Qué pasa con los datos de usuarios que ya usaban una app suspendida.
- Qué pasa con la app si el KYC del autor vence.

### 7.3 Descubrimiento

- Las **3 apps propias están SIEMPRE pinned y de primero**, sin excepción, sin rotación, sin contexto. Decisión firme del operador. **No re-litigar.**
- Las apps de terceros se muestran **debajo**, en el orden que corresponda.
- Valida y licencia antes de publicar → Opita Code no es "cualquier HTML dentro de tu plataforma".

---

## 8. CAPA 6 — Gamificación

### 8.1 Nivel transversal (cerrado)

| | **Reputación** | **Impulso** |
|---|---|---|
| Origen | Producción (crear, publicar, vender, contribuir) | Consumo + misiones |
| Naturaleza | Permanente | Efímero, reinicia **semanal** |
| Techo | Ninguno | Bajo (fuerza a producir) |
| Da | Insignias, color de nombre, badges | Badges de misión, progreso semanal |

- **2 monedas, 1 visible**: el usuario ve un único nivel = suma ponderada, producción pesa más.
- Solo granting **estético + comunidad**. No capacidad funcional, no peso en descubrimiento.
- Fundamento SOTA: Riot **quitó el tope de nivel 7** de Champion Mastery en mayo 2024 y la progresión sin techo + marcas de calidad persistentes es lo que sostiene el engagement de años. Un techo mata el sistema.

### 8.2 Misiones

- **Diarias y semanales** en todas las apps.
- **Harness por tarea**: se crea el harness adecuado que pasa el contexto y los parámetros apropiados para cada misión.
- Un harness **por app** + un harness **transversal**.
- Razonadas sobre **datos psicométricos + historial** de la persona.
- Consentimiento ya tocado: aceptación en la pantalla propia de la persona.

**Implicación arquitectural:** el harness de misiones es una app construida **dentro** de Vibe Studio. Es el **caso de uso canónico** — si el harness de misiones no se puede construir dentro de Vibe Studio, ninguna app de terceros se puede. Cuando se pruebe, no se prueba una feature: se prueba la tesis del marketplace.

---

## 9. Mapeo a AWS serverless

| Capa | Servicio candidato | Notas |
|---|---|---|
| Frontend / preview | CloudFront + Lambda@Edge | preview nativo, i18n en edge |
| Chat WebSocket | API Gateway WebSocket | mutación en tiempo real |
| Ejecución de módulos | Lambda (+ microVM si aplica) | ver decisión 5.3 |
| Eventos / mutaciones | DynamoDB Streams / EventBridge | source of truth event-sourced |
| Metadatos | DynamoDB | single-table, `project_id` por persona |
| Assets / previews | S3 | |
| Auth | Cognito (3 identidades) | |
| Workflows de misión | Step Functions | harness de misiones |
| **Memoria** | **dark-memory v4 self-hosted** | **NO es AWS — ver decisión 2** |

---

## 10. Bloqueantes abiertos

### Alta prioridad

| # | Bloque | Depende de |
|---|---|---|
| 1 | **Dónde se ejecuta el código de terceros** (5.3) | Decisión técnica mayor |
| 2 | **Aislamiento físico del mod** (2) | Decisión de costo + compliance |
| 3 | **Spec de permisos con edge cases** (4) | Razonamiento + documentación |
| 4 | **SOTA seguridad tiempo real con LLM** | Investigación bloque 1 |
| 5 | **SOTA KYC OpenSource Colombia** | Investigación bloque 2 |

### Media prioridad

| # | Bloque |
|---|---|
| 6 | Licencia de distribución — términos de suspensión/apelación |
| 7 | Pool cerrado de nombres opita |
| 8 | Costo de la 4ª+ empresa |
| 9 | Reglas de sharing/mutación de configs "gratis según caso de uso" (Q7 B) |
| 10 | Modos de edición: 2, 3 o 4 vistas (Q6 B) |

---

## 11. Nota operativa

El gate de drift de dark-memory v4 está caído: `judge`, `consensus` y `mindset_apply` devuelven `ErrInternal` (`judge` además está deprecado — spec 1276 H1: *"use DriftJudge with ArtifactRef"*). El health-check del LLM da 200, así que no es problema de key: es fallo interno del binario.

**Consecuencia:** `vibe_publish` devuelve `needs_human` por fallo de infra, no por drift real. Los artifacts se pueden guardar pero **no validar** hasta que se arregle el binario. Registrado como finding en dark-memory.
