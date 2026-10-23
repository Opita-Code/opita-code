# L2 · Tools base y el harness

> Parte 4 de 15. [Orden](L2-orden.md) · [Módulo](L2-modulo.md) · [Compartir](L2-compartir.md) · [Harness](L2-harness.md) · [Canónico](L2-canonico.md) · [Verificación](L2-verificacion.md) · [Aritmética](L2-aritmetica.md) · [Mutación](L2-mutacion.md) · [Presupuesto](L2-presupuesto.md) · [Hallazgo runner](L2-hallazgo-runner.md) · [Hallazgos](L2-hallazgos.md) · [Desviaciones](L2-desviaciones.md) · [Gate](L2-gate.md) · [Cierre](L2-cierre.md)
> Spec 537. Tareas L2-S3, L2-S4, L2-S5.

---

# Las cuatro tools

| Tool | Tier | Efecto | Determinismo | Entrega |
|---|---|---|---|---|
| `EXEC` | T0 | ninguno | determinista | `text` |
| `RENDER` | T0 | ninguno | determinista | `image` (SVG) |
| `DRAFT` | T0 | ninguno | estocástica | `text` |
| `RESEARCH` | T1 | `read` | estocástica | `text` |

## `EXEC` no es un intérprete de Python

El plan de MVP pedía *«python puro»*. Un intérprete necesita un runtime real, y
Pyodide es T1, que L1 dejó sin transporte. Poner algo que solo suma y resta y
llamarlo Python habría sido peor que decir lo que hace.

Evalúa una expresión infija de números con `+ - * /`, paréntesis y menos unario,
por análisis descendente por precedencia.

**No redondea.** `0.1 + 0.2` da `0.30000000000000004`, el valor exacto que
IEEE754 representa. Redondear sería meter una decisión dentro de lo que se afirma
que es una función pura.

## `RENDER` produce SVG, y eso no es un atajo

SVG es un formato de imagen de verdad, de texto, y por lo tanto determinista. La
alternativa habría sido afirmar que produce `image` y devolver algo que no es una
imagen: el modo de falla más caro, porque un descriptor que miente sobrevive si
nadie mira el valor.

**El escapado es la frontera, no robustez de presentación.** El valor viene de
una expresión que escribió el autor, así que puede contener `<`, `&` o `"`.
Pegado tal cual en el texto del SVG rompe el documento: el artifact deja de ser
una imagen y pasa a ser markup inyectado desde una tool que el sandbox consideró
inocua.

Y **el `&` se escapa primero**. Si se reemplazara después de `<`, un `<` ya
convertido en `&lt;` tendría su `&` convertido en `&amp;lt;`, y un texto legítimo
se corrompería. Hay un mutante que invierte ese orden.

## `RESEARCH` no se puede ejecutar, y el módulo lo dice

T1 concede `net`, así que el sandbox **no le va a negar nada**: le va a devolver
`unimplemented`, que es el otro motivo de fallo y no el mismo.

| `denied` | el sandbox no concede la capacidad | el sandbox funciona |
|---|---|---|
| `unimplemented` | el sandbox concede, no hay transporte | **nadie probó** |

Confundirlos haría creer que la seguridad está probada cuando lo que falta es el
cable. Por eso `RESEARCH` **propaga** la respuesta del puerto en vez de inventar
un resultado: si le llega `unimplemented`, ella falla con `unimplemented`.

> Una tool que ante un fallo devuelve algo plausible convierte un hueco de
> infraestructura en un artifact que parece bueno. El autor vería notas de
> investigación y no sabría que no hubo ninguna.

El endpoint es una **constante**, no el input del usuario. Un fetch cuya URL arma
el usuario es un SSRF esperando que alguien lo pruebe.

---
