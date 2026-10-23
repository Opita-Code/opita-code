/**
 * Partida por concepto de tres archivos que cruzaron el tope de 4096 B.
 *
 * ESTA ES UNA OPERACION DE UN SOLO USO. Los documentos ya estan partidos, y
 * volver a correrlo sobre los resultados cortaria el titulo del archivo.
 * Por eso el guard de abajo: si el resultado ya existe, no se toca nada y se
 * sale con codigo 0. El procedimiento queda en el repo; el efecto, en el
 * historial de git.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const R = 'C:/Users/nicou/Documents/IA/opita-code/docs/arquitectura/loops/';

if (existsSync(R + 'L-PUB-errores.md') || existsSync(R + 'L-PUB-abiertos.md')) {
  console.log('La partida ya esta hecha. No se toca nada (operacion de un solo uso).');
  process.exit(0);
}

// 1. L-PUB-correcciones.md -> L-PUB-correcciones.md + L-PUB-errores.md
{
  const p = R + 'L-PUB-correcciones.md';
  const l = readFileSync(p, 'utf8').split('\n');
  const i = l.findIndex((x) => x.startsWith('## 6. LOS ERRORES'));
  const cab = l.slice(0, i).join('\n').replace(/\n+$/, '');
  const cuerpo = l.slice(i).join('\n').trim();

  writeFileSync(
    R + 'L-PUB-correcciones.md',
    `# L-PUB · Correcciones de la superficie publica

> Parte 1 de 2. [Errores](L-PUB-errores.md) · [Cierre](L-PUB-cierre.md) · [Indice](INDICE-publico.md)
> Spec 540. Tareas P1 a P7.

Lo que estaba mal en la cara publica del repositorio, y como se corrigio.
Todo lo de aqui se **midio** antes de corregirlo.

${cab.split('\n').slice(5).join('\n')}

El error que cometi **dentro** de esta unidad, con lo que el guard atrapo, esta en
[errores](L-PUB-errores.md). Va aparte porque un cierre que solo lista lo que
salio bien no sirve para lo siguiente.
`
  );

  writeFileSync(
    R + 'L-PUB-errores.md',
    `# L-PUB · Errores de este loop

> Parte 2 de 2. [Correcciones](L-PUB-correcciones.md) · [Cierre](L-PUB-cierre.md) · [Indice](INDICE-publico.md)
> Spec 540. Tareas P1 a P7.

${cuerpo.replace('## 6. LOS ERRORES QUE COMETI DENTRO DE ESTA UNIDAD', '## Los errores que cometi dentro de esta unidad')}
`
  );
  console.log('partido: L-PUB-correcciones.md + L-PUB-errores.md');
}

// 2. L-PUB-cierre.md -> L-PUB-cierre.md + L-PUB-abiertos.md
{
  const p = R + 'L-PUB-cierre.md';
  const l = readFileSync(p, 'utf8').split('\n');
  const i = l.findIndex((x) => x.startsWith('## LO QUE NO SE MOVIO'));
  const j = l.findIndex((x) => x.startsWith('## LA REGLA QUE ESTE LOOP DEJA ADOPTADA'));
  const cab = l.slice(0, i).join('\n').replace(/\n+$/, '');
  const abiertos = l.slice(i, j).join('\n').trim();
  const cola = l.slice(j).join('\n').trim();

  writeFileSync(
    R + 'L-PUB-cierre.md',
    `# L-PUB · Cierre

> Parte 1 de 2. [Correcciones](L-PUB-correcciones.md) · [Errores](L-PUB-errores.md) · [Abiertos](L-PUB-abiertos.md) · [Indice](INDICE-publico.md)
> Spec 540. Tareas P1 a P7.

Lo que este loop deja atras y lo que entrega al siguiente.

> **El veredicto del gate sobre este documento no se afirma aqui.** Un documento
> que afirma su propio veredicto no es juzgable de forma estable: la
> afirmacion se convierte en su propia evidencia. El registro autoritativo esta
> en \`dark_memory_judgment_history\`, en el proyecto \`opita-code\`.

${cab.split('\n').slice(11).join('\n')}

Lo que **no** se movio, y lo que sigue abierto y sigue siendo del operador, esta
en [abiertos](L-PUB-abiertos.md).

## LA REGLA QUE ESTE LOOP DEJA ADOPTADA

${cola.split('\n').slice(1).join('\n').trim()}
`
  );

  writeFileSync(
    R + 'L-PUB-abiertos.md',
    `# L-PUB · Lo que no se movio, y lo que sigue abierto

> [Cierre](L-PUB-cierre.md) · [Correcciones](L-PUB-correcciones.md) · [Indice](INDICE-publico.md)
> Spec 540.

${abiertos.replace('## LO QUE NO SE MOVIO', '## Lo que no se movio').replace('## LO QUE SIGUE ABIERTO, Y SIGUE SIENDO DEL OPERADOR', '## Lo que sigue abierto, y sigue siendo del operador')}
`
  );
  console.log('partido: L-PUB-cierre.md + L-PUB-abiertos.md');
}
