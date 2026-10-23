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
| `fx8-limpio.md` | **control** | **0** |
| `fx10-limpio.ts` | **control** | **0** |

Total: 21 hallazgos, 8 clases distintas, 0 en los tres controles.

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