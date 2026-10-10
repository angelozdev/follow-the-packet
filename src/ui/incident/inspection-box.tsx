import { Card } from '@/design';
import type { Inspection } from '@/game';
import { EntityIcon } from '@/scene';
import { TaggedText } from '@/ui/tagged-text';

export function InspectionBox({ inspection }: { inspection: Inspection }) {
  return (
    <Card aria-labelledby="inspection-title">
      <h2 id="inspection-title">
        <EntityIcon entity={inspection.entity} />
        <TaggedText text={inspection.title} tips={false} />
      </h2>
      <dl className="inspection__fields">
        {inspection.fields.map((field) => (
          <div key={field.label}>
            <dt className="caption caption--soft">
              <TaggedText text={field.label} tips={false} />
            </dt>
            {field.lines.map((line, index) => (
              <dd key={`${index}-${line}`}>
                <TaggedText text={line} tips={false} />
              </dd>
            ))}
          </div>
        ))}
      </dl>
    </Card>
  );
}
