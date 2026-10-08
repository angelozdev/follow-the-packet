import { describe, expect, it } from 'vitest';
import { scoreStars } from './scoring';

describe('scoreStars', () => {
  it('sin objetivo no hay estrellas', () => {
    expect(scoreStars(false, true, true).count).toBe(0);
  });

  it('objetivo + no abrir de más + predicción = 3', () => {
    expect(scoreStars(true, true, true)).toEqual({ objective: true, tight: true, prediction: true, count: 3 });
    expect(scoreStars(true, false, true).count).toBe(2);
    expect(scoreStars(true, false, false).count).toBe(1);
  });
});
