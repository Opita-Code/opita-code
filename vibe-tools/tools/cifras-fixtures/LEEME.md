# Fixtures del cifras-guard

Defectos **deliberados**. Cada archivo existe para que el guard falle, o
para que no falle cuando debe.

Se ejecutan con:

```
node tools/cifras-guard.mjs tools/cifras-fixtures --fuente tools/cifras-fixtures/fuente.json
```

Y deben dar exactamente esto:

| Fixture | Clase | Hallazgos esperados |
|---|---|---|
| `fx1-cifras-falsas.md` | cifras que no coinciden con la fuente | 3 |
| `fx3-juez-que-no.md` | una cifra de documentos que el juez no resolvió | 1 |
| `fx2-limpio.md` | **control** | **0** |

Total: 4 hallazgos, 2 clases, 0 en el control.

Los tres hallazgos del fixture con defectos son, uno por uno, los tres
defectos que se encontraron el 2026-10-25 en el kit del canal: las pruebas
en verde con el numero del total, las unidades juzgables con un numero
viejo, y las decisiones abiertas con un numero que no es el de la fuente.
El cuarto reproduce, palabra por palabra, el defecto mas caro de todos: la
cifra de documentos que el juez no habia resuelto, escrita junto a la
palabra «juez». Ese fixture existe porque la regla del juez se aprieto
despues (ahora exige el verbo de resolucion, para que «67 son documentos»
no se confunda con una cifra del juez), y una regla que se aprieta puede
dejar de ver lo que veia.

El control lleva las cifras CORRECTAS de la fuente congelada: si el guard
no las aceptara, el fixture con defectos no probaria nada, porque pasaria
por no mirar.

**Y los tres archivos tienen que decir `6 cifra(s) contrastada(s)`.** El
control no pasa por no encontrar nada: pasa porque sus seis cifras se
midieron y coincidieron. Un guard que informa «OK» porque no encontro nada
es peor que no tener guard, y el control existe para que eso se note.

**LA FUENTE CONGELADA.** `fuente.json` no es la fuente real del proyecto:
es una fuente de mentira, con cifras redondas, para que el contrato del
guard no dependa de las cifras de hoy. Si el corpus se midiera contra
`vibe-tools/estado.json`, cada commit que moviera un numero decia que el
corpus estaba roto.

**LA REGLA DE LAS DOS FECHAS.** Una entrada cuya fecha es de hoy o de
despues esta pendiente de publicar, y sus cifras se miden contra la fuente
de hoy. Una entrada cuya fecha ya paso es un registro: dice lo que era
verdad el dia en que salio, y no se vuelve a medir. El guion
(`docs/canal.md`) no tiene fecha porque no es un post: es una regla
vigente, y siempre se mide contra la fuente de hoy.
