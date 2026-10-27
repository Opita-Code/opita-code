# L4-T4 · El aislamiento lógico

> Qué hace el motor de la base para que un proyecto no vea los datos de otro, y
> qué queda fuera de esta pieza.

## LA IDEA, Y POR QUÉ NO ES UN `WHERE`

Cada fila de la memoria lleva su `project_id`. La fila no se ve si no es del
proyecto conectado. Y esa regla no la escribe la aplicación: la escribe el
motor, en la fila, con la Row Level Security de PostgreSQL.

La diferencia con un `WHERE project_id = ?` en cada consulta es que un `WHERE`
es una disciplina y la RLS es una regla del motor. La disciplina se olvida, y
el olvido es una fuga. Aquí no hay forma de leer la fila de otro proyecto sin
que el motor la oculte: no depende de que alguien se acuerde de escribir la
condición.

## LAS TRES PIEZAS

| Pieza | Dónde | Qué hace |
|---|---|---|
| El esquema | `vibe-tools/db/001_esquema.sql` | Las tablas, el `project_id` que no puede ser nulo, y la RLS activada y forzada |
| Las políticas | `vibe-tools/db/002_politicas.sql` | Una política por operación, y la auditoría |
| El vínculo | `vibe-tools/src/aislamiento/vinculo.ts` | El lado de la aplicación: fija el proyecto y deja escrito lo que pasó |

### EL VÍNCULO

La base no sabe qué proyecto es el de la conexión: se lo dice la aplicación, con
`SET LOCAL app.project_id`. Y `LOCAL` no es un detalle: es de la transacción.
Con `SET`, el proyecto se queda pegado a la sesión, y la siguiente
transacción —que puede ser de otro— hereda el anterior. Un `SET` ahí es una
fuga silenciosa, y por eso el módulo solo produce `SET LOCAL`, con su `BEGIN`.

### FALLA CERRADO

Sin vínculo, `current_setting` devuelve nulo, y `project_id = NULL` no es
verdad: no se ve ninguna fila. No hay un estado intermedio en el que se vea
"casi todo" o "todo menos una cosa". La ausencia de vínculo es la ausencia de
acceso.

### EL ROL DE LA APLICACIÓN

Las políticas no se aplican al dueño de la tabla ni al superusuario. Por eso
la aplicación entra con un rol propio, `opita_app`, que no es ninguno de los
dos. Y por eso la RLS va con `FORCE`: sin forzar, el dueño se salta la
política.

## LA AUDITORÍA

La condición 3 del aislamiento legal pide auditar todo acceso. Lo que hay:

- **La base audita las escrituras.** Un disparador de sentencia deja una
  entrada por operación, con el recurso y la operación exactos.
- **La aplicación audita las lecturas y las denegaciones.** En su propia
  transacción, porque la transacción que falló se revierte con su contenido:
  un registro que se pierde con el error no sirve como prueba de nada.

**Lo que la base no puede auditar**, y está declarado: una lectura que el
motor ocultó no deja rastro en la base, porque el filtrado de la RLS es
silencioso. Por eso la auditoría de lecturas es de la aplicación, que sí sabe
qué se pidió. Y PostgreSQL no admite disparadores para `SELECT`: no es que no
se haya hecho, es que no existe.

El log tampoco es un canal lateral: cada proyecto ve el suyo y solo el suyo.

## LO QUE ESTA UNIDAD NO HACE

- **No cifra.** La condición 2 —cifrado en reposo y en tránsito, con KMS y
  rotación— depende de la infraestructura en producción, que todavía no existe.
  Aquí no hay ni una llave.
- **No autoriza.** Los permisos por identidad son L4-T5, y son de otra
  preocupación: la RLS aísla proyectos, no personas.
- **No es producción.** No hay AWS, ni RDS, ni nada desplegado. Lo que hay es
  el esquema, las políticas y la prueba contra un Postgres real.
- **No guarda datos.** Las tablas son el mínimo para que el aislamiento se
  pueda medir; el modelo de datos es de otra unidad.

La siguiente pieza es L4-T5, que decide quién puede hacer qué dentro del
proyecto: el aislamiento dice qué proyecto ve el motor, y no quién puede hacer
qué.
