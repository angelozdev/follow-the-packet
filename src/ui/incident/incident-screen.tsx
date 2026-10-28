import { useMemo, useReducer } from 'react';
import { EXPLANATION_TEXT, SCREEN_TEXT } from '@/copy';
import { Button } from '@/design';
import { PIECE_ID, caseCard, caseSummary, classifiedBlock, clockSteps, countStars, drawnSends, pieceViews, registryLines, sessionReducer, startSession, starsOf } from '@/game';
import { isGuided, type Incident } from '@/levels';
import { GameScene } from '@/scene';
import { ShellPanel } from '@/ui/shell/panel/shell-panel';
import { ShellColumn } from '@/ui/shell/shell-column';
import { StatusBar } from '@/ui/shell/status/status-bar';
import { useSelection } from '@/ui/shell/use-selection';
import { MotionToggle } from '@/ui/motion-toggle';
import { useStillMode } from '@/ui/use-still-mode';
import { CaseCard } from './side-cards/case-card';
import { ClockCard } from './side-cards/clock-card';
import { ExplanationCard } from './side-cards/explanation-card';
import { InspectionBox } from './inspection-box';
import { LuciaCard } from './side-cards/lucia-card';
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
  const [still, setStill] = useStillMode();
  const playing = session.phase === 'playing';
  const pieces = pieceViews(session);
  const sent = useMemo(() => drawnSends(session.sent), [session.sent]);
  const lines = useMemo(() => registryLines(session), [session]);
  const selection = useSelection(session);
  const { inspection, duplicate, trigger, release, holder } = useInspection(session, selection.selected);
  const triggerOf = (key: string) => selection.trigger(key, trigger(key));
  const caseOnCard = session.phase === 'result' ? null : caseCard(session);
  const steps = clockSteps(session);
  const { incident } = session;

  const showResult = () => {
    dispatch({ type: 'showResult' });
    onFinish(countStars(starsOf(session)));
  };
  const nextCase = () => dispatch({ type: 'nextCase' });

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
          sent={sent}
          still={still}
          blockName={classifiedBlock(session)}
          known={session.known}
          activePieceId={selection.pieceId}
          inspectTrigger={triggerOf}
          inspectStampsTrigger={(packetIds) => triggerOf(PIECE_ID.stamps(packetIds))}
          onActivate={() => undefined}
        />
      </div>
      <div aria-live="polite" aria-hidden={duplicate || undefined} className="incident__inspection" {...holder}>
        {inspection && <InspectionBox inspection={inspection} pinned={false} onClose={release} />}
      </div>
      <ShellColumn
        lucia={
          <>
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
          </>
        }
        panel={
          <ShellPanel
            key={caseOnCard?.number}
            session={session}
            dispatch={dispatch}
            inspection={selection.inspection}
            pieceId={selection.pieceId}
            heading={selection.heading}
            onClose={selection.release}
            onChoose={selection.choosePiece}
          />
        }
      />
      <StatusBar lines={lines} choose={(pieceId) => selection.trigger(pieceId, {})} />
    </main>
  );
}
