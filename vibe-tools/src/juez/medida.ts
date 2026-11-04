/**
 * L5-T4 · LEER UN VEREDICTO, Y NO CONFUNDIR TRES COSAS DISTINTAS.
 *
 * El juez devuelve tres palabras que se confunden todo el tiempo:
 *
 *   aligned         el artefacto afirma lo que el intent decia. Es el unico
 *                   desenlace concluyente.
 *   drift_detected  hay algo que no cuadra. Se corrige, no se discute.
 *   needs_human     el juez NO PUDO decidir. No es «esta bien» ni «esta mal»:
 *                   es una medida que no se tomo.
 *
 * Y dentro de `needs_human` hay dos causas que no se parecen en nada:
 *
 *   INFRAESTRUCTURA  el proveedor esta degradado, la cuota cayo, no hay
 *                    proveedor, la respuesta vino malformada o tardo de mas.
 *                    Se reintenta; no se toca el artefacto.
 *   SEMANTICO        el juez respondio, con su proveedor y su confianza, y no
 *                    pudo sostener la afirmacion. Se revisa el intent antes
 *                    que el artefacto, porque un intent que enumera o que
 *                    cita evidencia ausente neutra el veredicto.
 *
 * Confundirlas cuesta caro en las dos direcciones: tratar una cuota caida
 * como deriva hace reescribir un artefacto que estaba bien; tratar un
 * desacuerdo semantico como infraestructura hace reintentar en bucle una
 * pregunta mal hecha. Por eso la clasificacion es codigo y no prosa.
 *
 * Y UNA CUARTA COSA, que no es un veredicto: el DISENSO. Con varias muestras,
 * que no coincidan entre si no es ni aligned ni drift: es que el juez no esta
 * mirando lo que uno cree. Se para y se reporta.
 *
 * LO QUE ESTE ARCHIVO NO HACE. No llama al juez: recibe sus muestras ya
 * normalizadas y decide que significan. La traduccion de la respuesta del MCP
 * a `Muestra` vive en el transporte (`tools/juez-correr.mjs`), que es el
 * unico que habla con el servidor.
 */

export const VEREDICTOS = ['aligned', 'drift_detected', 'needs_human'] as const;

export type Veredicto = (typeof VEREDICTOS)[number];

/**
 * Una muestra: un veredicto de una llamada.
 *
 * `proveedor` es `null` cuando la respuesta no trae ninguno. Eso no es un
 * detalle de formato: medido en esta maquina, una cuota agotada devuelve
 * `needs_human` con confianza 0 y SIN proveedor, y ese es el patron que
 * distingue la infraestructura del juicio.
 */
export interface Muestra {
  readonly veredicto: Veredicto;
  readonly confianza: number;
  readonly proveedor: string | null;
  readonly latenciaMs: number | null;
  readonly degradado: boolean;
  /** Lo que dijo el juez, o el motivo de la falla. Se conserva para el operador. */
  readonly razon: string;
}

/** Una parte medida: su identidad y las muestras que se le tomaron. */
export interface MedidaDeParte {
  readonly parte: number;
  readonly sha: string;
  readonly bytes: number;
  readonly muestras: readonly Muestra[];
}

export type MotivoDeParada = 'infraestructura' | 'semantico' | 'disenso' | 'sin_muestras';

export type Desenlace =
  | {
      readonly tipo: 'alineado';
      readonly confianza: number;
      readonly stddev: number;
      readonly muestras: number;
    }
  | {
      readonly tipo: 'deriva';
      readonly confianza: number;
      readonly razon: string;
      readonly muestras: number;
    }
  | {
      readonly tipo: 'parada';
      readonly motivo: MotivoDeParada;
      readonly razon: string;
    };

/** Redondeo a 4 decimales: la misma precision con la que publica el juez. */
function redondear(x: number): number {
  return Math.round(x * 1e4) / 1e4;
}

function media(valores: readonly number[]): number {
  if (valores.length === 0) return 0;
  return redondear(valores.reduce((a, b) => a + b, 0) / valores.length);
}

/**
 * Desviacion tipica POBLACIONAL, que es la que publica el consenso del MCP
 * (`stddev_confidence`). Con una sola muestra es 0, y eso no es un cero
 * medido: es la ausencia de dispersion. El agregado lo distingue por el
 * numero de muestras, no por el valor.
 */
export function desviacion(valores: readonly number[]): number {
  if (valores.length === 0) return 0;
  const m = valores.reduce((a, b) => a + b, 0) / valores.length;
  const varianza = valores.reduce((a, b) => a + (b - m) * (b - m), 0) / valores.length;
  return redondear(Math.sqrt(varianza));
}

/**
 * El desenlace de una parte.
 *
 * EL ORDEN DE LAS COMPROBACIONES ES LA REGLA:
 *
 *   1. Sin muestras: no hay medida. Parada.
 *   2. Cualquier muestra degradada o sin proveedor: la medida no es de fiar.
 *      Parada por infraestructura, ANTES de mirar el veredicto. Un
 *      `drift_detected` de una muestra degradada no es una deriva: es una
 *      muestra que no vale.
 *   3. Si las muestras no coinciden: disenso. Se para; no se elige la mayoria
 *      cuando la minoria es justamente lo que hay que mirar.
 *   4. Con todas de acuerdo: aligned, drift o needs_human semantico.
 */
export function desenlaceDe(medida: MedidaDeParte): Desenlace {
  const m = medida.muestras;
  if (m.length === 0) {
    return { tipo: 'parada', motivo: 'sin_muestras', razon: `la parte ${medida.parte} no tiene muestras` };
  }

  const infra = m.find((s) => s.degradado || s.proveedor === null || s.proveedor.trim() === '');
  if (infra !== undefined) {
    return {
      tipo: 'parada',
      motivo: 'infraestructura',
      razon: infra.razon === '' ? 'muestra degradada o sin proveedor' : infra.razon,
    };
  }

  const cuenta: Record<Veredicto, number> = { aligned: 0, drift_detected: 0, needs_human: 0 };
  for (const s of m) cuenta[s.veredicto] += 1;

  const maximo = Math.max(cuenta.aligned, cuenta.drift_detected, cuenta.needs_human);
  const ganadores = VEREDICTOS.filter((v) => cuenta[v] === maximo);
  const modal = ganadores[0];
  // Una sola comprobacion para las dos formas de no coincidir: el empate y la
  // minoria. La rama de empate que habia antes era redundante —con un empate,
  // `maximo < m.length` siempre se cumple— y la mutacion la destapo: quitarla
  // no cambiaba el veredicto. Lo que se conserva es el mensaje, porque es la
  // superficie que lee el operador.
  if (maximo < m.length || modal === undefined) {
    const razon =
      ganadores.length > 1
        ? `empate entre ${ganadores.join(' y ')} en ${m.length} muestras`
        : `${maximo} de ${m.length} muestras dicen ${String(modal)}; el resto no`;
    return { tipo: 'parada', motivo: 'disenso', razon };
  }

  const confianza = media(m.map((s) => s.confianza));
  const stddev = desviacion(m.map((s) => s.confianza));

  if (modal === 'aligned') {
    return { tipo: 'alineado', confianza, stddev, muestras: m.length };
  }
  if (modal === 'drift_detected') {
    const primera = m.find((s) => s.veredicto === 'drift_detected');
    return {
      tipo: 'deriva',
      confianza,
      razon: primera === undefined || primera.razon === '' ? 'deriva sin razon declarada' : primera.razon,
      muestras: m.length,
    };
  }
  const primera = m.find((s) => s.veredicto === 'needs_human');
  return {
    tipo: 'parada',
    motivo: 'semantico',
    razon: primera === undefined || primera.razon === '' ? 'el juez no pudo sostener la afirmacion' : primera.razon,
  };
}

/**
 * El agregado de un artefacto. La regla es la del judge por partes: dice
 * «N de N partes», con nombre, y NUNCA «el documento esta bien».
 *
 *   - Una deriva manda: si una parte no se sostiene, el artefacto no pasa,
 *     por muchas partes que se sostengan.
 *   - Una parada deja el agregado INCOMPLETO. Un agregado incompleto no es
 *     un aprobado, y por eso no hay un estado intermedio que se pueda citar
 *     como bueno.
 *   - Alineado solo si TODAS las partes lo estan. Y el agregado es tan fuerte
 *     como su parte mas debil: publica la confianza MINIMA y el stddev
 *     MAXIMO, no la media. Una media alta esconde la parte que casi no pasa.
 */
export type Agregado =
  | {
      readonly tipo: 'alineado';
      readonly partes: number;
      readonly confianzaMinima: number;
      readonly stddevMaximo: number;
    }
  | {
      readonly tipo: 'deriva';
      readonly partes: readonly number[];
      readonly razon: string;
    }
  | {
      readonly tipo: 'parada';
      readonly motivos: readonly MotivoDeParada[];
      readonly partes: readonly number[];
      readonly razon: string;
    };

export function agregar(medidas: readonly MedidaDeParte[]): Agregado {
  if (medidas.length === 0) {
    return { tipo: 'parada', motivos: ['sin_muestras'], partes: [], razon: 'no hay partes que juzgar' };
  }

  const desenlaces = medidas.map((medida) => ({ medida, desenlace: desenlaceDe(medida) }));

  const derivas = desenlaces.filter(
    (x): x is { medida: MedidaDeParte; desenlace: Extract<Desenlace, { tipo: 'deriva' }> } =>
      x.desenlace.tipo === 'deriva',
  );
  if (derivas.length > 0) {
    return {
      tipo: 'deriva',
      partes: derivas.map((x) => x.medida.parte),
      razon: derivas[0]?.desenlace.razon ?? 'deriva',
    };
  }

  const paradas = desenlaces.filter(
    (x): x is { medida: MedidaDeParte; desenlace: Extract<Desenlace, { tipo: 'parada' }> } =>
      x.desenlace.tipo === 'parada',
  );
  if (paradas.length > 0) {
    const motivos = [...new Set(paradas.map((x) => x.desenlace.motivo))];
    return {
      tipo: 'parada',
      motivos,
      partes: paradas.map((x) => x.medida.parte),
      razon: paradas[0]?.desenlace.razon ?? 'no se pudo medir',
    };
  }

  const alineados = desenlaces.map(
    (x) => x.desenlace as Extract<Desenlace, { tipo: 'alineado' }>,
  );
  return {
    tipo: 'alineado',
    partes: medidas.length,
    confianzaMinima: Math.min(...alineados.map((d) => d.confianza)),
    stddevMaximo: Math.max(...alineados.map((d) => d.stddev)),
  };
}

/**
 * Lo que el operador tiene que hacer. Es la superficie de L5-T4: no un
 * codigo de error, sino la accion, y por que.
 */
export function queHacer(agregado: Agregado): string {
  if (agregado.tipo === 'alineado') return 'publicar';
  if (agregado.tipo === 'deriva') return 'corregir el artefacto y volver a publicar (maximo 2 intentos)';
  const motivos = agregado.motivos;
  if (motivos.includes('infraestructura')) {
    return 'no es drift: reintentar cuando el proveedor responda, sin tocar el artefacto';
  }
  if (motivos.includes('disenso')) {
    return 'parar y reportar: las muestras no coinciden, el juez no esta mirando lo que uno cree';
  }
  if (motivos.includes('sin_muestras')) {
    return 'no se midio nada: revisar el encargo antes de reintentar';
  }
  return 'revisar el intent antes que el artefacto: el juez respondio y no pudo sostener la afirmacion';
}
