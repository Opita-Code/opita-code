# L-PUB3 · La pagina del ahora

> El preview entre updates: una pagina, con fecha visible, que responde que se
> esta construyendo ahora.

## QUE ES, Y POR QUE EXISTE

El requisito era el preview entre updates: que se vea lo que pasa entre una
release y la siguiente. La investigacion del 2026-10-23 (memoria 1111, punto 4)
dio el patron: **una pagina, con FECHA VISIBLE, que responde «que estoy
haciendo ahora»**. No es un feed: cuenta una sola entrada, la que esta en
marcha.

Lo que la hace util para alguien que no lee codigo:

- **La fecha visible ES la senal de frescura.** Una pagina sin fecha no es
  evidencia de nada.
- **El bloque del final se puede copiar y pegar.** Es lo que hace que la
  pagina sirva cuando el canal de distribucion todavia no esta decidido.
- **No hay que leer una lista** para saber donde esta el proyecto.

## QUE TIENE

1. La promesa, y la fecha.
2. Que estoy haciendo ahora: el loop en curso, con su texto de apertura.
3. Lo que se cerro por ultima vez: una sola entrada, la anterior. No la lista.
4. La evidencia, medida: los cuatro numeros, los mismos que en el indice.
5. Para copiar y pegar: un bloque generado, con la promesa, el loop en curso,
   el ultimo cerrado, los numeros de hoy y la direccion de la pagina.

## DE DONDE SALE, Y COMO NO PUEDE ENVEJECER

Todo sale de `vibe-tools/estado.json`: la promesa, el loop en curso, el ultimo
cerrado, los KPI y la fecha. El generador es `scripts/generar-sitio.mjs`, y el
sitio se compara contra la fuente en cada push (`generar-sitio --check`), que
es lo que impide que una pagina con fecha vieja se quede quieta.

La fecha no es «hoy» por definicion: es `proyecto.actualizado`, y el guard del
estado la contrasta contra el ultimo commit que toco la fuente. Si el estado
cambia y la fecha no, el guard falla.

## LO QUE COSTARON LOS ENLACES

El README tiene un tope duro de 4096 B, y el 2026-10-25 estaba a 17 B de ese
tope. El enlace a esta pagina ocupa 74 B. En vez de amputar, se cambio el
rotulo del enlace al sitio («que se esta construyendo ahora» -> «el estado
completo»), porque esa redundancia la cubre ahora la pagina del ahora.

Aviso declarado: el README se pasara en cuanto L4 se cierre, porque la tabla
de documentos gana una fila. La salida es partirlo por concepto, no subir el
limite ni recortar el enlace.

## LO QUE NO SE HIZO

- **El canal de distribucion sigue sin decidirse.** Esta pagina no lo decide:
  deja el bloque listo para donde el operador lo lleve.
- **No hay feed**, ni archivo de entradas, ni fecha por entrada. Una sola
  entrada, con la fecha del estado.
- **La pagina no se sube a mano.** Como todo lo publico, sale de la fuente.
