# Decisión A4: si el documento legal de cumplimiento va público

> La pregunta que L-PUB dejó abierta, con lo que ya está medido, las opciones y
> lo que costaría cada una. Es tuya: [lo que L-PUB dejó abierto](L-PUB-cierre.md).
> Las otras: [el índice de decisiones](INDICE-decisiones.md).
>
> **Contestada el 2026-10-26: opción 2.** Se publica, y se le pone el estado real.

## La pregunta, tal como está declarada

| | |
|---|---|
| Id | A4 |
| Quién decide | el operador |
| Qué bloquea | la superficie legal publicada |
| La pregunta | si el documento legal de cumplimiento va público |

## El hecho, medido: ya es público

- El repositorio es **público** (`Opita-Code/opita-code`), y el documento está en
  git desde `f61fc0e` (2026-10-22), **dentro del tag `v0.4.0`**: un release ya
  publicado.
- Está enlazado desde el README, y el README se genera desde `estado.json`.
- **No tiene datos sensibles**: ni nombres de personas, ni correos, ni
  credenciales, ni infraestructura. El único «RUT» es la categoría D6 del
  inventario. Medido sobre el archivo.
- El propio documento se declara: «borrador técnico-legal. **NO declara
  conformidad**», con siete abiertos.

## El nudo, en una línea

> El documento describe el sistema **deseado**, y la admisibilidad legal del
> aislamiento lógico depende de tres loops abiertos. Un documento público que
> promete lo que no se puede mostrar es deuda pública.

## Lo que promete y lo que el sistema cumple hoy

| Compromiso del documento | Estado medido | Loop que lo cierra |
|---|---|---|
| §3.2 (4) · tests de aislamiento automatizados | **cumple** | — |
| §3.2 (1) · autorización en la capa de acceso | **no cumple** | L4-T5 |
| §3.2 (2) · AES-256 en reposo y KMS con rotación | **no comprobable** | L4-T4 |
| §3.2 (3) · auditoría de todo acceso | **no cumple** | L4-T4 |
| §6 · portabilidad `.opitapack` | **no cumple** | L4-T6 |
| §8 · consentimientos C1 a C5 | **no cumple** | sin UI (0 código frontend) |
| §3.1 · una app de tercero nunca cruza identidades | **la mitad** | L4-T5 |

Medido sobre el repositorio el 2026-10-26. Lo que no se midió: la
infraestructura en producción, que todavía no existe, y el texto del abogado,
que nadie ha revisado.

## Las opciones

**Opción 1 — se confirma público, tal cual.** Coste cero, y el documento ya
avisa: dice «NO declara conformidad» y lista siete abiertos. Lo que queda: quien
lea solo el §2 y el §3 se lleva la impresión de que el aislamiento lógico es
admisible hoy, y no lo es.

**Opción 2 — se confirma público, y se le pone el estado real.** El documento
se queda donde está y gana: fecha, versión, y una tabla con el estado de las
cuatro condiciones de admisibilidad y el loop que cierra cada una. El README
pasa a llamarlo por lo que es. Es el estado real, no un certificado, y deja la
deuda con nombre y con dueño. No protege más que la 1, porque no había nada que
proteger.

**Opción 3 — sale del índice público y se queda en el repo.** Deja de enlazarse
del README, pero el archivo sigue descargable desde el release `v0.4.0` y desde
la historia de git. **No es privacidad: es menos visibilidad.** Y sale peor que
las otras dos: el punto débil queda escondido a propósito, y el documento sigue
siendo público para quien lo busque.

**Opción 4 — sale de verdad.** Reescribe la historia de `main` desde `f61fc0e` y
mueve el tag `v0.4.0`, que ya está publicado. Rompe lo que ya se descargó,
rehace el `ad09d17` pendiente, y no protege nada: medido, el archivo no tiene
datos sensibles. **No la recomiendo.**

## Mi recomendación

**Opción 2.** El principio del operador ya lo dice: el punto débil debe existir,
porque es mejor ser regulada que ignorada. Un documento de cumplimiento
público que dice qué condiciones faltan y qué loop las cierra es exactamente
eso. La 3 esconde el punto débil sin proteger nada, y la 4 paga un rewrite de
historia por un archivo sin secretos.

## Qué necesito de ti

**A4: 1, 2, 3 o 4.**
