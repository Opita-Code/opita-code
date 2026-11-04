# Opita Code

> Opita Code — vibe-studio runtime, arquitectura y cumplimiento

<!-- GENERADO:vision -->
**Opita Code es el lugar donde tu memoria te pertenece.**

La memoria de una persona —su contexto, sus herramientas, lo que ha aprendido de ella— suele vivir en el sitio equivocado: en una sesion que se cierra, en una cuenta que no es suya, o en un perfil que la reduce a un segmento. Opita Code da a cada persona una memoria propia, fiel e incorruptible, que viaja con ella y que sus herramientas pueden usar sin que nadie mas la toque.

Legal, profesional y anonima: las tres son tuyas, y ninguna se mezcla con las otras.

Y no hace falta saber programar para tenerla.
<!-- /GENERADO:vision -->

## Como esta construido

El runtime de **vibe-tools**: un sistema donde las herramientas se componen entre si,
y donde la memoria se inyecta como contexto y nunca se lee desde una herramienta.

El repositorio esta organizado por loops. Cada loop cierra una pregunta concreta y
deja sus decisiones escritas, con la razon y el numero que las sostiene. La
documentacion esta en `docs/`, dividida por preocupacion: un documento que mezcla varias
deja de ser juzgable de forma estable.

Todo lo numerico de este repositorio se verifica. Los tests pasan, los mutantes
mueren, y un verificador automatico lee cada documento contra el criterio con el
que fue escrito y dice si el documento cumple.

<!-- GENERADO:estado -->
### Ahora

**L7 · Reputacion: el ciclo completo.** En curso: L7-T1 (sello de calidad: publicar, sello del juez, insignia visible). Depende de L6-T1, que ya esta hecho.

### La evidencia, medida

| Medida | Resultado |
| --- | --- |
| Tests | 563 de 563 |
| Mutantes | 312 de 312 (100%, 60 paquetes) |
| Unidades juzgables | 210, 0 exceden los 4096 B |
| Veredicto del juez | 34 documentos de L4-T5 y L4-T6 mas los 6 de L5 y los 6 de L6, con veredicto aligned vigente sobre el sha de hoy: confianza 0.93 a 1.00 (nli_label entailment, provider judge-minimax). Los transversales que L5 y L6 tocaron tambien se juzgaron (INDICE.md en ambos, con 6 partes y luego 2, 0.98 en las dos veces) pero no se suman al conteo para no duplicar. El registro de los loops anteriores vive en el store donde se cerraron, que esta maquina no tiene, y la CI no re-verifica ninguno de los dos. |

### Los documentos

| Loop | Que entrega |
| --- | --- |
| L0 | Fundacion: los contratos |
| L1 | Runtime: la caja de cada herramienta |
| L2 | Composicion: encadenar sin equivocarse |
| L3 | Boundary MEMORY: la memoria es tuya y de nadie mas |
| L4 | Identidad: las tres identidades y la puerta que las comprueba |
| L5 | Judge pipeline: publicar con confianza, y medir lo que cuesta |
| L6 | Marketplace: donde se publica, y el pin de las tres propias |

### Donde mirar

- [El ahora, con fecha](https://opita-code.github.io/opita-code/now.html)
- [El sitio: el estado completo, con la evidencia medida](https://opita-code.github.io/opita-code/)
- [El registro en lenguaje llano, ronda por ronda](docs/avances.md)
- [Los documentos tecnicos, uno por preocupacion](docs/arquitectura/loops/INDICE.md)
- [La superficie publica y los documentos transversales](docs/arquitectura/loops/INDICE-publico.md)
- [El inventario de datos, con el estado real de lo que se cumple](docs/legal/cumplimiento-aislamiento-datos-v1.md)
- [El paquete de runtime: estructura y comandos](vibe-tools/README.md)
- [Como contribuir, y que partes del proyecto todavia no estan listas](CONTRIBUTING.md)
- [Como reportar un problema de seguridad, en silencio](SECURITY.md)
- [La licencia, y por que no es «open source»](docs/licencia.md)
<!-- /GENERADO:estado -->

## Como se verifica

```bash
cd vibe-tools
npm install
npm run check              # contenido, presupuesto, tests y mutacion
npm run verificar-estado   # el estado publicado, contrastado contra la realidad
```

`npm run verificar-estado` es el guard que hace que esta pagina no pueda
envejecer en silencio: mide lo que el repositorio afirma de si mismo y cae si
un numero no cuadra. Por eso el estado que se publica arriba no se escribe a
mano.

El detalle, que es lo que de verdad no esta escrito a mano:
[docs/como-verificar.md](docs/como-verificar.md).

## Licencia

**PolyForm Noncommercial 1.0.0.** Ver [LICENSE](LICENSE).

El codigo se puede leer, estudiar, modificar y compartir: cualquiera lo usa y
cualquiera pide cambios. Lo que no permite es el uso comercial.

Una distincion que conviene no saltarse: **no esta aprobada por la OSI**, y
por eso este repositorio no se autodenomina «open source». El porque, con las
palabras de la OSI, y la alternativa mas estrecha, estan en
[docs/licencia.md](docs/licencia.md).
