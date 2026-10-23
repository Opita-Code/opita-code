# L-PUB2 · El guard que no miraba la raiz

> Parte 3 de 3. [Archivos](L-PUB2-archivos.md) · [Comunidad](L-PUB2-comunidad.md) · [Indice](INDICE-publico.md)
> Spec 550. Tareas P1 a P5.

## 6. EL GUARD QUE YA NO SE QUEDA EN MIRANDO LO DE ARRIBA

Al escribir estos archivos aparecieron **cinco caracteres de otro sistema de
escritura dentro de dos palabras**: tres arabes en `CODE_OF_CONDUCT.md` y dos
en `SECURITY.md`. Los habia escrito yo.

El content-guard caza la intrusion de guion, pero **no miraba los archivos de
la raiz**: la cobertura era `docs/` y `vibe-tools/src/`. Es decir, el guard
tenia un hueco justo donde estaba la superficie publica.

Corregido: ahora cubre la raiz, el sitio y `estado.json`. Y se **probó**:
se metio una intrusion de proposito en `SECURITY.md` y el guard la vio.
