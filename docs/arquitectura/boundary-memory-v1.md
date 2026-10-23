# Boundary `MEMORY` — Especificación

> **Estado:** propuesta para validación del operador.
> Decisión ya cerrada: la memoria **se inyecta como contexto**; la tool nunca la lee.
> El operador: *"la memoria es el corazón de todo esto. El diseño debe ser perfecto e incorruptible."*

---

## 0. Por qué esta spec existe

`MEMORY` no es una tool más. Es **el boundary de confianza de todo vibe-tools**. Si se rompe:

- Se filtran datos psicométricos (dato sensible, Ley 1581 art. 5).
- Se cruzan identidades (legal / empresa / anónimo) sin autorización.
- El sistema entero deja de ser auditable — y sin audit trail no hay cumplimiento.

Esta spec define ese boundary con edge cases explícitos, tal como pidió el operador.

---

## 1. El principio

> **La tool nunca lee la memoria. El harness decide qué contexto se inyecta. La tool recibe solo lo mínimo, en solo lectura, con registro.**

La diferencia no es de estilo. Es estructural:

| | Tool **lee** | Memoria **inyectada** |
|---|---|---|
| Enforcement | Chequeo de permisos → **bypass-able** | El dato **no existe** para la tool |
| Si hay bug | Fuga | La tool **nunca lo vio** |
| Guarantee | *Improbable* que se filtre | *Imposible* que se filtre |

La decisión del operador elige la columna de la derecha. Esta spec hace que esa columna sea verdad.

---

## 2. Quién decide: el harness

El harness es el **único actor con autoridad de selección**. La tool **nunca expresa qué contexto quiere**.

```
Tool:  run(input, ctx) -> output
                 ↑
Harness: decide ctx antes de invocar la tool
```

**Prohibido:** que la tool declare `needs_context("psychometrics")`. Si la necesita, la pide **en su spec al autorarse**, y el harness decide si se le concede.

**Por qué:** si la tool declara lo que necesita, el modelo de permisos se convierte en una whitelist de tools que piden todo. La decisión tiene que estar antes de la tool, no adentro.

---

## 3. Minimización

Cada tool declara en su spec un **perfil de contexto permitido**, acotado a lo mínimo para su tarea.

```
ToolSpec {
  context_profile: "none" | "preferences" | "usage_history" | "psychometric_optin"
}
```

- La mayoría de las tools de marketplace: `"none"`.
- Una tool de personalización: `"preferences"`.
- Una tool de misión: `"usage_history"` (+ psicometría **solo** con consentimiento explícito).
- `"psychometric_optin"`: caso exceptional, requiere consentimiento C3 **y** que el uso sea una finalidad declarada (art. 4.1.b).

**Test de minimalidad:** una tool que no necesita psicometría **no la recibe**, aunque tenga `context_profile` amplio. El harness verifica que el perfil declarado coincida con la tarea declarada.

---

## 4. Separación de identidades

**Regla dura:** el contexto inyectado **nunca** cruza identidades.

| Identidad | Contexto que puede inyectarse |
|---|---|
| Legal / KYC | Contexto de la identidad legal, **nunca** de empresa ni anónimo |
| Empresa | Contexto de la empresa + rol verificado, **nunca** de la legal ni del anónimo |
| Anónimo | **Nada** del legal ni de la empresa. El nickname es lo único que existe para terceros |

**Prueba obligatoria:** una tool de tercero que opera bajo identidad de empresa **no puede** recibir contexto de la identidad legal, aunque la misma persona sea el dueño de ambas. La persona tiene 3 identidades separadas precisamente para que esto sea cierto.

---

## 5. Inmutabilidad

- El contexto inyectado es **de solo lectura** para la tool.
- La tool **no escribe ni muta** la memoria.
- Para escribir, la tool **no escribe**: emite una **solicitud de mutación**, que el harness valida contra permisos y aplica o rechaza.

```
Tool emite: { mutation_request: { ... } }
Harness:     valida permisos → aplica o rechaza → audita
```

**Por qué:** si la tool puede escribir, entonces un `.opitpack` malicioso puede **reescribir la memoria de quien lo instala**. La escritura pasa por el harness o no pasa.

---

## 6. Filtro psicométrico

El perfil psicométrico es **dato sensible** (Ley 1581 art. 5). Tiene su propia capa.

| Regla | Implementación |
|---|---|
| Consentimiento explícito y separado | Pantalla propia, fuera de "acepto términos" |
| Finalidad declarada | Personalizar ≠ generar misiones (son fines distintos) |
| Inyección solo con `context_profile` que lo pida | La mayoría de tools no lo piden |
| Registro | Cada inyección psicométrica queda en audit trail con la finalidad |

**Punto crítico:** aceptar C3 (personalización) **no** autoriza C4 (misiones de engagement). El harness debe rastrear **para qué** se inyecta, no solo que se inyecta.

---

## 7. Auditoría

Cada inyección produce un registro con:

| Campo | Contenido |
|---|---|
| `session_id` | Sesión dark-memory |
| `tool_id`, `version` | Qué tool recibió contexto |
| `context_profile` | Qué perfil pidió |
| `fields_injected` | Qué campos concretos se dieron |
| `identity_context` | Bajo qué identidad |
| `purpose` | Para qué se usa (finalidad) |
| `actor` | Quién la invocó (persona, app, empresa) |

Esto es lo que hace el aislamiento **demostrable** ante la ley: no solo "no debería poder", sino "y hay registro de cada vez que lo hizo".

---

## 8. No exfiltración

El contexto inyectado no puede salir del sandbox.

| Capa | Control |
|---|---|
| T0 — WASM puro | Sin red. No puede exfiltrar. |
| T1 — WASM + shim | Toda salida pasa por el shim, que filtra por dominio permitido |
| T2 — microVM | Aislamiento de red; egress por allowlist |

**Test:** un intento de enviar el contexto a un dominio no permitido debe fallar en el shim, no "funcionar y avisar después".

---

## 9. Edge cases

| # | Caso | Regla |
|---|---|---|
| E1 | Tool pide contexto que no le corresponde | El harness lo rechaza. La tool no sabe que existe. |
| E2 | Contexto vacío | La tool corre con `ctx = {}`. Debe manejarlo sin fallar. |
| E3 | Tool de tercero vs. tool propia | La propia tiene perfil base; la de tercero arranca en `deny`. |
| E4 | Tool muta en loop | Las solicitudes de mutación pasan por el harness; loop se corta por presupuesto. |
| E5 | Misma persona, 2 identidades | Contexto de una **nunca** se filtra a la otra. |
| E6 | `.opitpack` malicioso instalado | No puede pedir contexto: no declara permisos. No puede escribir: pasa por harness. |
| E7 | Tool que **es** el harness | No puede ocurrir: el harness no es una tool. Separación de roles. |
| E8 | Tool legítima pide psicometría sin consentimiento | El harness rechaza (falta C3). |
| E9 | Persona revoca C3 después | Inyecciones psicométricas cesan de inmediato. |
| E10 | Tool de empresa pide contexto de un empleado | Solo si hay rol verificado del **empleado** para esa tool. No por ser dueño de la empresa. |
| E11 | Dos personas usan la misma app | Cada una recibe su contexto. La app no acumula contexto entre sesiones. |
| E12 | Contexto con datos de terceros | El contexto de una persona **no** incluye datos de con quien interactuó, salvo que esa persona los haya compartido. |

---

## 10. Arquitectura

```
┌─────────────────────────────────────────────────┐
│ Persona                                          │
│   mod de dark-memory (project_id)                │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ HARNESS  ← ÚNICO actor con autoridad             │
│   1. verifica permisos                            │
│   2. minimiza contexto                            │
│   3. inyecta (solo lectura)                       │
│   4. audita                                       │
└──────────────────┬──────────────────────────────┘
                   │  ctx (mínimo, solo lectura)
                   ▼
┌─────────────────────────────────────────────────┐
│ TOOL  ← nunca lee la memoria                     │
│   run(input, ctx) -> output                      │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
        mutation_request → vuelve al HARNESS
```

---

## 11. Tests obligatorios (precondición de go-live)

| # | Test | Criterio |
|---|---|---|
| T1 | Tool de tercero intenta leer memoria | Falla — no tiene acceso |
| T2 | Tool pide psicometría sin C3 | Contexto llega sin psicometría |
| T3 | Tool intenta cruzar identidades | Contexto vacío para la identidad no autorizada |
| T4 | Tool intenta escribir memoria | Rechazado; pasa por harness |
| T5 | `.opitpack` malicioso pide contexto | Ignorado; los permisos no los declara la tool |
| T6 | Tool exfiltra a dominio no permitido | Bloqueado en el shim |
| T7 | Persona revoca C3 | Inyección psicométrica cesa |
| T8 | Misma tool, 2 personas | Cada una recibe solo su contexto |

Sin estos tests verdes, el régimen DENTRO no abre.

---

## 12. Abiertos

| # | Abierto |
|---|---|
| 1 | ¿Quién es el harness exactamente: un servicio, o código por app? |
| 2 | ¿El harness puede ser extendido por apps de terceros? (probablemente no) |
| 3 | Presupuesto de mutaciones por sesión (E4) |
| 4 | ¿Qué pasa con herramientas de terceros que **necesitan** contexto amplio y no la reciben? |

---

## Nota

Esta spec define el boundary de confianza. **Su implementación depende de que el juez funcione.**

> **Corrección 2026-10-23 (loop L-PUB).** Esta nota afirmaba que el juez estaba
> caído (`judge`/`consensus`/`mindset_apply` → `ErrInternal` en dark-memory v4) y
> que arreglar el binario era precondición. **Era falso, y la causa estaba a
> una capa de la que la nota apuntaba.** El binario estaba bien; lo que estaba
> sin credencial era el canal NLI, que el veredicto de `drift_judge` usa y que
> **no consulta el keyring**: lee el token del binding del proyecto, y ese
> token estaba agotado.
>
> Con el binding repuesto y el proceso reiniciado (el proveedor se cachea en
> el orquestador, así que cambiar la configuración no toma efecto hasta que
> el proceso muere), el juez opera: los diez documentos de L3 se juzgaron
> `aligned` con `confidence 1.0000` y `nli_label=entailment`.
>
> Lo que la nota acertaba sin decirlo: la avería no era del código del juez,
> sino de su configuración. Por eso «arreglar el binario» era la instrucción
> equivocada, y esa clase de instrucción es la que hace que un equipo rebuild
> algo que ya funciona. El detalle está en [L-PUB-correcciones](loops/L-PUB-correcciones.md).