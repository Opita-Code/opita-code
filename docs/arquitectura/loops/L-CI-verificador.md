# L-CI · El verificador de mutación no media nada

> Parte 1 de 1. [Índice](INDICE-publico.md) · [Cómo se verifica](../../como-verificar.md)
> Spec 550. Continuación de L-PUB2, que es donde se vio.

> **Este documento se niega a afirmar su propio veredicto.** El registro
> autoritativo está en `dark_memory_judgment_history`, proyecto `opita-code`.

## EL HECHO

Desde el primer push, **la CI de `main` falló**. Los cuatro runs de los
cuatro pushes: `failure`. Y nadie lo había mirado, porque la sesión estaba
ocupada construyendo la superficie pública.

Lo que decía la CI **en esos cuatro runs**:

```
tests 263, pass 263, fail 0     la suite completa, en verde
mutación 123/142 = 86.6%        19 mutantes sobreviven
```

Y lo que decía **localmente**: `142/142 = 100%`.

## LA CAUSA

El harness corría los tests así:

```js
spawnSync(process.execPath, ['--test', 'dist/test/*.test.js'], { shell: true })
```

Con `shell: true`, el glob lo expande quien reciba la línea de comandos:

| Plataforma | Quién expande | Qué llega a Node | Qué pasa |
|---|---|---|---|
| Linux | `/bin/sh` | la lista de archivos | los tests **corren** |
| Windows | `cmd.exe` **no** expande | el patrón literal | Node no encuentra el archivo |

En Windows, Node recibía `dist/test/*.test.js`, no encontraba ningún archivo
con ese nombre y salía **con código 1**. Y un código de salida 1 significa
«el test falló». Así que el harness contaba eso como **«el mutante murió»**.

**MEDIDO, no supuesto:** con `shell: true` en Windows, `exit=1` y **salida
vacía**. No corrió ni un test. Los 142 mutantes «muertos» no murieron: no se
llegó a probar.

## POR QUÉ NADIE LO VIO

Porque el número era verdad en el sitio donde se escribió. En la máquina de
quien desarrolló, `cmd.exe` no expande, el comando falla, y el harness dice
`142/142 = 100%`. El número se reportó en L0, en L1 y en L2, se puso en el
README, y **nadie lo contrastó con una ejecución que de verdad corriera los
tests**.

La puerta era el gate de presupuesto, que miraba los bytes, y el gate de
drift, que miraba el texto. Nadie miró **si el gate estaba mirando**.

El arreglo, la verdad medida y lo que esto inválida están en
[L-CI-arreglo](L-CI-arreglo.md). Los 19 huecos que ese documento nombró ya están
cerrados: la suite pasa **282 de 282** y la mutación, medida de verdad, da
**142/142 = 100%**.
