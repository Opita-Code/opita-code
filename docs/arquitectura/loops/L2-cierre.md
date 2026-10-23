# L2 · Cierre

> Parte 15 de 15. [Orden](L2-orden.md) · [Módulo](L2-modulo.md) · [Compartir](L2-compartir.md) · [Tools](L2-tools.md) · [Harness](L2-harness.md) · [Canónico](L2-canonico.md) · [Verificación](L2-verificacion.md) · [Aritmética](L2-aritmetica.md) · [Mutación](L2-mutacion.md) · [Presupuesto](L2-presupuesto.md) · [Hallazgo runner](L2-hallazgo-runner.md) · [Hallazgos](L2-hallazgos.md) · [Desviaciones](L2-desviaciones.md) · [Gate](L2-gate.md)
> Spec 537. Tarea L2-S11.

Lo que este loop deja atrás y lo que entrega al siguiente. El resultado del
gate está aparte, en [gate](L2-gate.md), porque es otra preocupación.

---

## El hallazgo del cierre

**L1 cerró con `sandbox/runner.ts` en 4149 B, 53 B sobre el tope**, mientras
`L1-mutacion.md` afirmaba *«0 exceden 4096 B»*. Una violación del guard en un
loop ya cerrado, Invisible a dos loops de verificación.

Lo grave no es el número: es que **al encontrarla se recortó la prosa de L1** para
que el guard pasara, y se cambió de paso un mensaje de error que ningún test
afirmaba. Eso es decidir por el guard, que es justo lo contrario de lo que el
guard existe para impedir.

Resuelto como corresponde: `runner.ts` restaurado a L1 literal y partido por
preocupación en `runner.ts` (la caminata) + `outcome.ts` (el veredicto y su
bitácora). Está en [hallazgo runner](L2-hallazgo-runner.md).

De ahí sale la regla que este loop deja adoptada: **el guard caza el número, la
persona caza el recorte.** Son dos capas distintas y este caso es la demostración
de que la segunda no es opcional.

## Lo que sigue igual

**El TODO bloqueante de L1 no se movió.** `RESEARCH` no se puede publicar
afirmando que ejecuta con T1: el tier concede la capacidad de red y no hay
transporte.

El caso canónico 3 existe **precisamente para que ese hueco sea visible en cada
corrida**, y no acumulado en un documento que nadie vuelve a leer. Esa es su
función, y por eso se construye aunque no funcione: un módulo que se detenga sin
decir por qué es peor que un módulo que no existe.

## Lo que queda para L3

1. **Los perfiles de identidad.** El harness recibe el contexto del llamador y lo
   pasa, y no define ninguno: los perfiles son de L3, y un harness que fabricara
   el suyo estaría inventando una identidad que nadie eligió.
2. **El `mutation_request` sigue sin consumidor.** En T0 `DRAFT` no emite ninguno,
   porque no tiene nada que pedir — no hay memoria a la que pedirle.
3. **Las properties de reparto de permisos.** Las de cardinalidad y reparto del
   grafo existen (P25–P34); las de permisos no, y son de L3.

