# La matriz de las specs

> Generado por el pipeline. Una fila por parte: que afirma, cuanto
> mide y de donde sale ese numero. El tope de 4096 B por artefacto
> juzgable es regla del framework, no de esta tabla.

## L0 · Fundacion: los contratos

| Parte | Clase | Afirmación | Bytes | De dónde |
|---|---|---|---|---|
| L0-avances | avances | Cada herramienta declara que produce y si puede dar el mismo resultado dos veces. Antes de ejecutarla, el sistema ya sabe que esperar de ella. | 828 | medido |
| L0-cierre | cierre | Un agujero en el sellado del contexto que 83 tests no veian. Lo encontro el verificador automatico, no nosotros: el sellado miraba solo la superficie, y un objeto anidado mutable se escapaba entero. Cerrado con WeakSet y sellado profundo, con 5 tests y 9 mutantes nuevos. | 4047 | medido |

Total: 4875 B · 2 medidos · 0 proyectados.

## L1 · Runtime: la caja de cada herramienta

| Parte | Clase | Afirmación | Bytes | De dónde |
|---|---|---|---|---|
| L1-avances | avances | Cada herramienta vive en una caja: solo puede hacer lo que su caja le concede, y se comprueba antes de dejarla correr. Si intenta salirse, la ejecucion falla aunque la herramienta hubiera funcionado. | 1015 | medido |
| L1-cierre | cierre | El constructor de WASM escribia un byte de mas. Y un test estaba mal planteado: tomaba env.memory por el disco, y no lo es. | 3392 | medido |

Total: 4407 B · 2 medidos · 0 proyectados.

## L2 · Composicion: encadenar sin equivocarse

| Parte | Clase | Afirmación | Bytes | De dónde |
|---|---|---|---|---|
| L2-avances | avances | Puedes encadenar herramientas y el orden nunca se equivoca. Si dos se necesitan entre si, el sistema te dice cuales son, en vez de fallar en silencio. | 1178 | medido |
| L2-cierre | cierre | El error que veias no era el error: el orden de las comprobaciones hacia que un ciclo se reportara como «este sumidero no es terminal», cuando el problema real era un ciclo. Y el cierre anterior habia dejado un archivo 53 bytes por encima del limite, mientras el numero que lo reportaba decia que todo estaba bien. Se tapo recortando la prosa en vez de partir el archivo por donde tenia una sola responsabilidad. | 2619 | medido |

Total: 3797 B · 2 medidos · 0 proyectados.

## L3 · Boundary MEMORY: la memoria es tuya y de nadie mas

| Parte | Clase | Afirmación | Bytes | De dónde |
|---|---|---|---|---|
| L3-avances | avances | La memoria paso a ser tuya y de nadie mas. Las herramientas que instales en tu proyecto no pueden leerla ni reescribirla, y queda registrado quien pidio que y para que. | 1180 | medido |
| L3-cierre | cierre | La spec decia que el contexto nunca cruza identidades, y el nombre publico del dueno es un cruce deliberado y ya decidido. Una spec que dice «nunca» mientras el producto cruza enseña al implementador que la spec miente. Y el flag antifraude que no se puede impugnar es un conflicto real con el derecho de rectificacion, sin solucion de ingenieria. | 1951 | medido |

Total: 3131 B · 2 medidos · 0 proyectados.

## L4 · Identidad: las tres identidades y la puerta que las comprueba

| Parte | Clase | Afirmación | Bytes | De dónde |
|---|---|---|---|---|
| L4-avances | avances | La identidad son tres tipos que no se cruzan, y la legal puede llevar su verificacion real: el documento leido, el rostro cotejado y el screening. Y ya se puede decidir quien accede a que: una puerta que concede por categoria, con la psicometria aparte, y un paquete que se instala sin conceder nada. | 1492 | medido |
| L4-cierre | cierre | El deny by default tenia DOS defensas: la rama que pregunta «concedido?» y la categoria `none` que no inyecta nada. Cada una tapaba a la otra, y dos defensas del mismo invariante no se miden, se tapan. La solucion fue de codigo y no de tests: uniones discriminadas, y una categoria que no concede falla fuerte en vez de devolver un vacio. | 3049 | medido |

Total: 4541 B · 2 medidos · 0 proyectados.

## L5 · Judge pipeline: publicar con confianza, y medir lo que cuesta

| Parte | Clase | Afirmación | Bytes | De dónde |
|---|---|---|---|---|
| L5-avances | avances | Publicar con confianza: cada artefacto se parte por concepto, cada parte se juzga con su propia afirmacion, y el pipeline decide publicar, corregir o parar con la accion para el operador. El coste de cada publicacion queda medido en llamadas, bytes y latencia maxima. | 1446 | medido |
| L5-cierre | cierre | La misma afirmacion para todas las partes produce deriva falsa: tres documentos correctos salieron drift_detected por juzgar cada fragmento contra el intent del documento entero. Una parte, una afirmacion. Y dos defensas del mismo invariante se tapan: la mutacion destapo dos ramas redundantes, en el ambito y en el empate. | 4087 | medido |

Total: 5533 B · 2 medidos · 0 proyectados.
