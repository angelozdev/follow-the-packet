import { RESULT_TEXT, type TermText } from '@/copy';
import { countStars, type Stars as EarnedStars } from '@/game';
import type { Mechanic } from '@/levels';
import { Stars } from '@/ui/stars';
import { TaggedText } from '@/ui/tagged-text';
import { useFocusOnMount } from './use-focus-on-mount';

const STAR_KEYS = ['closed', 'middle', 'explained'] as const satisfies readonly (keyof EarnedStars)[];

function starText(key: (typeof STAR_KEYS)[number], mechanic: Mechanic): string {
  return key === 'middle' ? RESULT_TEXT.middle[mechanic] : RESULT_TEXT.stars[key];
}

export function ResultCard({ stars, mechanic, takeaway, nextId }: { stars: EarnedStars; mechanic: Mechanic; takeaway: TermText; nextId: string | null }) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
  return (
    <section className="card result" aria-labelledby="result-title">
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
      <h3>{RESULT_TEXT.takeaway}</h3>
      <p>
        <TaggedText text={takeaway} />
      </p>
      <nav className="result__nav">
        {nextId !== null && (
          <a className="btn btn--primary" href={`#/level/${nextId}`}>
            {RESULT_TEXT.next}
          </a>
        )}
        <a className="btn" href="#/">
          {RESULT_TEXT.back}
        </a>
      </nav>
    </section>
  );
}
