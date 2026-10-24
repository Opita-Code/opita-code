# L1 · Verificación

> Parte 5 de 7 de L1. Mutación y gate: [L1-mutacion.md](L1-mutacion.md) · Hallazgos: [L1-hallazgos.md](L1-hallazgos.md)
> Spec 536. Tarea S7. **164/164 tests.**

Dos métodos aquí. El tercero —mutación y gate— está en su propio documento,
porque es otra preocupación: prueba el comportamiento contra pruebas que
verifican el comportamiento.

## 1. Unitarios — 76 casos nuevos

| Archivo | Qué cubre | Casos |
|---|---|---|
| `capability.test.ts` | las dos tablas, `missingFor`, equivalencia con `tierAllows` | 11 |
| `effects.test.ts` | denegación, `denied` vs `unimplemented`, bitácora, backend no invocado | 12 |
| `wasm.test.ts` | los 4 descriptores, las 9 violaciones, lista blanca, pureza | 24 |
| `sandbox.test.ts` | las dos capas, la regla central, detección de host | 15 |
| `property-sandbox.test.ts` | las 14 invariantes × 6 semillas | 14 |

### La aritmética, explícita

```
88  casos de L0, intactos
+76  casos nuevos de L1
=164 total
```

**Contando prefijos salen 175**, y por eso hace falta decirlo: once de los
casos son los huecos de L-CI, que llevan el nombre del loop al que cubren y
viven en su propio archivo. Y para L1 sigue contando el caso de L0 **que se
renombró** y pasó a llevar nombre `L1-*`. Es *el host por defecto (cliente) no
sostiene T2, y dice que le falta*, antes *el MVP solo ejecuta T0: una tool T2 se
rechaza con mensaje claro*.

No se eliminó nada ni se relajó nada: ese caso se **fortaleció**. Antes probaba
que el mensaje contuviera un texto; ahora comprueba el código de fallo exacto y
que el detalle diga qué le faltaba al host. El nombre cambió porque lo que
afirma ya no es una regla del MVP sino una propiedad del sandbox.

Sin esta nota el conteo por prefijos no cuadra con el total, y el número parece
no verificable. Con ella, cualquiera lo comprueba.

## 2. Property-based — 14 invariantes × 6 semillas

| # | Invariante |
|---|---|
| P11 | `effectAllowed` coincide con `tierAllows` en los 12 pares |
| P12 | admitir un efecto es exactamente «todo lo que exige está concedido» |
| P13 | `granted` y `requiresFor` solo nombran capacidades declaradas |
| P14 | el puerto anuncia exactamente lo que el tier otorga |
| P15 | `scanWasm` **nunca lanza**, sobre 1 200 módulos aleatorios |
| P16 | 0 imports siempre pasa; ≥1 import siempre falla |
| P17 | `scanWasm` es puro: mismos bytes, mismo veredicto |
| P18 | **DIFERENCIAL**: tool pura, mismo valor bajo los tres tiers |
| P19 | **EXFILTRACIÓN**: cualquier efecto bajo T0 falla la ejecución |
| P20 | ningún host sostiene un tier por encima del que sostiene |
| P21 | el resultado no depende del orden de las claves del input |
| P22 | la bitácora crece de a uno y no pierde intentos |
| P23 | las salidas no cambian con el sandbox; **el sobre sí** |
| P24 | `process` solo se concede donde hay kernel |

**P15 es la que sostiene al validador.** Si `scanWasm` lanza sobre bytes raros,
un atacante elige los bytes que lo tumbarían. Fuzz de 1 200 módulos, seis
semillas, PRNG sembrado.

**P18 y P19 son los KPIs del loop.** P18 mide que el sandbox no altera una tool
que no lo toca; P19 mide que no hay salida. Ninguna de las dos está completa
sola: sin P18, P19 se cumpliría con un sandbox que rechazara todo; sin P19, P18
se cumpliría con un sandbox que no hiciera nada.
