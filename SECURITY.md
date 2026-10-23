# Seguridad

> Como reportar un problema de seguridad **sin** que quede publico antes de
> tiempo.

## Reportar

Usa la **divulgacion privada de vulnerabilidades de GitHub**: la pestana
**Security** de este repositorio, o el boton **Report a vulnerability**.

Esa via crea un advisory privado, visible solo para quien reporta y para
quien mantiene el repositorio. No hace falta abrir un issue, y no hace falta
tener cuenta en ningun otro sitio.

> **Antes de abrir un issue publico**, lee la seccion de abajo. Un issue
> publico sobre una vulnerabilidad da a cualquiera el tiempo de usarla.

## Que es una vulnerabilidad aqui

Este repositorio es un **runtime y su documentacion**, no un servicio con
usuarios. Asi que lo que cuenta como vulnerabilidad es:

- Un camino por el que una herramienta **lee o escribe la memoria** cuando el
  permiso no se lo concede. Esa es la garantia central del proyecto, y la
  seccion 5 de `docs/arquitectura/boundary-memory-v1.md` la define.
- Un camino por el que el **contexto inyectado sale del sandbox** por un
  dominio no permitido.
- Un bypass del **presupuesto de mutaciones** por sesion, o de los permisos que
  el harness valida.
- Una ejecucion de codigo en un tier que no lo concede.

Y **no** cuenta como vulnerabilidad:

- Que una herramienta que declara una capacidad todavia no la tenga. Eso es un
  hueco **declarado** en el repositorio, con su caso canonico, y se reporta
  como bug normal.
- Que falte un test.
- Que un documento este mal escrito.

## Que escribimos

Cuando se confirma un problema, el aviso lleva:

- Que se puede hacer y con que condiciones.
- Que **no** se puede hacer, si se determino.
- Donde esta el codigo que lo permite.
- Una **prueba minima** que lo reproduce, o al menos los pasos exactos.
- Que datos se ven afectados, y si alguno es de una persona.

## Compromiso

El plazo para un aviso publico es de **90 dias** desde el reporte, salvo que
alguien pida mas. Publicamos el aviso cuando hay una correccion o cuando se
acuerda un plazo distinto, y en los dos casos queda escrito.

## Lo que este repositorio todavia no tiene

- **No hay un proceso de firma** de las publicaciones.
- **No hay un canal cifrado** de reporte: la divulgacion privada de GitHub
  es el unico canal, y sus terminos son los de GitHub.
- **No hay respuesta automatizada**: un reporte se responde a mano.

Decirlo aqui es preferible a que alguien lo descubra.
