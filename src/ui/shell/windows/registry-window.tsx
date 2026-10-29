import { SYSTEMS_TEXT } from '@/copy';
import type { RegistryLine } from '@/game';
import type { ChooseLine, SeeRow } from '@/ui/shell/status/line-text';
import { Registry } from '@/ui/shell/status/registry';
import { SystemWindow } from './system-window';
import { SYSTEM_WINDOW, type SystemWindowId, type SystemWindowState } from './use-system-window';

interface RegistryWindowProps {
  windows: SystemWindowState<SystemWindowId>;
  lines: RegistryLine[];
  choose: ChooseLine;
  seeRow: SeeRow;
}

export function RegistryWindow({ windows, lines, choose, seeRow }: RegistryWindowProps) {
  const id = SYSTEM_WINDOW.registry;
  return (
    <SystemWindow name={SYSTEMS_TEXT.registry} open={windows.open === id} onClose={windows.close} buttonId={windows.buttonId(id)}>
      <Registry id={windows.controlsId(id)} labelledBy={windows.buttonId(id)} lines={lines} choose={choose} seeRow={seeRow} />
    </SystemWindow>
  );
}
