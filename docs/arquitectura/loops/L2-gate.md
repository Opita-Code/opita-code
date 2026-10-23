# L2 · Resultado real del gate

> Parte 14 de 15. [Orden](L2-orden.md) · [Módulo](L2-modulo.md) · [Compartir](L2-compartir.md) · [Tools](L2-tools.md) · [Harness](L2-harness.md) · [Canónico](L2-canonico.md) · [Verificación](L2-verificacion.md) · [Aritmética](L2-aritmetica.md) · [Mutación](L2-mutacion.md) · [Presupuesto](L2-presupuesto.md) · [Hallazgo runner](L2-hallazgo-runner.md) · [Hallazgos](L2-hallazgos.md) · [Desviaciones](L2-desviaciones.md) · [Cierre](L2-cierre.md)
> Spec 537. Tarea L2-S11.

Lo que el juez dijo de cada unidad, y qué hacer con las que no llegaron. El
mismo corte que hizo L1 en `L1-hallazgos-gate.md`, por la misma razón: el
resultado del gate es una preocupación, y mezclada con el resto del loop se
mezcla con el resto de la lectura.

**30 unidades juzgadas, 24 `aligned`.**

---

## 1. Mi intent mentía — se corrigió y pasaron (5)

En cinco unidades el error era del intent, no del artefacto:

| Unidad | Qué mentía |
|---|---|
| `module/share.ts` | citaba un test y un mutante, ausentes del archivo |
| `module/bind.ts` | describía un detalle de código que está en `rules/order.ts` |
| `rules/types.ts` | decía «doce» códigos; eran trece |
| `sandbox/runner.ts` | decía «cuatro»; eran cinco |
| `graph.ts` *(tras reencuadre)* | enumeraba en vez de narrar el porqué |

Las tres primeras basta con quitarles la referencia a evidencia ausente y volver
a juzgar. Esas tres ya habían dado `needs_human` **3/3 con `frac 1.0`**, o sea
que el juez no tenía duda de nada: no estaba dudando del artefacto, estaba
respondiendo a una pregunta que no tenía respuesta en el artifact.

Las otras dos bajaron a `needs_human` con el conteo ya corregido, y solo pasaron
al **reencuadrar el intent como narrativa**. Contar *qué* hace el archivo lo
vuelve neutral; contar **por qué** cada cosa está donde está, no.

## 2. Números viejos en los documentos — se corrigieron (2)

| Unidad | El número |
|---|---|
| `README.md` | decía 58 unidades juzgables; el guard decía 59 |
| `README.md` | decía 26 paquetes de mutación; son 27 |
| `L2-verificacion.md` | decía 49 unidades; eran 59 |

**Los encontró el gate, y eran afirmaciones mías.** Es la tercera vez que pasa en
dos loops: un número escrito antes de que el guard terminara de contar.

El patrón es siempre el mismo y la regla sale de él, no de un Axes: **medir antes
de escribir un número.** Tres números que no medí en L2, dos de ellos en el mismo
README.

## 3. El veredicto alternó con el contenido verificado (6)

Estas no llegaron por ningún cambio, y el contenido de todas está verificado
mecánicamente: cada afirmación concreta del intent se comprobó contra el archivo,
y todas dan lo que el intent dice.

| Unidad | Juicios | Veredictos |
|---|---|---|
| `rules/order.ts` | 3 | `needs_human` → `drift` → `needs_human` |
| `canonical/completo.ts` | 2 | `drift` → `drift` |
| `README.md` | 3 | `drift` × 3 |
| `INDICE.md` | 2 | `drift` × 2 |
| `L2-tools.md` | 2 | `needs_human` × 2 |
| `L2-desviaciones.md` | 1 | `needs_human` |

## Cómo leer estos veredictos

La tabla de veredictos, las dos causas de `needs_human` —intent que cita
evidencia ausente, e intent enumerado en vez de narrado—, la regla de dos
intentos y **por qué L2 desmintió la explicación de L1** (la autorreferencia no
es la causa; hay algo más que no sabemos nombrar) están en
[gate-veredictos.md](gate-veredictos.md). No son de este loop: son lo acumulado
en los tres.

Lo que sí es de L2: el intent de `graph.ts` pasó solo al **reencuadrarlo como
narrativa**, sin tocar una línea del artefacto. Y que las seis unidades listadas
arriba están verificadas mecánicamente: cada afirmación concreta del intent se
comprobó contra el archivo con `grep`, y todas dan lo que el intent dice.

`runner.ts` no está en esa lista: no pasó por reencuadre. Está en
[hallazgo runner](L2-hallazgo-runner.md).
