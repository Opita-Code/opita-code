# L2 · Los tres casos canónicos

> Parte 6 de 15. [Orden](L2-orden.md) · [Módulo](L2-modulo.md) · [Compartir](L2-compartir.md) · [Tools](L2-tools.md) · [Harness](L2-harness.md) · [Verificación](L2-verificacion.md) · [Aritmética](L2-aritmetica.md) · [Mutación](L2-mutacion.md) · [Presupuesto](L2-presupuesto.md) · [Hallazgo runner](L2-hallazgo-runner.md) · [Hallazgos](L2-hallazgos.md) · [Desviaciones](L2-desviaciones.md) · [Gate](L2-gate.md) · [Cierre](L2-cierre.md)
> Spec 537. Tarea L2-S10.

**Criterio de éxito primario del MVP:** si una app de terceros se puede
construir, esto se puede construir. Los tres se construyen **dentro de
`vibe-tools`**, sin dependencias.

| Caso | Grafo | Resultado |
|---|---|---|
| 1 · completo | `EXEC` → `RENDER` | **corre entero**, entrega SVG |
| 2 · receta | `DRAFT` | **corre entero**, entrega texto |
| 3 · investigación | `EXEC` → `RESEARCH` | **se detiene** en `busca`, tipado |

---

## 1 · El que completa

`calcula` y `dibuja`, **declarados al revés** a propósito.

Si `executionOrder` volviera a ser el orden de declaración, este caso entregaría
un artifact vacío. **El caso canónico no necesita un test aparte para el orden:
lo usa todos los días.**

Es además el único camino por el que un artifact `mutation` se produce: 5
corridas con la misma entrada dan el mismo SVG, y con la misma `ValueStore` la
segunda corrida marca `reused: true` en los dos nodos.

## 2 · Una receta

Un solo nodo, y se queda corto. **Se queda corto porque R5 lo exige**: una tool
determinista no puede consumir de una estocástica, y la única tool T0 que
consume texto y es determinista es `RENDER`.

Que un caso canónico con receta no se pueda encadenar es la **consecuencia
correcta** de las reglas de L0, no una carencia que este loop tapara.

## 3 · El que no completa

Este es el caso que se sube al marketplace, y aquí no corre. Y no se disfraza de
que corre.

```
host de cliente (el default) → E_HOST_UNSUPPORTED
                               el host no sostiene T1

host con T1 (clientFull)     → E_TOOL_ERROR, detalle: `unimplemented`
                               T1 concede net y no hay transporte
```

**La diferencia no es un detalle de implementación.** El primer motivo dice que el
entorno está mal; el segundo dice que el sandbox concede el poder y nadie probó
el cable. Solo el segundo revela el TODO bloqueante de L1.

### Lo que demuestra

Que la cadena de L1 **sobrevive al cruce del módulo**. El intento de red queda
registrado con `granted: true` — el sandbox **concedió** la capacidad — y aun así
la corrida falla.

Un módulo que se detuviera sin decir por qué, o que devolviera notas inventadas,
sería peor que un módulo que no existe.

### Lo que NO demuestra, y no dice que sí

```
deniedCount = 0
```

Fallar no es intentar salir. No hubo exfiltración; hubo un cable que falta.

Y el `RESEARCH` **no se puede publicar diciendo que ejecuta con T1**. El TODO de
L1 sigue abierto.

---

## Por qué tres casos y no uno

El plan pedía un caso canónico. Uno solo habría tenido que elegir entre correr y
fallar, y las dos cosas que hay que demostrar son incompatibles en un solo grafo:
`RESEARCH` es T1 y no tiene transporte, y `DRAFT` es T0 y por R5 no se puede
encadenar con `RENDER`.

Tres casos cubren las tres formas de terminar una corrida: **completa**,
**completa con receta**, y **detenida por el ambiente**.

## La aritmética

```
88  casos de L0, intactos
+76  casos de L1
=164 al cierre de L1
+99  casos nuevos de L2
=263 total
```

Y **esta vez los prefijos cuadran sin nota al pie**:

```
77  L0-*      \  los 88 de L0: 77 con nombre + 10 properties con nombre P*
77  L1-*       |
10  P*        /
99  L2-*
─────
263
```

Ni uno de los 263 tests de L0 ni de L1 fue tocado en este loop — `git diff`
contra `456ad85` sale vacío. No hubo renombrado, ni eliminación, ni relajación.

La segunda reconciliación —por archivo, que no depende del historial de
renombres— está en [verificación](L2-verificacion.md). Las dos vías dan 263.
