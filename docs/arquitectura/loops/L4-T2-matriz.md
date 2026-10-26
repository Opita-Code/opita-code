# L4-T2 · La matriz: cinco señales y quién puede probarlas

> Parte 4 de L4. [Las piezas](L4-T2-piezas.md) · [La decisión](L4-T2-decision.md) ·
> [Las tres identidades](L4-identidades.md) · [El índice de L4](INDICE-L4.md) ·
> [El plan](../plan-iteracion-mvp.md)

## Lo que cierra

L4-T2 es investigación, y el plan le pone un KPI único: **un stack de código
abierto viable en Colombia, o la decisión documentada de por qué no**. La
pregunta era si el KYC real se podía armar con piezas libres, sin contratar a
nadie y sin depender del Estado.

La respuesta medida: **cuatro de las cinco señales tienen dueño libre**, y la
quinta no. La que no es la del registro oficial: el acceso a las bases de la
Registraduría es un trámite con la entidad, y en el mercado lo envuelven dos
APIs de pago.

## Las cinco señales

| Señal | Qué prueba de verdad | Veredicto |
|---|---|---|
| Documento | Que el documento se lee y que sus datos son legibles | viable |
| Liveness | Que quien lo presenta está vivo y no es una foto | viable con reserva |
| Cotejo | Que el rostro del documento es el rostro de quien lo presenta | viable con reserva |
| Screening | Que no está en una lista de personas condenadas o expuestas políticamente | viable |
| Registral | Que la cédula existe en el registro oficial y es de esa persona | **no es libre** |

Reserva significa una cosa concreta: el modelo de liveness abierto no es el
mejor, y los pesos de cotejo no sirven para uso comercial. Las piezas están
en [su propio documento](L4-T2-piezas.md), con la licencia y la fecha de cada
una.

## Las dos costuras

**La registral.** La Registraduría tiene una página de «Acceso a bases de
datos», que es un acceso con la entidad, no una API. En el mercado hay dos
envoltorios de pago que validan la cédula contra el registro oficial. No hay
código abierto que lo reemplace.

**Los pesos de cotejo.** El único motor de rostro con licencia de código
limpia que se midió es el de InsightFace, y sus pesos son de investigación no
comercial. Como el repositorio es PolyForm Noncommercial, ese uso es compatible
hoy; si el producto se vuelve comercial, hay que cambiar de modelo o negociar
licencia.

## Y el resto de las señales, en una línea cada una

- **Documento:** se lee con un lector de código PDF417 y dos bibliotecas de OCR
  libres. Sin costura.
- **Liveness:** hay un modelo abierto que funciona en CPU. Con reserva: el
  modelo de alta precisión del mismo proyecto no es libre.
- **Cotejo:** hay motores libres y maduros. Con reserva: la licencia de los
  pesos.
- **Screening:** hay dos fuentes libres, una internacional y otra oficial
  colombiana. Con un hueco: la lista de personas condenadas de la UIF no está
  en el catálogo de datos abiertos.
