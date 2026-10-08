import { Html } from '@react-three/drei';
import type { Network, Trace } from '../engine/types';
import { useHtmlPortal } from './htmlLayer';
import { findRule, formatPeer, formatWhat } from '../format';
import type { Layout } from './layout';
import { Label } from './pieces';

/** Notas del DNS ("nombre → IP") y del NAT ("el origen cambia") sobre el mapa. */
export function StepNotes({ trace, layout }: { trace: Trace; layout: Layout }) {
  return (
    <>
      {trace.steps
        .filter((s) => s.stage === 'dns' || s.stage === 'nat')
        .map((s, index) => {
          const position = s.stage === 'nat' ? layout.igw : (layout.instances[s.at]?.door ?? layout.actors[s.at] ?? layout.igw);
          return (
            <Label key={`${s.stage}-${index}`} position={[position[0], 2.5, position[1]]} tone="accent">
              {s.reason}
            </Label>
          );
        })}
    </>
  );
}

/** La lista del guardia: cada regla de entrada con qué ✓/✕ y desde dónde ✓/✕. */
export function GuardList({ trace, network, layout }: { trace: Trace; network: Network; layout: Layout }) {
  const portal = useHtmlPortal();
  const step = trace.steps.find((s) => s.stage === 'sg-in');
  const spot = step ? layout.instances[step.at] : undefined;
  if (!step?.checks || !spot) return null;
  return (
    <Html portal={portal} position={[spot.barrier[0] + 1.3, 1.3, spot.barrier[1]]} zIndexRange={[20, 0]}>
      <div className="guard">
        <p className="guard__title">Lista del guardia</p>
        {step.checks.length === 0 && <p>Sin reglas de entrada.</p>}
        {step.checks.map((c) => {
          const rule = findRule(network, c.sgId, c.ruleId);
          return (
            <p key={`${c.sgId}-${c.ruleId}`} className="guard__row">
              <span className="mono">{rule ? `${formatWhat(rule.what)} · ${formatPeer(rule.peer, network)}` : c.ruleId}</span>
              <span>qué {c.what ? '✓' : '✕'}</span>
              <span>desde dónde {c.from ? '✓' : '✕'}</span>
            </p>
          );
        })}
      </div>
    </Html>
  );
}
