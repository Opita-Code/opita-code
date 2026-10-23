/**
 * EXEC — aritmetica acotada. T0, sin efecto, determinista.
 *
 * LO QUE ES Y LO QUE NO
 * No es un interprete de Python y su descriptor no dice que lo sea. Evalua una
 * expresion infija de numeros con `+ - * /`, parentesis y menos unario, y nada
 * mas. El plan de MVP pedia "python puro"; un interprete de Python necesita un
 * runtime real, y Pyodide es T1, que L1 dejo sin transporte. Poner algo que solo
 * suma y restar y llamarlo Python habria sido peor que decir lo que hace.
 *
 * POR QUE ES DETERMINISTA SIN PEDIRLO
 * No consulta el reloj, no tira dados, y ni siquiera toca el puerto de efectos:
 * es aritmetica sobre el input y nada mas. En T0 eso no es suerte, es la
 * consecuencia de que la lista blanca de imports este vacia. Por eso su
 * etiqueta `deterministic` no es una promesa del autor que el sandbox espera
 * cumplir: es la unica etiqueta posible para una tool T0 sin Sortidas ocultas.
 *
 * Y EL RESULTADO NO SE REDONDEA
 * `0.1 + 0.2` da `0.30000000000000004`, que es el valor exacto que IEEE754
 * representa. Redondear seria meter una decision dentro de lo que se afirma que
 * es una funcion pura, y obligaria a decidir cada cuantos digitos.
 */

import type { ToolDescriptor } from '../contract.js';
import type { ToolImpl } from '../tool.js';

export const EXEC_DESCRIPTOR: ToolDescriptor = {
  id: 'opita.exec',
  version: '0.1.0',
  author: 'opita',
  title: 'evalua una expresion aritmetica',
  determinism: 'deterministic',
  tier: 'T0',
  effect: 'none',
  inputs: [{ name: 'expr', produces: 'code', artifact: false }],
  outputs: [{ name: 'value', produces: 'text', artifact: false }],
};

const isDigit = (c: string | undefined): boolean => c !== undefined && (c >= '0' && c <= '9' || c === '.');
const isSpace = (c: string | undefined): boolean => c !== undefined && /\s/.test(c);

/**
 * Analisis descendente por precedencia. Tira `Error` con el mensaje que va a ver
 * el autor; la tool lo convierte en `ok:false` con `E_TOOL_ERROR`.
 */
function evaluate(src: string): number {
  let i = 0;
  const bad = (msg: string): never => {
    throw new Error(`${msg} (posicion ${i} de ${src.length})`);
  };
  const ws = (): void => {
    while (isSpace(src[i])) i++;
  };

  function primary(): number {
    ws();
    if (src[i] === '(') {
      i++;
      const v = expr();
      ws();
      if (src[i] !== ')') bad('falta un parentesis de cierre');
      i++;
      return v;
    }
    const start = i;
    while (isDigit(src[i])) i++;
    if (start === i) bad('se esperaba un numero');
    const n = Number(src.slice(start, i));
    if (!Number.isFinite(n)) bad(`numero invalido: ${src.slice(start, i)}`);
    return n;
  }

  function unary(): number {
    ws();
    if (src[i] === '-') {
      i++;
      return -unary();
    }
    return primary();
  }

  function term(): number {
    let v = unary();
    for (;;) {
      ws();
      if (src[i] === '*') {
        i++;
        v *= unary();
      } else if (src[i] === '/') {
        i++;
        const d = unary();
        if (d === 0) bad('division por cero');
        v /= d;
      } else return v;
    }
  }

  function expr(): number {
    let v = term();
    for (;;) {
      ws();
      if (src[i] === '+') {
        i++;
        v += term();
      } else if (src[i] === '-') {
        i++;
        v -= term();
      } else return v;
    }
  }

  const out = expr();
  ws();
  if (i !== src.length) bad('sobro texto al final');
  return out;
}

export const EXEC_IMPL: ToolImpl = (input) => {
  const expr = input['expr'];
  if (typeof expr !== 'string') return { ok: false, error: 'falta el puerto de entrada expr' };
  try {
    return { ok: true, outputs: [{ port: 'value', value: String(evaluate(expr)) }] };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'expresion invalida' };
  }
};