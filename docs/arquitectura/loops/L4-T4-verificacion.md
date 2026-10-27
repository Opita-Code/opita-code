# L4-T4 · El aislamiento, medido

> Qué se comprobó contra un Postgres real, y qué no se comprobó.

## LA MEDICIÓN, CONTRA QUÉ

Un Postgres 16 de verdad, en un contenedor, con las migraciones del repositorio
aplicadas y dos proyectos sembrados: el proyecto A con una fila, el proyecto B
con otra. La aplicación entra con el rol `opita_app`, que es el único al que
las políticas miran.

| Prueba | Resultado |
|---|---|
| El acceso cruzado falla en las cuatro operaciones | **4 de 4.** Leer, escribir, actualizar y borrar sobre la fila del otro proyecto no la alcanzan |
| Sin vínculo no se ve nada | **Correcto.** Cero filas, sin error: el aislamiento falla cerrado |
| Una fila propia no se puede mover al proyecto de otro | **Rechazada.** El `WITH CHECK` de la política lo para |
| La auditoría queda escrita | **Correcto.** La base registra la escritura y la aplicación registra la lectura y la denegación |
| El log de un proyecto no se ve desde otro | **Correcto.** El log no es un canal lateral |

El "4 de 4" es el KPI del plan: el intento de acceso cruzado entre
`project_id` falla el cien por cien. No es una cifra de planes: son cuatro
operaciones contra cuatro filas de otro proyecto, y las cuatro fallaron.

## LAS PRUEBAS, Y DÓNDE ESTÁN

| Suite | Dónde | Qué corre |
|---|---|---|
| Unidad | `vibe-tools/test/aislamiento.test.ts` | El vínculo: `SET LOCAL`, la transacción, los motivos, el escapado |
| Integración | `vibe-tools/integration/aislamiento-rls.test.ts` | El aislamiento real, contra un Postgres de verdad |

La suite de integración va aparte, y no por capricho: el runner de mutación
corre la suite de `dist/test` una vez por mutante, y son 199. Levantar un
contenedor 199 veces no es una suite, es una espera.

**Si no hay Docker, la prueba se salta y lo dice.** Un aislamiento que no se
midió no es un aislamiento comprobado, y la diferencia entre las dos cosas se
ve en el nombre del test, no en un silencio.

## LO QUE ESTA UNIDAD NO MIDE

- **La infraestructura de producción.** No hay AWS, ni RDS, ni rotación de
  llaves. Lo que se midió es el motor, no el despliegue.
- **El cifrado.** La condición 2 depende de KMS y de rotación, y aquí no hay
  ni una llave.
- **El rendimiento.** No hay medición de carga ni de latencia con la política
  activa. Con `project_id` indexado, la política se resuelve sobre el índice;
  eso es una expectativa, no una medida.
- **Los permisos.** Quién puede hacer qué dentro del proyecto es L4-T5.

## POR QUÉ LA AUDITORÍA ESTÁ PARTIDA

La base audita las escrituras, con un disparador de sentencia. Las lecturas las
audita la aplicación. Y no es una preferencia: PostgreSQL no admite disparadores
para `SELECT`, y el filtrado de la RLS es silencioso, así que una lectura que
el motor ocultó no deja rastro en la base. Si la auditoría de las lecturas
fuera de la base, la lectura que ocurrió y la que no se verían igual.

La denegación se escribe aparte, en su propia transacción, porque la
transacción que falló se revierte con su contenido: un registro que se pierde
con el error no sirve como prueba.

## LO QUE EL JUEZ NO VIÓ

Esta unidad se juzga por partes, como todas. Cada parte va contra su propia
afirmación, y la coherencia entre partes no la certifica nadie.
