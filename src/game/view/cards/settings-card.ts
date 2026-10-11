import { SETTINGS_TEXT, deviceName, toPlainText, type TermText } from '@/copy';
import { settingValue, type SendIncident, type SettingSpec } from '@/levels';
import type { Session } from '@/game/session';
import { PIECE_ID } from '@/game/view/piece-id';

interface SettingChip {
  id: string;
  label: TermText;
}

interface SettingTray {
  id: string;
  name: string;
  picked: string | null;
  chips: SettingChip[];
}

export interface SettingsCard {
  deviceId: string;
  pieceId: string;
  title: TermText;
  settings: SettingTray[];
}

function offeredSettings(session: Session): SettingSpec[] {
  const incident: SendIncident | null = session.incident.mechanic === 'send' ? session.incident : null;
  return incident?.send.settings ?? [];
}

/** Returns the ids of the devices whose settings card the incident offers, once each and in the order of its settings; empty when the incident offers none. */
export function settingsDeviceIds(session: Session): string[] {
  return [...new Set(offeredSettings(session).map((setting) => setting.deviceId))];
}

/** Returns what the settings card of a device shows, opened from its settings entry (`PIECE_ID.settings`): its title and, for each setting the incident offers for it, the name of the tray by its term, the chips, and the chip that matches the world, which is the one whose value is what the setting has now (`settingValue`: the gateway or the DNS server the device has, no value when it has none, or the listen address of the service it names), or none when no chip stands for it. `pieceId` is the piece of the device the card sits beside. Null when the incident offers no setting for that device. */
export function settingsCard(session: Session, entryId: string): SettingsCard | null {
  const deviceId = settingsDeviceIds(session).find((candidate) => PIECE_ID.settings(candidate) === entryId);
  const device = session.world.devices.find((candidate) => candidate.id === deviceId);
  if (deviceId === undefined || !device) return null;
  return {
    deviceId,
    pieceId: PIECE_ID.device(deviceId),
    title: SETTINGS_TEXT.title(deviceName(session.world, deviceId)),
    settings: offeredSettings(session)
      .filter((setting) => setting.deviceId === deviceId)
      .map((setting) => ({
        id: setting.id,
        name: toPlainText(setting.name),
        picked: setting.chips.find((chip) => chip.value === settingValue(session.world, setting))?.id ?? null,
        chips: setting.chips.map(({ id, label }) => ({ id, label })),
      })),
  };
}
