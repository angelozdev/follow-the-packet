import type { RefObject } from 'react';
import { INSPECTION_TEXT } from '@/copy';
import { Button, Card } from '@/design';
import type { Inspection } from '@/game';
import { EntityIcon } from '@/scene';
import { CardIcon } from '@/ui/card-icon';
import { TaggedText } from '@/ui/tagged-text';

interface InspectionBoxProps {
  inspection: Inspection;
  pinned: boolean;
  heading: RefObject<HTMLHeadingElement | null>;
  onClose: () => void;
}

/** The box that tells what a piece or a stamp is and how it is. Pinned, its stripe says «Fijada» and offers «Cerrar»; its heading can take the focus, from which the arrow keys scroll its body. */
export function InspectionBox({ inspection, pinned, heading, onClose }: InspectionBoxProps) {
  return (
    <Card
      aria-labelledby="inspection-title"
      header={{
        icon: <CardIcon kind="inspection" />,
        type: INSPECTION_TEXT.type,
        meta: pinned ? (
          <>
            {INSPECTION_TEXT.pinned}{' '}
            <Button variant="small" aria-label={INSPECTION_TEXT.closeLabel} onClick={onClose}>
              {INSPECTION_TEXT.close}
            </Button>
          </>
        ) : undefined,
      }}
    >
      <h2 id="inspection-title" ref={heading} tabIndex={-1}>
        {inspection.entity && <EntityIcon entity={inspection.entity} />}
        <TaggedText text={inspection.title} tips={false} />
      </h2>
      <dl className="inspection__fields">
        {inspection.fields.map((field, index) => (
          <div key={`${index}-${field.label}`}>
            <dt className="caption caption--soft">
              <TaggedText text={field.label} tips={false} />
            </dt>
            {field.lines.map((line, index) => (
              <dd key={`${index}-${line}`}>
                <TaggedText text={line} tips={false} />
              </dd>
            ))}
            {field.notes?.map((note) => (
              <dd key={note} className="muted">
                <TaggedText text={note} tips={false} />
              </dd>
            ))}
          </div>
        ))}
      </dl>
    </Card>
  );
}
