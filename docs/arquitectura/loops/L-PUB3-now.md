# L-PUB3 · La página del ahora

> El preview entre updates: una página, con fecha visible, que responde que se
> está construyendo ahora.

## QUÉ ES, Y POR QUÉ EXISTE

El requisito era el preview entre updates: que se vea lo que pasa entre una
release y la siguiente. La investigación del 2026-10-23 (memoria 1111, punto 4)
dio el patrón: **una página, con FECHA VISIBLE, que responde «qué estoy
haciendo ahora»**. No es un feed: cuenta una sola entrada, la que está en
marcha.

Lo que la hace útil para alguien que no lee código:

- **La fecha visible ES la señal de frescura.** Una página sin fecha no es
  evidencia de nada.
- **El bloque del final se puede copiar y pegar.** Es lo que hace que la
  página sirva cuando el canal de distribución todavía no está decidido.
- **No hay que leer una lista** para saber dónde está el proyecto.

## QUÉ TIENE

1. La promesa, y la fecha.
2. Qué estoy haciendo ahora: el loop en curso, con su texto de apertura.
3. Lo que se cerró por última vez: una sola entrada, la anterior. No la lista.
4. La evidencia, medida: los cuatro números, los mismos que en el índice.
5. Para copiar y pegar: un bloque generado, con la promesa, el loop en curso,
   el último cerrado, los números de hoy y la dirección de la página.

## DE DONDE SALE, Y CÓMO NO PUEDE ENVEJECER

Todo sale de `vibe-tools/estado.json`: la promesa, el loop en curso, el último
cerrado, los KPI y la fecha. El generador es `scripts/generar-sitio.mjs`, y el
sitio se compara contra la fuente en cada push (`generar-sitio --check`), que
es lo que impide que una página con fecha vieja se quede quieta.

La fecha no es «hoy» por definición: es `proyecto.actualizado`, y el guard del
estado la contrasta contra el último commit que tocó la fuente. Si el estado
cambia y la fecha no, el guard falla.

## LO QUE COSTARON LOS ENLACES

El README tiene un tope duro de 4096 B, y el 2026-10-25 estaba a 17 B de ese
tope. El enlace a esta página ocupa 74 B. En vez de amputar, se cambió el
rótulo del enlace al sitio («qué se está construyendo ahora» -> «el estado
completo»), porque esa redundancia la cubre ahora la página del ahora.

Aviso declarado: el README se pasará en cuanto L4 se cierre, porque la tabla
de documentos gana una fila. La salida es partirlo por concepto, no subir el
límite ni recortar el enlace.

## LO QUE NO SE HIZO

- **El canal de distribución sigue sin decidirse.** Esta página no lo decide:
  deja el bloque listo para dónde el operador lo lleve.
- **No hay feed**, ni archivo de entradas, ni fecha por entrada. Una sola
  entrada, con la fecha del estado.
- **La página no se sube a mano.** Como todo lo público, sale de la fuente.
