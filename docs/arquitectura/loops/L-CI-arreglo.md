# L-CI · El arreglo, la verdad medida, y lo que esto inválida

> [Verificador](L-CI-verificador.md) · [Índice](INDICE-publico.md)
> Continuación del hallazgo.

## EL ARREGLO

Tres cosas en el harness, y las tres son guards, no parches:

1. **Sin shell, y sin glob.** La lista de archivos se expande en JS y se le
   pasa a Node. La ejecución es la misma en cualquier plataforma.
2. **Una línea base.** Antes de mutar nada, se comprueba que la suite corre y
   pasa en una copia intacta. Si no corre, el harness sale con error y dice
   que no se mide nada. Sin esto, un comando de test que no arranca se
   convierte en «todos los mutantes murieron y el verificador es perfecto».
3. **Tres resultados en vez de dos.** El código de salida no distingue:
   - la suite corrió y falló: el mutante **murió**;
   - la suite corrió y pasó: el mutante **sobrevivió**;
   - la suite **no corrió**: el mutante **no es verificable**, y se cuenta como
     hueco, igual que un patrón que no aparece en el compilado.

## LA VERDAD, MEDIDA

```
mutación 123/142 = 86.6%
supervivientes 19
paquetes bajo 80%: 6
```

Los 19, que son huecos REALES de la suite (la mutación se aplica y la suite
no la nota): 4 en `wasm/binary.js`, 3 en `wasm/imports.js`, 3 en
`tools/draft.js`, y 1 en cada uno de `rules/types.js`, `tool.js`,
`sandbox/outcome.js`, `wasm/structure.js`, `hash.js`, `rules/order.js`,
`module/run.js`, `module/deliver.js`, `tools/render.js`.

## LO QUE ESTO INVALIDA

Los cierres de **L0, L1 y L2**_reportan «mutation 142/142 = 100%». Ese número
**no era una medida**. Y el KPI K2 del plan («mutation score >= 80% por
paquete») se cumplía con un verificador que no ejecutaba los tests.

**La CI sigue en rojo, y ahora por la razón correcta:** el verificador dice
«VEREDOR Débil - no se cierra el loop con esto». Fijar los 19 huecos es una
unidad de trabajo propia, con sus 19 tests.

**CIERRE: los 19 huecos están cerrados.** Los 19 tests viven en
`test/verification-gaps.test.ts`, la suite pasa **282 de 282**, y la mutación
que se mide ahora es **142/142 = 100%**: 0 sobrevivientes, en 28 paquetes. El
123/142 de arriba era el número del problema; este es el de la suite ya
entera.

## LA REGLA QUE DEJA ESTE HALLAZGO

**Un guard que nunca se ha visto en verde no es un guard: es un adorno que
nadie ha mirado.** Y el número que un guard reporta no es el número del
problema: es el número que el guard midió. Si el guard no estaba mirando, su
número no era del problema.

Corolario de la disciplina: R5 («no se pasa a la siguiente unidad suponiendo
que está bien») tiene que incluir **«no se pasa a la siguiente unidad
suponiendo que la verificación funciona»**. Aquí se construyeron cuatro
unidades con la CI en rojo desde el primer push.
