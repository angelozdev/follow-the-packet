import { useId, useState } from 'react';
import type { Network } from '../../engine/types';
import { formatPeer, formatWhat } from '../../format';
import type { Level, LevelAction } from '../../levels/schema';

let counter = 0;
function newRuleId(): string {
  counter += 1;
  return `user-${counter}`;
}

export interface RuleEditorProps {
  spec: NonNullable<Level['editable']['rules']>;
  network: Network;
  onApply: (action: LevelAction) => void;
}

export function RuleEditor({ spec, network, onApply }: RuleEditorProps) {
  const ids = { sg: useId(), what: useId(), peer: useId() };
  const [sgId, setSgId] = useState(spec.sgIds[0]);
  const [whatIndex, setWhatIndex] = useState(0);
  const [peerIndex, setPeerIndex] = useState(0);
  const group = network.securityGroups.find((g) => g.id === sgId);
  if (!group) return null;

  const add = () =>
    onApply({
      type: 'addRule',
      sgId,
      rule: { id: newRuleId(), what: spec.whatOptions[whatIndex].what, peer: spec.peerOptions[peerIndex].peer },
    });

  return (
    <section className="card" aria-labelledby={`${ids.sg}-title`}>
      <h3 id={`${ids.sg}-title`}>Reglas de entrada</h3>
      {spec.sgIds.length > 1 && (
        <div className="field">
          <label htmlFor={ids.sg}>Security Group</label>
          <select id={ids.sg} value={sgId} onChange={(e) => setSgId(e.target.value)}>
            {spec.sgIds.map((id) => (
              <option key={id} value={id}>
                {network.securityGroups.find((g) => g.id === id)?.name ?? id}
              </option>
            ))}
          </select>
        </div>
      )}
      <table className="rules">
        <caption className="sr-only">Reglas de entrada del SG {group.name}</caption>
        <thead>
          <tr>
            <th scope="col">Qué</th>
            <th scope="col">Desde dónde</th>
            <th scope="col">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {group.inbound.length === 0 && (
            <tr>
              <td colSpan={3}>Sin reglas: no entra nada.</td>
            </tr>
          )}
          {group.inbound.map((rule) => (
            <tr key={rule.id}>
              <td className="mono">{formatWhat(rule.what)}</td>
              <td className="mono">{formatPeer(rule.peer, network)}</td>
              <td>
                <button
                  className="btn btn--small"
                  aria-label={`Borrar regla ${formatWhat(rule.what)} desde ${formatPeer(rule.peer, network)}`}
                  onClick={() => onApply({ type: 'removeRule', sgId, ruleId: rule.id })}
                >
                  Borrar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="rule-form">
        <div className="field">
          <label htmlFor={ids.what}>Qué</label>
          <select id={ids.what} value={whatIndex} onChange={(e) => setWhatIndex(Number(e.target.value))}>
            {spec.whatOptions.map((o, i) => (
              <option key={o.label} value={i}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor={ids.peer}>Desde dónde</label>
          <select id={ids.peer} value={peerIndex} onChange={(e) => setPeerIndex(Number(e.target.value))}>
            {spec.peerOptions.map((o, i) => (
              <option key={o.label} value={i}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <button className="btn" onClick={add}>
          Agregar regla
        </button>
      </div>
    </section>
  );
}
