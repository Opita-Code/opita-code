# L-PUB · Correcciones de la superficie publica

> Parte 1 de 2. [Errores](L-PUB-errores.md) · [Cierre](L-PUB-cierre.md) · [Indice](INDICE-publico.md)
> Spec 540. Tareas P1 a P7.

Lo que estaba mal en la cara publica del repositorio, y como se corrigio.
Todo lo de aqui se **midio** antes de corregirlo.

Lo que estaba mal en la cara publica del repositorio, y como se corrigio.
Todo lo de aqui se **midio** antes de corregirlo. Y los errores que cometi
dentro de esta unidad tambien van, porque un cierre que solo lista lo que
salio bien no sirve para lo siguiente.

## 1. EL REPO NO TENIA PUERTA DE ENTRADA

Medido: en la raiz no hay ningun `README*`. El unico README es el del paquete,
`vibe-tools/README.md`, que es el indice tecnico del runtime.

Quien llega al repositorio no encuentra por donde empezar. Lo unico que hay es
un indice de 39 documentos de proceso, y el unico texto que parece una puerta
esta escrito para quien ya sabe que busca.

## 2. EL README DEL PAQUETE MENTIA EN TRES LUGARES

Medido contra el estado real de la sesion:

| Afirmacion | Realidad |
|---|---|
| `Siguiente: L3` | L3 estaba cerrado y validado 10 de 10 |
| `67 unidades juzgables` | el guard medía 77 |
| L3 no aparecia en la lista de loops | estaba cerrado |

El primero es el que mas duele: una pagina que dice que lo siguiente es algo que
ya esta hecho enseña a quien llega que el proyecto se quedo parado.

## 3. UNA AFIRMACION FALSA EN LA SPEC DE BOUNDARY

`docs/arquitectura/boundary-memory-v1.md` afirmaba que el juez estaba caido y que
«arreglar el binario» era precondicion. **Era falso**, y la causa estaba a una
capa de la que la nota apuntaba: el binario estaba bien, lo que estaba sin
credencial era el canal NLI, que el veredicto usa y que no consulta el keyring.

Corregido, y corregido el modo de decirlo: la averia no era del codigo, era de
su configuracion. Por eso la instruccion equivocada era rebuild algo que ya
funcionaba, y esa clase de instruccion es la que hace que un equipo pierda un
dia en lo que ya estaba resuelto.

## 4. CUATRO ARCHIVOS CON LA RUTA DEL USUARIO DENTRO

Medido: `consensus-probe.json`, `l3-judge-steps.json`, `rejudge-steps.json` y
`mcp-stdio-probe.mjs` llevaban `C:/Users/nicou/...` hardcodeado. No es un
secreto, pero hace que la sonda no corra en ninguna otra maquina: la evidencia
de **como** se juzgo el repo no se puede reproducir donde no se.

El arreglo no es borrar los archivos, que son la evidencia de como se juzgo.
Es quitarles la dependencia de una maquina:

- El wrapper del MCP vive en el perfil del usuario, no en el repo. Ahora se
  deriva de `homedir()`, con `DARK_MEMORY_WRAPPER` como override.
- La raiz del repo se deriva de la ubicacion del propio archivo, no del
  directorio de trabajo.
- Los pasos usan un marcador `__ROOT__` para las rutas de artefacto, que se
  sustituye por la raiz real antes de la llamada. El juez resuelve el artefacto
  contra el **directorio de trabajo del proceso**, asi que la ruta tiene que
  ser absoluta: `__ROOT__` cumple las dos cosas, portable y absoluta.

Verificado con una evaluacion nueva: 1013, `aligned`, entailment, sobre la ruta
resuelta desde el marcador.

## 5. LO QUE SE CONSTRUYO

- **Una fuente unica de verdad**: `vibe-tools/estado.json`.
- **Un generador**: `vibe-tools/scripts/generar-estado.mjs`. De la fuente salen
  `STATUS.md`, `docs/avances.md`, un archivo por loop en `docs/avances/`, las
  islas generadas del `README.md` y las notas de release.
- **Un guard**: `vibe-tools/scripts/verificar-estado.mjs`. Mide la realidad y la
  contrasta contra lo declarado. Si un numero no cuadra, sale con error.
- **Tres workflows**: `ci.yml` verifica, `estado.yml` regenera la superficie en
  cada push, `release.yml` deja el release como borrador para que el operador
  lo publique.

El error que cometi **dentro** de esta unidad, con lo que el guard atrapo, esta en
[errores](L-PUB-errores.md). Va aparte porque un cierre que solo lista lo que
salio bien no sirve para lo siguiente.
