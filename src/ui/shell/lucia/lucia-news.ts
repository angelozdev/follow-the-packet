import type { Session } from '@/game';
import { isGuided } from '@/levels';

export type LuciaNews = Record<'hints' | 'rejection' | 'alerts' | 'cases' | 'question' | 'result', number>;

/** Takes the session and returns what Lucía has said so far, as one count for each thing that is news when it grows: the hints shown in the case, the attempt of her reply to a rejected solution (none once it goes away), the alerts of an intruder that started, the cases opened, whether her question is asked and whether the result is shown. A task ticked, an option chosen and an alert that ends change no count. */
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

/** Takes what Lucía had said and what she says now, and returns true when any count grew: a count that falls back, as a reply that goes away, is not news. */
export function hasNews(before: LuciaNews, after: LuciaNews): boolean {
  return Object.entries(after).some(([thing, count]) => count > before[thing as keyof LuciaNews]);
}
