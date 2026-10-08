import { useId, useState } from 'react';
import { privateDnsName, publicDnsName, resolveName } from '../../engine/dns';
import type { Network, Trace } from '../../engine/types';
import { formatPeer, formatWhat } from '../../format';
import type { Level } from '../../levels/schema';

function RulesTool({ network }: { network: Network }) {
  return (
    <details>
      <summary>Ver reglas</summary>
      {network.instances.map((instance) => (
        <div key={instance.id} className="tool-block">
          <p className="tool-block__title">{instance.name}</p>
          {instance.sgIds.map((sgId) => {
            const group = network.securityGroups.find((g) => g.id === sgId);
            if (!group) return null;
            return (
              <div key={sgId}>
                <p className="muted">SG {group.name} · entrada</p>
                <ul className="mono">
                  {group.inbound.length === 0 ? (
                    <li>Sin reglas</li>
                  ) : (
                    group.inbound.map((r) => (
                      <li key={r.id}>
                        {formatWhat(r.what)} · {formatPeer(r.peer, network)}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      ))}
    </details>
  );
}

function TcpdumpTool({ network, trace }: { network: Network; trace: Trace | null }) {
  const id = useId();
  const [instanceId, setInstanceId] = useState(network.instances[0]?.id ?? '');
  const lines = trace ? trace.tcpdump.filter((l) => l.instanceId === instanceId) : [];
  const output = !trace
    ? 'Aún no has enviado nada.'
    : lines.length === 0
      ? '(nada: ningún paquete llegó a esta máquina)'
      : lines.map((l) => `${l.direction.padEnd(3)} IP ${l.src} > ${l.dst}: ${l.summary}`).join('\n');
  return (
    <details>
      <summary>tcpdump</summary>
      <div className="field">
        <label htmlFor={id}>Escuchar en</label>
        <select id={id} value={instanceId} onChange={(e) => setInstanceId(e.target.value)}>
          {network.instances.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>
      <pre className="terminal" aria-live="polite">
        {output}
      </pre>
    </details>
  );
}

function GetentTool({ network }: { network: Network }) {
  const fromId = useId();
  const nameId = useId();
  const names = network.instances.flatMap((i) => [
    ...(i.publicIp ? [publicDnsName(i.publicIp, network.region)] : []),
    privateDnsName(i.privateIp, network.region),
  ]);
  const [from, setFrom] = useState('outside');
  const [name, setName] = useState(names[0] ?? '');
  const answer = name ? resolveName(network, name, from !== 'outside') : null;
  return (
    <details>
      <summary>getent hosts</summary>
      <div className="field">
        <label htmlFor={fromId}>Preguntar desde</label>
        <select id={fromId} value={from} onChange={(e) => setFrom(e.target.value)}>
          <option value="outside">Tu Mac (fuera de AWS)</option>
          {network.instances.map((i) => (
            <option key={i.id} value={i.id}>
              {i.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={nameId}>Nombre</label>
        <select id={nameId} value={name} onChange={(e) => setName(e.target.value)}>
          {names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
      <pre className="terminal">{answer ? `${answer}    ${name}` : '(sin respuesta)'}</pre>
    </details>
  );
}

export function ToolsPanel({ tools, network, trace }: { tools: Level['tools']; network: Network; trace: Trace | null }) {
  if (tools.length === 0) return null;
  return (
    <section className="card" aria-labelledby="tools-title">
      <h3 id="tools-title">Herramientas</h3>
      {tools.includes('rules') && <RulesTool network={network} />}
      {tools.includes('tcpdump') && <TcpdumpTool network={network} trace={trace} />}
      {tools.includes('getent') && <GetentTool network={network} />}
    </section>
  );
}
