import { CATALOG_TEXT, ENTITY_REFS, entityName } from '@/copy';
import { CatalogScene, EntityIcon, StampIcon } from '@/scene';
import { MotionToggle } from '@/ui/motion-toggle';
import { TaggedText } from '@/ui/tagged-text';
import { useStillMode } from '@/ui/use-still-mode';
import { InterfaceSection } from './interface-section';

const STAMP_STATES = ['arrived', 'blocked', 'lost', 'intruder', 'warned'] as const;
const STAMP_NAME = {
  arrived: CATALOG_TEXT.state.arrived,
  blocked: CATALOG_TEXT.state.blocked,
  lost: CATALOG_TEXT.state.lost,
  intruder: CATALOG_TEXT.intruder,
  warned: CATALOG_TEXT.state.warned,
} as const;

/** The design review page of the entity catalog: every piece in every variant and state on one canvas, every icon with its name, and every element of the interface. */
export function EntitiesPage() {
  const [still, setStill] = useStillMode();
  return (
    <main className="catalog">
      <header className="catalog__head">
        <h1>{CATALOG_TEXT.title}</h1>
        <p className="lede">{CATALOG_TEXT.lede}</p>
        <MotionToggle still={still} className="catalog__motion" onChange={setStill} />
      </header>
      <section aria-labelledby="catalog-pieces" className="catalog__section">
        <h2 id="catalog-pieces">{CATALOG_TEXT.pieces}</h2>
        <CatalogScene still={still} />
      </section>
      <section aria-labelledby="catalog-icons" className="catalog__section">
        <h2 id="catalog-icons">{CATALOG_TEXT.icons}</h2>
        <ul className="catalog__icons">
          {ENTITY_REFS.map((entity) => {
            const name = entityName(entity);
            return (
              <li key={name}>
                <EntityIcon entity={entity} />
                <TaggedText text={name} tips={false} />
              </li>
            );
          })}
          {STAMP_STATES.map((state) => (
            <li key={state}>
              <StampIcon state={state} />
              {STAMP_NAME[state]}
            </li>
          ))}
        </ul>
      </section>
      <InterfaceSection />
    </main>
  );
}
