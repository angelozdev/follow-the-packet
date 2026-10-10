import { useReducer, useState } from 'react';
import { EXPLANATION_TEXT, SCREEN_TEXT } from '@/copy';
import { Button } from '@/design';
import { countStars, firewallCard, inspect, pieceViews, sessionReducer, startSession, starsOf, terminalCard, terminalLine, tracerouteLines } from '@/game';
import type { Incident } from '@/levels';
import { GameScene, pieceDomId } from '@/scene';
import { MotionToggle } from '@/ui/motion-toggle';
import { useStillMode } from '@/ui/use-still-mode';
import { ExplanationCard } from './explanation-card';
import { InspectionBox } from './inspection-box';
import { LuciaCard } from './lucia-card';
import { TaskCard } from './map-cards/task-card';
import { TerminalCard } from './map-cards/terminal-card';
import { ResultCard } from './result-card';

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
  const [still, setStill] = useStillMode();
  const playing = session.phase === 'playing';
  const pieces = pieceViews(session);
  const chips = session.incident.mechanic === 'filter' ? session.incident.chips : null;
  const card = playing && chips && cardPieceId ? firewallCard(session, cardPieceId) : null;
  const terminal = playing && cardPieceId ? terminalCard(session, cardPieceId) : null;
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
          <Button variant="text" href="#/">
            {SCREEN_TEXT.back}
          </Button>
          <h1>{session.incident.title}</h1>
          <MotionToggle still={still} className="incident__motion" onChange={setStill} />
        </header>
        <GameScene
          world={session.world}
          pieces={pieces}
          flows={session.runs}
          sent={session.sent}
          still={still}
          activePieceId={card || terminal ? cardPieceId : null}
          overlay={
            (card && chips && (
              <TaskCard
                key={card.firewallId}
                card={card}
                chips={chips}
                onPlace={(whatId, fromId) => dispatch({ type: 'placeRule', firewallId: card.firewallId, whatId, fromId })}
                onRemove={(ruleId) => dispatch({ type: 'removeRule', firewallId: card.firewallId, ruleId })}
                onClose={closeCard}
              />
            )) ||
            (terminal && (
              <TerminalCard
                card={terminal}
                describe={(picks) => terminalLine(session, picks)}
                route={(picks) => tracerouteLines(session, picks)}
                onPickOrigin={(fromId) => setCardPieceId(terminal.origins[fromId])}
                onSend={({ from, to, message }) => dispatch({ type: 'sendPacket', fromId: from, toId: to, messageId: message })}
                onClose={closeCard}
              />
            ))
          }
          onInspect={setInspecting}
          onActivate={activate}
        />
        <div aria-live="polite" className="incident__inspection">
          {inspection ? (
            <InspectionBox inspection={inspection} />
          ) : (
            <>
              <p className="muted">{SCREEN_TEXT.inspectHelp}</p>
              <p className="muted">{SCREEN_TEXT.stampLegend}</p>
            </>
          )}
        </div>
      </div>
      <aside className="incident__side">
        <LuciaCard session={session} onAskHint={() => dispatch({ type: 'showHint' })} onSubmit={() => dispatch({ type: 'submit' })} />
        {session.phase === 'explaining' && (
          <ExplanationCard
            question={session.incident.question ?? EXPLANATION_TEXT.whatHappened}
            options={session.incident.explanation}
            choice={session.choice}
            onChoose={(index) => dispatch({ type: 'chooseExplanation', index })}
            onContinue={showResult}
          />
        )}
        {session.phase === 'result' && <ResultCard stars={starsOf(session)} mechanic={session.incident.mechanic} takeaway={session.incident.takeaway} nextId={nextId} />}
      </aside>
    </main>
  );
}
