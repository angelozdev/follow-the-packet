import type { Inspection } from '@/game';
import { TaggedText } from '@/ui/tagged-text';

export function InspectionBox({ inspection }: { inspection: Inspection }) {
  return (
    <section className="card inspection" aria-labelledby="inspection-title">
      <h2 id="inspection-title">
        <TaggedText text={inspection.title} />
      </h2>
      <dl>
        {inspection.fields.map((field) => (
          <div key={field.label}>
            <dt>
              <TaggedText text={field.label} />
            </dt>
            {field.lines.map((line) => (
              <dd key={line}>
                <TaggedText text={line} />
              </dd>
            ))}
          </div>
        ))}
      </dl>
    </section>
  );
}
