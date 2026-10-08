import { useId, useState } from 'react';
import type { PacketSpec } from '../../engine/types';
import type { AttackerObjective } from '../../levels/schema';

export function AttackComposer({
  objective,
  attempts,
  onLaunch,
}: {
  objective: AttackerObjective;
  attempts: number;
  onLaunch: (packet: PacketSpec) => void;
}) {
  const ids = { origin: useId(), target: useId(), service: useId() };
  const [origin, setOrigin] = useState(0);
  const [target, setTarget] = useState(0);
  const [service, setService] = useState(0);
  const { attack, maxAttempts } = objective;

  const launch = () => {
    const svc = attack.services[service];
    onLaunch({
      from: attack.origins[origin].endpoint,
      to: attack.targets[target].to,
      protocol: svc.protocol,
      ...(svc.protocol === 'icmp' ? { icmpType: svc.icmpType } : { port: svc.port }),
    });
  };

  return (
    <section className="card" aria-labelledby={`${ids.origin}-title`}>
      <h3 id={`${ids.origin}-title`}>Arma el ataque</h3>
      <div className="field">
        <label htmlFor={ids.origin}>Desde</label>
        <select id={ids.origin} value={origin} onChange={(e) => setOrigin(Number(e.target.value))}>
          {attack.origins.map((o, i) => (
            <option key={o.label} value={i}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={ids.target}>Hacia</label>
        <select id={ids.target} value={target} onChange={(e) => setTarget(Number(e.target.value))}>
          {attack.targets.map((t, i) => (
            <option key={t.label} value={i}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={ids.service}>Servicio</label>
        <select id={ids.service} value={service} onChange={(e) => setService(Number(e.target.value))}>
          {attack.services.map((s, i) => (
            <option key={s.label} value={i}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <p className="muted">
        Intentos: {attempts}. Para la segunda estrella, {maxAttempts} o menos.
      </p>
      <button className="btn btn--primary" onClick={launch}>
        Lanzar ataque
      </button>
    </section>
  );
}
