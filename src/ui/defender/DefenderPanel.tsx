import type { Network } from '../../engine/types';
import type { Level, LevelAction } from '../../levels/schema';
import { AppTargetPicker } from './AppTargetPicker';
import { LinuxFlags } from './LinuxFlags';
import { RuleEditor } from './RuleEditor';

export function DefenderPanel({
  level,
  network,
  onApply,
  onLaunch,
  onReset,
}: {
  level: Level;
  network: Network;
  onApply: (action: LevelAction) => void;
  onLaunch: () => void;
  onReset: () => void;
}) {
  const { editable } = level;
  return (
    <>
      {editable.rules && <RuleEditor spec={editable.rules} network={network} onApply={onApply} />}
      {editable.appTarget && <AppTargetPicker spec={editable.appTarget} network={network} onApply={onApply} />}
      {editable.linuxFlags && <LinuxFlags spec={editable.linuxFlags} network={network} onApply={onApply} />}
      <div className="actions">
        <button className="btn btn--primary" onClick={onLaunch}>
          Enviar
        </button>
        <button className="btn" onClick={onReset}>
          Deshacer cambios
        </button>
      </div>
    </>
  );
}
