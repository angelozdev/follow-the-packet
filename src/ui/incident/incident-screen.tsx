import { useMediaQuery } from '@mantine/hooks';
import { useMemo, useReducer, useState } from 'react';
import { EXPLANATION_TEXT, MESSAGE_TEXT, SCREEN_TEXT } from '@/copy';
import { Button, Message } from '@/design';
import { PIECE_ID, caseCard, caseSummary, classifiedBlock, clockSteps, countStars, drawnSends, firewallCard, pieceCard, pieceViews, sessionReducer, startSession, starsOf } from '@/game';
import { isGuided, ruleChipsOf, type Incident } from '@/levels';
import { GameScene, pieceDomId } from '@/scene';
import { ShellColumn } from '@/ui/shell/shell-column';
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

const ABOVE_900_PX = '(min-width: 901px)';
const MEDIA_QUERY_AT_FIRST_RENDER = { getInitialValueInEffect: false };

interface InspectHelpProps {
  line: 'p' | 'span';
  className: string;
  cardOpen: boolean;
}

/** The two lines of the inspect help: what hovering or focusing a piece or a stamp does (with no card open, also the sentence about pinning the box) and the legend of the stamps. `line` is the element of each line and `className` its class, so the same words sit in a paragraph under the map or inside a note of the side panel. */
function InspectHelp({ line: Line, className, cardOpen }: InspectHelpProps) {
  return (
    <>
      <Line className={className}>
        {SCREEN_TEXT.inspectHelp}
        {!cardOpen && (
          <>
            {' '}
            <span>{SCREEN_TEXT.inspectPinHelp}</span>
          </>
        )}
      </Line>
      <Line className={className}>{SCREEN_TEXT.stampLegend}</Line>
    </>
  );
}

interface IncidentScreenProps {
  incidents: Incident[];
  incidentId: string;
  nextId: string | null;
  onFinish: (stars: number) => void;
}

export function IncidentScreen({ incidents, incidentId, nextId, onFinish }: IncidentScreenProps) {
  const [session, dispatch] = useReducer(sessionReducer, incidentId, (id) => startSession(incidents, id));
  const [cardPieceId, setCardPieceId] = useState<string | null>(null);
  const [still, setStill] = useStillMode();
  const helpInPanel = useMediaQuery(ABOVE_900_PX, undefined, MEDIA_QUERY_AT_FIRST_RENDER);
  const playing = session.phase === 'playing';
  const pieces = pieceViews(session);
  const sent = useMemo(() => drawnSends(session.sent), [session.sent]);
  const opensCard = (pieceId: string) => playing && pieces.some((candidate) => candidate.id === pieceId && candidate.configurable);
  const firewall = playing && cardPieceId ? firewallCard(session, cardPieceId) : null;
  const chips = firewall && ruleChipsOf(session.incident, firewall.firewallId);
  const card = chips ? firewall : null;
  const piece = playing && cardPieceId ? pieceCard(session, cardPieceId) : null;
  const cardOpen = card !== null || piece !== null;
  const { inspection, pinned, noRoom, trigger, release, heading, holder, watchTheMap } = useInspection(session, opensCard, cardOpen);
  const origins = piece?.tabs.find((tab) => tab.id === 'terminal')?.card.origins;
  const caseOnCard = session.phase === 'result' ? null : caseCard(session);
  const steps = clockSteps(session);
  const { incident } = session;

  const activate = (pieceId: string) => {
    if (opensCard(pieceId)) setCardPieceId(pieceId);
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
      <div className="incident__map" ref={watchTheMap}>
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
          inspectTrigger={trigger}
          inspectStampsTrigger={(packetIds) => trigger(PIECE_ID.stamps(packetIds))}
          onActivate={activate}
        />
      </div>
      <div aria-live="polite" className="incident__inspection" {...holder}>
        {inspection ? (
          <InspectionBox inspection={inspection} pinned={pinned} heading={heading} onClose={release} />
        ) : (
          !helpInPanel && <InspectHelp line="p" className="muted" cardOpen={cardOpen} />
        )}
      </div>
      <ShellColumn
        lucia={
          <>
            <LuciaCard session={session} onAskHint={() => dispatch({ type: 'showHint' })} onSubmit={() => dispatch({ type: 'submit' })} />
            {noRoom && (
              <Message variant="note" words={MESSAGE_TEXT} role="status">
                {SCREEN_TEXT.noRoomForTheBox}
              </Message>
            )}
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
          helpInPanel && (
            <Message variant="note" words={MESSAGE_TEXT}>
              <InspectHelp line="span" className="incident__help-line" cardOpen={cardOpen} />
            </Message>
          )
        }
      />
    </main>
  );
}
