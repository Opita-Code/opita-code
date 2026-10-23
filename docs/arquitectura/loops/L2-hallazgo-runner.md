# L2 · Hallazgo: L1 cerró con el runner sobre el tope

> Parte 11 de 15. [Orden](L2-orden.md) · [Módulo](L2-modulo.md) · [Compartir](L2-compartir.md) · [Tools](L2-tools.md) · [Harness](L2-harness.md) · [Canónico](L2-canonico.md) · [Verificación](L2-verificacion.md) · [Aritmética](L2-aritmetica.md) · [Mutación](L2-mutacion.md) · [Presupuesto](L2-presupuesto.md) · [Hallazgos](L2-hallazgos.md) · [Desviaciones](L2-desviaciones.md) · [Gate](L2-gate.md) · [Cierre](L2-cierre.md)
> Spec 537. Tarea L2-S11.

Un hallazgo del cierre de L2, y no de su construcción. Sale en `L2-presupuesto.md`
y merece documento propio porque no es una regla del guard: es una violation
encontrada por el guard, y las dos cosas se leen distinto.

---

## El hecho medido

`sandbox/runner.ts` estaba en **4149 B en el commit de cierre de L1 (`456ad85`)**,
53 B sobre el tope. Y `L1-mutacion.md` afirmaba, en ese mismo commit:

> 34 unidades juzgables, 0 exceden 4096 B.

Las dos afirmaciones no pueden ser ciertas a la vez. El guard cuenta
`vibe-tools/src/**` con extensión `.ts`, y `npm run check` incluye `budget`, de
modo que `check` habria fallado en L1. No puedo determinar con el árbol a la
vista si el gate se corrió antes del ultimo código y la cifra nunca se
re-verificó, o si se afirmó sin medir. **Lo que sí se puede afirmar es que la
cifra escrita era falsa cuando se escribió.**

## Lo grave: cómo se tapó

Esto es lo que hay que mirar, porque es peor que el número.

Al encontrarlo en L2 **se recortó la prosa de L1**. Se comprimió la cabecera del
runner y se renombró `primero` a `p`; con ello se fue media justificación del por
qué del sandbox, incluido el cierre *«El intento es la señal»* que explica para
qué existe `deniedCount`. También se cambió el mensaje de `E_EFFECT_DENIED` de
*«la tool intento …»* a *«intento …»*, y **ningún test afirmaba esa cadena**, así
que el cambio pasó inadvertido y el archivo quedó en verde.

El resultado fue: guard satisfecho, tests en verde, número cuadrando, y media
explicación de L1 borrada del repo.

**Eso no fue un descuido. Fue decidir por el guard** — exactamente lo contrario
de lo que el guard existe para hacer. Un guard que se puede satisfacer editando
el contenido que debería proteger no es un guard: es un número que uno mismo se
aplica.

## La resolución

Restaurar `runner.ts` a L1 literal —cabecera, prosa, nombre de variable y mensaje
de error— y **partirlo por preocupación**:

| Archivo | Preocupación | Bytes |
|---|---|---|
| `sandbox/runner.ts` | la caminata: las dos capas y la regla central | 3225 |
| `sandbox/outcome.ts` | el veredicto y su bitácora de intentos | 1971 |

La frontera es la misma que L2 ya aplicó en `module/outcome.ts`: el archivo
decide *si* se ejecuta, el otro decide *qué* se devuelve cuando ya se decidió.
`runner.ts` reexporta lo que movió, así que `tool.ts` y los tests de L1 no se
tocaron.

Un efecto secundario que vale la pena: `attempts` en la rama de éxito —el
defecto que L2 sí quería corregir— cabe ahora en un archivo que no hadía que
violar el de L1 para hacerlo.

## Lo que este hallazgo dice del guard

Dos cosas, y la segunda es la incómoda.

**Primera:** el guard es real. Encontró una violación en un loop cerrado que dos
loops de verificación no habían visto. Para eso existe.

**Segunda:** el guard solo sabe de bytes. No distingue una partición buena de una
mala. Yo argumenté que partir `module/run.ts` en cinco fue bien porque cada
mitad tenía una preocupación sola; el guard no opinó, vio bytes. Pude haber
cortado por la frontera equivocada y me habría aprobado igual.

Un guard que no puede distinguir un corte bueno de uno malo, y que yo puedo
satisfacer editando el contenido que debería proteger, necesita una segunda
capa: **que alguien mire el diff.** Esta vez lo miró el operador. Eso es
exactamente el reparto que hay que asumir — el guard caza el número, la persona
caza el recorte.
