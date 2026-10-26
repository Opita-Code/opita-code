/**
 * LA MATRIZ: las dimensiones de una spec, antes de que exista.
 *
 * QUE ES. Una spec (un loop, en este repo) se materializa en varias partes:
 * el registro en lenguaje llano que se genera desde la fuente, y el documento
 * de cierre que se escribe a mano. La matriz dice, de cada parte, que
 * afirma, cuanto mide y de donde sale ese numero.
 *
 * POR QUE ESTA EN EL PIPELINE Y NO EN UNA TOOL SUELTA. Una tool aparte es un
 * paso que alguien puede saltarse, y un paso que se salta es un paso que
 * nadie sabe si dio bien. Aqui la matriz la calcula el mismo codigo que
 * genera los artefactos, y el resultado se escribe junto a ellos: si el
 * generador corre, la matriz esta; si la matriz cambia, el `--check` se cae.
 *
 * LOS NUMEROS SON DE DOS CLASES Y NO SE MEZCLAN.
 *   - MEDIDO: el tamano real del artefacto, en bytes.
 *   - PROYECTADO: una estimacion a partir del corpus de los artefactos ya
 *     medidos de la misma clase.
 * Un proyectado nunca se escribe como medido. La diferencia va en el dato,
 * no en la prosa: por eso cada parte lleva su `origen`.
 *
 * LO QUE ESTE ARCHIVO NO HACE, Y POR QUE.
 *   - No decide si una parte cabe. El tope es del framework (4096 B por
 *     artefacto juzgable) y el corte lo aplica la regla, no la estimacion:
 *     aqui solo se reporta que una parte se pasa.
 *   - No mide nada. Los bytes medidos los miden el generador y el guard de
 *     presupuesto; aqui se resumen y se comparan.
 *   - No juzga. Que una parte afirme lo que dice es cosa del juez, y de la
 *     regla de judge por partes.
 */

/** Las clases de parte que el pipeline produce. */
export const CLASES = {
  avances: 'El registro en lenguaje llano del loop, generado desde la fuente',
  cierre: 'El documento de cierre del loop, escrito a mano',
};

/** El tope de bytes de un artefacto juzgable. Es regla del framework. */
export const TOPE = 4096;

/**
 * El resumen de una lista de tamanos medidos.
 *
 * Percentiles por indice: con pocos datos, un percentil exacto engaña, y
 * el rango entre el p50 y el p75 es la banda honesta.
 */
export function resumen(tamanos) {
  const s = [...tamanos].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  const n = s.length;
  if (n === 0) return { n: 0, p50: 0, p75: 0, min: 0, max: 0, media: 0 };
  const q = (p) => s[Math.min(n - 1, Math.floor(p * n))];
  const media = Math.round(s.reduce((a, b) => a + b, 0) / n);
  return { n, p50: q(0.5), p75: q(0.75), min: s[0], max: s[n - 1], media };
}

/**
 * El cuerpo de una clase: el resumen de los tamanos y la media del largo de
 * sus afirmaciones.
 */
export function cuerpoDe(clase, partes) {
  const deLaClase = partes.filter((p) => p.clase === clase);
  const claims = deLaClase.map((p) => String(p.claim ?? '').length);
  return {
    clase,
    resumen: resumen(deLaClase.map((p) => p.bytes)),
    claimMedio: claims.length ? Math.round(claims.reduce((a, b) => a + b, 0) / claims.length) : 0,
    n: deLaClase.length,
  };
}

/**
 * El tamano PROYECTADO de una parte de una clase, a partir del cuerpo medido
 * de esa clase.
 *
 * La proyeccion es el p50 de la clase, mas lo que la afirmacion se pase de
 * la media. Se usa el p50 y no el p75 porque el p50 es lo que se espera, y
 * el p75 es lo que se aguanta: quien quiera ser conservador usa el p75.
 */
export function proyectar(cuerpo, claim = '') {
  if (!cuerpo || cuerpo.n === 0) return null;
  const extra = Math.max(0, String(claim).length - cuerpo.claimMedio);
  return cuerpo.resumen.p50 + extra;
}

/**
 * La matriz de una spec.
 *
 * Cada parte lleva su afirmacion (una sola, por la regla de judge por
 * partes), sus bytes y de donde sale el numero. La parte que se pasa del
 * tope se lista aparte, porque es lo que hay que partir.
 */
export function matriz(spec, partes, cuerpos, tope = TOPE) {
  const filas = partes.map((p) => {
    const medido = Number.isFinite(p.bytes) ? p.bytes : null;
    const proyectado = medido === null ? proyectar(cuerpos[p.clase], p.claim) : null;
    const bytes = medido !== null ? medido : proyectado;
    const claim = String(p.claim ?? '').trim();
    return {
      id: p.id,
      clase: p.clase,
      claim,
      bytes: bytes ?? 0,
      origen: medido !== null ? 'medido' : 'proyectado',
      fueraDeTope: bytes !== null && bytes > tope,
      // Una parte sin afirmacion no se puede certificar: la regla del judge
      // por partes pide UNA afirmacion central por parte, y una parte muda no
      // tiene nada que juzgar.
      sinAfirmacion: claim.length === 0,
    };
  });
  return {
    version: 1,
    spec: spec.id,
    nombre: spec.nombre ?? spec.id,
    partes: filas,
    bytesTotal: filas.reduce((a, f) => a + f.bytes, 0),
    medidos: filas.filter((f) => f.origen === 'medido').length,
    proyectados: filas.filter((f) => f.origen === 'proyectado').length,
    fueraDeTope: filas.filter((f) => f.fueraDeTope).map((f) => f.id),
    sinAfirmacion: filas.filter((f) => f.sinAfirmacion).map((f) => f.id),
  };
}

/**
 * La matriz en markdown, para escribirla junto a los artefactos.
 *
 * Lo que no dice la tabla es tan importante como lo que dice: que un numero
 * proyectado es una estimacion, y que una parte fuera del tope hay que
 * partirla.
 */
export function renderMatriz(m, tope = TOPE) {
  const lineas = [];
  lineas.push(`# La matriz de las specs`);
  lineas.push('');
  lineas.push('> Generado por el pipeline. Una fila por parte: que afirma, cuanto');
  lineas.push(`> mide y de donde sale ese numero. El tope de ${tope} B por artefacto`);
  lineas.push('> juzgable es regla del framework, no de esta tabla.');
  lineas.push('');
  for (const spec of m) {
    lineas.push(`## ${spec.spec} · ${spec.nombre}`);
    lineas.push('');
    lineas.push('| Parte | Clase | Afirmación | Bytes | De dónde |');
    lineas.push('|---|---|---|---|---|');
    for (const p of spec.partes) {
      lineas.push(
        `| ${p.id} | ${p.clase} | ${p.claim.replace(/\|/g, '/')} | ${p.bytes} | ${p.origen} |`,
      );
    }
    lineas.push('');
    lineas.push(
      `Total: ${spec.bytesTotal} B · ${spec.medidos} medidos · ${spec.proyectados} proyectados.`,
    );
    if (spec.fueraDeTope.length > 0) {
      lineas.push('');
      lineas.push(
        `**Fuera del tope:** ${spec.fueraDeTope.join(', ')}. Cada una se parte por concepto.`,
      );
    }
    if (spec.sinAfirmacion.length > 0) {
      lineas.push('');
      lineas.push(
        `**Sin afirmación:** ${spec.sinAfirmacion.join(', ')}. Una parte sin afirmación no se puede certificar.`,
      );
    }
    lineas.push('');
  }
  return lineas.join('\n');
}
