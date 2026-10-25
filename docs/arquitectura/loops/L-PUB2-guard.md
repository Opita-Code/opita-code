# L-PUB2 · El guard que no miraba la raíz

> Parte 3 de 3. [Archivos](L-PUB2-archivos.md) · [Comunidad](L-PUB2-comunidad.md) · [Índice](INDICE-publico.md)
> Spec 550. Tareas P1 a P5.

## 6. EL GUARD QUE YA NO SE QUEDA EN MIRANDO LO DE ARRIBA

Al escribir estos archivos aparecieron **cinco caracteres de otro sistema de
escritura dentro de dos palabras**: tres árabes en `CODE_OF_CONDUCT.md` y dos
en `SECURITY.md`. Los había escrito yo.

El content-guard caza la intrusión de guión, pero **no miraba los archivos de
la raíz**: la cobertura era `docs/` y `vibe-tools/src/`. Es decir, el guard
tenía un hueco justo donde estaba la superficie pública.

Corregido: ahora cubre la raíz, el sitio y `estado.json`. Y se **probó**:
se metió una intrusión de propósito en `SECURITY.md` y el guard la vio.
