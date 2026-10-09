import { useReducedMotion } from '@mantine/hooks';
import { useReducer, useState } from 'react';
import { SCREEN_TEXT } from '@/copy';
import { countStars, firewallCard, inspect, pieceViews, sessionReducer, startSession, starsOf } from '@/game';
import type { Incident } from '@/levels';
import { GameScene, pieceDomId } from '@/scene';
import { ExplanationCard } from './explanation-card';
import { InspectionBox } from './inspection-box';
import { LuciaCard } from './lucia-card';
import { ResultCard } from './result-card';
import { TaskCard } from './task-card';

interface IncidentScreenProps {
  incidents: Incident[];
  incidentId: string;
  nextId: string | null;
  onFinish: (stars: number) => void;
}

export function IncidentScreen({ incidents, incidentId, nextId, onFinish }: IncidentScreenProps) {
  const [session, dispatch] = useReducer(sessionReducer, incidentId, (id) => startSession(incidents, id));
  const [inspecting, setInspecting] = useState<string | null>(null);
  const [cardPieceId, setCardPieceId] = useState<string | null>(null);
  const prefersStill = useReducedMotion(false, { getInitialValueInEffect: false });
  const [stillChoice, setStillChoice] = useState<boolean | null>(null);

  const still = stillChoice ?? prefersStill;
  const playing = session.phase === 'playing';
  const pieces = pieceViews(session);
  const card = playing && cardPieceId ? firewallCard(session, cardPieceId) : null;
  const inspection = inspecting ? inspect(session, inspecting) : null;

  const activate = (pieceId: string) => {
    if (playing && pieces.some((piece) => piece.id === pieceId && piece.configurable)) setCardPieceId(pieceId);
  };
  const closeCard = () => {
    if (cardPieceId) document.getElementById(pieceDomId(cardPieceId))?.focus();
    setCardPieceId(null);
  };
  const showResult = () => {
    dispatch({ type: 'showResult' });
    onFinish(countStars(starsOf(session)));
  };

  return (
    <main className="incident">
      <div className="incident__map">
        <header className="incident__bar">
          <a href="#/">{SCREEN_TEXT.back}</a>
          <h1>{session.incident.title}</h1>
          <label className="incident__motion">
            <input type="checkbox" checked={still} onChange={(event) => setStillChoice(event.target.checked)} /> {SCREEN_TEXT.motion}
          </label>
        </header>
        <GameScene
          world={session.world}
          pieces={pieces}
          flows={session.runs}
          still={still}
          activePieceId={card ? cardPieceId : null}
          overlay={
            card && (
              <TaskCard
                key={card.firewallId}
                card={card}
                chips={session.incident.chips}
                onPlace={(whatId, fromId) => dispatch({ type: 'placeRule', firewallId: card.firewallId, whatId, fromId })}
                onRemove={(ruleId) => dispatch({ type: 'removeRule', firewallId: card.firewallId, ruleId })}
                onClose={closeCard}
              />
            )
          }
          onInspect={setInspecting}
          onActivate={activate}
        />
        <div aria-live="polite" className="incident__inspection">{inspection ? <InspectionBox inspection={inspection} /> : <p className="muted">{SCREEN_TEXT.inspectHelp}</p>}</div>
      </div>
      <aside className="incident__side">
        <LuciaCard session={session} onAskHint={() => dispatch({ type: 'showHint' })} onSubmit={() => dispatch({ type: 'submit' })} />
        {session.phase === 'explaining' && (
          <ExplanationCard options={session.incident.explanation} choice={session.choice} onChoose={(index) => dispatch({ type: 'chooseExplanation', index })} onContinue={showResult} />
        )}
        {session.phase === 'result' && <ResultCard stars={starsOf(session)} takeaway={session.incident.takeaway} nextId={nextId} />}
      </aside>
    </main>
  );
}
