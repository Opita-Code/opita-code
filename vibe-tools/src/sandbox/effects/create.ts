/**
 * LA FABRICA DEL PUERTO: donde el sandbox se vuelve real.
 *
 * Aqui es donde una capacidad se concede o se niega, y donde nace la bitacora.
 * El puerto que sale de aca no tiene referencia al host: sus metodos o ejecutan
 * el backend inyectado o devuelven un rechazo tipado. No hay un tercer camino.
 *
 * AUDITORIA
 * Todo intento queda registrado, concedido o no. Sin esto no se puede afirmar
 * que no hubo exfiltracion: solo que no la hubo vista.
 */

import type { Capability } from '../capability.js';
import { grantsFor } from '../capability.js';
import type { Tier } from '../../axes.js';
import type { EffectAttempt, EffectBackend, EffectPort, EffectResult } from './port.js';

export function createPort(tier: Tier, backend: EffectBackend = {}): EffectPort {
  const granted = grantsFor(tier);
  const log: EffectAttempt[] = [];

  function call(capability: Capability, op: string, impl: (() => unknown) | undefined): EffectResult {
    const ok = granted.includes(capability);
    // La entrada se congela: `attempts` copia el ARRAY, pero sin esto los objetos
    // seguirian siendo internos. Un rastro que se puede editar no es un rastro.
    log.push(Object.freeze({ capability, op, granted: ok }));
    if (!ok) {
      return {
        ok: false,
        why: 'denied',
        capability,
        detail: `${tier} no concede ${capability} (peticion: ${op})`,
      };
    }
    if (impl === undefined) {
      return {
        ok: false,
        why: 'unimplemented',
        capability,
        detail: `${tier} concede ${capability} pero el MVP no tiene backend para ${op}`,
      };
    }
    return { ok: true, value: impl() };
  }

  return {
    granted,
    net: (url) => call('net', `net ${url}`, backend.net ? () => backend.net!(url) : undefined),
    fs: (op, path, body) =>
      call('fs', `fs ${op} ${path}`, backend.fs ? () => backend.fs!(op, path, body) : undefined),
    proc: (argv) =>
      call('process', `proc ${argv.join(' ')}`, backend.proc ? () => backend.proc!(argv) : undefined),
    get attempts(): readonly EffectAttempt[] {
      return log.slice();
    },
  };
}

/**
 * Puerto para herramientas que declaran efecto `none`.
 *
 * No es una conveniencia: es el caso por defecto de T0 y el unico que el MVP
 * ejecuta. Que exista un puerto "mudo" explicito evita que el codigo tenga que
 * fabricar un backend para no hacer nada.
 */
export function sealedPort(tier: Tier = 'T0'): EffectPort {
  return createPort(tier, {});
}