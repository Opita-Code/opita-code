# Opita Code

> Opita Code — vibe-studio runtime, arquitectura y cumplimiento

<!-- GENERADO:vision -->
> **PENDIENTE DEL OPERADOR.** El para que de Opita Code, a quien le duele y por
> que se construye no esta escrito todavia. No se inventa: la superficie lo declara y
> espera.
<!-- /GENERADO:vision -->

## Que es esto

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

**L4 · Identidad: un stub, y despues tres identidades.** Es el siguiente loop del plan. Arranca cuando esten resueltas las tres decisiones abiertas de L3.

### La evidencia, medida

| Medida | Resultado |
| --- | --- |
| Tests | 263 de 263 |
| Mutantes | 142 de 142 (100%, 28 paquetes) |
| Unidades juzgables | 93, 0 exceden los 4096 B |
| Veredicto del juez | 10 de 10 documentos de L3 en aligned, confidence 1.0000, nli_label entailment, provider chat-minimax, model MiniMax-M3, sin degraded. |

### Los documentos

| Loop | Que entrega |
| --- | --- |
| L0 | Fundacion: los contratos |
| L1 | Runtime: la caja de cada herramienta |
| L2 | Composicion: encadenar sin equivocarse |
| L3 | Boundary MEMORY: la memoria es tuya y de nadie mas |

El detalle, con el razonamiento y los hallazgos: [docs/arquitectura/loops/INDICE.md](docs/arquitectura/loops/INDICE.md).
El estado completo: [STATUS.md](STATUS.md). El registro en lenguaje llano: [docs/avances.md](docs/avances.md).
<!-- /GENERADO:estado -->

## Como se verifica

```bash
cd vibe-tools
npm install
npm run check      # contenido, presupuesto, tests y mutacion
npm run estado     # el estado publicado, contrastado contra la realidad
```

`npm run estado` es el guard que hace que esta pagina no pueda envejecer en
silencio: mide lo que el repositorio afirma de si mismo y cae si un numero no
cuadra. Por eso el estado que se publica arriba no se escribe a mano.

El detalle, que es lo que de verdad no esta escrito a mano:
[docs/como-verificar.md](docs/como-verificar.md).

## Donde mirar

- [docs/avances.md](docs/avances.md) — el registro en lenguaje llano, ronda por ronda
- [docs/arquitectura/loops/INDICE.md](docs/arquitectura/loops/INDICE.md) — los documentos tecnicos, uno por preocupacion
- [docs/arquitectura/loops/INDICE-publico.md](docs/arquitectura/loops/INDICE-publico.md) — la superficie pública y los documentos transversales
- [docs/legal/cumplimiento-aislamiento-datos-v1.md](docs/legal/cumplimiento-aislamiento-datos-v1.md) — el inventario de datos y los principios que lo rigen
- [vibe-tools/README.md](vibe-tools/README.md) — el paquete de runtime: estructura y comandos

## Licencia

**Sin licencia todavia.** En un repositorio publico, sin licencia, el default legal
es todos los derechos reservados. Es una decision abierta, y por eso se declara en
lugar de omitirse.
