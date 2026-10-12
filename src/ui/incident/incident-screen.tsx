import { useReducer, useState } from 'react';
import { EXPLANATION_TEXT, SCREEN_TEXT } from '@/copy';
import { Button } from '@/design';
import { caseCard, caseSummary, classifiedBlock, clockSteps, countStars, firewallCard, inspect, pieceCard, pieceViews, sessionReducer, startSession, starsOf } from '@/game';
import { isGuided, type Incident } from '@/levels';
import { GameScene, pieceDomId } from '@/scene';
import { MotionToggle } from '@/ui/motion-toggle';
import { useStillMode } from '@/ui/use-still-mode';
import { CaseCard } from './side-cards/case-card';
import { ClockCard } from './side-cards/clock-card';
import { ExplanationCard } from './side-cards/explanation-card';
import { InspectionBox } from './inspection-box';
import { LuciaCard } from './side-cards/lucia-card';
import { PieceCard, pieceHandlers } from './map-cards/piece-card';
import { TaskCard } from './map-cards/task-card';
import { ResultCard } from './side-cards/result-card';
import { useInspection } from './use-inspection';

interface IncidentScreenProps {
  incidents: Incident[];
  incidentId: string;
  nextId: string | null;
  onFinish: (stars: number) => void;
}

export function IncidentScreen({ incidents, incidentId, nextId, onFinish }: IncidentScreenProps) {
  const [session, dispatch] = useReducer(sessionReducer, incidentId, (id) => startSession(incidents, id));
  const { inspecting, onInspect, holder } = useInspection();
  const [cardPieceId, setCardPieceId] = useState<string | null>(null);
  const [still, setStill] = useStillMode();
  const playing = session.phase === 'playing';
  const pieces = pieceViews(session);
  const chips = session.incident.mechanic === 'filter' ? session.incident.chips : null;
  const card = playing && chips && cardPieceId ? firewallCard(session, cardPieceId) : null;
  const piece = playing && cardPieceId ? pieceCard(session, cardPieceId) : null;
  const origins = piece?.tabs.find((tab) => tab.id === 'terminal')?.card.origins;
  const inspection = inspecting ? inspect(session, inspecting) : null;
  const caseOnCard = session.phase === 'result' ? null : caseCard(session);
  const steps = clockSteps(session);
  const { incident } = session;

  const activate = (pieceId: string) => {
    if (playing && pieces.some((candidate) => candidate.id === pieceId && candidate.configurable)) setCardPieceId(pieceId);
  };
  const closeCard = () => {
    if (cardPieceId) document.getElementById(pieceDomId(cardPieceId))?.focus();
    setCardPieceId(null);
  };
  const showResult = () => {
    dispatch({ type: 'showResult' });
    onFinish(countStars(starsOf(session)));
  };
  const nextCase = () => {
    setCardPieceId(null);
    dispatch({ type: 'nextCase' });
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
          blockName={classifiedBlock(session)}
          activePieceId={card || piece ? cardPieceId : null}
          overlay={
            (card && chips && (
              <TaskCard
                key={card.firewallId}
                card={card}
                chips={chips}
                onPlace={(whatId, fromId) => dispatch({ type: 'placeRule', firewallId: card.firewallId, whatId, fromId })}
                onRemove={(ruleId) => dispatch({ type: 'removeRule', firewallId: card.firewallId, ruleId })}
                outbound={{
                  onPlace: (whatId, toId) => dispatch({ type: 'placeRule', firewallId: card.firewallId, whatId, toId, direction: 'outbound' }),
                  onRemove: (ruleId) => dispatch({ type: 'removeRule', firewallId: card.firewallId, ruleId, direction: 'outbound' }),
                }}
                onClose={closeCard}
              />
            )) ||
            (piece && (
              <PieceCard card={piece} {...pieceHandlers(session, dispatch, (fromId) => origins?.[fromId] && setCardPieceId(origins[fromId]))} onClose={closeCard} />
            ))
          }
          onInspect={onInspect}
          onActivate={activate}
        />
      </div>
      <div aria-live="polite" className="incident__inspection" {...holder}>
        {inspection ? (
          <InspectionBox inspection={inspection} />
        ) : (
          <>
            <p className="muted">{SCREEN_TEXT.inspectHelp}</p>
            <p className="muted">{SCREEN_TEXT.stampLegend}</p>
          </>
        )}
      </div>
      <aside className="incident__side">
        <LuciaCard session={session} onAskHint={() => dispatch({ type: 'showHint' })} onSubmit={() => dispatch({ type: 'submit' })} />
        {playing && steps.length > 0 && <ClockCard seconds={session.clock} steps={steps} onWait={(seconds) => dispatch({ type: 'wait', seconds })} />}
        {caseOnCard && (
          <CaseCard key={caseOnCard.number} card={caseOnCard} onNameCause={(index) => dispatch({ type: 'nameCause', index })} onNext={nextCase} onShowResult={showResult} />
        )}
        {session.phase === 'explaining' && isGuided(incident) && (
          <ExplanationCard
            question={incident.question ?? EXPLANATION_TEXT.whatHappened}
            options={incident.explanation}
            choice={session.choice}
            onChoose={(index) => dispatch({ type: 'chooseExplanation', index })}
            onContinue={showResult}
          />
        )}
        {session.phase === 'result' && <ResultCard stars={starsOf(session)} mechanic={incident.mechanic} takeaway={incident.takeaway} nextId={nextId} cases={caseSummary(session)} />}
      </aside>
    </main>
  );
}
