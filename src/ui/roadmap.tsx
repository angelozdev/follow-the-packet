import { ROADMAP_TEXT } from '@/copy';
import { CHAPTERS, type LevelEntry } from '@/levels';
import { isUnlocked, type Progress } from '@/storage';

function Stars({ count }: { count: number }) {
  return (
    <span className="stars-inline">
      <span aria-hidden="true">
        {'★'.repeat(count)}
        {'☆'.repeat(3 - count)}
      </span>
      <span className="sr-only">{ROADMAP_TEXT.starsOf(count)}</span>
    </span>
  );
}

export function Roadmap({ levels, progress }: { levels: LevelEntry[]; progress: Progress }) {
  return (
    <main className="page roadmap">
      <header>
        <h1>{ROADMAP_TEXT.title}</h1>
        <p className="lede">{ROADMAP_TEXT.lede}</p>
      </header>
      <ol className="chapters">
        {CHAPTERS.map((chapter) => {
          const own = levels.filter((l) => l.chapter === chapter.number);
          const done = own.filter((l) => (progress[l.id] ?? 0) > 0).length;
          return (
            <li key={chapter.number} className={own.length > 0 ? 'chapter' : 'chapter chapter--soon'}>
              <div className="chapter__head">
                <span className="chapter__num">{chapter.number}</span>
                <h2>{chapter.title}</h2>
                <span className="chapter__meta">{own.length > 0 ? `${done}/${own.length}` : ROADMAP_TEXT.soon}</span>
              </div>
              {own.length > 0 && (
                <ol className="levels">
                  {own.map((level) => {
                    const label = `${level.order}. ${level.title}`;
                    return (
                      <li key={level.id} data-level-id={level.id} className="level-item">
                        {isUnlocked(level, progress, own) ? (
                          <a href={`#/level/${level.id}`}>{label}</a>
                        ) : (
                          <span className="locked" aria-disabled="true">
                            {label} {ROADMAP_TEXT.locked}
                          </span>
                        )}
                        <span className="role">{ROADMAP_TEXT.role[level.role]}</span>
                        <Stars count={progress[level.id] ?? 0} />
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          );
        })}
      </ol>
    </main>
  );
}
