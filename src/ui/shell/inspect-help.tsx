import { MESSAGE_TEXT, SCREEN_TEXT } from '@/copy';
import { Message } from '@/design';

/** The panel when the player has chosen nothing: a note with what hovering or focusing a piece or a stamp does, what a click does, and the legend of the stamps and the lock. */
export function InspectHelp() {
  return (
    <Message variant="note" words={MESSAGE_TEXT}>
      <span className="incident__help-line">
        {SCREEN_TEXT.inspectHelp} <span>{SCREEN_TEXT.inspectClickHelp}</span>
      </span>
      <span className="incident__help-line">{SCREEN_TEXT.stampLegend}</span>
    </Message>
  );
}
