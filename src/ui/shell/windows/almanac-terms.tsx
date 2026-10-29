import { LUCIA_TEXT, TERMS, TERM_ENTITY, type TermId } from '@/copy';
import { EntityIcon } from '@/scene';

interface AlmanacTermsProps {
  known: ReadonlySet<TermId>;
  newTerms: ReadonlySet<TermId>;
}

const byName = (a: TermId, b: TermId) => TERMS[a].name.localeCompare(TERMS[b].name, 'es');

const newFirst = (newTerms: ReadonlySet<TermId>) => (a: TermId, b: TermId) => Number(newTerms.has(b)) - Number(newTerms.has(a)) || byName(a, b);

export function AlmanacTerms({ known, newTerms }: AlmanacTermsProps) {
  return (
    <dl className="glossary">
      {[...known].sort(newFirst(newTerms)).map((id) => {
        const entity = TERM_ENTITY[id];
        return (
          <div key={id}>
            <dt>
              {entity && <EntityIcon entity={entity} />}
              <span className="glossary__name">{TERMS[id].name}</span>
              {newTerms.has(id) && <>{' '}<span className="term__new">{LUCIA_TEXT.newBadge}</span></>}
            </dt>
            <dd>{TERMS[id].definition}</dd>
          </div>
        );
      })}
    </dl>
  );
}
