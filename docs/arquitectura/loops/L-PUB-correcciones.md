# L-PUB · Correcciones de la superficie pública

> Parte 1 de 2. [Cierre](L-PUB-cierre.md) · [Índice](INDICE-publico.md)
> Spec 540. Tareas P1 a P7.

Lo que estaba mal en la cara pública del repositorio, y cómo se corrigió.
Todo lo de aquí se **midió** antes de corregirlo. Y los errores que cometí
dentro de esta unidad también van, porque un cierre que solo lista lo que
salió bien no sirve para lo siguiente.

## 1. EL REPO NO TENÍA PUERTA DE ENTRADA

Medido: en la raíz no hay ningún `README*`. El único README es el del paquete,
`vibe-tools/README.md`, que es el índice técnico del runtime.

Quien llega al repositorio no encuentra por dónde empezar. Lo único que hay es
un índice de 39 documentos de proceso, y el único texto que parece una puerta
está escrito para quien ya sabe que busca.

## 2. EL README DEL PAQUETE MENTÍA EN TRES LUGARES

Medido contra el estado real de la sesión:

| Afirmación | Realidad |
|---|---|
| `Siguiente: L3` | L3 estaba cerrado y validado 10 de 10 |
| `67 unidades juzgables` | el guard medía 77 |
| L3 no aparecía en la lista de loops | estaba cerrado |

El primero es el que más duele: una página que dice que lo siguiente es algo que
ya está hecho enseña a quien llega que el proyecto se quedó parado.

## 3. UNA AFIRMACIÓN FALSA EN LA SPEC DE BOUNDARY

`docs/arquitectura/boundary-memory-v1.md` afirmaba que el juez estaba caído y que
«arreglar el binario» era precondición. **Era falso**, y la causa estaba a una
capa de la que la nota apuntaba: el binario estaba bien, lo que estaba sin
credencial era el canal NLI, que el veredicto usa y que no consulta el keyring.

Corregido, y corregido el modo de decirlo: la avería no era del código, era de
su configuración. Por eso la instrucción equivocada era rebuild algo que ya
funcionaba, y esa clase de instrucción es la que hace que un equipo pierda un
día en lo que ya estaba resuelto.

## 4. CUATRO ARCHIVOS CON LA RUTA DEL USUARIO DENTRO

Medido: `consensus-probe.json`, `l3-judge-steps.json`, `rejudge-steps.json` y
`mcp-stdio-probe.mjs` llevaban `C:/Users/nicou/...` hardcodeado. No es un
secreto, pero hace que la sonda no corra en ninguna otra máquina: la evidencia
de **cómo** se juzgó el repo no se puede reproducir donde no se.

El arreglo no es borrar los archivos, que son la evidencia de cómo se juzgó.
Es quitarles la dependencia de una máquina:

- El wrapper del MCP vive en el perfil del usuario, no en el repo. Ahora se
  deriva de `homedir()`, con `DARK_MEMORY_WRAPPER` como override.
- La raíz del repo se deriva de la ubicación del propio archivo, no del
  directorio de trabajo.
- Los pasos usan un marcador `__ROOT__` para las rutas de artefacto, que se
  sustituye por la raíz real antes de la llamada. El juez resuelve el artefacto
  contra el **directorio de trabajo del proceso**, así que la ruta tiene que
  ser absoluta: `__ROOT__` cumple las dos cosas, portable y absoluta.

Verificado con una evaluación nueva: 1013, `aligned`, entailment, sobre la ruta
resuelta desde el marcador.

## 5. LO QUE SE CONSTRUYÓ

- **Una fuente única de verdad**: `vibe-tools/estado.json`.
- **Un generador**: `vibe-tools/scripts/generar-estado.mjs`. De la fuente salen
  `STATUS.md`, `docs/avances.md`, un archivo por loop en `docs/avances/`, las
  islas generadas del `README.md` y las notas de release.
- **Un guard**: `vibe-tools/scripts/verificar-estado.mjs`. Mide la realidad y la
  contrasta contra lo declarado. Si un número no cuadra, sale con error.
- **Tres workflows**: `ci.yml` verifica, `estado.yml` regenera la superficie en
  cada push, `release.yml` deja el release como borrador para que el operador
  lo publique.

El error que cometí **dentro** de esta unidad, con lo que el guard atrapó, está en
la sección siguiente: un cierre que solo lista lo que salió bien no sirve para
lo siguiente.

## 6. LOS ERRORES QUE COMETÍ DENTRO DE ESTA UNIDAD

Cuatro, y el guard los atrapó a todos:

1. **La sustitución dentro del JSON.** Al portabilizar la sonda, metí la raíz
   del repo con barras invertidas dentro del texto JSON serializado. En JSON la
   barra es un carácter de escape, así que `C:\Users\nicou` se leía como
   `C:<salto>Users<retorno>nicou`, y el servidor se colgaba. La lección: si se
   sustituye dentro de una representación, hay que respetar la representación.
   Se sustituye sobre los **valores**, no sobre el texto.
2. **Un identificador de una letra de diferencia.** El mismo nombre escrito de
   dos maneras, y el que se usaba no era el que se había declarado: uno tenía
   once letras y el otro diez. Lo produjo el error más tonto posible y se vio
   en la primera corrida.
3. **El README en 4249 B.** El tope son 4096. No se amortiguó: se acortó la
   sección de visión, que duplicaba el texto de la fuente, y la verificación se
   movió a su propio documento. **Partir por concepto, nunca amputar.**
4. **Un número viejo en la fuente.** Al meter la superficie nueva dentro del
   gate, las unidades juzgables pasaron de 77 a 85 y la fuente seguía diciendo
   77. **El guard lo dijo en la primera corrida**, que es exactamente lo que
   existe para decir eso.

Y uno de la sesión anterior, que este loop hereda: la sonda no hacía lo que su
nombre prometía porque el judge resolvía el artefacto contra el directorio de
trabajo del proceso, no contra el repositorio. Por eso la ruta tiene que ser
absoluta, y por eso ahora se deriva de la ubicación del propio archivo.
