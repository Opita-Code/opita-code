/**
 * L5-T1 · EL PIPELINE: del encargo a la decision de publicar.
 *
 * QUE ES. La pieza que convierte un artefacto en una decision, en este orden:
 *
 *   1. REVISAR el encargo (ambito, tipo, afirmacion) sin gastar una llamada.
 *   2. PLANIFICAR: cuantas partes, cuantas muestras por parte, cuantos bytes.
 *   3. [el transporte llama al juez: no vive aqui]
 *   4. COMPROBAR que las medidas son de ESTE plan: mismas partes, mismo sha,
 *      mismos bytes, mismo numero de muestras.
 *   5. AGREGAR segun la regla del judge por partes.
 *   6. DECIDIR: publicar, corregir o parar. Y decirle al operador que hacer.
 *
 * POR QUE LA COMPROBACION DEL PASO 4 ES UN `throw` Y NO UN VEREDICTO.
 *
 *   Una medida que no corresponde al plan no es un juicio sobre el artefacto:
 *   es un fallo del que llamo. Publicar el veredicto de otro sha es
 *   exactamente el error que el pipeline existe para evitar, y devolverlo como
 *   "parada" lo dejaria en el mismo saco que un `needs_human` legitimo. Es la
 *   misma regla de L4-T5: una decision incoherente tiene que fallar, no
 *   devolver un vacio.
 *
 * POR QUE EL PLAN LLEVA EL CONSENSO Y NO LO ELIGE EL TRANSPORTE.
 *
 *   El numero de muestras es una decision de riesgo, y el riesgo lo declara
 *   el encargo y lo resuelve la tabla de ambitos. Si lo eligiera el
 *   transporte, el que llama podria bajar el coste bajando las muestras sin
 *   que nadie lo viera. El plan es el contrato: el transporte lo ejecuta.
 *
 * LO QUE ESTE ARCHIVO NO HACE. No parte el artefacto (eso es
 * `tools/juez-partes.mjs`), no llama al juez (eso es `tools/juez-correr.mjs`)
 * y no concede permisos (eso es la puerta de L4-T5). Recibe partes y medidas,
 * y decide.
 */

import { TOPE_AFIRMACION, revisarEncargo, type Encargo, type MotivoDeRechazo } from './encargo.js';
import { agregar, queHacer, type Agregado, type MedidaDeParte } from './medida.js';
import { costeDe, type Coste } from './coste.js';
import type { Ambito } from './ambitos.js';

/** Una parte del artefacto, tal como la produce la partida por concepto. */
export interface Parte {
  /** El numero de parte, desde 1. */
  readonly n: number;
  readonly titulo: string;
  readonly bytes: number;
  /** El sha256 del TEXTO de la parte, sin la cabecera. */
  readonly sha: string;
}

export type MotivoDePlan =
  | MotivoDeRechazo
  | 'sin_partes'
  | 'parte_repetida'
  | 'parte_vacia'
  | 'parte_grande'
  | 'afirmaciones_por_parte';

export type Planificacion =
  | { readonly ok: true; readonly plan: Plan }
  | { readonly ok: false; readonly motivo: MotivoDePlan; readonly detalle: string };

export interface Plan {
  readonly ruta: string;
  readonly ambito: Ambito;
  readonly consenso: number;
  readonly riesgo: 'normal' | 'alto';
  /** Una afirmacion por parte, en el orden de las partes. */
  readonly afirmaciones: readonly string[];
  readonly partes: readonly Parte[];
  /** partes x consenso. Es lo que se le pide al transporte, ni una mas. */
  readonly llamadas: number;
  /** bytes de las partes x consenso. */
  readonly bytesEnviados: number;
}

export interface OpcionesDePlan {
  /** El tope por parte. No tiene valor por defecto: es una regla del framework. */
  readonly tope: number;
  /** El tope de la afirmacion. Por defecto, el del binding del juez. */
  readonly topeAfirmacion?: number;
}

function sinPlan(motivo: MotivoDePlan, detalle: string): Planificacion {
  return { ok: false, motivo, detalle };
}

/**
 * Planifica el encargo. Todo lo que se puede rechazar sin llamar al juez se
 * rechaza aqui.
 */
export function planificar(
  encargo: Encargo,
  partes: readonly Parte[],
  opciones: OpcionesDePlan,
): Planificacion {
  const revision = revisarEncargo(encargo, opciones.topeAfirmacion ?? TOPE_AFIRMACION);
  if (!revision.ok) return sinPlan(revision.motivo, revision.detalle);

  if (partes.length === 0) {
    return sinPlan('sin_partes', 'el artefacto no tiene partes: no hay nada que juzgar');
  }

  const vistos = new Set<number>();
  for (const parte of partes) {
    if (vistos.has(parte.n)) {
      return sinPlan('parte_repetida', `la parte ${parte.n} aparece dos veces`);
    }
    vistos.add(parte.n);
    if (parte.bytes <= 0) {
      return sinPlan('parte_vacia', `la parte ${parte.n} (${parte.titulo}) mide ${parte.bytes} B`);
    }
    if (parte.bytes > opciones.tope) {
      return sinPlan(
        'parte_grande',
        `la parte ${parte.n} (${parte.titulo}) mide ${parte.bytes} B y el tope es ${opciones.tope} B: se parte por concepto, no se sube el tope`,
      );
    }
  }

  if (encargo.afirmaciones.length !== partes.length) {
    return sinPlan(
      'afirmaciones_por_parte',
      `el artefacto tiene ${partes.length} parte(s) y hay ${encargo.afirmaciones.length} afirmacion(es): una parte, una afirmacion`,
    );
  }

  const bytesPorParte = partes.reduce((a, p) => a + p.bytes, 0);
  return {
    ok: true,
    plan: {
      ruta: encargo.ruta,
      ambito: revision.ambito,
      consenso: revision.consenso,
      riesgo: revision.riesgo,
      afirmaciones: [...encargo.afirmaciones],
      partes: [...partes],
      llamadas: partes.length * revision.consenso,
      bytesEnviados: bytesPorParte * revision.consenso,
    },
  };
}

/** Una medida que no corresponde al plan. Es un fallo del llamador, no un juicio. */
export class MedidaIncoherenteError extends Error {
  readonly codigo = 'E_MEDIDA_INCOHERENTE';
  constructor(detalle: string) {
    super(detalle);
    this.name = 'MedidaIncoherenteError';
  }
}

/**
 * Las medidas tienen que ser de ESTE plan: misma parte, mismo sha, mismos
 * bytes, mismo numero de muestras. Un veredicto sobre otro contenido no se
 * publica.
 */
export function comprobarCorrespondencia(plan: Plan, medidas: readonly MedidaDeParte[]): void {
  if (medidas.length !== plan.partes.length) {
    throw new MedidaIncoherenteError(
      `el plan tiene ${plan.partes.length} partes y llegaron ${medidas.length} medidas`,
    );
  }
  const porNumero = new Map<number, MedidaDeParte>();
  for (const medida of medidas) {
    if (porNumero.has(medida.parte)) {
      throw new MedidaIncoherenteError(`la parte ${medida.parte} llego medida dos veces`);
    }
    porNumero.set(medida.parte, medida);
  }
  for (const parte of plan.partes) {
    const medida = porNumero.get(parte.n);
    if (medida === undefined) {
      throw new MedidaIncoherenteError(`la parte ${parte.n} no llego medida`);
    }
    if (medida.sha !== parte.sha) {
      throw new MedidaIncoherenteError(
        `la parte ${parte.n} se midio con sha ${medida.sha} y el plan dice ${parte.sha}`,
      );
    }
    if (medida.bytes !== parte.bytes) {
      throw new MedidaIncoherenteError(
        `la parte ${parte.n} se midio con ${medida.bytes} B y el plan dice ${parte.bytes} B`,
      );
    }
    if (medida.muestras.length !== plan.consenso) {
      throw new MedidaIncoherenteError(
        `la parte ${parte.n} tiene ${medida.muestras.length} muestras y el plan pide ${plan.consenso}`,
      );
    }
  }
}

export interface Publicacion {
  readonly ruta: string;
  readonly ambito: Ambito;
  readonly consenso: number;
  readonly partes: readonly Parte[];
  readonly agregado: Agregado;
  readonly decision: 'publicar' | 'corregir' | 'parar';
  /** La accion que el operador tiene que tomar. */
  readonly accion: string;
  readonly coste: Coste;
}

/**
 * La decision. Lanza `MedidaIncoherenteError` si las medidas no son del plan.
 */
export function resolver(plan: Plan, medidas: readonly MedidaDeParte[]): Publicacion {
  comprobarCorrespondencia(plan, medidas);
  const agregado = agregar(medidas);
  const decision = agregado.tipo === 'alineado' ? 'publicar' : agregado.tipo === 'deriva' ? 'corregir' : 'parar';
  return {
    ruta: plan.ruta,
    ambito: plan.ambito,
    consenso: plan.consenso,
    partes: plan.partes,
    agregado,
    decision,
    accion: queHacer(agregado),
    coste: costeDe({ llamadas: plan.llamadas, bytes: plan.bytesEnviados }, medidas),
  };
}

/**
 * La superficie del veredicto para el operador: que paso, en que partes, que
 * hacer y cuanto costo. Es lo que L5-T4 pide que exista: un `needs_human` no
 * se queda en un codigo, se convierte en una instruccion.
 */
export function resumenDe(publicacion: Publicacion): readonly string[] {
  const lineas: string[] = [];
  lineas.push(`${publicacion.ruta} · ambito ${publicacion.ambito} · consenso ${publicacion.consenso}`);
  const a = publicacion.agregado;
  if (a.tipo === 'alineado') {
    lineas.push(`alineado: ${a.partes} de ${a.partes} partes · confianza minima ${a.confianzaMinima} · stddev maximo ${a.stddevMaximo}`);
  } else if (a.tipo === 'deriva') {
    lineas.push(`deriva en ${a.partes.length} parte(s): ${a.partes.join(', ')} · ${a.razon}`);
  } else {
    lineas.push(`parada por ${a.motivos.join(' y ')} en ${a.partes.length} parte(s): ${a.partes.join(', ')} · ${a.razon}`);
  }
  lineas.push(`decision: ${publicacion.decision} · ${publicacion.accion}`);
  const c = publicacion.coste;
  lineas.push(
    `coste: ${c.llamadas} llamada(s) · ${c.bytes} B enviados · latencia ${c.latenciaMs === null ? 'no medida' : `${c.latenciaMs} ms`} · tokens no medidos (${c.motivoTokens})`,
  );
  return lineas;
}
