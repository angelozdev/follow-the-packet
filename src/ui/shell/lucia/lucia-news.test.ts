import { describe, expect, it } from 'vitest';
import { isIntruding, sessionReducer, startSession, type Session, type SessionAction } from '@/game';
import { INCIDENTS } from '@/levels';
import { ruleIdFor } from '@/levels/contract/incident';
import { FROM, SG, WHAT } from '@/levels/04-iaas/shared';
import { diagnoseIncident } from '@/testing/incidents';
import { hasNews, luciaNews } from './lucia-news';

const FIRST = '04-01';
const FIX: SessionAction = { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.sgServidor1.id };
const WIDE: SessionAction = { type: 'placeRule', firewallId: SG.servidor2, whatId: WHAT.echoRequest.id, fromId: FROM.anywhere.id };
const TAKE_WIDE_BACK: SessionAction = { type: 'removeRule', firewallId: SG.servidor2, ruleId: ruleIdFor(WHAT.echoRequest.id, FROM.anywhere.id) };
const SUBMIT: SessionAction = { type: 'submit' };
const HINT: SessionAction = { type: 'showHint' };
const CHOOSE: SessionAction = { type: 'chooseExplanation', index: 0 };
const SHOW_RESULT: SessionAction = { type: 'showResult' };
const NEXT_CASE: SessionAction = { type: 'nextCase' };

function play(start: Session, ...actions: SessionAction[]): Session {
  return actions.reduce(sessionReducer, start);
}

function isNews(before: Session, after: Session): boolean {
  return hasNews(luciaNews(before), luciaNews(after));
}

describe('what is new for Lucía', () => {
  it('the news of Lucía change when a hint is shown, a solution is rejected, the alert of an intruder starts, a new case begins, the question appears and the result appears, and not when a task is ticked', () => {
    const start = startSession(INCIDENTS, FIRST);
    const solved = play(start, FIX);
    const asked = play(solved, SUBMIT);
    const answered = play(asked, CHOOSE);
    const diagnose = diagnoseIncident();
    const firstCase = startSession([diagnose], diagnose.id);
    const rightCause = diagnose.diagnose.cases[0].cause.options.findIndex((option) => option.correct);
    const closed = play(firstCase, { type: 'nameCause', index: rightCause });

    expect(isNews(start, play(start, HINT)), 'a hint is shown').toBe(true);
    expect(isNews(start, play(start, SUBMIT)), 'a solution is rejected').toBe(true);
    expect(isNews(start, play(start, WIDE)), 'the alert of an intruder starts').toBe(true);
    expect(isNews(closed, play(closed, NEXT_CASE)), 'a new case begins').toBe(true);
    expect(isNews(solved, asked), 'the question appears').toBe(true);
    expect(isNews(answered, play(answered, SHOW_RESULT)), 'the result appears').toBe(true);
    expect(isNews(start, solved), 'a task is ticked').toBe(false);
  });

  it('what goes away, what is chosen and what only moves the case on are not news', () => {
    const start = startSession(INCIDENTS, FIRST);
    const rejected = play(start, SUBMIT);
    const intruded = play(start, WIDE);
    const asked = play(start, FIX, SUBMIT);
    const diagnose = diagnoseIncident();
    const firstCase = startSession([diagnose], diagnose.id);
    const rightCause = diagnose.diagnose.cases[0].cause.options.findIndex((option) => option.correct);

    expect(isNews(rejected, play(rejected, FIX)), 'a reply that goes away when a rule changes').toBe(false);
    expect(isIntruding(intruded) && !isIntruding(play(intruded, TAKE_WIDE_BACK)), 'the intruder is gone').toBe(true);
    expect(isNews(intruded, play(intruded, TAKE_WIDE_BACK)), 'an alert that ends').toBe(false);
    expect(isNews(asked, play(asked, CHOOSE)), 'an option of the question is chosen').toBe(false);
    expect(isNews(firstCase, play(firstCase, { type: 'nameCause', index: rightCause })), 'the cause of a case is named').toBe(false);
    expect(isNews(rejected, play(rejected, SUBMIT)), 'a second rejection is news again').toBe(true);
    const cleared = play(start, WIDE, SUBMIT, TAKE_WIDE_BACK);
    expect(luciaNews(cleared).rejection, 'the reply went away').toBe(0);
    expect(isNews(cleared, play(cleared, SUBMIT)), 'a rejection after one that went away is news').toBe(true);
  });
});
