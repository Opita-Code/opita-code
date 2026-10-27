# L4-T2 · Las piezas libres, medidas

> Parte 5 de L4. [La matriz](L4-T2-matriz.md) · [La decisión](L4-T2-decision.md) ·
> [El índice de L4](INDICE.md)

## Las piezas, medidas

| Pieza | Licencia | Actividad | Qué resuelve |
|---|---|---|---|
| `zxing-cpp` | Apache-2.0 | 2069 estrellas, 2026-10-06 | PDF417, DataMatrix, QR, Aztec |
| `colombian-cedula-reader` | MIT | 53 estrellas, 2024-02-29 | lee el PDF417 de la cédula colombiana |
| `PaddleOCR` | Apache-2.0 | 91706 estrellas, 2026-09-16 | OCR de documento |
| `docTR` | Apache-2.0 | 6395 estrellas, 2026-10-26 | OCR de documento |
| `Tesseract` | Apache-2.0 | 77170 estrellas, 2026-10-24 | OCR de documento |
| `Silent-Face-Anti-Spoofing` | Apache-2.0 | 1837 estrellas, 2023-10-03 | liveness |
| `insightface` | MIT en el README | 30053 estrellas, 2026-10-19 | detección, cotejo y liveness RGB |
| `deepface` | MIT | 23606 estrellas, 2026-10-24 | cotejo |
| `face_recognition` con dlib | MIT y Boost | 56855 estrellas, 2026-06-25 | cotejo |
| `onnxruntime` | MIT | 22175 estrellas, 2026-10-26 | inferencia en CPU |
| `opensanctions` | MIT | 855 estrellas, 2026-10-26 | screening internacional |

Licencias, estrellas y fechas están medidas contra la API de GitHub el
2026-10-26, no de memoria.

## Las dos licencias que hay que leer enteras

`insightface` no trae archivo de licencia, y por eso GitHub no marca ninguna,
pero su README dice que el código es MIT y que **los modelos y los datos de
entrenamiento son solo para investigación no comercial**; desde el 2025-11-24
pide además contacto para licenciar el paquete de modelos abierto.

`face_recognition` usa dlib, cuyo código es Boost Software License. De los
motores de cotejo con nombre propio, el que vive es el fork: el repositorio
original no tiene una subida desde el 2021-07-11, y el fork sí, con 23606
estrellas.

## Lo que el liveness declara

`Silent-Face-Anti-Spoofing` es Apache-2.0 y trae dos modelos: el abierto, de 84
millones de parámetros, 20 ms, TPR 97.8% y FPR 1e-5; y el de alta precisión, de
162 millones, 40 ms y TPR 99.7%, que **no es de código abierto**. Son cifras
del proyecto, no una medición nuestra: no las medimos. La velocidad, de 20 ms
en un teléfono, es lo que hace que el liveness quepa en CPU.

## El screening: dos fuentes y un hueco

| Fuente | Qué da | Licencia |
|---|---|---|
| `opensanctions` | listas internacionales, PEP incluidos | MIT en el código; los datos tienen licencia propia |
| datos abiertos del Estado | PEP de la función pública (SIGEP) | CC BY-SA 4.0, oficial |

El catálogo nacional de datos abiertos se buscó por «condenadas» y por «UIF», y
**no tiene la lista de personas condenadas de la UIF**: no aparece en el
catálogo. El screening interno sí está, con su número de documento.

## Y lo que cabe en serverless

Medido en la documentación de AWS Lambda: imagen de contenedor de hasta 10 GB
descomprimida, 15 minutos de tiempo, 10.240 MB de memoria, 1.769 MB equivalen
a una vCPU, y MicroVM en arm64. No hay acelerador en la lista de cuotas. El
liveness abierto son 20 ms en un teléfono, así que en CPU cabe; el OCR pesado
de PaddleOCR es el que empuja la imagen hacia el tope, y por eso hay dos
alternativas más ligeras en la tabla.
