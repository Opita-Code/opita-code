# L0 · Composición: las 11 reglas

> Parte 2 de 4 de L0. Contratos: [L0-contratos.md](L0-contratos.md) · Verificación: [L0-verificacion.md](L0-verificacion.md) · Hallazgos: [L0-hallazgos.md](L0-hallazgos.md)
> Commit `0639b69`. Tarea L0-T3.

## Orden fijo

Once reglas. **El orden importa**: el primer rechazo es el veredicto, y un orden fijo es lo que hace la función determinista y por tanto testeable.

El orden vive en `graph.ts`, el orquestador, y en ningún otro sitio. Cada regla está en su propio archivo bajo `rules/`, así que agregar una en L5 es agregar un archivo y una línea, no editar una función de 200 líneas.

| Regla | Qué | Código de rechazo |
|---|---|---|
| R0 | ids y nombres de puerto sin `:` | `E_BAD_REF` |
| R1 | no puede haber dos nodos con el mismo id | `E_DUPLICATE_NODE` |
| R11 | el tier declarado admite el efecto | `E_TIER_EFFECT` |
| R2 | los dos extremos de la arista existen | `E_DANGLING_NODE` |
| R3 | el puerto de salida y el de entrada existen | `E_PORT_NOT_FOUND` |
| R4 | **el eje 1 coincide puerto a puerto** | `E_AXIS_MISMATCH` |
| R5 | determinista exige entradas deterministas | `E_NONDETERMINISTIC_INPUT` |
| R6 | **un artifact no alimenta otro nodo** | `E_ARTIFACT_NOT_TERMINAL` |
| R7 | todo sink existe y es terminal | `E_SINK_NOT_FOUND` / `E_SINK_NOT_TERMINAL` |
| R8 | toda salida terminal está declarada como sink | `E_UNDECLARED_SINK` |
| R9 | el módulo entrega al menos un artifact | `E_NO_ARTIFACT` |

---

## Tres que merecen explicación

**R4** es la regla que hace que el type system sea un type system. `code` no conecta a un puerto `text`. Si conectara, el error se descubre ejecutando — tarde y caro.

**R5** protege la promesa de determinismo. Una herramienta `deterministic` que consume de una `stochastic` no es determinista: es una mentira. El validador la rechaza en composición, no en runtime. La dirección inversa sí se permite: lo estocástico puede consumir lo determinista.

**R6 + R9** son el contrato canónico entero: *el código compone, los artifacts terminan*. R6 impide que un artifact se siga composing. R9 impide que exista un módulo que no entrega nada a un humano — es un segmento suelto, no un módulo.

---

## El veredicto

Una **unión discriminada**, nunca una excepción ni un string suelto:

- `ok:true` con el plan compilado — módulo, integridad sha256, orden de ejecución, `checksRun`.
- `ok:false` con `code` del union `REJECT_CODES`, `detail` no vacío, `at` y `checksRun`.

El primer rechazo gana, y `detail` lleva el prefijo de la regla (`R4: code no conecta a text`) para que el rechazo diga **en qué regla** cayó.

`checksRun` hace **observable el rigor del verificador**: un módulo validado con 4 comprobaciones y otro con 40 se distinguen a simple vista, sin leer el código.

---

## Invariantes que el fuzz comprueba

Sobre 6 semillas y módulos generados al azar, todo módulo **aceptado** cumple:

- ningún puerto `artifact` tiene arista saliente (R6)
- toda salida sin arista saliente está declarada como sink (R8)
- hay al menos un artifact entregado (R9)
- cada herramienta respeta su tier y su efecto (R11)
- el veredicto es idéntico con las claves en otro orden de inserción (pureza)

Y sobre todo módulo rechazado: el código pertenece a `REJECT_CODES`, el detalle no está vacío, y `validate` **no lanza excepciones** — el fuzz falla el test si alguna vez lo hace.