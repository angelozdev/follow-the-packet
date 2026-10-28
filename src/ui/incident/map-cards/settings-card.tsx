import { toPlainText } from '@/copy';
import { ChipTray } from '@/design';
import type { ServicesCard as Services, SettingsCard as Settings } from '@/game';
import { TaggedText } from '@/ui/tagged-text';
import { trayChips, type CardFrame } from './card-frame';

type OnPick = (settingId: string, chipId: string) => void;

/** Returns what the «Ajustes de red» card of a device puts in its card: a tray of chips for each setting saved on the device, such as its default gateway or its DNS server, with the chip that matches the world picked, and, when the incident gives no way to set the DNS server, the server the device has and where it got it. A pick is a change of the device: it is reported at once, the world changes, and the tray shows the chip the game says now matches. */
export function settingsFrame(card: Settings, onPick: OnPick): CardFrame {
  return {
    body: (
      <>
        {card.settings.map((setting) => (
          <ChipTray key={setting.id} name={setting.name} chips={trayChips(setting.chips)} picked={setting.picked} onPick={(chipId) => onPick(setting.id, chipId)} />
        ))}
        {card.dns && (
          <div>
            <p className="caption caption--soft">
              <TaggedText text={card.dns.label} />
            </p>
            <p>
              <code>
                <TaggedText text={card.dns.value} ips={false} />
              </code>
            </p>
            <p className="muted">
              <TaggedText text={card.dns.note} />
            </p>
          </div>
        )}
      </>
    ),
  };
}

/** Returns what the «Servicios» card of a device puts in its card: a tray of chips for the listen address of each service the incident offers a setting for, named with the service it sets, with the chip that matches the world picked. */
export function servicesFrame(card: Services, onPick: OnPick): CardFrame {
  return {
    body: card.services.map((service) => (
      <ChipTray key={service.id} name={`${service.name} · ${toPlainText(service.service)}`} chips={trayChips(service.chips)} picked={service.picked} onPick={(chipId) => onPick(service.id, chipId)} />
    )),
  };
}
