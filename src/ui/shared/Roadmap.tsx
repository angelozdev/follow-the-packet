import { CHAPTERS } from '../../levels/chapters';
import type { LevelEntry } from '../../levels/level-entry';
import { isUnlocked, type Progress } from '../../storage/progress';

function Stars({ count }: { count: number }) {
  return (
    <span className="stars-inline">
      <span aria-hidden="true">
        {'★'.repeat(count)}
        {'☆'.repeat(3 - count)}
      </span>
      <span className="sr-only">{count} de 3 estrellas</span>
    </span>
  );
}

export function Roadmap({ levels, progress }: { levels: LevelEntry[]; progress: Progress }) {
  return (
    <main className="page roadmap">
      <header>
        <h1>Sigue el paquete</h1>
        <p className="lede">Un capítulo por módulo del curso. Cada nivel repasa una lección jugando.</p>
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
                <span className="chapter__meta">{own.length > 0 ? `${done}/${own.length}` : 'Próximamente'}</span>
              </div>
              {own.length > 0 && (
                <ol className="levels">
                  {own.map((level) => {
                    const stars = progress[level.id] ?? 0;
                    const label = `${level.order}. ${level.title}`;
                    return (
                      <li key={level.id} data-level-id={level.id} className="level-item">
                        {isUnlocked(level, progress, own) ? (
                          <a href={`#/level/${level.id}`}>{label}</a>
                        ) : (
                          <span className="locked" aria-disabled="true">
                            {label} (bloqueado)
                          </span>
                        )}
                        <span className="role">{level.role === 'defender' ? 'Defensor' : 'Atacante'}</span>
                        <Stars count={stars} />
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
