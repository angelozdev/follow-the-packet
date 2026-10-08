import { useEffect, useReducer, useRef } from 'react';
import { gameReducer, initGame } from '../../game/reducer';
import type { Level } from '../../levels/schema';
import { GameScene } from '../../scene/GameScene';
import { AttackComposer } from '../attacker/AttackComposer';
import { DefenderPanel } from '../defender/DefenderPanel';
import { BriefPanel } from './BriefPanel';
import { PredictPanel } from './PredictPanel';
import { ResultPanel } from './ResultPanel';
import { ToolsPanel } from './ToolsPanel';
import { TraceList } from './TraceList';

export interface LevelScreenProps {
  level: Level;
  reducedMotion: boolean;
  onToggleMotion: () => void;
  onFinish: (stars: number) => void;
}

export function LevelScreen({ level, reducedMotion, onToggleMotion, onFinish }: LevelScreenProps) {
  const [state, dispatch] = useReducer(gameReducer, level, initGame);
  // onFinish cambia de identidad en cada render del padre: guardarlo en una ref evita bucles.
  const onFinishRef = useRef(onFinish);
  useEffect(() => {
    onFinishRef.current = onFinish;
  });
  useEffect(() => {
    if (state.phase === 'result' && state.stars && state.stars.count > 0) onFinishRef.current(state.stars.count);
  }, [state.phase, state.stars]);

  const objective = level.objective;
  return (
    <div className="level">
      <section className="stage" aria-label="Mapa de la red">
        <GameScene
          network={state.network}
          trace={state.phase === 'result' ? state.lastTrace : null}
          packet={state.lastPacket}
          runId={state.attempts}
          reducedMotion={reducedMotion}
          packetColor={level.role === 'attacker' ? 'ink' : 'accent'}
          candidates={state.phase === 'predict' ? level.prediction.candidates : []}
          onPredict={(point) => dispatch({ type: 'predict', point })}
        />
      </section>
      <aside className="side">
        <nav className="side__top">
          <a href="#/">← Roadmap</a>
          <label className="check">
            <input type="checkbox" checked={reducedMotion} onChange={onToggleMotion} /> Sin animaciones
          </label>
        </nav>
        <header>
          <p className="eyebrow">
            Capítulo {level.chapter} · Nivel {level.order} · {level.role === 'defender' ? 'Defensor' : 'Atacante'}
          </p>
          <h1>{level.title}</h1>
        </header>
        {state.phase === 'brief' && <BriefPanel level={level} onStart={() => dispatch({ type: 'start' })} />}
        {state.phase === 'predict' && <PredictPanel level={level} onPredict={(point) => dispatch({ type: 'predict', point })} />}
        {state.phase === 'act' && (
          <>
            <p className="objective">{level.brief}</p>
            {objective.kind === 'attacker' ? (
              <AttackComposer objective={objective} attempts={state.attempts} onLaunch={(attack) => dispatch({ type: 'launch', attack })} />
            ) : (
              <DefenderPanel
                level={level}
                network={state.network}
                onApply={(action) => dispatch({ type: 'apply', action })}
                onLaunch={() => dispatch({ type: 'launch' })}
                onReset={() => dispatch({ type: 'reset' })}
              />
            )}
            <ToolsPanel tools={level.tools} network={state.network} trace={state.lastTrace} />
          </>
        )}
        {state.phase === 'result' && (
          <>
            <ResultPanel state={state} onRetry={() => dispatch({ type: 'retry' })} onHint={() => dispatch({ type: 'showHint' })} />
            {state.lastTrace && <TraceList trace={state.lastTrace} />}
          </>
        )}
      </aside>
    </div>
  );
}
