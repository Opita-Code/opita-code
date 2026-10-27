-- L4-T4 · AISLAMIENTO LOGICO: EL ESQUEMA.
--
-- QUE ES. La base donde vive la memoria. Cada fila lleva su `project_id`, y la
-- fila no se ve si no es del proyecto conectado. El aislamiento lo hace el
-- motor, no la aplicacion: una tool que se equivoca de proyecto no puede
-- leer lo de otro, porque la politica no la deja.
--
-- POR QUE RLS Y NO UN WHERE. Un `WHERE project_id = ?` en cada consulta es
-- una disciplina: se olvida, y el olvido es una fuga. La RLS es una regla del
-- motor: no se puede olvidar, porque la politica se aplica a la fila.
--
-- LO QUE ESTA AQUI: las tablas, el rol de la aplicacion, y la RLS activada.
-- Las politicas estan en 002_politicas.sql, que es otra preocupacion.
--
-- LO QUE NO HACE: esto no cifra nada (la condicion 2 del aislamiento legal
-- depende de KMS y de rotacion), no autoriza por identidad (eso es L4-T5), y
-- no decide que datos se guardan.

CREATE SCHEMA IF NOT EXISTS opita;

-- EL ROL DE LA APLICACION. Sin el, las politicas no aplican: el dueno de la
-- tabla la ve entera, y un superusuario la ve entera siempre. La aplicacion
-- entra como `opita_app`, que no es superusuario ni dueno.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'opita_app') THEN
    CREATE ROLE opita_app NOLOGIN;
  END IF;
END
$$;

-- LOS PROYECTOS. La raiz del aislamiento: una fila por proyecto de memoria.
CREATE TABLE IF NOT EXISTS opita.proyecto (
  id          uuid PRIMARY KEY,
  nombre      text NOT NULL,
  creado_en   timestamptz NOT NULL DEFAULT now()
);

-- LOS REGISTROS. Lo que la memoria guarda. `project_id` NO es null: una fila
-- sin proyecto no tiene a quien pertenecer, y por eso no se puede crear.
CREATE TABLE IF NOT EXISTS opita.registro (
  id          uuid PRIMARY KEY,
  project_id  uuid NOT NULL REFERENCES opita.proyecto(id),
  contenido   jsonb NOT NULL,
  creado_en   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS registro_por_proyecto ON opita.registro(project_id);

-- EL LOG DE ACCESO. La condicion 3 del aislamiento legal: la auditoria de
-- todo acceso. Su propia secuencia, para no depender del nombre que el
-- motor le pone a la de un bigserial.
CREATE SEQUENCE IF NOT EXISTS opita.acceso_log_id_seq;

CREATE TABLE IF NOT EXISTS opita.acceso_log (
  id            bigint NOT NULL DEFAULT nextval('opita.acceso_log_id_seq'),
  project_id    uuid,
  recurso       text NOT NULL,
  operacion     text NOT NULL,
  resultado     text NOT NULL,
  ocurrido_en   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- LA RLS. Se activa y se FUERZA: forzar es lo que hace que el dueno de la
-- tabla tambien obedezca la politica. Sin FORCE, el dueno la ve entera.
ALTER TABLE opita.proyecto   ENABLE ROW LEVEL SECURITY;
ALTER TABLE opita.proyecto   FORCE  ROW LEVEL SECURITY;
ALTER TABLE opita.registro   ENABLE ROW LEVEL SECURITY;
ALTER TABLE opita.registro   FORCE  ROW LEVEL SECURITY;
ALTER TABLE opita.acceso_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE opita.acceso_log FORCE  ROW LEVEL SECURITY;

-- EL ROL DE LA APLICACION: usa las tablas, no las posee.
GRANT USAGE ON SCHEMA opita TO opita_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON opita.proyecto, opita.registro TO opita_app;
GRANT SELECT, INSERT ON opita.acceso_log TO opita_app;
GRANT USAGE, SELECT ON SEQUENCE opita.acceso_log_id_seq TO opita_app;
