# L1 · Mutación y presupuesto

> Parte 6 de 7 de L1. Verificación: [L1-verificacion.md](L1-verificacion.md) · Hallazgos: [L1-hallazgos.md](L1-hallazgos.md)
> Spec 536. Tareas S8 y S10.

## Mutation testing — 105 mutantes, 100%

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

### Los mutantes que importan

Todos los del runner, que es donde vive la seguridad:

| Mutante | Qué rompe |
|---|---|
| `REGLA CENTRAL: el intento denegado pasa` | la regla del loop entero |
| `REGLA CENTRAL invertida: todo intento falla` | y su inversa |
| `boundary: entregar el contexto sin sellar` | la garantía de L0 |
| `POLITICA: cualquier import admitido` | la lista blanca vacía |
| `la bitacora miente: marca concedido lo denegado` | la auditoría |
| `la bitacora no se congela y se puede reescribir` | y su integridad |
| `T0 concede red: se rompe el tier entero` | la definición de T0 |

**Los dos últimos existían porque el test correspondiente ya había encontrado el
bug real** antes de que el mutante lo confirmara. Es el orden correcto: el test
manda, y el mutante verifica que el test tiene dientes.

## Gate budget

34 unidades juzgables, 0 exceden 4096 B.

Tres excesos aparecieron durante L1 y los tres se partieron **por preocupación,
no por recorte**:

| Archivo | Alcanzó | Se partió en |
|---|---|---|
| `sandbox/wasm.ts` | 8472 B | `binary` · `imports` · `structure` · `scan` |
| `sandbox/runner.ts` | 4189 B | — (recorte de comentarios) |
| `sandbox/effects.ts` | 4420 B | `port` (vocabulario) · `create` (fábrica) |

El de 8472 B no admitía recorte: la mezcla de primitivas de formato, parser y
política es lo que lo hizo insostenible, y partirlo por eso dejó la capa de
política legible sola.

## Gate de drift

Este documento **no describe el veredicto del gate sobre si mismo**. El registro
autoritativo es `dark_memory_judgment_history` en dark-memory, proyecto
`opita-code`.

Un documento que narra su propio veredicto es autorreferencial: la afirmacion se
vuelve su propia evidencia, y el juez la lee como contradiccion porque no puede
verificarla contra nada. Esa leccion esta en [L1-hallazgos.md](L1-hallazgos.md),
no aqui, porque un hallazgo **no puede** vivir en el documento que lo provoca.
