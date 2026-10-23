# Scope I — Cumplimiento legal: aislamiento de datos

> **Estado:** borrador técnico-legal. **NO declara conformidad.**
> Este documento traduce la normativa colombiana a requisitos de implementación para Opita Code.
> Requiere revisión de abogado specialization en protección de datos en Colombia antes de declararse conforme.

**Base normativa:** Ley Estatutaria 1581 de 2012 · Decreto 1377 de 2013 · Decreto 1081 de 2015 · C-748 de 2011.
**Autoridad de control:** SIC (Superintendencia de Industria y Comercio).
**Alcance (art. 2):** los principios aplican a datos personales en cualquier base susceptible de tratamiento por entidades públicas o privadas.

---

## 1. Inventario de datos tratados

Punto de partida obligatorio: no se puede cumprir un principio sobre datos que no se han
inventariado.

| # | Dato | Dato personal | **Sensible** (art. 5) | Guardado en | Finalidad declarada |
|---|---|---|---|---|---|
| D1 | Nombre legal, documento de identidad | Sí | **Sí** (biométrico si hay liveness) | dark-memory mod, identidad legal | KYC + identificación |
| D2 | Rostro / template biométrico (liveness, face-match) | Sí | **Sí** | Almacenamiento KYC (por definir) | Verificación de identidad |
| D3 | **Perfil psicométrico** | Sí | **Sí** (afecta intimidad, discriminable) | dark-memory mod | Personalización de la experiencia |
| D4 | Historial de usos en productos Opita | Sí | No | dark-memory mod (`episodic`) | Personalización, misiones, reputación |
| D5 | Preferencias y decisiones | Sí | No | dark-memory mod (`semantic`/`decision`) | Personalización, memoria del companion |
| D6 | Datos de empresa (RUT, razón social, roles, organigrama) | Sí | No | dark-memory mod de identidad empresa | Operación de la empresa |
| D7 | Nickname anónimo | pseudónimo | No | Registro de identidades | exercising perfil anónimo |
| D8 | Nivel, reputación, misiones | Sí | No | Registro de reputación | Gamificación transversal |
| D9 | Contenido creado por la persona (código, imágenes, video) | Depende | Depende | **Local** (local-first) | Creación de la persona |
| D10 | Transacciones con Opita Saldo | Sí | No | Registro financiero | Prestación del servicio |

**Conclusión inmediata:** D2, D3 y D4 configuran el perfil de una persona y por tanto activan las obligaciones de dato sensible en el tratamiento agregado. Eso obliga a un estándar de tratamiento reforzado para todo el `mod`, no solo para el subconjunto psicométrico.

---

## 2. Matriz principio → requisito → implementación → verificación

| Principio (ley 1581) | Requisito legal | Implementación en Opita Code | Verificación |
|---|---|---|---|
| **Finalidad** (art. 4.1.b) | El dato se usa solo para el fin recogido. Treatments incompatibles requieren autorización | Cada dato de la tabla §1 tiene una finalidad declarada y registrada. **Misiones = finalidad DISTINTA** a personalización → requiere consentimiento propio | Registro de tratamientos + pantalla de consentimiento por finalidad |
| **Libertad** (art. 4.1.c) | El consentimiento es siempre opcional y revocable | Consentimiento granular por finalidad. Rechazar psicometría no impide usar la plataforma | Test: rechazar psicometría y verificar que el resto funciona |
| **Calidad** (art. 4.1.d) | Datos verificados, exactos, actualizado | Persona puede rectificar su perfil; el mod se actualiza | Ejercicio del derecho de rectificación |
| **Transparencia** (art. 4.1.e) | El titular conoce el tratamiento | Política de privacidad clara + pantalla de consentimiento propia | Revisión del texto por abogado |
| **Seguridad** (art. 4.1.f, art. 15) | Medidas técnicas y administrativas | Ver §3 | Tests de aislamiento + auditoría |
| **Confidencialidad** (art. 10) | DutiesQM solo para personal/encargados | dark-memory: los `project_id` son la frontera; nadie accede a un mod ajeno | Test: intento de acceso cruzado entre project_ids |
| **Acceso y rectificación** (art. 8) | El titular conoce, accede, actualiza, rectifica, suprime | Panel de control en el companion: ver, corregir, descargar (.opitpack), suprimir | E2E del flujo de derechos |
| **Sensibles** (art. 5, art. 9) | Consentimiento **explícito, separado y por escrito** | Pantalla propia y separada para psicometría y biometría. Nunca dentro de "acepto términos" | Verificación de que no están agrupados |

---

## 3. Requisitos de seguridad (art. 15)

### 3.1 Aislamiento entre identidades

Modelo de 3 identidades que **nunca se cruzan**:

| Identidad | Project namespace | Acceden apps de terceros? | Acceden apps propias? |
|---|---|---|---|
| Legal / KYC | `identity:legal:<uuid>` | Solo con permiso explícito | Sí |
| Empresa | `identity:org:<uuid>` | Solo con permiso explícito | Sí |
| Anónimo | `identity:anon:<uuid>` | Solo con permiso explícito | Sí |

**Regla dura:** una app publicada por un tercero **nunca** accede a la memoria de una persona distinta de quien la usa, y **nunca** cruza identidades. Esto aplica incluso a apps propias cuando operan bajo contexto de tercero.

### 3.2 Aislamiento físico: lógico vs. físico

**La ley no exige microVM. Exige aislamiento efectivo y demostrable.** Esto abre una decisión de ingeniería con base legal:

| Opción | Descripción | ¿Cumple? | Condición |
|---|---|---|---|
| **L — Lógico** | Una instancia dark-memory, `project_id` por persona/identidad, control de acceso riguroso + auditoría + cifrado | **Defendible** | Solo si el control de acceso es efectivo y auditable, y hay una garantía técnica de que el aislamiento no se bypasea |
| **F — Físico** | Instancia dark-memory dedicada por persona | **Defendible** | Costo prohibitivo a escala; reservado a casos de alto riesgo |

**Lectura legal:** la opción L es admisible si y solo si se puede demostrar que un acceso indebido a un `project_id` ajeno es imposible en la práctica, no solo improbable. Eso obliga a:

1. **Autorización en la capa de acceso**, no en la lógica de la app.
2. **Cifrado en reposo y en tránsito**: TLS en tránsito, AES-256 en reposo, claves en KMS con
rotación.
3. **Auditoría de todo acceso**: quién, cuándo, qué dato, para qué, desde dónde (principio de
accountability).
4. **Tests de aislamiento automatizados**: intento de acceso cruzado debe fallar siempre.

---

## 4. El boundary `MEMORY` (contexto inyectado)

Decisión cerrada: la memoria **se inyecta como contexto**; la tool nunca la lee.

| Requisito | Implementación | Verificación |
|---|---|---|
| Minimización | La tool recibe solo el contexto mínimo para la tarea | Test: tool que no necesita psicometría no lo recibe |
| Separación de identidades | El contexto inyectado nunca cruza identidades | Test de intentar leer contexto de otra identidad |
| Solo lectura | La tool no escribe ni muta la memoria | Test: intento de escritura rechazado |
| Filtro psicométrico | El perfil psicométrico solo se inyecta con consentimiento explícito y separado | Test: sin consentimiento → contexto sin psicometría |
| Auditoría | Cada inyección queda registrada | Log de inyecciones consultable |
| No exfiltración | El contexto no sale del sandbox sin pasar por el shim de red | Test de exfiltración |

---

## 5. Transferencias y terceros

| Situación | Base legal | Requisito |
|---|---|---|
| App de tercero usa datos del usuario | Transferencia / tratamiento por cuenta de terceros | Información al titular + base legal del tratamiento |
| App de tercero accede al `mod` | Delegación de tratamiento | Relación de **encargo** (responsable vs. encargado) |
| Empresa como responsable de datos de empleados | Verificación de rol del operador | Solo operar bajo rol verificado |

---

## 6. Derechos del titular (art. 8)

| Derecho | Implementación | Nota |
|---|---|---|
| Acceso | Panel del companion: ver su mod | — |
| Rectificación | Editar su perfil; el mod se actualiza | Dato rectificado deja de Circular en inferencias derivadas |
| Supresión | Borrado del mod | Cuidado:.delete wallet/saldo tiene reglas fiscales propias |
| **Portabilidad** | **Export `.opitpack`** | **Es un derecho, no un feature** |

---

## 7. Registro de tratamientos (art. 4)

Inventario obligatorio: qué datos, qué finalidades, qué bases legales, qué Transferencias. **El §1
de este documento es el punto de partida y debe mantenerse vivo.**

Si Opita Code tiene bases con datos sensibles (D2, D3) → evaluar inscripción en el **RNBD**
(Registro Nacional de Bases de Datos).

---

## 8. Consentimientos requeridos (separados, no agrupados)

| # | Finalidad | Base legal | Pantalla |
|---|---|---|---|
| C1 | Identificación / KYC | Consentimiento + obligación legal | Propia, explícita |
| C2 | Biometría (liveness / face-match) | **Consentimiento explícito y separado** (art. 9) | Propia, separada |
| C3 | **Perfil psicométrico para personalizar** | **Consentimiento explícito y separado** (art. 9) | Propia, separada |
| C4 | **Misiones personalizadas (engagement)** | **Fin distinto** → **requiere su propio consentimiento** | Propia, separada |
| C5 | Aceptación de términos generales | Consentimiento | Separada de C1–C4 |

**Punto crítico:** C3 y C4 son **finalidades distintas** con bases legales distintas. Aceptar la personalización **no** autoriza el uso para engagement, y viceversa.

---

## 9. Transferencias internacionales

Si la infraestructura de dark-memory o el procesamiento ocurre fuera de Colombia → aplica el
principio de nivel de protección adecuado (art. 19 y ss.). Requiere análisis específico de la
ubicación de la instancia de dark-memory. **[ABIERTO]**

---

## 10. Brechas e incidentes (art. 18)

Procedimiento de notificación a la SIC y a los titulares para cualquier incidente que pueda afectar los derechos. **`[ABIERTO]`** redactar.

---

## 11. Accesorios

- **SIC** — autoridad de control; puede sancionar.
- **RNBD** — registro de bases con datos sensibles o +10.000 titulares.
- **Revisión de abogado** specialization en datos Colombia — **obligatoria antes de declarar conformidad**.

---

## 12. Abiertos

| # | Abierto |
|---|---|
| 1 | Aislamiento L (lógico) vs. F (físico) — decisión con base legal |
| 2 | Ubicación de la instancia de dark-memory (¿internacional?) → transferencias art. 19 |
| 3 | Procedimiento de incidentes (art. 18) |
| 4 | Inspección RNBD |
| 5 | Relación de encargo (responsable vs. encargado) con apps de terceros |
| 6 | Reglas de supresión cuando hay saldo (derecho de supresión y obligación fiscal) |
| 7 | **Revisión de abogado** antes de declarar conformidad |

---

## Nota final

Este documento **traduce** la norma a requisitos técnicos. No **interpreta** la norma. Los puntos
donde la ley exige un juicio jurídico (suficiencia del aislamiento lógico, base legal concreta de
cada tratamiento, alcance del derecho de supresión frente a obligaciones tributarias) **deben ser
confirmados por abogado**.
