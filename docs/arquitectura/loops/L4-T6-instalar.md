# L4-T6 · La instalación de un paquete

> Lo que pasa cuando un paquete viene de fuera. [El paquete](L4-T6-paquete.md)
> · [Los permisos](L4-T5-permisos.md)

## EL ORDEN, Y POR QUÉ ESTE

Instalar hace tres cosas, y el orden importa.

1. **La forma.** Un paquete con un campo que no existe, o de otro formato, o
   de otra versión de formato, no se mira: no se sabe qué reglas se le aplican.
2. **La huella.** Dice si el contenido es el que se exportó. Va antes que las
   reglas porque validar reglas de un contenido alterado es medir otra cosa:
   si alguien cambió el módulo por el camino, la pregunta relevante no es si
   el módulo es válido, sino si es el que te mandaron.
3. **Las reglas.** El módulo tiene que ser un módulo: nodos que no se repiten,
   aristas que apuntan a puertos que existen, sinks que son terminales. Un
   grafo inválido no se ejecuta.

## INSTALAR NO CONCEDE

Es el invariante central, y es el caso E6 y T5 del boundary.

El paquete declara lo que sus tools necesitan —el techo de cada una—, pero
**declararlo no es obtenerlo**. Conceder es un acto del operador, por la
puerta de L4-T5, con su motivo y su registro.

Por eso la instalación devuelve una **política vacía**, y no «la política que
hubiera»: la política que sale de instalar un paquete es siempre la misma, y
es la de no tener nada. Y no es una disciplina: es la forma del resultado. No
hay ningún camino por el que instalar devuelva una política con concesiones.

De ahí sale el caso del boundary: un `.opitapack` malicioso instalado no puede
pedir contexto, porque sus tools no tienen concesión, y la puerta lo dice con
su motivo. Y no puede escribir, porque la escritura también es una concesión.

## LAS PETICIONES: DERIVADAS, NO DENTRO DEL FORMATO

El paquete **no** lleva una lista de permisos. Las peticiones se calculan del
descriptor de cada tool, que es la única copia.

Si el paquete llevara sus peticiones y además cada tool llevara su techo,
habría **dos fuentes de verdad** para lo mismo, y la segunda podría divergir de
la primera sin que nadie lo notara.

Una tool que no pide nada no aparece: una petición de nada no es una petición.

**Y por qué no hay un campo de escritura.** Escribir en la memoria es una
capacidad que concede el operador a un (id, version, autor), y ninguna tool la
declara: el `effect` del contrato es el efecto sobre su entorno —un fichero,
la red—, y no es lo mismo. Confundir los dos haría que una tool que escribe en
un fichero pareciera pedir permiso para reescribir la memoria de quien la
instala. Lo que el paquete da es la lista de sus tools, que está en el módulo,
y de ahí sale a quién se le puede conceder escritura.

## LO QUE LA INSTALACIÓN NO HACE

- **No resuelve el código de las tools.** La magia se resuelve por (id,
  version) en el registry; el paquete lleva la promesa.
- **No escribe nada en ningún sitio.** Instalar es una operación pura: mira un
  paquete y devuelve el módulo, las peticiones y la política. Quien lo guarda
  en disco es el harness, que es quien sabe dónde vive.
- **No es el derecho de portabilidad por sí solo.** El derecho del art. 8 lo
  cumple quien tiene los datos, con este mismo formato.
