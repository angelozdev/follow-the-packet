import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { deathPoint } from '../engine/checkpoints';
import { scoreStars } from '../engine/scoring';
import { simulate } from '../engine/simulate';
import { REPO_ROOT, syllabusLessons } from '../test-utils/repo';
import { materialize } from './apply';
import { CHAPTERS } from './chapters';
import { applySolution, evaluateAttack, evaluateDefender } from './evaluate';
import { LEVELS } from './registry';
import type { Level } from './schema';

const lessons = syllabusLessons();

it('hay niveles registrados y sin ids repetidos', () => {
  expect(LEVELS.length).toBeGreaterThan(0);
  expect(new Set(LEVELS.map((l) => l.id)).size).toBe(LEVELS.length);
});

describe.each(LEVELS.map((l): [string, Level] => [l.id, l]))('nivel %s', (_id, level) => {
  it('pertenece a un capítulo del pensum', () => {
    expect(CHAPTERS.map((c) => c.number)).toContain(level.chapter);
  });

  it('cita una lección que existe en syllabus.md', () => {
    expect(lessons.has(level.lesson)).toBe(true);
  });

  it('enlaza una nota de concepto que existe', () => {
    expect(existsSync(resolve(REPO_ROOT, level.concept))).toBe(true);
  });

  it('la respuesta de la predicción coincide con el motor', () => {
    const packet = materialize(level.prediction.packet, level.network);
    expect(deathPoint(simulate(level.network, packet))).toEqual(level.prediction.answer);
  });

  it('el punto de partida no cumple el objetivo', () => {
    if (level.objective.kind === 'defender') {
      expect(evaluateDefender(level, level.network).objective).toBe(false);
    } else {
      expect(evaluateAttack(level, level.network, level.prediction.packet).objective).toBe(false);
    }
  });

  it('la solución de referencia gana con 3 estrellas', () => {
    if (level.solution.kind === 'defender') {
      const result = evaluateDefender(level, applySolution(level));
      expect(result.mustPass.filter((r) => !r.ok).map((r) => r.packet)).toEqual([]);
      expect(result.mustBlock.filter((r) => !r.ok).map((r) => r.packet)).toEqual([]);
      expect(result.extra).toEqual([]);
      expect(scoreStars(result.objective, result.tight, true).count).toBe(3);
    } else if (level.objective.kind === 'attacker') {
      const result = evaluateAttack(level, level.network, level.solution.packet);
      expect(scoreStars(result.objective, 1 <= level.objective.maxAttempts, true).count).toBe(3);
    }
  });

  it('la solución solo usa opciones que el nivel ofrece', () => {
    const { rules, appTarget, linuxFlags } = level.editable;
    if (level.solution.kind === 'defender') {
      for (const action of level.solution.actions) {
        switch (action.type) {
          case 'addRule':
            expect(rules?.sgIds).toContain(action.sgId);
            expect(rules?.whatOptions.map((o) => o.what)).toContainEqual(action.rule.what);
            expect(rules?.peerOptions.map((o) => o.peer)).toContainEqual(action.rule.peer);
            break;
          case 'removeRule':
            expect(rules?.sgIds).toContain(action.sgId);
            break;
          case 'setAppTarget':
            expect(appTarget?.options.map((o) => o.target)).toContain(action.target);
            break;
          case 'setIgnoreIcmpEcho':
            expect(linuxFlags?.instanceIds).toContain(action.instanceId);
            break;
        }
      }
    } else if (level.objective.kind === 'attacker') {
      const { attack } = level.objective;
      const p = level.solution.packet;
      expect(attack.origins.map((o) => o.endpoint)).toContainEqual(p.from);
      expect(attack.targets.map((t) => t.to)).toContain(p.to);
      expect(attack.services.map((s) => ({ protocol: s.protocol, port: s.port, icmpType: s.icmpType }))).toContainEqual({
        protocol: p.protocol,
        port: p.port,
        icmpType: p.icmpType,
      });
    }
  });
});
