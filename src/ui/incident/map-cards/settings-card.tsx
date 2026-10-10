import { ChipTray } from '@/design';
import type { SettingsCard as Settings } from '@/game';
import { CardIcon } from '@/ui/card-icon';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';
import { ChipCard, trayChips } from './chip-card';

interface SettingsCardProps {
  card: Settings;
  onPick: (settingId: string, chipId: string) => void;
  onClose: () => void;
}

/** The "Ajustes de red" card of a device: a tray of chips for each setting saved on the device, such as its default gateway, with the chip that matches the world picked. A pick is a change of the device: it is reported at once, the world changes, and the tray shows the chip the game says now matches. "Listo" and Escape only close the card. */
export function SettingsCard({ card, onPick, onClose }: SettingsCardProps) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
  return (
    <ChipCard title={card.title} icon={<CardIcon kind="settings" />} heading={heading} onClose={onClose}>
      {card.settings.map((setting) => (
        <ChipTray key={setting.id} name={setting.name} chips={trayChips(setting.chips)} picked={setting.picked} onPick={(chipId) => onPick(setting.id, chipId)} />
      ))}
    </ChipCard>
  );
}
