# La regla del judge por partes

> Cómo se juzga una spec que se parte en varias, qué dice el veredicto
> agregado, y qué NO lo dice. Transversal: aplica a todo lo que se juzga.

## Por qué hace falta una regla

Porque **juzgar por partes ya se hace**: cada tarea de una spec es un
artefacto, y cada artefacto se juzga contra su propio SpecIntent. Lo que
faltaba era saber **qué significa** el resultado cuando hay N veredictos.

Y hay una asimetría que obliga a escribirla: el juez **no ve** el conjunto.
Cada veredicto es sobre su artefacto. Un agregado de «N de N aligned» dice
que **cada parte** sostiene lo que decía; **no** dice que las partes no se
contradigan entre sí.

## La regla

**1. Una parte, una afirmación.** Cada parte se juzga contra un SpecIntent con
**una** afirmación central. Es la regla que ya se aprendió con los
documentos: un intent que enumera varias cosas produce neutralidad, no
entailment (medido: cinco intentos, cinco formas).

**2. El agregado dice «N de N partes», con nombre.** Nunca «el documento está
bien». Cada parte se certifica con la suya: «L3-mindsets: aligned». Y si se
declara una parte que no se juzga, el agregado es **incompleto**, y un
agregado incompleto no es un aprobado.

**3. La coherencia entre partes NO la certifica el juez.** Es otra capa. Un
juez por partes no puede ver una contradicción entre dos partes, y la regla
no promete lo que el juez no puede cumplir.

**4. Cada parte cabe en una pieza.** El tope del framework son 4096 B por
artefacto juzgable, y la razón está medida: con ese tope el SpecIntent
aplica al artefacto **completo** y el veredicto es decidible (100 % aligned,
stddev 0, degraded false). Un artefacto más grande **no es un problema del
juez**: medido hoy, uno de 5067 B se juzgó entero, sin truncar
(`artifact_truncated: false`), con `aligned` y confianza 1.000, a 45 s. El
tope es una regla nuestra para que el veredicto signifique algo, no un
límite técnico.

**5. La suma de las partes es el conjunto, no su coherencia.** Publicar «10
de 10 partes en aligned» es un dato verdadero y limitado: cada parte se
sostiene sola. Quien lo use tiene que saber esa diferencia.

## Dónde ocurre la partida

Decisión del operador (2026-10-27): **la partida es solo para el juez.** En el
repositorio el documento es uno, entero, con su prosa completa. Lo que se parte
es lo que el juez ve, en el momento de juzgarse; y un script recompone las
partes y las verifica contra el original, byte a byte.

El motivo es que partir en el repositorio obligaba a recortar la prosa de
otros documentos para que un índice quepa. Un tope de bytes terminó decidiendo
la forma del árbol de archivos, y eso está al revés: el tope existe para que el
veredicto signifique algo, no para que los documentos se partan.

El corte va en los títulos (un concepto es un título y lo que va debajo), y en
el código en las declaraciones de nivel superior. Si un concepto no cabe solo,
el script falla: partirlo por bytes sería amputar, y un veredicto sobre un
trozo de una idea no es un veredicto sobre la idea.

Y el tope **no sube**: sigue siendo 4096 B por parte. Lo que cambió es dónde se
parte, no cuánto.

## Qué pasó con las partidas que existían por el tope

Cinco archivos del repositorio existían solo porque el tope decidía la forma
del árbol. Medido, no supuesto: cada uno nació en el commit que declaró el tope
como su razón, o lo escribió un script de un solo uso.

| Archivo | Nació porque | Volvió a |
|---|---|---|
| `INDICE-L4.md` | `INDICE.md` estaba en 4084 B y una fila más lo empujaba sobre el tope | `INDICE.md`, con las siete piezas de L4 en su tabla |
| `L-PUB-errores.md` | `split-lpub.mjs`, una partida de un solo uso | `L-PUB-correcciones.md`, sección 6 |
| `L-PUB-abiertos.md` | `split-lpub.mjs`, la misma partida | `L-PUB-cierre.md`, sus tres secciones |
| `L-PUB2-comunidad.md` | `split-lpub2.mjs`, la misma operación | `L-PUB2-archivos.md`, secciones 3 a 5 |
| `L-PUB2-guard.md` | `split-lpub2.mjs`, la misma operación | `L-PUB2-archivos.md`, sección 6 |

Los dos scripts de la partida se borraron con ella. Un script de un solo uso
que ya no tiene nada que partir es un arma cargada: su guarda comprobaba que
la partida **existiera**, y como ya no existe, volver a correrlo habría
cortado un documento por donde no era.

Lo que **no** se deshizo: los documentos que un loop divide por preocupación
—L0, L1, L2, L3— siguen siendo varios, con su navegación. Ahí la razón es
que un documento que mezcla varias cosas deja de ser juzgable de forma
estable, y esa razón no era el tope.

## Lo que hace falta para que la coherencia no sea un agujero

**a) Cada parte declara a qué se refiere.** El conjunto sabe si dos partes se
pisan, y dos partes que afirman cosas incompatibles sobre lo mismo no se
pueden certificar por separado y juntas.

**b) El plan declara sus dimensiones antes de existir.** La **matriz**: las
partes, la afirmación de cada una y el tamaño proyectado. Se calcula en el
pipeline que genera la spec, no en un paso aparte que alguien pueda saltarse.

**c) Lo declarado se mide después.** Cuando el artefacto llega, su tamaño
medido se compara con el proyectado, y si la diferencia sale de la banda, la
estimación estaba mala. Una estimación que nunca se comprueba es una cifra
inventada con otro nombre.

## Lo que esta regla NO hace

- **No sube el tope.** Un artefacto grande se parte por concepto, no se
  juzga entero porque el juez pueda.
- **No promete lo que el juez no ve.** La coherencia entre partes es de las
  otras capas: pruebas de propiedad, mutación y lectura.
- **No cambia el resultado de una parte.** Si una parte no se sostiene, el
  agregado no pasa, por muchas partes que tengan.

## Qué se midió para escribirla

| Dato | Medido |
|---|---|
| Un artefacto de 5067 B | `aligned`, confianza 1.000, `artifact_truncated: false`, 45,8 s |
| El SpecIntent decide el veredicto | 5 intentos, mismo sha del artefacto: 5 alinearon con una sola afirmación, 2 neutraron con enumeraciones |
| La degradación del juez | rate limit del proveedor → `needs_human` con confianza 0 y **sin proveedor**: no es veredicto, es infraestructura |
| El falso positivo del juez | rows 482/1985/2013/2016/2017, sobrescritos por el operador dos veces |
| El chunking lo hace el proveedor | `num_chunks`, `chunked_size` y `requested_n` vienen del proveedor, no del MCP |
