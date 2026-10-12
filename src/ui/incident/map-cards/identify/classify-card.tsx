import { useState, type CSSProperties } from 'react';
import { CLASSIFY_TEXT, MESSAGE_TEXT, toPlainText } from '@/copy';
import { Button, Choice, Message } from '@/design';
import type { ClassifyCard as Classify, ClassifyItem, ClassifyNumber } from '@/game';
import { EntityIcon } from '@/scene';
import { useFocusOnMount } from '@/ui/incident/use-focus-on-mount';
import { FramedCard, type CardFrame } from '@/ui/incident/map-cards/chip-card';
import { TaggedText } from '@/ui/tagged-text';

/** The item the player has picked up to put in a bin. It lives above the card, so a card that shows this one as a tab keeps it when the player switches tabs. */
export interface ClassifyDraft {
  selected: string | null;
  select: (deviceId: string | null) => void;
}

export function useClassifyDraft(): ClassifyDraft {
  const [selected, select] = useState<string | null>(null);
  return { selected, select };
}

function Ip({ item }: { item: ClassifyItem }) {
  if (item.split === null) return <code>{item.ip}</code>;
  return (
    <span className="ip">
      <span className="ip__net">{item.split.block}</span>
      <span className="ip__host">{item.split.device}</span>
    </span>
  );
}

function Tile({ item, selected, onSelect }: { item: ClassifyItem; selected: boolean; onSelect: () => void }) {
  return (
    <Choice pressed={selected} onClick={onSelect}>
      <TaggedText text={item.name} /> <Ip item={item} />
    </Choice>
  );
}

function BitsRow({ numbers, blockNumbers, prefix }: { numbers: ClassifyNumber[]; blockNumbers: number | null; prefix: number }) {
  const spans = blockNumbers === null ? null : ({ '--numbers': blockNumbers } as CSSProperties);
  return (
    <div className="bits-wrap">
      {spans ? (
        <div className="bits__braces" style={spans} aria-hidden="true">
          <span className="bits__brace bits__brace--net">{CLASSIFY_TEXT.blockBits(prefix)}</span>
          <span className="bits__brace bits__brace--device">{CLASSIFY_TEXT.deviceBits(32 - prefix)}</span>
        </div>
      ) : (
        <p className="muted" aria-hidden="true">
          {CLASSIFY_TEXT.blockBits(prefix)} · {CLASSIFY_TEXT.deviceBits(32 - prefix)}
        </p>
      )}
      <div className="bits" role="group" aria-label={CLASSIFY_TEXT.bitsName}>
        {numbers.map((number, index) => (
          <div key={index} className="bits__oct">
            <div className="bits__cells" role="img" aria-label={number.bits.map(({ value }) => value).join('')}>
              {number.bits.map((bit, position) => (
                <span key={position} className={bit.fixed ? 'bits__b bits__b--net' : 'bits__b'} aria-hidden="true">
                  {bit.value}
                </span>
              ))}
            </div>
            <span className="bits__dec">{number.decimal}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ClassifyHandlers {
  onAnswer: (deviceId: string, picks: Record<string, string>) => void;
}

/** Returns what the card that classifies puts in its card: the block with its mask, the 32 bits of the IP of the owner with the first ones the prefix fixes filled, the items still to classify and the two bins with the ones already placed. The player picks an item up and presses "Poner aquí" in a bin, or in the other bin to move it: placing reports the answer of that item at once, because the bins, the line under each item and the outline of the block on the map are all drawn from the answers of the session. Each placed item carries a line that says whether it fits, as a success when the bin is right and as an error when it is not. "Listo" and Escape only close the card. */
export function classifyFrame(card: Classify, draft: ClassifyDraft, { onAnswer }: ClassifyHandlers, refocus: () => void): CardFrame {
  const items = [...card.waiting, ...card.bins.flatMap((bin) => bin.items)];
  const chosen = items.find((item) => item.deviceId === draft.selected);
  const toggle = (item: ClassifyItem) => draft.select(draft.selected === item.deviceId ? null : item.deviceId);
  const place = (binId: string) => {
    if (!chosen) return;
    onAnswer(chosen.deviceId, { [card.trayId]: binId });
    draft.select(null);
    refocus();
  };
  return {
    title: card.title,
    icon: <EntityIcon entity={card.entity} />,
    body: (
      <>
        <dl className="classify__fields">
          <div>
            <dt className="caption caption--soft">
              <TaggedText text={CLASSIFY_TEXT.block} />
            </dt>
            <dd>
              <code className="cidr">{card.block}</code>
            </dd>
          </div>
          <div>
            <dt className="caption caption--soft">
              <TaggedText text={CLASSIFY_TEXT.mask} />
            </dt>
            <dd>
              <code className="cidr">{card.mask}</code>
            </dd>
          </div>
        </dl>
        <p className="muted">
          <TaggedText text={CLASSIFY_TEXT.bitsLead(card.title, card.ownerIp, card.prefix)} />
        </p>
        <BitsRow numbers={card.numbers} blockNumbers={card.blockNumbers} prefix={card.prefix} />
        <p className="legend-ip">
          <span className="ip">
            <span className="ip__net">{CLASSIFY_TEXT.legend.fixed}</span>
          </span>{' '}
          {CLASSIFY_TEXT.legend.fixedMeaning} ·{' '}
          <span className="ip">
            <span className="ip__host">{CLASSIFY_TEXT.legend.free}</span>
          </span>{' '}
          {CLASSIFY_TEXT.legend.freeMeaning}
        </p>
        <h3 className="caption caption--soft">{CLASSIFY_TEXT.waiting}</h3>
        {card.waiting.length === 0 ? (
          <p className="slot__empty">{CLASSIFY_TEXT.nothingWaiting}</p>
        ) : (
          <div className="tiles">
            {card.waiting.map((item) => (
              <Tile key={item.deviceId} item={item} selected={draft.selected === item.deviceId} onSelect={() => toggle(item)} />
            ))}
          </div>
        )}
        <div className="bins">
          {card.bins.map((bin) => (
            <section key={bin.id} className="bin" role="group" aria-label={bin.name}>
              <h3 className="caption caption--soft">{bin.name}</h3>
              <div className="slot bin__slot">
                {bin.items.length === 0 && <span className="slot__empty">{CLASSIFY_TEXT.emptyBin}</span>}
                {bin.items.map((item) => (
                  <div key={item.deviceId} className="bin__item">
                    <Tile item={item} selected={draft.selected === item.deviceId} onSelect={() => toggle(item)} />
                    {item.line && (
                      <Message role="status" variant={item.line.right ? 'success' : 'error'} words={MESSAGE_TEXT}>
                        <TaggedText text={item.line.text} />
                      </Message>
                    )}
                  </div>
                ))}
                <Button
                  variant="small"
                  disabled={!chosen || chosen.placed === bin.id}
                  aria-label={CLASSIFY_TEXT.placeIn(chosen ? toPlainText(chosen.name) : null, bin.name)}
                  onClick={() => place(bin.id)}
                >
                  {CLASSIFY_TEXT.here}
                </Button>
              </div>
            </section>
          ))}
        </div>
      </>
    ),
  };
}

interface ClassifyCardProps extends ClassifyHandlers {
  card: Classify;
  onClose: () => void;
}

/** The card that classifies as a card of its own, for a piece whose only card it is. */
export function ClassifyCard({ card, onAnswer, onClose }: ClassifyCardProps) {
  const heading = useFocusOnMount<HTMLHeadingElement>();
  const draft = useClassifyDraft();
  return <FramedCard frame={classifyFrame(card, draft, { onAnswer }, () => heading.current?.focus())} heading={heading} onClose={onClose} />;
}
