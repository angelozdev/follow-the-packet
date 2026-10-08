import type { Network } from '../../engine/types';
import { formatPacket, formatSolution } from '../../format';
import type { GameState } from '../../game/reducer';
import type { DefenderEvaluation } from '../../levels/evaluate';
import { levelsOfChapter } from '../../levels/registry';
import type { Level } from '../../levels/schema';

function DefenderDetails({ evaluation, network }: { evaluation: DefenderEvaluation; network: Network }) {
  const failedPass = evaluation.mustPass.filter((r) => !r.ok);
  const failedBlock = evaluation.mustBlock.filter((r) => !r.ok);
  if (failedPass.length === 0 && failedBlock.length === 0 && evaluation.extra.length === 0) return null;
  return (
    <div className="details">
      {failedPass.map((r, i) => (
        <p key={`pass-${i}`}>✕ Debía pasar: {formatPacket(r.packet, network)}</p>
      ))}
      {failedBlock.map((r, i) => (
        <p key={`block-${i}`}>✕ Debía quedar fuera: {formatPacket(r.packet, network)}</p>
      ))}
      {evaluation.extra.length > 0 && (
        <>
          <p>Abriste de más ({evaluation.extra.length}). Por ejemplo:</p>
          <ul className="mono">
            {evaluation.extra.slice(0, 5).map((p, i) => (
              <li key={`extra-${i}`}>{formatPacket(p, network)}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function Hints({ level, shown, onHint }: { level: Level; shown: number; onHint: () => void }) {
  const items = [level.hints[0], level.hints[1], `Solución: ${formatSolution(level)}`].slice(0, shown);
  return (
    <div className="hints">
      {items.map((text) => (
        <p key={text} className="hint">
          {text}
        </p>
      ))}
      {shown < 3 && (
        <button className="btn" onClick={onHint}>
          {shown < 2 ? 'Pedir una pista' : 'Ver la solución'}
        </button>
      )}
    </div>
  );
}

export function ResultPanel({ state, onRetry, onHint }: { state: GameState; onRetry: () => void; onHint: () => void }) {
  const { level, stars, evaluation } = state;
  if (!stars || !evaluation) return null;
  const next = levelsOfChapter(level.chapter).find((l) => l.order === level.order + 1);
  const tightLabel = level.objective.kind === 'attacker' ? `En ${level.objective.maxAttempts} intentos o menos` : 'Sin abrir de más';
  return (
    <section className="card result" aria-live="polite">
      <p className="stars">
        <span aria-hidden="true">
          {'★'.repeat(stars.count)}
          {'☆'.repeat(3 - stars.count)}
        </span>{' '}
        {stars.count} de 3 estrellas
      </p>
      <ul className="checklist">
        <li>{stars.objective ? '✓' : '✕'} Objetivo</li>
        <li>
          {stars.tight ? '✓' : '✕'} {tightLabel}
        </li>
        <li>{stars.prediction ? '✓' : '✕'} Predicción</li>
      </ul>
      {evaluation.kind === 'defender' && <DefenderDetails evaluation={evaluation} network={state.network} />}
      {stars.objective ? (
        <>
          <h3>Lo que te llevas</h3>
          <p>{level.takeaway}</p>
          <p className="muted">
            Tu nota: <code>{level.concept}</code>
          </p>
          <a className="btn btn--primary" href={next ? `#/level/${next.id}` : '#/'}>
            {next ? 'Siguiente nivel' : 'Volver al roadmap'}
          </a>
        </>
      ) : (
        <p>Todavía no. Mira el recorrido paso a paso y vuelve a intentarlo.</p>
      )}
      <Hints level={level} shown={state.hintsShown} onHint={onHint} />
      <button className="btn" onClick={onRetry}>
        Volver a intentar
      </button>
    </section>
  );
}
