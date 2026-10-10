import type { ReactNode } from 'react';
import { EXPLANATION_TEXT, INSPECTION_TEXT, INTERFACE_TEXT, LUCIA_TEXT, RESULT_TEXT, ROADMAP_TEXT, SCREEN_TEXT, TASK_CARD_TEXT, TERMINAL_TEXT, type TermId } from '@/copy';
import { Button, ChipTray, Choice } from '@/design';
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
const noPick = () => {};

function Specimen({ caption, wide = false, children }: { caption: string; wide?: boolean; children: ReactNode }) {
  return (
    <figure className={wide ? 'catalog__specimen catalog__specimen--wide' : 'catalog__specimen'}>
      {children}
      <figcaption className="catalog__caption">{caption}</figcaption>
    </figure>
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

/** Every element of the interface in every variant and state, drawn with the classes the screens use, so its capture shows any change to how one looks. */
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
          <Button disabled>{TERMINAL_TEXT.send}</Button>
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
        <Specimen caption={VARIANT.option} wide>
          <Choice variant="option" pressed={false}>
            {SAMPLE.option}
          </Choice>
        </Specimen>
        <Specimen caption={VARIANT.optionChosen} wide>
          <Choice variant="option" pressed disabled>
            {SAMPLE.chosen}
          </Choice>
        </Specimen>
        <Specimen caption={VARIANT.optionClosed} wide>
          <Choice variant="option" pressed={false} disabled>
            {SAMPLE.closed}
          </Choice>
        </Specimen>
        <Specimen caption={VARIANT.right} wide>
          <p className="feedback feedback--right">
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
          <section className="card">
            <h2>{LUCIA_TEXT.name}</h2>
            <p>
              <TaggedText text={SAMPLE.text} newTerms={NEW_TERMS} />
            </p>
          </section>
        </Specimen>
        <Specimen caption={VARIANT.cardSoon} wide>
          <div className="chapter chapter--soon">
            <h2>{ROADMAP_TEXT.soon}</h2>
          </div>
        </Specimen>
        <Specimen caption={VARIANT.terminal} wide>
          <section className="card chip-card">
            <h2>
              <TaggedText text={TERMINAL_TEXT.title(SAMPLE.origin)} />
            </h2>
            <p className="slot">
              <code>
                <TaggedText text={TERMINAL_TEXT.ping(FIRST_ADDRESS)} />
              </code>
            </p>
            <ChipTray name={TERMINAL_TEXT.trays.to} chips={ADDRESS_CHIPS} picked={FIRST_ADDRESS} onPick={noPick} />
            <Button>{TERMINAL_TEXT.send}</Button>
            <Button>{TASK_CARD_TEXT.done}</Button>
          </section>
        </Specimen>
      </Family>
      <Family name={INTERFACE_TEXT.family.text}>
        <Specimen caption={VARIANT.caption}>
          <h3>{LUCIA_TEXT.tasks}</h3>
        </Specimen>
        <Specimen caption={VARIANT.caption}>
          <details className="lucia__glossary">
            <summary>{LUCIA_TEXT.glossary}</summary>
          </details>
        </Specimen>
        <Specimen caption={VARIANT.fieldCaption}>
          <div className="inspection">
            <dl>
              <dt>{INSPECTION_TEXT.whatIs}</dt>
            </dl>
          </div>
        </Specimen>
        <Specimen caption={VARIANT.roleCaption}>
          <div className="level-item">
            <span className="role">{ROADMAP_TEXT.role.defender}</span>
          </div>
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
    </section>
  );
}
