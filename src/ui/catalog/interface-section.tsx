import type { ComponentProps, ReactNode } from 'react';
import { EXPLANATION_TEXT, INSPECTION_TEXT, INTERFACE_TEXT, LUCIA_TEXT, RESULT_TEXT, ROADMAP_TEXT, SCREEN_TEXT, TASK_CARD_TEXT, TERMINAL_TEXT, type TermId } from '@/copy';
import { Button, Card, ChipTray, Choice, Table, Tabs } from '@/design';
import { EntityIcon } from '@/scene';
import { CardIcon } from '@/ui/card-icon';
import { Stars } from '@/ui/stars';
import { TaggedText } from '@/ui/tagged-text';

const VARIANT = INTERFACE_TEXT.variant;
const SAMPLE = INTERFACE_TEXT.sample;
const [FIRST_CHIP] = SAMPLE.chips;
const [FIRST_ADDRESS] = SAMPLE.addresses;
const SAMPLE_STARS = 2;
const NEW_TERMS = new Set<TermId>(['security-group']);
const TRAY_CHIPS = SAMPLE.chips.map((label) => ({ id: label, label: <TaggedText text={label} /> }));
const ADDRESS_CHIPS = SAMPLE.addresses.map((address) => ({ id: address, label: address }));
const YES_NO_CHIPS = [
  { id: 'yes', label: SAMPLE.yes },
  { id: 'no', label: SAMPLE.no },
];
const noPick = () => {};
const SAMPLE_TABS = [
  {
    id: 'in',
    label: SAMPLE.tabs.in,
    panel: <ChipTray name={TASK_CARD_TEXT.what} chips={TRAY_CHIPS} picked={null} onPick={noPick} />,
  },
  {
    id: 'out',
    label: SAMPLE.tabs.out,
    panel: <ChipTray name={TERMINAL_TEXT.trays.to} chips={ADDRESS_CHIPS} picked={FIRST_ADDRESS} onPick={noPick} />,
  },
];
const [FIRST_TAB] = SAMPLE_TABS;
const TABLE = SAMPLE.table;
const TABLE_COLUMNS = [
  { id: 'to', label: TABLE.columns.to },
  { id: 'via', label: TABLE.columns.via },
];
const [FIXED_ROUTE, REMOVABLE_ROUTE, ROUTE_IN_USE] = TABLE.routes.map(({ to, via }) => ({
  id: to,
  cells: [<code key={to}>{to}</code>, <TaggedText key={via} text={via} />],
}));
const TABLE_ROWS = [FIXED_ROUTE, { ...REMOVABLE_ROUTE, onRemove: noPick }, { ...ROUTE_IN_USE, inUse: true, onRemove: noPick }];

function Specimen({ caption, wide = false, children }: { caption: string; wide?: boolean; children: ReactNode }) {
  return (
    <figure className={wide ? 'catalog__specimen catalog__specimen--wide' : 'catalog__specimen'}>
      {children}
      <figcaption className="catalog__caption">{caption}</figcaption>
    </figure>
  );
}

function RoutesCard({ rows }: Pick<ComponentProps<typeof Table>, 'rows'>) {
  return (
    <Card header={{ icon: <EntityIcon entity={{ kind: 'edge', variant: 'router' }} />, title: <h2>{TABLE.title}</h2>, meta: <TaggedText text={TABLE.owner} /> }}>
      <Table caption={TABLE.caption} columns={TABLE_COLUMNS} rows={rows} emptyText={TABLE.empty} inUseText={TABLE.inUse} removeText={TABLE.remove} />
    </Card>
  );
}

function Family({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="catalog__family">
      <h3>{name}</h3>
      <div className="catalog__specimens">{children}</div>
    </div>
  );
}

/** Every element of the interface in every variant and state, drawn with the design-system primitives the screens use and, where the screens use no primitive, with their own plain classes and markup (the slots, the feedback lines, the text styles and the contents of the cards), so its capture shows any change to how one looks. */
export function InterfaceSection() {
  return (
    <section aria-labelledby="catalog-interface" className="catalog__section">
      <h2 id="catalog-interface">{INTERFACE_TEXT.title}</h2>
      <Family name={INTERFACE_TEXT.family.buttons}>
        <Specimen caption={VARIANT.primary}>
          <Button variant="primary">{LUCIA_TEXT.submit}</Button>
        </Specimen>
        <Specimen caption={VARIANT.secondary}>
          <Button>{TASK_CARD_TEXT.done}</Button>
        </Specimen>
        <Specimen caption={VARIANT.small}>
          <Button variant="small">{LUCIA_TEXT.askHint}</Button>
        </Specimen>
        <Specimen caption={VARIANT.disabled}>
          <Button variant="primary" disabled>{TERMINAL_TEXT.send}</Button>
        </Specimen>
        <Specimen caption={VARIANT.primaryLink}>
          <Button variant="primary" href="#/">
            {RESULT_TEXT.next}
          </Button>
        </Specimen>
        <Specimen caption={VARIANT.link}>
          <Button href="#/">{RESULT_TEXT.back}</Button>
        </Specimen>
        <Specimen caption={VARIANT.textLink}>
          <Button variant="text" href="#/">
            {SCREEN_TEXT.back}
          </Button>
        </Specimen>
      </Family>
      <Family name={INTERFACE_TEXT.family.choices}>
        <Specimen caption={VARIANT.chip}>
          <Choice pressed={false}>
            <TaggedText text={FIRST_CHIP} />
          </Choice>
        </Specimen>
        <Specimen caption={VARIANT.chipPressed}>
          <Choice pressed>
            <TaggedText text={FIRST_CHIP} />
          </Choice>
        </Specimen>
        <Specimen caption={VARIANT.chipNamePressed}>
          <Choice pressed>
            <TaggedText text={SAMPLE.namedChip} />
          </Choice>
        </Specimen>
        <Specimen caption={VARIANT.tray}>
          <ChipTray name={TASK_CARD_TEXT.what} chips={TRAY_CHIPS} picked={null} onPick={noPick} />
        </Specimen>
        <Specimen caption={VARIANT.segmented} wide>
          <ChipTray name={SAMPLE.yesNo} variant="segmented" chips={YES_NO_CHIPS} picked="no" onPick={noPick} />
        </Specimen>
        <Specimen caption={VARIANT.slotEmpty}>
          <div className="slot">
            <span className="slot__empty">{TASK_CARD_TEXT.what}</span>
            <span aria-hidden="true">←</span>
            <span className="slot__empty">{TASK_CARD_TEXT.from}</span>
          </div>
        </Specimen>
        <Specimen caption={VARIANT.slotFull}>
          <div className="slot">
            <Choice>
              <TaggedText text={FIRST_CHIP} />
            </Choice>
            <span aria-hidden="true">←</span>
            <span className="slot__empty">{TASK_CARD_TEXT.from}</span>
          </div>
        </Specimen>
        <Specimen caption={VARIANT.options} wide>
          <ol className="options">
            <li>
              <Choice variant="option" pressed={false}>
                {SAMPLE.option}
              </Choice>
            </li>
            <li>
              <Choice variant="option" pressed disabled>
                {SAMPLE.chosen}
              </Choice>
            </li>
            <li>
              <Choice variant="option" pressed={false} disabled>
                {SAMPLE.closed}
              </Choice>
            </li>
          </ol>
        </Specimen>
        <Specimen caption={VARIANT.right} wide>
          <p className="feedback">
            <strong>{EXPLANATION_TEXT.right}</strong> {SAMPLE.feedback}
          </p>
        </Specimen>
        <Specimen caption={VARIANT.wrong} wide>
          <p className="feedback feedback--wrong">
            <strong>{EXPLANATION_TEXT.wrong}</strong> {SAMPLE.feedback}
          </p>
        </Specimen>
      </Family>
      <Family name={INTERFACE_TEXT.family.cards}>
        <Specimen caption={VARIANT.card} wide>
          <Card header={{ icon: <CardIcon kind="lucia" />, title: <h2>{LUCIA_TEXT.name}</h2>, meta: LUCIA_TEXT.role }}>
            <p>
              <TaggedText text={SAMPLE.text} newTerms={NEW_TERMS} />
            </p>
          </Card>
        </Specimen>
        <Specimen caption={VARIANT.cardTitled} wide>
          <Card header={{ icon: <CardIcon kind="result" />, type: RESULT_TEXT.type }}>
            <h2>{RESULT_TEXT.title}</h2>
            <Stars count={SAMPLE_STARS} />
          </Card>
        </Specimen>
        <Specimen caption={VARIANT.cardSoon} wide>
          <Card variant="soon" header={{ icon: <CardIcon kind="chapter" />, type: ROADMAP_TEXT.chapter(SAMPLE.chapterNumber), meta: ROADMAP_TEXT.soon }}>
            <h2>{SAMPLE.chapterTitle}</h2>
          </Card>
        </Specimen>
        <Specimen caption={VARIANT.terminal} wide>
          <Card
            header={{
              icon: <CardIcon kind="terminal" />,
              title: (
                <h2>
                  <TaggedText text={TERMINAL_TEXT.title(SAMPLE.origin)} />
                </h2>
              ),
            }}
          >
            <div className="chip-card">
              <p className="slot">
                <code>
                  <TaggedText text={TERMINAL_TEXT.ping(FIRST_ADDRESS)} />
                </code>
              </p>
              <ChipTray name={TERMINAL_TEXT.trays.to} chips={ADDRESS_CHIPS} picked={FIRST_ADDRESS} onPick={noPick} />
              <Button variant="primary">{TERMINAL_TEXT.send}</Button>
              <Button>{TASK_CARD_TEXT.done}</Button>
            </div>
          </Card>
        </Specimen>
      </Family>
      <Family name={INTERFACE_TEXT.family.text}>
        <Specimen caption={VARIANT.caption}>
          <h3>{LUCIA_TEXT.tasks}</h3>
        </Specimen>
        <Specimen caption={VARIANT.caption}>
          <details className="lucia__glossary">
            <summary className="caption">{LUCIA_TEXT.glossary}</summary>
          </details>
        </Specimen>
        <Specimen caption={VARIANT.fieldCaption}>
          <dl className="inspection__fields">
            <dt className="caption caption--soft">{INSPECTION_TEXT.whatIs}</dt>
          </dl>
        </Specimen>
        <Specimen caption={VARIANT.roleCaption}>
          <span className="caption caption--soft">{ROADMAP_TEXT.role.defender}</span>
        </Specimen>
        <Specimen caption={VARIANT.text} wide>
          <p>
            <TaggedText text={SAMPLE.text} newTerms={NEW_TERMS} />
          </p>
        </Specimen>
        <Specimen caption={VARIANT.muted} wide>
          <p className="muted">{SCREEN_TEXT.stampLegend}</p>
        </Specimen>
        <Specimen caption={VARIANT.stars}>
          <Stars count={SAMPLE_STARS} />
        </Specimen>
        <Specimen caption={VARIANT.alert}>
          <p className="lucia__alert">{LUCIA_TEXT.intrusion}</p>
        </Specimen>
        <Specimen caption={VARIANT.reply} wide>
          <div className="lucia__reply">
            <p>{LUCIA_TEXT.intruding}</p>
          </div>
        </Specimen>
      </Family>
      <Family name={INTERFACE_TEXT.family.tabs}>
        <Specimen caption={VARIANT.tabs} wide>
          <Tabs name={SAMPLE.tabs.name} tabs={SAMPLE_TABS} selected={FIRST_TAB.id} onSelect={noPick} />
        </Specimen>
      </Family>
      <Family name={INTERFACE_TEXT.family.tables}>
        <Specimen caption={VARIANT.table} wide>
          <RoutesCard rows={TABLE_ROWS} />
        </Specimen>
        <Specimen caption={VARIANT.tableEmpty} wide>
          <RoutesCard rows={[]} />
        </Specimen>
      </Family>
    </section>
  );
}
