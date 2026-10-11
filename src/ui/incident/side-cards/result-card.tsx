import { RESULT_TEXT, type TermText } from '@/copy';
import { Button, Card } from '@/design';
import { countStars, type CaseSummary, type Stars as EarnedStars } from '@/game';
import type { Mechanic } from '@/levels';
import { CardIcon } from '@/ui/card-icon';
import { Stars } from '@/ui/stars';
import { TaggedText } from '@/ui/tagged-text';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';

const STAR_KEYS = ['closed', 'middle', 'explained'] as const satisfies readonly (keyof EarnedStars)[];

interface ResultCardProps {
  stars: EarnedStars;
  mechanic: Mechanic;
  takeaway: TermText;
  nextId: string | null;
  cases: CaseSummary | null;
}

function starText(key: (typeof STAR_KEYS)[number], mechanic: Mechanic): string {
  if (mechanic === 'diagnose') return RESULT_TEXT.cases.stars[key];
  return key === 'middle' ? RESULT_TEXT.middle[mechanic] : RESULT_TEXT.stars[key];
}

function CaseOutcomes({ summary }: { summary: CaseSummary }) {
  return (
    <>
      <h3>{RESULT_TEXT.cases.title}</h3>
      <p>{summary.missed.length === 0 ? RESULT_TEXT.cases.allFirstTry(summary.total) : RESULT_TEXT.cases.missed(summary.missed)}</p>
    </>
  );
}

export function ResultCard({ stars, mechanic, takeaway, nextId, cases }: ResultCardProps) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
  return (
    <Card aria-labelledby="result-title" header={{ icon: <CardIcon kind="result" />, type: RESULT_TEXT.type }}>
      <h2 id="result-title" ref={heading} tabIndex={-1}>
        {RESULT_TEXT.title}
      </h2>
      <Stars count={countStars(stars)} />
      <ul className="result__list">
        {STAR_KEYS.map((key) => (
          <li key={key}>
            <span aria-hidden="true">{stars[key] ? '★ ' : '☆ '}</span>
            {starText(key, mechanic)}
            <span className="sr-only"> ({stars[key] ? RESULT_TEXT.earned : RESULT_TEXT.missed})</span>
          </li>
        ))}
      </ul>
      {cases && <CaseOutcomes summary={cases} />}
      <h3>{RESULT_TEXT.takeaway}</h3>
      <p>
        <TaggedText text={takeaway} />
      </p>
      <nav className="result__nav">
        {nextId !== null && (
          <Button variant="primary" href={`#/level/${nextId}`}>
            {RESULT_TEXT.next}
          </Button>
        )}
        <Button href="#/">{RESULT_TEXT.back}</Button>
      </nav>
    </Card>
  );
}
