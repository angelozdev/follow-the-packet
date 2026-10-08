import { RESULT_TEXT, type TermText } from '@/copy';
import { countStars, type Stars as EarnedStars } from '@/game';
import { Stars } from '@/ui/stars';
import { TaggedText } from '@/ui/tagged-text';
import { useFocusOnMount } from './use-focus-on-mount';

const STAR_KEYS = ['closed', 'tight', 'explained'] as const satisfies readonly (keyof EarnedStars)[];

export function ResultCard({ stars, takeaway, nextId }: { stars: EarnedStars; takeaway: TermText; nextId: string | null }) {
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
            {RESULT_TEXT.stars[key]}
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
