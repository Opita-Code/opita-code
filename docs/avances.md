# Avances

> El registro en lenguaje llano: que se puede hacer ahora que antes no se podia, que se
> volvio mas seguro, y **lo que nos equivocamos en esta ronda**.
> Generado desde `vibe-tools/estado.json`. Actualizado el 2026-11-04.

## De un vistazo

| Loop | Que se puede hacer ahora que antes no se podia |
| --- | --- |
| L0 | Cada herramienta declara que produce y si puede dar el mismo resultado dos veces. Antes de ejecutarla, el sistema ya sabe que esperar de ella. |
| L1 | Cada herramienta vive en una caja: solo puede hacer lo que su caja le concede, y se comprueba antes de dejarla correr. Si intenta salirse, la ejecucion falla aunque la herramienta hubiera funcionado. |
| L2 | Puedes encadenar herramientas y el orden nunca se equivoca. Si dos se necesitan entre si, el sistema te dice cuales son, en vez de fallar en silencio. |
| L3 | La memoria paso a ser tuya y de nadie mas. Las herramientas que instales en tu proyecto no pueden leerla ni reescribirla, y queda registrado quien pidio que y para que. |
| L4 | La identidad son tres tipos que no se cruzan, y la legal puede llevar su verificacion real: el documento leido, el rostro cotejado y el screening. Y ya se puede decidir quien accede a que: una puerta que concede por categoria, con la psicometria aparte, y un paquete que se instala sin conceder nada. |
| L5 | Publicar con confianza: cada artefacto se parte por concepto, cada parte se juzga con su propia afirmacion, y el pipeline decide publicar, corregir o parar con la accion para el operador. El coste de cada publicacion queda medido en llamadas, bytes y latencia maxima. |
| L6 | Publicar un modulo o una tool atomica: crear, validar, aceptar la licencia de distribucion y publicar. Y encontrarlos: las tres propias de primero, los terceros debajo con el distintivo de mutacion o receta. |

## Ronda por ronda

- [L6 · Marketplace: donde se publica, y el pin de las tres propias](avances/L6.md)
- [L5 · Judge pipeline: publicar con confianza, y medir lo que cuesta](avances/L5.md)
- [L4 · Identidad: las tres identidades y la puerta que las comprueba](avances/L4.md)
- [L3 · Boundary MEMORY: la memoria es tuya y de nadie mas](avances/L3.md)
- [L2 · Composicion: encadenar sin equivocarse](avances/L2.md)
- [L1 · Runtime: la caja de cada herramienta](avances/L1.md)
- [L0 · Fundacion: los contratos](avances/L0.md)

El detalle tecnico de cada loop, con su razonamiento y sus hallazgos, esta en
[arquitectura/loops/INDICE.md](arquitectura/loops/INDICE.md). La superficie
publica y los documentos transversales, en
[arquitectura/loops/INDICE-publico.md](arquitectura/loops/INDICE-publico.md).
