# L-PUB · Cierre

> Parte 2 de 2. [Correcciones](L-PUB-correcciones.md) · [Índice](INDICE-publico.md)
> Spec 540. Tareas P1 a P7.

Lo que este loop deja atrás y lo que entrega al siguiente.

> **El veredicto del gate sobre este documento no se afirma aquí.** Un documento
> que afirma su propio veredicto no es juzgable de forma estable: la
> afirmación se convierte en su propia evidencia. El registro autoritativo está
> en `dark_memory_judgment_history`, en el proyecto `opita-code`.

## QUÉ ENTREGA

Una superficie pública que **no se puede envejecer en silencio**.

- `vibe-tools/estado.json` es la fuente única de verdad. Todo lo que el mundo ve
  fuera del repo sale de ahí.
- `vibe-tools/scripts/generar-estado.mjs` la materializa: `STATUS.md`,
  `docs/avances.md`, un archivo por loop en `docs/avances/`, las islas
  generadas del `README.md` y las notas de release en tres capas.
- `vibe-tools/scripts/verificar-estado.mjs` es el guard: mide la realidad y la
  contrasta contra lo declarado. Si un número no cuadra, sale con error.
- `README.md` en la raíz: la puerta que no existía.
- Tres workflows: `ci.yml` verifica, `estado.yml` regenera la superficie en cada
  push a main, `release.yml` deja el release como **borrador** para que el
  operador lo publique con un clic.
- Las correcciones de verdad: la puerta, las tres mentiras del README del
  paquete, la afirmación falsa sobre el juez, y las cuatro rutas absolutas con
  el nombre del usuario dentro.

## LO QUE SE MIDIÓ

| Medida | Resultado |
|---|---|
| Tests | 282 de 282, 0 fallos |
| Reparto por prefijo | L0 78, P 10, L1 87, L2 107 |
| Mutantes | 142 de 142, 100% en 28 paquetes, umbral 80% |
| Unidades juzgables | 93, y 0 exceden los 4096 B |
| Guards de contenido | 8 clases probadas contra defectos deliberados |

El número de unidades subió de 77 a 93 porque la superficie pública **entró en
el gate**: el README, el STATUS, el índice de avances, los cuatro avances por
loop, el documento de verificación, los cuatro documentos de esta unidad, el
índice de la superficie, y los tres workflows. Una puerta que no se mide es una
puerta que puede mentir, que es justo lo que pasó con el README del paquete.

Lo que **no** se movió, y lo que sigue abierto y sigue siendo del operador, está
en las dos secciones siguientes.

## LA REGLA QUE ESTE LOOP DEJA ADOPTADA

**Lo que se publica no se escribe a mano; se deriva, y se contrasta con la
realidad.** La página que se publica arriba no la escribió nadie: la género un
programa desde una fuente, y un guard la comparó con lo que el repositorio
realmente es. Cuando los dos no coinciden, la tubería se cae.

Es la misma regla que el guard y el juez tienen que medir lo mismo, aplicada un
nivel más arriba: el guard caza el número, el juez caza la deriva, y el
verificador de estado caza que lo publicado deje de ser cierto.

## LO QUE NO SE MOVIÓ

**El veredicto del juez no corre en CI.** El gate de drift vive en
`dark-memory-mcp`, que no es parte de este repositorio. Los cuatro guards que
sí corren en CI son locales y deterministas; el juez necesita el binario del
MCP y una credencial. Es un hueco real y declarado: hoy CI verifica el código,
no el texto.

**La imagen de social preview no se sube desde la API.** GitHub solo la acepta
por la interfaz web. El repositorio tiene hoy la autogenerada, que sale con el
nombre, la descripción, las estrellas y el lenguaje. Se puede mejorar sin
subir nada, tocando descripción y topics.

**La página estática no se construye.** El canal de distribución es una decisión
abierta del operador, y montar el contenedor antes de decidir el canal sería
decidir por él.

## LO QUE SIGUE ABIERTO, Y SIGUE SIENDO DEL OPERADOR

1. **La visión.** El para qué de Opita Code, a quien le duele y por qué se
   construye. No sale de los documentos: sale del operador. El README la
   declara como hueco, y el guard comprueba que el hueco no se pierda.
2. **El canal de distribución.** GitHub es el argumento, no el canal de la
   audiencia que no programa.
3. **La licencia.** Sin licencia, el default legal en un repo público es todos
   los derechos reservados.
4. Las tres decisiones de L3, que este loop no abre ni cierra: el eje por
   creencia, cuál se degrada entre anonimato y antifraude, y el sexto
   consentimiento con su techo de falsos positivos.

## Y LO QUE SE CERRÓ EN ESTA RONDA

**El documento legal de cumplimiento ya es público, con su estado real.** No
era una pregunta de secreto: está en el repositorio público desde el 2026-10-22
y dentro del release `v0.4.0`, y medido no tiene datos sensibles. Lo que tenía
era otro problema: describía el sistema deseado. El operador respondió que se
publique con el estado real de lo que el sistema cumple hoy de lo que el
documento exige. Está en [A4](decision-A4.md).
