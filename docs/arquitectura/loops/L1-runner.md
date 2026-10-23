# L1 · El runner y lo que L1 no entrega

> Parte 4 de 5 de L1. Capacidades: [L1-capacidades.md](L1-capacidades.md) · Puerto: [L1-puerto.md](L1-puerto.md) · Estática: [L1-estatica.md](L1-estatica.md) · Verificación: [L1-verificacion.md](L1-verificacion.md)
> Spec 536. Tareas S5 y S6.

## EL ORDEN DE LAS COMPROBACIONES

```
1. E_NOT_BOUND          la tool no resuelve por (id, version)
2. E_MODULE_DENIED      el binario importa algo            ← capa estática
3. E_HOST_UNSUPPORTED   el host no alcanza para el tier
4. (ejecuta la tool con el puerto y el contexto sellados)
5. E_EFFECT_DENIED      intentó algo que el tier no concede ← capa dinámica
6. E_TOOL_ERROR         la tool falló
```

La estática va **primero**, antes de que la tool corra. Hay un test que lo
comprueba: el flag `corrio` de una tool que nunca se pone en `true` cuando el
binario se rechaza.

## LA REGLA QUE MÁS CUESTA ACEPTAR

> **Un intento denegado falla la ejecución INCLUSO si la tool devolvió éxito.**

Una tool que intentó exfiltrar y no lo logró no es una tool que funcionó. Si se
aceptara su resultado, el siguiente paso de quien la escribió sería probar con
otro puerto, y el sandbox sería el obstáculo en lugar de la garantía.

**El intento es la señal, no el éxito.**

Esto también es lo que hace que `deniedCount` sea el KPI de exfiltración del
loop: cuenta intentos denegados, no errores devueltos.

## EL SOBRE DICE EN QUÉ CORRIÓ

Un veredicto exitoso trae `tier` y `granted`. **Deben diferir entre corridas**:
una tool T0 y la misma tool T2 producen las mismas salidas y sobres distintos.

Un sandbox que no distinguiera eso estaría mintiendo sobre su propia corrida.
Y por eso una property durante L1 se corrigió a sí misma: estaba enunciada como
"el resultado no cambia", y el enunciado correcto es **"las salidas no cambian;
el sobre sí"**.

## LO QUE L1 ENTREGA, Y LO QUE NO

### Entregado y verificado por completo

- El modelo de capacidades, con sus tablas totales, exhaustivas y no configurables.
- El puerto de efectos, con denegación por ausencia de poder y bitácora inmutable.
- El validador estático de imports WASM sobre bytes crudos, con lista blanca vacía.
- La detección de tier y `supports()` con el host que le falta.
- El runner que ata las tres cosas, y el registry delegando en él.

### NO entregado

**Los bindings reales de Pyodide, WebContainers y Firecracker.** Eso necesita un
navegador y una microVM, no un repositorio.

> **L1 verifica la POLÍTICA, no el RUNTIME.**

La distinción importa y no es retórica:

| | Qué está verificado |
|---|---|
| **Política** | que T0 no concede red, que un módulo con import no se carga, que un intento denegado falla la corrida |
| **Runtime** | que Pyodide no deje salir por un lado raro; que Firecracker aísle de verdad |

Lo segundo **no está probado**. Los tests ejercitan la política con hosts de
referencia falsos (`clientFull`, `backend`) que describen capacidades, no
ejecutan nada. Un host de referencia que dice `microvm: true` no es una microVM.

### El gap queda explícito y con gate

- **TODO abierto y bloqueante**: los bindings reales.
- **Criterio de cierre**: la misma property P18 debe pasar con el `ToolImpl`
  sustituido por la implementación real de cada tier, no por una función en
  proceso.
- **Regla**: no se puede publicar nada en `opitacode.com` que afirme ejecutar con
  T1 o T2 hasta que ese TODO cierre.

Fingir que la política probada equivale a la política ejercida sería el error
más caro de este loop, y sería fácil de cometer porque los tests pasan en verde.
