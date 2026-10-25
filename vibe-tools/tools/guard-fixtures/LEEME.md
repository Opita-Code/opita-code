# Fixtures del content-guard

Defectos **deliberados**. Cada archivo existe para que el guard falle.

Se ejecutan con:

```
node tools/content-guard.mjs vibe-tools/tools/guard-fixtures
```

Y deben dar exactamente esto:

| Fixture | Clase | Hallazgos esperados |
|---|---|---|
| `fx1-guion.md` | intrusión de guion (CJK y cirílico) | 10 |
| `fx2-fffd.md` | carácter de reemplazo U+FFFD | 1 |
| `fx3-marcador.md` | marcador pendiente | 1 |
| `fx4-tabla.md` | tabla con columnas inconsistentes | 1 |
| `fx5-fence.md` | bloque de código sin cerrar | 1 |
| `fx6-sin-h1.md` | sin título de primer nivel | 1 |
| `fx7-enlace.md` | enlaces internos rotos | 2 |
| `fx9-ts.ts` | intrusión dentro de un `.ts` | 3 |
| `fx11-crlf.md` | finales de línea CRLF | 1 |
| `fx12-url.md` | URL con acento | 1 |
| `fx13-caja.md` | enlace con la caja equivocada | 1 |
| `fx8-limpio.md` | **control** | **0** |
| `fx10-limpio.ts` | **control** | **0** |

Total: 23 hallazgos, 11 clases distintas, 0 en los dos controles.

(Y una correccion: antes de este cambio, el total decia «21 hallazgos, 8
clases». Los 21 eran correctos, pero las clases eran nueve: el guion CJK y
el cirílico se contaban como una sola, y son dos detecciones distintas.)

## Las dos clases que se añadieron el 2026-10-25

`fx12-url.md` y `fx13-caja.md` nacieron de un pase de ortografía, no de una
idea. El pase acentúó una URL y dejó diez enlaces con la caja equivocada
(`Indice-publico.md` en vez de `INDICE-publico.md`).

Lo importante de `fx13-caja.md`: en **Windows** ese enlace no se ve roto,
porque el sistema de archivos no distingue mayúsculas. El guard daba verde
sobre algo que en Linux y en GitHub estaba roto. Por eso la comprobación
compara el nombre escrito con el nombre real del directorio, y no se apoya
en que el archivo exista.

Y lo importante de `fx12-url.md`: el texto del enlace y su destino cuentan
como **un** defecto, no dos. Por eso el hallazgo esperado es 1, aunque la
URL con acento aparezca en los dos sitios de un enlace de markdown.

## Por qué los controles son la parte importante

Un guard que marca todo **también** pasa una prueba que solo busca «detectó
algo». Un control que debe dar cero es lo que distingue una verificación de una
decoración: obliga a que el guard acierte, no solo a que reaccione.

## No los borres y no los arregles

Si el guard deja de detectar uno de los ocho, el guard se rompió — no el fixture.
Ese es el mismo contrato que tienen los mutantes en `tools/mutation/`.

## Por qué `npm run check` no los escanea

El content-guard corre sobre `docs/**` y `vibe-tools/src/**`, y estos fixtures
están en `vibe-tools/tools/`. Es deliberado: si los escaneara, el check siempre
fallaría y el guard dejaría de informar de nada.