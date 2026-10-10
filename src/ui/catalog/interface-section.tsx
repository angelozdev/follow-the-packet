import type { ReactNode } from 'react';
import { EXPLANATION_TEXT, INSPECTION_TEXT, INTERFACE_TEXT, LUCIA_TEXT, RESULT_TEXT, ROADMAP_TEXT, SCREEN_TEXT, TASK_CARD_TEXT, TERMINAL_TEXT, type TermId } from '@/copy';
import { Stars } from '@/ui/stars';
import { TaggedText } from '@/ui/tagged-text';

const VARIANT = INTERFACE_TEXT.variant;
const SAMPLE = INTERFACE_TEXT.sample;
const [FIRST_CHIP, SECOND_CHIP] = SAMPLE.chips;
const [FIRST_ADDRESS, SECOND_ADDRESS] = SAMPLE.addresses;
const SAMPLE_STARS = 2;
const NEW_TERMS = new Set<TermId>(['security-group']);

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
          <button type="button" className="btn btn--primary">
            {LUCIA_TEXT.submit}
          </button>
        </Specimen>
        <Specimen caption={VARIANT.secondary}>
          <button type="button" className="btn">
            {TASK_CARD_TEXT.done}
          </button>
        </Specimen>
        <Specimen caption={VARIANT.small}>
          <button type="button" className="btn btn--small">
            {LUCIA_TEXT.askHint}
          </button>
        </Specimen>
        <Specimen caption={VARIANT.disabled}>
          <button type="button" className="btn" disabled>
            {TERMINAL_TEXT.send}
          </button>
        </Specimen>
        <Specimen caption={VARIANT.primaryLink}>
          <a className="btn btn--primary" href="#/">
            {RESULT_TEXT.next}
          </a>
        </Specimen>
        <Specimen caption={VARIANT.link}>
          <a className="btn" href="#/">
            {RESULT_TEXT.back}
          </a>
        </Specimen>
        <Specimen caption={VARIANT.textLink}>
          <a href="#/">{SCREEN_TEXT.back}</a>
        </Specimen>
      </Family>
      <Family name={INTERFACE_TEXT.family.choices}>
        <Specimen caption={VARIANT.chip}>
          <button type="button" className="chip" aria-pressed={false}>
            <TaggedText text={FIRST_CHIP} />
          </button>
        </Specimen>
        <Specimen caption={VARIANT.chipPressed}>
          <button type="button" className="chip" aria-pressed>
            <TaggedText text={FIRST_CHIP} />
          </button>
        </Specimen>
        <Specimen caption={VARIANT.chipNamePressed}>
          <button type="button" className="chip" aria-pressed>
            <TaggedText text={SAMPLE.namedChip} />
          </button>
        </Specimen>
        <Specimen caption={VARIANT.tray}>
          <div role="group" aria-label={TASK_CARD_TEXT.what} className="tray">
            <span className="tray__name" aria-hidden="true">
              {TASK_CARD_TEXT.what}
            </span>
            <button type="button" className="chip" aria-pressed={false}>
              <TaggedText text={FIRST_CHIP} />
            </button>
            <button type="button" className="chip" aria-pressed={false}>
              <TaggedText text={SECOND_CHIP} />
            </button>
          </div>
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
            <button type="button" className="chip">
              <TaggedText text={FIRST_CHIP} />
            </button>
            <span aria-hidden="true">←</span>
            <span className="slot__empty">{TASK_CARD_TEXT.from}</span>
          </div>
        </Specimen>
        <Specimen caption={VARIANT.option} wide>
          <button type="button" className="option" aria-pressed={false}>
            {SAMPLE.option}
          </button>
        </Specimen>
        <Specimen caption={VARIANT.optionChosen} wide>
          <button type="button" className="option" aria-pressed disabled>
            {SAMPLE.chosen}
          </button>
        </Specimen>
        <Specimen caption={VARIANT.optionClosed} wide>
          <button type="button" className="option" aria-pressed={false} disabled>
            {SAMPLE.closed}
          </button>
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
            <div role="group" aria-label={TERMINAL_TEXT.trays.to} className="tray">
              <span className="tray__name" aria-hidden="true">
                {TERMINAL_TEXT.trays.to}
              </span>
              <button type="button" className="chip" aria-pressed>
                {FIRST_ADDRESS}
              </button>
              <button type="button" className="chip" aria-pressed={false}>
                {SECOND_ADDRESS}
              </button>
            </div>
            <button type="button" className="btn">
              {TERMINAL_TEXT.send}
            </button>
            <button type="button" className="btn">
              {TASK_CARD_TEXT.done}
            </button>
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
