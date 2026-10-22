# L1 · La capa estática: lista blanca de imports

> Parte 3 de 5 de L1. Capacidades: [L1-capacidades.md](L1-capacidades.md) · Puerto: [L1-puerto.md](L1-puerto.md) · Runner: [L1-runner.md](L1-runner.md) · Verificación: [L1-verificacion.md](L1-verificacion.md)
> Spec 536. Tarea S3.

## LA SUPERFICIE DE ESCAPE DE UN MÓDULO WASM

Un módulo WASM no alcanza la red, el archivo ni el proceso sin **importarlos**.
Todo poder que tiene es un par `modulo#campo` declarado en su sección de imports.

Por eso la garantía fuerte de T0 no se construye ejecutando la política en
runtime, sino **negándose a cargar** un módulo que importe algo.

## POR QUÉ LA LISTA DE T0 ESTÁ VACÍA

Lo que una tool T0 necesita ya viene en el `input`. Si el módulo importa algo,
pide algo que el contrato no pidió.

Y no hay forma de revisar en código que un import sea inocuo:

```
wasi_snapshot_preview1 + sock_send  ->  salida a la red
wasi_snapshot_preview1 + fd_write   ->  escritura al disco
```

El mismo módulo, la misma línea, distinto poder. **La granularidad del nombre no
compra seguridad.** Por eso la lista está vacía, y no "casi vacía".

## LAS DOS CAPAS Y POR QUÉ SON INSUFICIENTES POR SEPARADO

| Capa | Comprueba | No alcanza porque |
|---|---|---|
| Estática | el binario no importa nada | no protege al módulo de un host engañado |
| Dinámica | la tool no alcanza la red | no protege al binario de un módulo malicioso |

Juntas cierran el círculo. Se comprueban las dos, y se comprueban en orden: la
estática **antes** de ejecutar. Hay un test que comprueba que la tool no llega a
correr cuando el binario se rechaza.

## TRES REGLAS DE FORMA, Y NO SON CAPRICHO

Las secciones no-custom van en **orden creciente** de id y aparecen **una vez**
cada una. Con secciones repetidas o desordenadas hay **dos lecturas válidas** del
mismo binario, y un validador que elige una es un validador que otro puede hacer
pasar por la otra.

Las secciones `custom` (id 0) pueden ir donde quiera y repetirse: ahí va el
nombre del módulo, los Debug Names, el paquete. No cuentan para el orden.

**Ante cualquier duda el veredicto es rechazo.** Un módulo que el validador no
entiende no está aprobado: está **desconocido**, que es un estado distinto. Un
validador que se rinde ante lo raro es peor que no tener validador, porque su
salida se lee como aprobación.

Nueve códigos de rechazo: `E_SHORT`, `E_MAGIC`, `E_VERSION`, `E_TRUNCATED`,
`E_UNKNOWN_SECTION`, `E_SECTION_ORDER`, `E_DUPLICATE_SECTION`, `E_BAD_IMPORT`,
`E_IMPORT_DENIED`.

## CÓMO SE PRUEBA SIN TOOLCHAIN

El validador se prueba sobre **bytes construidos a mano**, no sobre módulos
compilados. Es a propósito: si los tests dependieran de una toolchain, el
validador solo se ejercitaría en módulos con la forma que ella quiere, que es un
subconjunto diminuto. A mano se fuerzan las formas raras que un atacante escribiría
a propósito.

`test/wasm-builder.ts` construye cabecera, secciones, nombres y los cuatro
descriptores de import (`func`, `table`, `memory`, `global`) byte a byte. El
LEB128 se acumula por multiplicación, no con `<<`: con desplazamiento un valor de
32 bits acumulado en un entero con signo se sale del rango y queda negativo.

## `capabilityOfImport` ES PARA AUDITAR, NO PARA DECIDIR

Clasifica un import como `net`, `fs`, `process` o `unknown` para explicar el
rechazo. **La política no lo consulta**: rechaza por lista blanca.

Se ve por qué. `env.memory` es **RAM, no disco**: se rechaza igual, pero
capacidad `unknown`. Un validador que decidiera por la capacidad inferida
aceptaría `env.memory` — que es inocuo — y rechazaría `env.salida` — que no lo
es. Inferir poder a partir de nombres es el error, no la protección.

## ESTE ARCHIVO CORRE EN EL HOST, NO EN EL SANDBOX

Por eso puede usar `TextDecoder`, que es API del host. `hash.ts` no puede, y por
eso es puro: ese corre dentro de los tres tiers.

La regla del runtime es una sola:

> **Lo que corre ADENTRO es puro. Lo que corre ANTES puede usar el host.**