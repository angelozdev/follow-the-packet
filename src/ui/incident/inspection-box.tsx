import type { Inspection } from '@/game';
import { EntityIcon } from '@/scene';
import { TaggedText } from '@/ui/tagged-text';

export function InspectionBox({ inspection }: { inspection: Inspection }) {
  return (
    <section className="card inspection" aria-labelledby="inspection-title">
      <h2 id="inspection-title">
        <EntityIcon entity={inspection.entity} />
        <TaggedText text={inspection.title} tips={false} />
      </h2>
      <dl>
        {inspection.fields.map((field) => (
          <div key={field.label}>
            <dt>
              <TaggedText text={field.label} tips={false} />
            </dt>
            {field.lines.map((line) => (
              <dd key={line}>
                <TaggedText text={line} tips={false} />
              </dd>
            ))}
          </div>
        ))}
      </dl>
    </section>
  );
}
