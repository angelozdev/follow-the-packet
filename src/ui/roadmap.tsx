import { ROADMAP_TEXT } from '@/copy';
import { Button, Card } from '@/design';
import { CHAPTERS, TIERS, type Chapter, type LevelEntry } from '@/levels';
import { isUnlocked, type Progress } from '@/storage';
import { Stars } from './stars';

function ChapterCard({ chapter, levels, progress }: { chapter: Chapter; levels: LevelEntry[]; progress: Progress }) {
  const own = levels.filter((l) => l.chapter === chapter.number);
  const done = own.filter((l) => (progress[l.id] ?? 0) > 0).length;
  return (
    <Card as="li" variant={own.length > 0 ? 'default' : 'soon'}>
      <div className="chapter__head">
        <span className="chapter__num">{chapter.number}</span>
        <h2>
          {chapter.title}
          {chapter.optional && (
            <>
              {' '}
              <span className="caption caption--soft">{ROADMAP_TEXT.optional}</span>
            </>
          )}
        </h2>
        <span className="chapter__meta">{own.length > 0 ? `${done}/${own.length}` : ROADMAP_TEXT.soon}</span>
      </div>
      {own.length > 0 && (
        <ol className="levels">
          {own.map((level) => {
            const label = `${level.order}. ${level.title}`;
            return (
              <li key={level.id} data-level-id={level.id} className="level-item">
                {isUnlocked(level, progress, levels) ? (
                  <Button variant="text" href={`#/level/${level.id}`}>
                    {label}
                  </Button>
                ) : (
                  <span className="locked" aria-disabled="true">
                    {label} {ROADMAP_TEXT.locked}
                  </span>
                )}
                <span className="caption caption--soft">{ROADMAP_TEXT.role[level.role]}</span>
                <Stars count={progress[level.id] ?? 0} />
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}

export function Roadmap({ levels, progress }: { levels: LevelEntry[]; progress: Progress }) {
  return (
    <main className="page roadmap">
      <header>
        <h1>{ROADMAP_TEXT.title}</h1>
        <p className="lede">{ROADMAP_TEXT.lede}</p>
      </header>
      {TIERS.map((tier) => (
        <section key={tier.number} aria-labelledby={`tier-${tier.number}`}>
          <h2 id={`tier-${tier.number}`} className="caption">
            {ROADMAP_TEXT.tier(tier)}
          </h2>
          <ol className="chapters">
            {CHAPTERS.filter((chapter) => chapter.tier === tier.number).map((chapter) => (
              <ChapterCard key={chapter.number} chapter={chapter} levels={levels} progress={progress} />
            ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
