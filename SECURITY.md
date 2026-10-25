# Seguridad

> Cómo reportar un problema de seguridad **sin** que quede público antes de
> tiempo.

## Reportar

Usa la **divulgación privada de vulnerabilidades de GitHub**: la pestaña
**Security** de este repositorio, o el botón **Report a vulnerability**.

Esa vía crea un advisory privado, visible solo para quien reporta y para
quien mantiene el repositorio. No hace falta abrir un issue, y no hace falta
tener cuenta en ningún otro sitio.

> **Antes de abrir un issue público**, lee la sección de abajo. Un issue
> público sobre una vulnerabilidad da a cualquiera el tiempo de usarla.

## Qué es una vulnerabilidad aquí

Este repositorio es un **runtime y su documentación**, no un servicio con
usuarios. Así que lo que cuenta como vulnerabilidad es:

- Un camino por el que una herramienta **lee o escribe la memoria** cuando el
  permiso no se lo concede. Esa es la garantía central del proyecto, y la
  sección 5 de `docs/arquitectura/boundary-memory-v1.md` la define.
- Un camino por el que el **contexto inyectado sale del sandbox** por un
  dominio no permitido.
- Un bypass del **presupuesto de mutaciones** por sesión, o de los permisos que
  el harness valida.
- Una ejecución de código en un tier que no lo concede.

Y **no** cuenta como vulnerabilidad:

- Qué una herramienta que declara una capacidad todavía no la tenga. Eso es un
  hueco **declarado** en el repositorio, con su caso canónico, y se reporta
  como bug normal.
- Qué falte un test.
- Qué un documento esté mal escrito.

## Qué escribimos

Cuando se confirma un problema, el aviso lleva:

- Qué se puede hacer y con qué condiciones.
- Qué **no** se puede hacer, si se determinó.
- Dónde está el código que lo permite.
- Una **prueba mínima** que lo reproduce, o al menos los pasos exactos.
- Qué datos se ven afectados, y si alguno es de una persona.

## Compromiso

El plazo para un aviso público es de **90 días** desde el reporte, salvo que
alguien pida más. Publicamos el aviso cuando hay una corrección o cuando se
acuerda un plazo distinto, y en los dos casos queda escrito.

## Lo que este repositorio todavía no tiene

- **No hay un proceso de firma** de las publicaciones.
- **No hay un canal cifrado** de reporte: la divulgación privada de GitHub
  es el único canal, y sus términos son los de GitHub.
- **No hay respuesta automatizada**: un reporte se responde a mano.

Decirlo aquí es preferible a que alguien lo descubra.
