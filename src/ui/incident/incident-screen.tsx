import { useMemo, useReducer, type MouseEvent } from 'react';
import { EXPLANATION_TEXT } from '@/copy';
import { PIECE_ID, caseCard, caseSummary, classifiedBlock, clockSteps, countStars, drawnSends, pieceViews, registryLines, sessionReducer, startSession, starsOf, type RouteRow } from '@/game';
import { isGuided, type Incident } from '@/levels';
import { GameScene } from '@/scene';
import type { Progress } from '@/storage';
import { LuciaZone } from '@/ui/shell/lucia/lucia-zone';
import { useLuciaFold } from '@/ui/shell/lucia/use-lucia-fold';
import { ShellPanel } from '@/ui/shell/panel/shell-panel';
import { usePanelChoice } from '@/ui/shell/panel/use-panel-choice';
import { NewestLine } from '@/ui/shell/status/newest-line';
import { BottomStrip } from '@/ui/shell/strip/bottom-strip';
import { GameClock } from '@/ui/shell/strip/game-clock';
import { SystemsBar } from '@/ui/shell/systems/systems-bar';
import { useSystems } from '@/ui/shell/systems/use-systems';
import { TopStrip } from '@/ui/shell/strip/top-strip';
import { useSelection } from '@/ui/shell/use-selection';
import { AlmanacWindow } from '@/ui/shell/windows/almanac-window';
import { lessonsOf } from '@/ui/shell/windows/almanac-lessons';
import { RegistryWindow } from '@/ui/shell/windows/registry-window';
import { SYSTEM_WINDOW, useSystemWindow } from '@/ui/shell/windows/use-system-window';
import { useStillMode } from '@/ui/use-still-mode';
import { CaseCard } from './side-cards/case-card';
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
  progress?: Progress;
}

export function IncidentScreen({ incidents, incidentId, nextId, onFinish, progress = {} }: IncidentScreenProps) {
  const [session, dispatch] = useReducer(sessionReducer, incidentId, (id) => startSession(incidents, id));
  const [still, setStill] = useStillMode();
  const playing = session.phase === 'playing';
  const pieces = pieceViews(session);
  const sent = useMemo(() => drawnSends(session.sent), [session.sent]);
  const lines = useMemo(() => registryLines(session), [session]);
  const selection = useSelection(session);
  const panelChoice = usePanelChoice();
  const fold = useLuciaFold(session);
  const windows = useSystemWindow(lines.length > 0 ? [SYSTEM_WINDOW.registry, SYSTEM_WINDOW.almanac] : [SYSTEM_WINDOW.almanac]);
  const systems = useSystems(session, selection, panelChoice, windows, lines.length);
  const covered = windows.open !== null;
  const chooseLine = (pieceId: string) => {
    const props = selection.trigger(pieceId, {});
    return {
      ...props,
      onClick: (event: MouseEvent<HTMLElement>) => {
        props.onClick?.(event);
        windows.close();
      },
    };
  };
  const { inspection, duplicate, trigger, holder } = useInspection(session, selection.selected);
  const triggerOf = (key: string) => selection.trigger(key, trigger(key));
  const caseOnCard = session.phase === 'result' ? null : caseCard(session);
  const steps = clockSteps(session);
  const clock = playing && steps.length > 0 && <GameClock seconds={session.clock} steps={steps} onWait={(seconds) => dispatch({ type: 'wait', seconds })} />;
  const { incident } = session;
  const almanac = { domId: windows.buttonId(SYSTEM_WINDOW.almanac), expanded: windows.open === SYSTEM_WINDOW.almanac, onPress: () => windows.toggle(SYSTEM_WINDOW.almanac) };

  const showResult = () => {
    dispatch({ type: 'showResult' });
    onFinish(countStars(starsOf(session)));
  };
  const nextCase = () => dispatch({ type: 'nextCase' });
  const seeRow = ({ pieceId, send }: RouteRow) => {
    windows.close();
    panelChoice.chooseTab(pieceId, 'tables');
    panelChoice.chooseFicha(pieceId, 'tables', 'routes');
    selection.showRow(pieceId, send);
  };

  return (
    <main className="incident">
      <TopStrip title={incident.title} still={still} onStillChange={setStill} almanac={almanac} clock={clock} />
      <LuciaZone id={fold.controls} inert={covered}>
        <LuciaCard session={session} onAskHint={() => dispatch({ type: 'showHint' })} onSubmit={() => dispatch({ type: 'submit' })} fold={fold} />
        {caseOnCard && <CaseCard key={caseOnCard.number} card={caseOnCard} onNameCause={(index) => dispatch({ type: 'nameCause', index })} onNext={nextCase} onShowResult={showResult} hidden={fold.folded} />}
        {session.phase === 'explaining' && isGuided(incident) && (
          <ExplanationCard
            question={incident.question ?? EXPLANATION_TEXT.whatHappened}
            options={incident.explanation}
            choice={session.choice}
            onChoose={(index) => dispatch({ type: 'chooseExplanation', index })}
            onContinue={showResult}
            hidden={fold.folded}
          />
        )}
        {session.phase === 'result' && <ResultCard stars={starsOf(session)} mechanic={incident.mechanic} takeaway={incident.takeaway} nextId={nextId} cases={caseSummary(session)} hidden={fold.folded} />}
      </LuciaZone>
      <div className="incident__map" inert={covered}>
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
        {inspection && <InspectionBox inspection={inspection} pinned={false} />}
      </div>
      <aside className="incident__panel" inert={covered}>
        <ShellPanel
          key={caseOnCard?.number}
          session={session}
          dispatch={dispatch}
          inspection={selection.inspection}
          pieceId={selection.pieceId}
          heading={selection.heading}
          onClose={selection.release}
          onChoose={selection.choosePiece}
          choice={panelChoice}
          markedSend={selection.markedSend}
        />
      </aside>
      <BottomStrip
        line={<NewestLine lines={lines} choose={chooseLine} seeRow={seeRow} />}
        bar={systems.length > 0 && <SystemsBar systems={systems} />}
        box={
          <>
            <RegistryWindow windows={windows} lines={lines} choose={chooseLine} seeRow={seeRow} />
            <AlmanacWindow windows={windows} known={session.known} newTerms={new Set(incident.introduces)} lessons={lessonsOf(incidents, incidentId, progress)} />
          </>
        }
      />
    </main>
  );
}
