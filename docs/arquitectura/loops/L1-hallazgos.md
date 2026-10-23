# L1 · Hallazgos

> Parte 7 de 8 de L1. Verificación: [L1-verificacion.md](L1-verificacion.md) · Mutación: [L1-mutacion.md](L1-mutacion.md) · Hallazgos del gate: [L1-hallazgos-gate.md](L1-hallazgos-gate.md)
> Spec 536.

Cinco cosas. **Ninguna en el diseño del sandbox**: el modelo de capacidades, el
puerto, el validador y el runner salieron como se pensaron. Cuatro estaban en las
pruebas o en las herramientas de prueba, y una era un mutante imposible.

Los dos hallazgos que produjo el propio gate están en
[L1-hallazgos-gate.md](L1-hallazgos-gate.md), aparte por una razón que se explica
ahí.

---

## 1. La bitácora de auditoría tenía las entradas mutables

`attempts` entrega una copia del **array**. Eso no protege los **objetos**: sin
congelarlos, `attempts[0].granted = true` reescribía el registro interno.

Bug real de seguridad, encontrado por un test que afirmaba algo que era falso.
**Un rastro de auditoría que se puede editar no es un rastro de auditoría**, y el
test tenía razón: ahora la escritura **lanza**.

Cerrado con `Object.freeze` por entrada, más dos mutantes que matan tanto la
congelación como la mentira de la bitácora.

## 2. El builder WASM escribía un byte de más

El descriptor de un import `func` es solo el índice de tipo: un LEB128. El builder
escribía `kind` **y** un `0x00` extra de relleno. Con eso la sección quedaba
desalineada y todos los imports siguientes se leían como basura.

Solo apareció al probar **tres** imports en la misma sección. Con uno o dos
funcionaba, porque el byte sobrante se comía el final de la sección y el parser
terminaba sin notarlo.

> Un test por caso no lo encuentra. Un test de recorrido completo sí.

## 3. Una property mal enunciada

Escribí «el sandbox nunca cambia el resultado de una tool que no lo toca» y la
comparé con `deepEqual` sobre el veredicto entero. **Es falsa**, y no por el
código: por el enunciado.

El sobre **debe** diferir entre un T0 y un T2, porque `tier` y `granted` son la
declaración de bajo qué regla corrió la tool. Un sandbox que no los distinguiera
estaría mintiendo sobre su propia corrida.

El enunciado correcto es **«las salidas no cambian; el sobre sí»**, y es más
fuerte: no dice que el sandbox sea invisible, dice que es *fiel*.

## 4. Un test mal planteado: `env.memory` no es el disco

Daba por hecho que un import de memoria se lee como capacidad `fs`. No lo es:
`env.memory` es **RAM**. Se rechaza igual — la lista blanca está vacía — pero se
etiqueta `unknown`.

Importa más de lo previsto. Si `capabilityOfImport` devolviera `fs` ahí, la
tentación de usar esa inferencia **para decidir** crecía: `env.memory` sería
"peligroso y conocido" cuando es inocuo, y `env.salida` sería desconocido cuando
es exactamente igual de peligroso. La etiqueta es para auditar, y el test lo dejó
claro.

## 5. Un mutante imposible

Escribí un mutante «el registry descarta la lista blanca del llamador», que
exigía importar `T0_ALLOWED` en `tool.ts`. El compilador lo rechazó como símbolo
sin uso: `runInSandbox` **ya** aplica el default `req.allowed ?? T0_ALLOWED`.

Mutante y código muerto. Se quitaron los dos, en vez de dejar un import sin uso
para satisfacer al mutante.

> **Un mutante imposible es una afirmación falsa sobre el código, no un hueco en
> los tests.** Lo contrario —inventar código para que un mutante sea aplicable—
> es *fabrication*, y *fabrication* pasa más adelante en el proceso que un hueco.
