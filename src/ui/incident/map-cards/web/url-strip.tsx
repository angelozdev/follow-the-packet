import { URL_STRIP_TEXT } from '@/copy';
import { ChipTray } from '@/design';
import type { UrlPartName, UrlPicks, UrlStrip } from '@/game';
import { trayChips } from '@/ui/incident/map-cards/chip-card';

interface UrlStripTrayProps {
  strip: UrlStrip;
  picked: UrlPicks;
  onPick: (part: UrlPartName, value: string) => void;
}

const SEPARATOR_AFTER: Partial<Record<UrlPartName, string>> = { scheme: URL_STRIP_TEXT.separators.host, host: URL_STRIP_TEXT.separators.port };

/** The address of a terminal whose urls come by parts, drawn as the url reads: one tray for each part, in the order of the url, with the separators between them (`://` after the scheme, `:` before the port). A part that offers a single value arrives picked. */
export function UrlStripTray({ strip, picked, onPick }: UrlStripTrayProps) {
  return (
    <div role="group" aria-label={strip.name} className="strip">
      {strip.parts.map((part) => (
        <div key={part.name} className="strip__part">
          <ChipTray name={part.label} chips={trayChips(part.chips)} picked={picked[part.name] ?? null} onPick={(value) => onPick(part.name, value)} />
          {SEPARATOR_AFTER[part.name] && (
            <span className="strip__sep" aria-hidden="true">
              {SEPARATOR_AFTER[part.name]}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
