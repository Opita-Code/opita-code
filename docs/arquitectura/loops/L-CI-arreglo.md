# L-CI · El arreglo, la verdad medida, y lo que esto invalida

> [Verificador](L-CI-verificador.md) · [Indice](INDICE-publico.md)
> Continuacion del hallazgo.

## EL ARREGLO

Tres cosas en el harness, y las tres son guards, no parches:

1. **Sin shell, y sin glob.** La lista de archivos se expande en JS y se le
   pasa a Node. La ejecucion es la misma en cualquier plataforma.
2. **Una linea base.** Antes de mutar nada, se comprueba que la suite corre y
   pasa en una copia intacta. Si no corre, el harness sale con error y dice
   que no se mide nada. Sin esto, un comando de test que no arranca se
   convierte en «todos los mutantes murierony el verificador es perfecto».
3. **Tres resultados en vez de dos.** El codigo de salida no distingue:
   - la suite corrio y fallo: el mutante **murio**;
   - la suite corrio y paso: el mutante **sobrevivio**;
   - la suite **no corrio**: el mutante **no es verificable**, y se cuenta como
     hueco, igual que un patron que no aparece en el compilado.

## LA VERDAD, MEDIDA

```
mutacion 123/142 = 86.6%
supervivientes 19
paquetes bajo 80%: 6
```

Los 19, que son huecos REALES de la suite (la mutacion se aplica y la suite
no la nota): 4 en `wasm/binary.js`, 3 en `wasm/imports.js`, 3 en
`tools/draft.js`, y 1 en cada uno de `rules/types.js`, `tool.js`,
`sandbox/outcome.js`, `wasm/structure.js`, `hash.js`, `rules/order.js`,
`module/run.js`, `module/deliver.js`, `tools/render.js`.

## LO QUE ESTO INVALIDA

Los cierres de **L0, L1 y L2**_reportan «mutation 142/142 = 100%». Ese numero
**no era una medida**. Y el KPI K2 del plan («mutation score >= 80% por
paquete») se cumplia con un verificador que no ejecutaba los tests.

**La CI sigue en rojo, y ahora por la razon correcta:** el verificador dice
«VEREDOR DEBIL - no se cierra el loop con esto». Fijar los 19 huecos es una
unidad de trabajo propia, con sus 19 tests.

## LA REGLA QUE DEJA ESTE HALLAZGO

**Un guard que nunca se ha visto en verde no es un guard: es un adorno que
nadie ha mirado.** Y el numero que un guard reporta no es el numero del
problema: es el numero que el guard MIDIO. Si el guard no estaba mirando, su
numero no era del problema.

Corolario de la disciplina: R5 («no se pasa a la siguiente unidad suponiendo
que esta esta bien») tiene que incluir **«no se pasa a la siguiente unidad
suponiendo que la verificacion funciona»**. Aqui se construyeron cuatro
unidades con la CI en rojo desde el primer push.
