import type { Network } from '../../engine/types';
import type { Level, LevelAction } from '../../levels/schema';

export function LinuxFlags({
  spec,
  network,
  onApply,
}: {
  spec: NonNullable<Level['editable']['linuxFlags']>;
  network: Network;
  onApply: (action: LevelAction) => void;
}) {
  return (
    <fieldset className="card">
      <legend>Linux</legend>
      {spec.instanceIds.map((id) => {
        const instance = network.instances.find((i) => i.id === id);
        if (!instance) return null;
        return (
          <label key={id} className="check">
            <input
              type="checkbox"
              checked={instance.linux.ignoreIcmpEcho}
              onChange={(e) => onApply({ type: 'setIgnoreIcmpEcho', instanceId: id, value: e.target.checked })}
            />{' '}
            {instance.name} ignora los ping <span className="mono">(icmp_echo_ignore_all)</span>
          </label>
        );
      })}
    </fieldset>
  );
}
