# L6 · El cierre del loop: el marketplace y lo que todavía no se puede publicar

> [Publicar](L6-publicar.md) · [La licencia](L6-licencia.md) · [El pin](L6-pin.md) ·
> [El catálogo](L6-catalogo.md) · [La usabilidad](L6-usabilidad.md) ·
> [El índice](INDICE.md)

## QUÉ ES

L6 cierra el mecanismo del ciclo: por fin hay **dónde publicar**. Antes el
runtime sabía encadenar, compartir, empaquetar y juzgar; lo que no existía era
la puerta que convierte el trabajo de alguien en algo que otra persona puede
usar.

El loop tiene cinco tareas y las cinco están hechas. Lo que queda no es de este
runtime, y se dice más abajo con su nombre.

## LAS CINCO TAREAS

| Tarea | Qué entrega | Dónde |
|---|---|---|
| L6-T1 | El flujo: crear → validar → licenciar → publicar, sin atajos | `src/marketplace/{entrada,manifiesto,validar,publicar}.ts` |
| L6-T2 | La licencia de distribución: no transfiere la propiedad | `src/marketplace/licencia.ts` |
| L6-T3 | El pin: las tres propias de primero, sin rotación | `src/marketplace/pin.ts` |
| L6-T4 | El catálogo y el distintivo mutación/receta | `src/marketplace/{catalogo,clase}.ts` |
| L6-T5 | Los dos niveles: módulos y tools atómicas | `src/marketplace/niveles.ts` |

## LO MEDIDO

| Medida | Resultado |
|---|---|
| Tests | **563**, 563 en verde, 0 saltados (51 de L6) |
| Reparto por prefijo | L0 78 · L1 87 · L2 107 · L4 105 · L5 125 · **L6 51** · P 10 |
| Mutantes | **312/312 = 100 %** en 60 paquetes (umbral 80 %) |
| Unidades juzgables | **207**, ninguna sobre el tope de 4096 B |
| Propiedad del pin | 5 propiedades, 6 semillas, 200 rondas cada una |

La propiedad del pin no es un ejemplo: es lo que el plan pedía como
`property_check`, y protege tres cosas — que ningún tercero preceda a una
propia, que el bloque de las propias no rote al entrar terceros, y que el
listado sea exactamente lo publicado.

## LOS KPIs, UNO POR UNO

| KPI del plan | Estado |
|---|---|
| Pin verificado: las 3 propias en posición 1, 100 % de las veces | **Cumplido por el mecanismo**, con la propiedad medida. Las tres propias concretas están **sin nombrar**: es decisión del operador |
| `property_check`: 3 propias antes que cualquier tercero | **Cumplido**, medido |
| `drift_judge` sobre el diseño del marketplace | **Cumplido**: los seis documentos de L6, en `aligned` |
| Flujo de publicación sin fricción (persona) | **No cumplido**: no se ha medido. El instrumento está escrito en [L6-usabilidad](L6-usabilidad.md), y el recorrido lo tiene que hacer una persona |

El cuarto KPI no se da por bueno. Un agente que recorre su propio diseño no se
detiene en ninguna parte, y medir eso como «sin fricción» sería la forma más
barata de mentir.

## LO QUE QUEDA ABIERTO

- **Las tres propias, sin nombre.** El mecanismo está medido y funciona con
  cualquier conjunto de tres; los ids son del operador.
- **El texto legal de la licencia.** Las causales de suspensión, la apelación
  y el KYC vencido son un abierto de la arquitectura (§11, punto 7). El
  mecanismo está; el texto no.
- **El recorrido con una persona.** Con su instrumento escrito.
- **La lista blanca de backend está vacía a propósito.** Hoy no se publica un
  módulo con un nodo T2, y el rechazo dice qué tool falta por decidir. Nadie
  corre con backend hasta que la plataforma lo permita.

## LO QUE ESTA DECLARADO Y NO ES UN NÚMERO FALSO

El catálogo es una estructura **en memoria**, como el resto del runtime: no hay
persistencia, ni servidor, ni red. Lo que L6 entrega es la forma —el flujo, la
licencia, el pin, los niveles— y esa forma es lo que se mide.

Y el marketplace **no concede permisos**: publicar no concede nada, igual que
instalar no concede. El techo de cada tool lo declara su descriptor; el
permiso es otro acto, y de otro sitio.

## LO QUE NO HACE

- **No llama al juez.** Produce la solicitud y la entrega al pipeline de L5.
- **No decide el ámbito.** Lo saca L5 de la ruta del manifiesto.
- **No toca la base de datos.** La capa RLS queda intacta.
- **No es el sitio web.** Es el runtime del marketplace; `opitacode.com` es
  otra cosa, y no está aquí.
