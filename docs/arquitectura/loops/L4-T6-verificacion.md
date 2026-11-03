# L4-T6 · El paquete, medido

> Qué se comprobó del `.opitapack`, y qué no se comprobó.
> [El paquete](L4-T6-paquete.md) · [La instalación](L4-T6-instalar.md)

## LA MEDICIÓN, CONTRA QUÉ

El runtime de `vibe-tools`, en la máquina del operador: Node 24, sin Docker. La
puerta del paquete se midió con **tests** (cada comportamiento, con su nombre)
y con **mutación** (cada invariante, con un mutante escrito a mano que rompe
exactamente esa regla).

| Medida | Resultado |
|---|---|
| Tests de L4-T6 | **28**, todos en verde |
| Mutantes de L4-T6 | **19**, los 19 muertos |
| Paquetes nuevos | `src/paquete/{formato,exportar,instalar}.js` al 100% |
| Total del repositorio | 426 tests · 242 de 242 mutantes en 45 paquetes |

## LO QUE DEMUESTRA CADA PRUEBA

| Comportamiento | Qué se rompe si el paquete deja de mirarlo |
|---|---|
| Los cuatro campos del formato | Que el paquete deje de ser un paquete |
| El paquete no repite nombre, versión ni autor | Que haya dos fuentes de verdad para el mismo dato |
| Un campo que el formato no define no se instala | Que un paquete con `concede_permisos: true` pase |
| Un campo que falta no se instala | Que un paquete a medio construir se instale |
| Un formato ajeno no se lee | Que se lea un formato que no es el de este runtime |
| Una versión de formato ajena no se lee | Que se apliquen reglas que no son las del formato |
| Un texto que no es JSON no se lee | Que un fichero cualquiera se instale |
| Exportar es determinista | Que la huella dependa del momento de exportar |
| El texto es el canónico | Que la huella dependa de quién serializó |
| La huella es la del módulo | Que un paquete alterado se instale |
| Un módulo inválido no se instala | Que un grafo roto se ejecute |
| Instalar no concede | El deny by default, y el caso E6 del boundary |
| Las peticiones se derivan | Que el paquete lleve una segunda copia de los permisos |

## LOS MUTANTES, Y POR QUÉ ESTÁN ESCRITOS A MANO

El runner no genera mutantes: cada uno es una sustitución literal elegida para
romper **una** regla. Por eso un mutante que sobrevive no es ruido, es un hueco.

**Y TRES SOBREVIVIERON, Y NO ERA RUIDO.** La primera corrida dejó tres vivos en
`formato.js`, y eran dos cosas distintas:

- **Dos huecos de prueba.** No había ningún test que metiera una huella que no
  fuera una cadena, ni un módulo que no fuera un módulo. Los mutantes no
  sobrevivían porque fueran equivalentes: **no había nada que los activara**.
  Un mutante que nadie dispara no mide nada.
- **Una comprobación tapada por otra.** El campo que falta lo cazaban dos
  comprobaciones: la del bucle de campos y la del campo concreto. La prueba
  quitaba solo `huella`, y esa la cazaba la segunda. Con la prueba por cada
  campo, la primera comprobación queda medida.

Es la misma lección de L4-T5, escrita al revés: **dos defensas del mismo
invariante no se miden, se tapan.** La diferencia es que aquí no hizo falta
cambiar el código: bastaba con medir el invariante entero.

## LO QUE NO SE COMPROBÓ

- **El companion.** Los datos del titular los exporta dark-memory, que es
  quien los tiene. Aquí no hay memoria, y por eso el paquete no lleva ese
  hueco: el derecho del art. 8 lo cumple quien tiene los datos.
- **El código de las tools.** El paquete lleva la promesa; la magia se resuelve
  por (id, version) en el registry, y eso ya estaba de L0.
- **Un paquete real de otro sitio.** Aquí el módulo se arma en memoria y se
  serializa; no se leyó un `.opitapack` de un fichero ajeno. La verificación
  de la huella está probada contra un paquete alterado, que es el caso
  interesante.
- **El registro del juez de los loops anteriores.** Vive en el store donde se
  cerraron, que esta máquina no tiene.
- **La instalación en otro runtime.** El texto canónico es portable por
  construcción, pero no se midió en WASM, en Lambda ni en una microVM.
