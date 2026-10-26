/**
 * Los tests de la matriz.
 *
 * El corpus del backtest se recalcula aqui, aparte del pipeline: dos
 * implementaciones independientes tienen que coincidir, y si el pipeline
 * cambia el corpus, el test lo dice.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { resumen, cuerpoDe, proyectar, matriz, renderMatriz, TOPE } from './matriz.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

test('L5 · el resumen ordena el corpus y no inventa percentiles', () => {
  const r = resumen([300, 100, 200]);
  assert.equal(r.n, 3);
  assert.equal(r.min, 100);
  assert.equal(r.max, 300);
  assert.equal(r.p50, 200);
  assert.ok(r.p50 <= r.p75, 'el p50 no puede pasar del p75');
});

test('L5 · un corpus vacio no produce numeros', () => {
  const r = resumen([]);
  assert.equal(r.n, 0);
  assert.equal(r.p50, 0);
  assert.equal(r.max, 0);
});

test('L5 · la p50 y la p75 acotan el corpus: el rango es la banda honesta', () => {
  const r = resumen([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  assert.ok(r.p50 >= r.min && r.p50 <= r.max);
  assert.ok(r.p75 >= r.p50 && r.p75 <= r.max);
});

test('L5 · la proyeccion crece con la afirmacion, y no con el azar', () => {
  const cuerpo = cuerpoDe('cierre', [
    { clase: 'cierre', claim: 'a'.repeat(100), bytes: 3000 },
    { clase: 'cierre', claim: 'a'.repeat(200), bytes: 3100 },
  ]);
  const corta = proyectar(cuerpo, 'a'.repeat(50));
  const larga = proyectar(cuerpo, 'a'.repeat(400));
  assert.ok(larga > corta, 'una afirmacion mas larga no puede proyectar menos');
});

test('L5 · sin corpus no hay proyeccion, y se dice', () => {
  const cuerpo = cuerpoDe('cierre', []);
  assert.equal(proyectar(cuerpo, 'algo'), null);
});

test('L5 · una parte sin afirmacion queda marcada: no se puede certificar', () => {
  const m = matriz({ id: 'X', nombre: 'X' }, [
    { id: 'X-1', clase: 'avances', claim: '   ', bytes: 100 },
  ], { avances: cuerpoDe('avances', [{ clase: 'avances', claim: 'algo', bytes: 100 }]) });
  assert.deepEqual(m.sinAfirmacion, ['X-1']);
});

test('L5 · una parte fuera del tope se lista aparte, y el total es la suma', () => {
  const cuerpos = { avances: cuerpoDe('avances', [{ clase: 'avances', claim: 'x', bytes: 100 }]) };
  const m = matriz({ id: 'X', nombre: 'X' }, [
    { id: 'X-1', clase: 'avances', claim: 'una', bytes: 100 },
    { id: 'X-2', clase: 'avances', claim: 'otra', bytes: TOPE + 1 },
  ], cuerpos);
  assert.deepEqual(m.fueraDeTope, ['X-2']);
  assert.equal(m.bytesTotal, 100 + TOPE + 1);
});

test('L5 · un numero proyectado no se escribe como medido', () => {
  const cuerpos = { avances: cuerpoDe('avances', [{ clase: 'avances', claim: 'x', bytes: 100 }]) };
  const m = matriz({ id: 'X', nombre: 'X' }, [
    { id: 'X-1', clase: 'avances', claim: 'una', bytes: 100 },
    { id: 'X-2', clase: 'avances', claim: 'otra', bytes: null },
  ], cuerpos);
  assert.equal(m.medidos, 1);
  assert.equal(m.proyectados, 1);
  assert.equal(m.partes.find((p) => p.id === 'X-2').origen, 'proyectado');
});

test('L5 · el render declara el tope y de donde sale cada numero', () => {
  const cuerpos = { avances: cuerpoDe('avances', [{ clase: 'avances', claim: 'x', bytes: 100 }]) };
  const m = matriz({ id: 'X', nombre: 'X' }, [
    { id: 'X-1', clase: 'avances', claim: 'una', bytes: 100 },
  ], cuerpos);
  const txt = renderMatriz([m]);
  assert.ok(txt.includes('4096'), 'el render tiene que decir el tope');
  assert.ok(txt.includes('medido'), 'el render tiene que decir de donde sale el numero');
});

test('L5 · BACKTEST: la estimacion cae en la banda sobre el corpus congelado', () => {
  // El corpus congelado son los cierres medidos el 2026-10-25: cuatro
  // documentos de cierre, con su tamano real. Es una medicion historica, y
  // por eso lleva fecha: el estimador se prueba contra lo que se midio, no
  // contra lo que se mide hoy (el harness corre en un sandbox sin el repo).
  const MEDIDO = [4047, 3392, 2619, 1951];
  const cuerpo = cuerpoDe('cierre', MEDIDO.map((bytes) => ({ clase: 'cierre', claim: '', bytes })));
  for (const bytes of MEDIDO) {
    const proy = proyectar(cuerpo, '');
    assert.ok(proy !== null, 'hay corpus, hay proyeccion');
    const ratio = proy / bytes;
    assert.ok(ratio > 0.5 && ratio < 2, `la proyeccion se fue de la banda: ${bytes} medido, ${proy} proyectado`);
  }
});

test('L5 · BACKTEST en vivo: el corpus del repo da la misma banda', () => {
  // El mismo test contra el corpus de HOY. Se salta cuando el repo no esta
  // a mano (el sandbox del harness), y por eso el de arriba existe.
  const fuente = join(root, 'vibe-tools', 'estado.json');
  if (!existsSync(fuente)) return;
  const estado = JSON.parse(readFileSync(fuente, 'utf8'));
  const partes = [];
  for (const l of estado.loops) {
    if (!l.documento_cierre) continue;
    const p = join(root, l.documento_cierre);
    if (!existsSync(p)) continue;
    partes.push({
      clase: 'cierre',
      claim: l.hallazgo ?? '',
      bytes: Buffer.byteLength(readFileSync(p, 'utf8'), 'utf8'),
    });
  }
  assert.ok(partes.length >= 3, 'el corpus real es demasiado pequeno para un backtest');
  const cuerpo = cuerpoDe('cierre', partes);
  for (const p of partes) {
    const proy = proyectar(cuerpo, p.claim);
    assert.ok(proy !== null, 'hay corpus, hay proyeccion');
    const ratio = proy / p.bytes;
    assert.ok(ratio > 0.5 && ratio < 2, `la proyeccion se fue de la banda: ${p.bytes} medido, ${proy} proyectado`);
  }
});
