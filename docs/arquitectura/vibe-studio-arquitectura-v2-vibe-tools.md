# Vibe Studio — Arquitectura v2 (vibe-tools)

> Estado: **propuesta de arquitectura**, posterior a `vibe-studio-arquitectura-v1.md`.
> Cada sección traza a una decisión persistida en dark-memory project `opita-code`.
> `[ABIERTO]` = requiere cierre antes de construir.

---

## 0. El runtime: **vibe-tools**

Nombre cerrado por el operador. Es el runtime de tools componibles — el análogo a React para crear
herramientas de IA.

### 0.1 Principio rector

> **Opita Code no es "4 apps que comparten una API". Es 1 plataforma (vibe-tools) con N despliegues, y un marketplace donde la gente publica herramientas construidas sobre ese mismo runtime.**

Corolario: vibe-tools está en el *critical path* de todo. Si vibe-tools se construye bien, Opita
Trabajos y Opita Market son baratos encima. Si falla, no hay ecosistema.

### 0.2 Se rechaza MCP como core

Decisión del operador, con tres razones estructurales:

1. **MCP es protocolo de proceso, no de función.** Habla JSON-RPC sobre stdio/HTTP; cada llamada
serializa, cruza un boundary y deserializa. Un móvil no instancia procesos.
2. **MCP no es componible.** Para que una tool A use una tool B se necesita un puente. En vibe-tools
la composición es **llamada de función directa**.
3. **MCP no tiene noción de módulo funcional.** El módulo vibe-tools es `tool + harness + runtime`, un flujo compuesto, no una función.

**Adapter MCP→vibe-tool queda como fuente de tools, no como arquitectura** (opcional, posterior).

---

## 1. La primitiva: Tool = función tipada

```
VibeTool {
  id, version, author_id
  vibe_case:  C1 | C2 | C3 | C4 | C5 | C6 | C7
  input_schema, output_schema
  run(input, ctx) -> output        ← función, no proceso
}
```

Sin protocolo. Sin JSON-RPC. Sin proceso. Es una función con firma, como los hooks de React — eso es
lo que hace posible mobile-first y lo que hace la composición gratis.

### 1.1 El principio: contratos confiables alrededor de magia opaca

**Fundamento (del operador):** *todo en la web es código · vibe-studio es para gente que no sabe escribir código · la generación es magia.*

De ahí sale la conclusión que ancla todo el diseño:

> **vibe-tools = un sistema de CONTRATOS CONFIABLES alrededor de MAGIA OPACA.**

La persona que viene a vibe-studio **no puede leer el código**. Nunca pudo. Solo puede confiar en
que algo hace lo que dice. Eso no es una limitación — **es el producto**.

Todo lo demás se deriva:

| Pieza | Qué es realmente |
|---|---|
| Type system | El **lenguaje de contratos** |
| El juez | El **verificador de contratos** |
| El marketplace | El **intercambio de contratos** |
| Los permisos | Lo que la **magia puede tocar** |

### 1.2 El type system de vibe-tools: dos ejes

**Propio de vibe-tools, ortogonal a vibe-case.**

```
Eje 1 — QUÉ produce:    code · text · image · video · audio · multimodal
Eje 2 — DETERMINISMO:  determinista | estocástica | con estado
```

El **segundo eje es el que importa**: define cómo se verifica, cómo se comparte y qué puede
componerse.

- Módulo con solo tools **deterministas** → **se compila**
- Módulo con tools **estocásticas** → **se interpreta**

### 1.3 Las reglas que se derivan

**(a) Composición: el código compone, los artifacts terminan.**
Una tool que produce artifact es un **nodo terminal** del grafo. No se compone hacia adentro. Esto
da el canvas gratis: los nodos de artifact se ven distintos a los de código.

**(b) Verificación: el juez verifica el artifact, no el proceso.**
La magia es el paso de generación; la verificación es sobre lo que salió. El juez no evalúa *cómo*
la tool llegó al resultado — evalúa si el resultado cumple el spec.

**(c) Mutación vs receta.**

| Tipo de tool | Cómo se comparte |
|---|---|
| **Determinista** | Como **mutación** — fork, idéntica, es tuya |
| **Estocástica** | Como **receta** — cada corrida da un resultado distinto |

Esto **define "mutarse sin costo"** de forma literal: la mutación es una cosa para lo determinista y
una receta para lo estocástico. Sin esta distinción, "mutarse gratis" no es definible.

**(d) Vibe-case queda como selector de rúbrica del juez (gobernanza), NO como type system.**
Son cosas distintas: *qué trabajo se evalúa* vs *qué produce una tool*. Mezclarlas hace que el juez
evalúe mal.

### 1.4 Dónde se valida

- La **firma** (io-schema) se valida **en el cliente, en WASM, antes de ejecutar**. Local, instantáneo, sin red.
- El **eje de determinismo** y el contrato se validan **en la frontera de confianza** (publicación y uso server-side).

Resultado: los errores de composición se ven **instantáneamente mientras el usuario compone**. Es la
sensación "todo encaja" de React con los props types.

### 1.2 Módulos

```
VibeModule {
  id, version, author_id
  consumes: vibe_case[]
  produces: vibe_case
  tools: VibeTool[]           ← composición
  harness: Harness            ← cómo responde
}
```

Ejemplo del operador, ya type-checked:

```
INV(C6→C2) + HARNESS(?→C6) + EXEC(C1→C1)
  →  módulo: "escribir Python en modo X a la perfección"  (C2→C1)
```

Si otra persona ya publicó las tres tools, el módulo se arma en segundos. **Eso es el marketplace
funcionando.**

---

## 2. Los dos regímenes

**La frontera es la publicación en opitacode.com.**

### Régimen DENTRO — app publicada en opitacode.com

| Regla | Detalle |
|---|---|
| Superficie | **0 código**, principalmente frontend. El usuario no viene por ingeniería. |
| Backend | Solo **módulos backend permitidos** por opita (whitelist) |
| Objetivo del whitelist | Limitar acceso a lo que **no se cobra serverless apropiadamente** (bases de datos, almacenamiento persistente) para reducir costes |
| Deploy | **Gratis si pasa el juez** |
| Límite | **Máx 3 apps publicadas** por persona |
| Ejecución | AWS **serverless-first** |
| Validación | Debe seguir las reglas de opita |

### Régimen FUERA — contenido no publicado para opitacode.com

| Regla | Detalle |
|---|---|
| Acceso | **Vibe-tools generales, sin restricciones** |
| Ejemplos | código Python o backend, un video, una foto editada |
| Ejecución | El usuario controla su código y su infraestructura |
| Validación | No pasa por el juez de opita — no es app de opita |

`[ABIERTO]` Si una app **ya publicada** puede invocar vibe-tools generales, o si publicar es una decisión irreversible respecto al acceso a tools sin whitelist.

`[ABIERTO]` Qué pasa al superar las 3 apps (¿costo por la 4ª+? ¿las 3 de por vida?). Nota: todo en esta plataforma tiene límite 3 — 3 identidades, 3 empresas, 3 apps. El patrón es intencional.

---

## 3. Local-first

Decisión del operador: **el código de las personas y todos los archivos que crean se manejan en
local**, tanto en móvil como en PC.

El código **no vive en el servidor hasta que la persona elige desplegar**. Local-first +
serverless-first atacan los dos costos principales de un marketplace: almacenamiento de código
inactivo, y cómputo no cobrado.

---

## 4. vibe-spec: el framework verificable

Todo componente de vibe-tools usa el framework **vibe-spec** propio y sigue el patrón verificable
para poder pasar por el juez.

```
tool / módulo / app
   → vibe-spec (spec + tasks)
   → vibe_publish (artifact)
   → drift_judge + consensus  ← EL JUEZ
   → verdict: aligned | drift_detected | needs_human
```

**El juez valida:** corrección (drift), seguridad (consensus + tests), y — `[ABIERTO]` — si valida **cumplimiento de la whitelist** de módulos backend. Sin eso, alguien podría meter una tool no-permitida y igual pasar el juez.

---

## 5. Sandbox: 3 tiers, coste progresivo

**No todo necesita lo mismo.** El coste por usuario es proporcional al uso real.

| Tier | Qué corre | Dónde | Para qué |
|---|---|---|---|
| **T0 — Pure** | Tools puras, sin I/O | **WASM en cliente** | Cálculo, parseo, transformaciones |
| **T1 — Client** | Tools con I/O de red acotado | **WASM + shim de red** (patrón WebContainers) | Preview, fetch controlado, UI |
| **T2 — Server** | Tools que necesitan backend real | **microVM Firecracker** | Trabajos (vacantes), Market (pagos), saldo |

### Fundamento SOTA 2026

- **MicroVM Firecracker** es el default pragmático 2026 para código no confiable / generado por IA. Guest kernel separado = un exploit de kernel no toca el host. gVisor si se necesita compatibilidad de contenedores.
- **Vercel Sandbox** hizo GA en enero 2026 → la infra microVM administrada ya es producto.
- **WebContainers (StackBlitz)**: Node.js completo compilado a WASM corriendo 100% en el navegador, con filesystem virtual y network shim. Patrón de referencia para Node-en-móvil.
- **WASI 0.3 + Component Model**: ratified, con streaming asíncrono (`stream<T>`, `future<T>`). Runtimes maduros: Wasmtime, Spin 3.0+, wasmCloud, WasmEdge. En 2026 WASM dejó de ser tecnología de navegador.
- **Pyodide**: CPython a WASM con NumPy/Pandas/Matplotlib. La guía 2026 recomienda mover a runtime Wasm custom solo el 5-10% realmente performance-critical.

### Por qué esto resuelve mobile-first

La persona **compone, ve preview, e itera en el chat** — todo T0/T1, en su teléfono, sin costo
server. Solo lo que genuinamente necesita backend (Market, Trabajos, wallet) paga T2.

---

## 6. Las tools atómicas iniciales

| Tool | Vibe-case | Tier | Función |
|---|---|---|---|
| `INV` | C6→C2 | T1 | Investigación (research recursive / academic / CVE / domain / dns / cert / threat / geo / news) |
| `CODEGEN` | ?→C1 | T1 | Generación de código Python/JS en modo X |
| `EXEC` | C1→C1 | T0 | Runtime Python (Pyodide) |
| `HARNESS` | ?→C6 | T0 | Responde en modo X, con contexto del mod |
| `RENDER` | C1→C3 | T1 | Preview frontend nativo |
| `MEMORY` | ?→C6 | T1 | Lee/escribe el mod de dark-memory — **boundary de confianza** |

### 6.1 `MEMORY` es la tool más importante

Toda tool que lea la memoria del usuario pasa por los permisos definidos (deny by default,
consentimiento explícito, psicométrico separado bajo Ley 1581). Esa tool es **el boundary de
confianza** de todo vibe-tools.

`[ABIERTO — decisión de seguridad]` Si la tool **lee** la memoria (puede pedir permiso para lo que quiera) o si la memoria se **inyecta como contexto** (la tool solo recibe lo que el harness decide darle). trade-off: seguridad vs. flexibilidad.

---

### 7.1 Mutación vs receta (determinismo)

Una tool **determinista** se comparte como **mutación**: fork, idéntica, es tuya.
Una tool **estocástica** solo se comparte como **receta**: cada corrida da un resultado distinto.

Esto define "mutarse sin costo" de forma literal y es la base del modelo de compartición del
marketplace.

`[ABIERTO]` ¿Cómo puntúa y se diferencia una **mutación** de una **receta** en el marketplace? Una mutación es reutilizable y testeable; una receta es una promesa, no un artefacto. El juez las trata distinto.

### 7.2 Portabilidad: el `.opitpack`

Dado que el usuario es dueño del código, y dado que los AI app builders tienen techo 80/20 en
deployment, la portabilidad es **una feature, no un afterthought**.

- El mod de dark-memory es **exportable** (derecho de portabilidad, Ley 1581).
- El bundle de vibe-tools es un **`.opitpack`** exportable: las tools, sus versiones, y sus permisos.

Hallazgo SOTA que lo respalda: el BuilderProof leaderboard 2026 de portabilidad califica v0/Bolt 8,
Lovable/Replit 7, Base44 4 (de 10). Y el hallazgo: *"code ownership no es lo mismo que
portability"*. Ser dueño sin poder salir es dueño a medias.

---

## 8. Sistema de niveles transversal (cerrado)

| | **Reputación** | **Impulso** |
|---|---|---|
| Origen | Producción (crear, publicar, vender, contribuir) | Consumo + misiones |
| Naturaleza | Permanente | Efímero, reinicia **semanal** |
| Techo | Ninguno | Bajo (fuerza a producir) |
| Da | Insignias, color de nombre, badges | Badges de misión, progreso semanal |

- **2 monedas, 1 visible**: el usuario ve un único nivel = suma ponderada, producción pesa más.
- Solo granting **estético + comunidad**. No capacidad funcional, no peso en descubrimiento.
- Fundamento SOTA: Riot **quitó el tope de nivel 7** de Champion Mastery en mayo 2024; la progresión sin techo + marcas de calidad persistentes es lo que sostiene el engagement de años. Un techo mata el sistema.

### Misiones

- Diarias y semanales en todas las apps.
- **Harness por tarea**: el harness adecuado que pasa contexto y parámetros de cada misión.
- Un harness **por app** + uno **transversal**.
- Razonadas sobre **datos psicométricos + historial**, con consentimiento en la pantalla propia.

**Implicación arquitectural:** el harness de misiones es una app construida **dentro** de vibe-tools. Es el **caso de uso canónico** — si el harness de misiones no se puede construir dentro, ninguna app de terceros se puede.

---

## 9. Identidad y permisos (capas 1-2 del v1, resumido)

**3 identidades por persona**, que nunca se mezclan ni se cruzan entre sí:
1. **Legal/KYC** — obligatoria, fuerte, stack 100% OpenSource. Hasta 3 empresas de por vida.
2. **Empresa** — hasta 3. Fundador = admin de roles y permisos. El organigrama se diseña en tiempo
real vía chat.
3. **Anónimo** — 1 por persona, nickname **inmutable** de pool cerrado. Anti-Sybil.

**Permisos: deny by default**, permisos agrupados por categoría (evitar fatiga de consentimiento), psicométrico con consentimiento **separado y explícito** (Ley 1581).

`[ESPECIFICACIÓN DEDICADA]` El modelo de permisos completo — con edge cases — es un spec aparte, decisión ya tomada por el operador.

---

## 10. Capa marketplace (opitacode.com)

- Las **3 apps propias SIEMPRE pinned y de primero**, sin excepción, sin rotación, sin contexto. Decisión firme. **No re-litigar.**
- Las apps de terceros se muestran **debajo**.
- Flujo: crear → validar → aceptar licencia de distribución → publicar.
- **El usuario es dueño de su código** desde que escribe el prompt. Opita Code publica, no posee.
- **Opita Code SÍ puede suspender/remover** una app publicada — va explícito en la licencia de distribución.

---

## 11. Abiertos (todos requieren decisión del operador)

### Alta prioridad

| # | Abierto | Por qué importa |
|---|---|---|
| 1 | **¿Una app publicada puede invocar vibe-tools generales?** | Define si la whitelist tiene dientes |
| 2 | **Qué pasa al superar las 3 apps** | Patrón 3× en toda la plataforma |
| 3 | **¿El juez valida cumplimiento de la whitelist?** | Si no, la whitelist es decorativa |
| 4 | **`MEMORY`: ¿lee o se inyecta?** | El boundary de confianza de todo vibe-tools |
| 5 | **Aislamiento físico del mod** (v1 §2) | Costo + cumplimiento Ley 1581 |

### Media prioridad

| # | Abierto |
|---|---|
| 6 | ¿El mod es importable? (→ sandbox de prompt injection) |
| 7 | Licencia de distribución: causales de suspensión, apelación, KYC vencido |
| 8 | Pool cerrado de nombres opita |
| 9 | Reglas de sharing/mutación de configs "gratis según caso de uso" |
| 10 | Modos de edición: 2, 3 o 4 vistas |

---

## 12. Nota operativa: gate de drift caído

`judge`, `consensus` y `mindset_apply` devuelven `ErrInternal` en dark-memory v4 (`judge` además está deprecado — spec 1276 H1). Health-check del LLM da 200 → no es key, es fallo interno del binario.

**Consecuencia:** el juez de vibe-spec — que es el corazón del régimen DENTRO — **no puede ejecutarse** hasta que se arregle el binario. Esto es un bloqueante de arranque, no un detalle. Registrado como finding en dark-memory.
