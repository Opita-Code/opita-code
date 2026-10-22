# L1 · Verificación

> Parte 5 de 6 de L1. Hallazgos: [L1-hallazgos.md](L1-hallazgos.md)
> Spec 536. Tareas S7 y S8.

Tres métodos, mínimo 2 por artefacto. Los tres verdes.

## 1. Unitarios — 76 casos nuevos

| Archivo | Qué cubre |
|---|---|
| `capability.test.ts` | las dos tablas, `missingFor`, equivalencia con `tierAllows` |
| `effects.test.ts` | denegación, `denied` vs `unimplemented`, bitácora, backend no invocado |
| `wasm.test.ts` | los 4 descriptores, las 9 violaciones, lista blanca, pureza |
| `sandbox.test.ts` | las dos capas, la regla central, detección de host |

**164 tests en total**, sin eliminar ni relajar ninguno de los 88 de L0.

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

## 3. Mutation testing — 105 mutantes, 100%

19 paquetes, **105/105 muertos**, cero sobrevivientes, cero `no-aplicable`.

| Paquete | Muertos | Paquete | Muertos |
|---|---|---|---|
| `rules/edges.js` | 9/9 | `sandbox/runner.js` | 9/9 |
| `rules/terminals.js` | 8/8 | `sandbox/wasm/binary.js` | 7/7 |
| `hash.js` | 7/7 | `sandbox/capability.js` | 6/6 |
| `tool.js` | 6/6 | `sandbox/wasm/structure.js` | 6/6 |
| `sandbox/effects/create.js` | 5/5 | `axes.js` | 5/5 |
| `sandbox/tier.js` | 4/4 | `sandbox/wasm/imports.js` | 5/5 |
| `rules/identity.js` | 5/5 | `sandbox/wasm/scan.js` | 5/5 |
| `context.js` | 5/5 | `canonical.js` | 3/3 |
| `graph.js` | 5/5 | `contract.js` | 3/3 |
| `rules/types.js` | 2/2 | **TOTAL** | **105/105** |

Los mutantes del runner son los que importan:

- `REGLA CENTRAL: el intento denegado pasa` → `if (false)`
- `REGLA CENTRAL invertida: todo intento falla` → `if (denegados.length === 0)`
- `boundary: entregar el contexto sin sellar` → `sealContext(req.ctx)` → `req.ctx`
- `POLITICA: cualquier import admitido` → `if (true)`
- `la bitacora miente: marca concedido lo denegado`
- `la bitacora no se congela y se puede reescribir`
- `T0 concede red: se rompe el tier entero`

Los dos últimos existían porque el test correspondiente **ya había encontrado el
bug real** antes de que el mutante lo confirmara. Es el orden correcto: el test
manda, el mutante verifica que el test tiene dientes.

## Gate budget

31 unidades juzgables, 0 exceden 4096 B una vez partidos los tres excesses que
aparecieron durante L1: `wasm.ts` llegó a 8472 B, y `runner.ts` y `effects.ts`
se partieron por preocupación, no por recorte.