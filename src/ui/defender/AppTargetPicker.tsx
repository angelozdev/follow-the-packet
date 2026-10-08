import type { Network } from '../../engine/types';
import type { Level, LevelAction } from '../../levels/schema';

export function AppTargetPicker({
  spec,
  network,
  onApply,
}: {
  spec: NonNullable<Level['editable']['appTarget']>;
  network: Network;
  onApply: (action: LevelAction) => void;
}) {
  const instance = network.instances.find((i) => i.id === spec.instanceId);
  return (
    <fieldset className="card">
      <legend>¿A dónde apunta la app de {instance?.name ?? spec.instanceId}?</legend>
      {spec.options.map((o) => (
        <label key={o.target} className="radio">
          <input
            type="radio"
            name="app-target"
            value={o.target}
            checked={instance?.appTarget === o.target}
            onChange={() => onApply({ type: 'setAppTarget', instanceId: spec.instanceId, target: o.target })}
          />{' '}
          <span className="mono">{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
