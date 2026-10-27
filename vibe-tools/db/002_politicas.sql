-- L4-T4 · AISLAMIENTO LOGICO: LAS POLITICAS Y LA AUDITORIA.
--
-- EL VINCULO. Que proyecto esta conectado en esta sesion. La aplicacion lo
-- fija con `SET LOCAL app.project_id = '<uuid>'` DENTRO de una transaccion.
-- Sin vinculo, `current_setting` devuelve NULL, y `project_id = NULL` no es
-- TRUE: no se ve ninguna fila. Falta el vinculo = no hay acceso.
CREATE OR REPLACE FUNCTION opita.proyecto_actual() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.project_id', true), '')::uuid
$$;

-- LAS POLITICAS. Una por comando, para que el log diga que se hizo y no solo
-- que se intento.
--
-- `USING` mira la fila que ya existe; `WITH CHECK` mira la que se quiere
-- escribir. Por eso el UPDATE lleva las dos: no se puede leer una fila de
-- otro proyecto, ni mover una fila propia hacia el proyecto de otro.
CREATE POLICY proyecto_leer ON opita.proyecto FOR SELECT
  USING (id = opita.proyecto_actual());

CREATE POLICY registro_leer ON opita.registro FOR SELECT
  USING (project_id = opita.proyecto_actual());

CREATE POLICY registro_escribir ON opita.registro FOR INSERT
  WITH CHECK (project_id = opita.proyecto_actual());

CREATE POLICY registro_actualizar ON opita.registro FOR UPDATE
  USING (project_id = opita.proyecto_actual())
  WITH CHECK (project_id = opita.proyecto_actual());

CREATE POLICY registro_borrar ON opita.registro FOR DELETE
  USING (project_id = opita.proyecto_actual());

-- EL LOG. Cada proyecto ve su propio log y solo el suyo: la auditoria no
-- puede ser un canal lateral entre projetos.
--
-- Y la escritura se permite solo con el proyecto conectado: asi el log no se
-- puede falsificar con el identificador de otro.
CREATE POLICY acceso_log_leer ON opita.acceso_log FOR SELECT
  USING (project_id IS NOT DISTINCT FROM opita.proyecto_actual());

CREATE POLICY acceso_log_escribir ON opita.acceso_log FOR INSERT
  WITH CHECK (project_id IS NOT DISTINCT FROM opita.proyecto_actual());

-- LA AUDITORIA. Un disparador por sentencia de escritura: una entrada por
-- operacion, con el recurso y la operacion exactos.
--
-- Y POR QUE UN DISPARADOR Y NO UNA POLITICA. La politica ve la fila, no la
-- sentencia: si escribiera el log, dejaria una entrada por fila alcanzada, y
-- ademas no podria distinguir un acceso permitido de uno denegado, porque el
-- motor filtra en silencio. Lo que se audita es lo que la aplicacion hizo.
--
-- Y POR QUE NO HAY DISPARADOR DE LECTURA. PostgreSQL no los admite: SELECT no
-- es un evento de CREATE TRIGGER. Por eso las lecturas las audita la
-- aplicacion (sentenciaLectura), no la base. Y el motivo de fondo es el mismo
-- que hace que el aislamiento sea silencioso: una lectura que el motor filtra
-- sin error no deja rastro en la base, porque el filtrado de la RLS no es un
-- evento. Ese limite esta declarado, no escondido.
--
-- `SECURITY DEFINER` porque escribe en una tabla que tambien tiene politica:
-- sin esto, auditar seria imposible.
CREATE OR REPLACE FUNCTION opita.registrar_acceso() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = opita, pg_temp AS $$
BEGIN
  INSERT INTO opita.acceso_log (project_id, recurso, operacion, resultado)
  VALUES (opita.proyecto_actual(), TG_TABLE_NAME, TG_OP, 'permitido');
  RETURN NULL;
END;
$$;

CREATE TRIGGER acceso_registro_escribir
  AFTER INSERT ON opita.registro FOR EACH STATEMENT
  EXECUTE FUNCTION opita.registrar_acceso();

CREATE TRIGGER acceso_registro_actualizar
  AFTER UPDATE ON opita.registro FOR EACH STATEMENT
  EXECUTE FUNCTION opita.registrar_acceso();

CREATE TRIGGER acceso_registro_borrar
  AFTER DELETE ON opita.registro FOR EACH STATEMENT
  EXECUTE FUNCTION opita.registrar_acceso();

CREATE TRIGGER acceso_proyecto_leer
  AFTER INSERT ON opita.proyecto FOR EACH STATEMENT
  EXECUTE FUNCTION opita.registrar_acceso();
