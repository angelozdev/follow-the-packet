import { useReducer, useState } from 'react';
import { EXPLANATION_TEXT, SCREEN_TEXT } from '@/copy';
import { Button } from '@/design';
import { caseCard, caseSummary, countStars, firewallCard, identifyCard, inspect, pieceViews, sessionReducer, settingsCard, startSession, starsOf, terminalCard, terminalLine, tracerouteLines } from '@/game';
import { isGuided, type Incident } from '@/levels';
import { GameScene, pieceDomId } from '@/scene';
import { MotionToggle } from '@/ui/motion-toggle';
import { useStillMode } from '@/ui/use-still-mode';
import { CaseCard } from './case-card';
import { ExplanationCard } from './explanation-card';
import { InspectionBox } from './inspection-box';
import { LuciaCard } from './lucia-card';
import { IdentifyCard } from './map-cards/identify-card';
import { SettingsCard } from './map-cards/settings-card';
import { TaskCard } from './map-cards/task-card';
import { TerminalCard } from './map-cards/terminal/terminal-card';
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
  const identify = playing && cardPieceId ? identifyCard(session, cardPieceId) : null;
  const settings = playing && cardPieceId ? settingsCard(session, cardPieceId) : null;
  const inspection = inspecting ? inspect(session, inspecting) : null;
  const caseOnCard = session.phase === 'result' ? null : caseCard(session);
  const { incident } = session;

  const activate = (pieceId: string) => {
    if (playing && pieces.some((piece) => (piece.id === pieceId && piece.configurable) || piece.settings?.id === pieceId)) setCardPieceId(pieceId);
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
          activePieceId={card || terminal || identify || settings ? (settings?.pieceId ?? cardPieceId) : null}
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
            (terminal && (
              <TerminalCard
                card={terminal}
                describe={(picks) => terminalLine(session, picks)}
                route={(picks) => tracerouteLines(session, picks)}
                onPickOrigin={(fromId) => setCardPieceId(terminal.origins[fromId])}
                onSend={({ from, to, message }) => dispatch({ type: 'sendPacket', fromId: from, toId: to, messageId: message })}
                onClose={closeCard}
              />
            )) ||
            (identify && (
              <IdentifyCard
                key={identify.deviceId}
                card={identify}
                onAnswer={(picks) => dispatch({ type: 'answerCard', deviceId: identify.deviceId, picks })}
                onClose={closeCard}
              />
            )) ||
            (settings && (
              <SettingsCard
                key={settings.deviceId}
                card={settings}
                onPick={(settingId, chipId) => dispatch({ type: 'setSetting', deviceId: settings.deviceId, settingId, chipId })}
                onClose={closeCard}
              />
            ))
          }
          onInspect={setInspecting}
          onActivate={activate}
        />
      </div>
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
      <aside className="incident__side">
        <LuciaCard session={session} onAskHint={() => dispatch({ type: 'showHint' })} onSubmit={() => dispatch({ type: 'submit' })} />
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
