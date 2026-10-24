# L-CI · El verificador de mutacion no media nada

> Parte 1 de 1. [Indice](INDICE-publico.md) · [Como se verifica](../../como-verificar.md)
> Spec 550. Continuacion de L-PUB2, que es donde se vio.

> **Este documento se niega a afirmar su propio veredicto.** El registro
> autoritativo esta en `dark_memory_judgment_history`, proyecto `opita-code`.

## EL HECHO

Desde el primer push, **la CI de `main` fallo**. Los cuatro runs de los
cuatro pushes: `failure`. Y nadie lo habia mirado, porque la sesion estaba
ocupada construyendo la superficie publica.

Lo que decia la CI **en esos cuatro runs**:

```
tests 263, pass 263, fail 0     la suite completa, en verde
mutacion 123/142 = 86.6%        19 mutantes sobreviven
```

Y lo que decia **localmente**: `142/142 = 100%`.

## LA CAUSA

El harness corria los tests asi:

```js
spawnSync(process.execPath, ['--test', 'dist/test/*.test.js'], { shell: true })
```

Con `shell: true`, el glob lo expande quien reciba la linea de comandos:

| Plataforma | Quien expande | Que llega a Node | Que pasa |
|---|---|---|---|
| Linux | `/bin/sh` | la lista de archivos | los tests **corren** |
| Windows | `cmd.exe` **no** expande | el patron literal | Node no encuentra el archivo |

En Windows, Node recibia `dist/test/*.test.js`, no encontraba ningun archivo
con ese nombre y salia **con codigo 1**. Y un codigo de salida 1 significa
«el test fallo». Asi que el harness contaba eso como **«el mutante murio»**.

**MEDIDO, no supuesto:** con `shell: true` en Windows, `exit=1` y **salida
vacia**. No corrio ni un test. Los 142 mutantes "muertos» no murieron: no se
llego a probar.

## POR QUE NADIE LO VIO

Porque el numero era verdad en el sitio donde se escribio. En la maquina de
quien desarrollo, `cmd.exe` no expande, el comando falla, y el harness dice
`142/142 = 100%`. El numero se reporto en L0, en L1 y en L2, se puso en el
README, y **nadie lo contrasto con una ejecucion que de verdad corriera los
tests**.

La puerta era el gate de presupuesto, que miraba los bytes, y el gate de
drift, que miraba el texto. Nadie mire **si el gate estaba mirando**.

El arreglo, la verdad medida y lo que esto invalida estan en
[L-CI-arreglo](L-CI-arreglo.md). Los 19 huecos que ese documento nombro ya estan
cerrados: la suite pasa **282 de 282** y la mutacion, medida de verdad, da
**142/142 = 100%**.
