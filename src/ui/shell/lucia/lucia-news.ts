import type { Session } from '@/game';
import { isGuided } from '@/levels';

export type LuciaNews = Record<'hints' | 'rejection' | 'alerts' | 'cases' | 'question' | 'result', number>;

export function luciaNews({ incident, hintsShown, rejection, alerts, caseIndex, phase }: Session): LuciaNews {
  return {
    hints: hintsShown,
    rejection: rejection?.attempt ?? 0,
    alerts,
    cases: caseIndex,
    question: Number(phase === 'explaining' && isGuided(incident)),
    result: Number(phase === 'result'),
  };
}

export function hasNews(before: LuciaNews, after: LuciaNews): boolean {
  return Object.entries(after).some(([thing, count]) => count > before[thing as keyof LuciaNews]);
}
