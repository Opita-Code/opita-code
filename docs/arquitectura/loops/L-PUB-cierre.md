# L-PUB · Cierre

> Parte 1 de 2. [Correcciones](L-PUB-correcciones.md) · [Errores](L-PUB-errores.md) · [Abiertos](L-PUB-abiertos.md) · [Indice](INDICE-publico.md)
> Spec 540. Tareas P1 a P7.

Lo que este loop deja atras y lo que entrega al siguiente.

> **El veredicto del gate sobre este documento no se afirma aqui.** Un documento
> que afirma su propio veredicto no es juzgable de forma estable: la
> afirmacion se convierte en su propia evidencia. El registro autoritativo esta
> en `dark_memory_judgment_history`, en el proyecto `opita-code`.


## QUE ENTREGA

Una superficie publica que **no se puede envejecer en silencio**.

- `vibe-tools/estado.json` es la fuente unica de verdad. Todo lo que el mundo ve
  fuera del repo sale de ahi.
- `vibe-tools/scripts/generar-estado.mjs` la materializa: `STATUS.md`,
  `docs/avances.md`, un archivo por loop en `docs/avances/`, las islas
  generadas del `README.md` y las notas de release en tres capas.
- `vibe-tools/scripts/verificar-estado.mjs` es el guard: mide la realidad y la
  contrasta contra lo declarado. Si un numero no cuadra, sale con error.
- `README.md` en la raiz: la puerta que no existia.
- Tres workflows: `ci.yml` verifica, `estado.yml` regenera la superficie en cada
  push a main, `release.yml` deja el release como **borrador** para que el
  operador lo publique con un clic.
- Las correcciones de verdad: la puerta, las tres mentiras del README del
  paquete, la afirmacion falsa sobre el juez, y las cuatro rutas absolutas con
  el nombre del usuario dentro.

## LO QUE SE MIDIO

| Medida | Resultado |
|---|---|
| Tests | 263 de 263, 0 fallos |
| Reparto por prefijo | L0 77, P 10, L1 77, L2 99 |
| Mutantes | 142 de 142, 100% en 28 paquetes, umbral 80% |
| Unidades juzgables | 93, y 0 exceden los 4096 B |
| Guards de contenido | 8 clases probadas contra defectos deliberados |

El numero de unidades subio de 77 a 93 porque la superficie publica **entro en
el gate**: el README, el STATUS, el indice de avances, los cuatro avances por
loop, el documento de verificacion, los cuatro documentos de esta unidad, el
indice de la superficie, y los tres workflows. Una puerta que no se mide es una
puerta que puede mentir, que es justo lo que paso con el README del paquete.

Lo que **no** se movio, y lo que sigue abierto y sigue siendo del operador, esta
en [abiertos](L-PUB-abiertos.md).

## LA REGLA QUE ESTE LOOP DEJA ADOPTADA

**Lo que se publica no se escribe a mano; se deriva, y se contrasta con la
realidad.** La pagina que se publica arriba no la escribio nadie: la genero un
programa desde una fuente, y un guard la comparo con lo que el repositorio
realmente es. Cuando los dos no coinciden, la tuberia se cae.

Es la misma regla que el guard y el juez tienen que medir lo mismo, aplicada un
nivel mas arriba: el guard caza el numero, el juez caza la deriva, y el
verificador de estado caza que lo publicado deje de ser cierto.
