import { useId, type RefObject } from 'react';
import { INSPECTION_TEXT } from '@/copy';
import { Button, Card } from '@/design';
import type { Inspection } from '@/game';
import { EntityIcon } from '@/scene';
import { CardIcon } from '@/ui/card-icon';
import { TaggedText } from '@/ui/tagged-text';

interface InspectionBoxProps {
  inspection: Inspection;
  pinned: boolean;
  heading?: RefObject<HTMLHeadingElement | null>;
  onClose?: () => void;
}

/** The fields of the box, each a label and its values: a field that is an HTTP message draws its lines as code, on a light panel, as one block (the blank line before its body is one of the lines), and its notes stay under the panel in the body font. */
export function InspectionFields({ fields }: { fields: Inspection['fields'] }) {
  return (
    <dl className="inspection__fields">
      {fields.map((field, index) => (
        <div key={`${index}-${field.label}`}>
          <dt className="caption caption--soft">
            <TaggedText text={field.label} tips={false} />
          </dt>
          {field.message ? (
            <dd className="inspection__message">
              <div className="output output--message">
                {field.lines.map((line, at) => (
                  <code key={`${at}-${line}`} className="output__line">
                    <TaggedText text={line} tips={false} ips={false} />
                  </code>
                ))}
              </div>
            </dd>
          ) : (
            field.lines.map((line, at) => (
              <dd key={`${at}-${line}`}>
                <TaggedText text={line} tips={false} />
              </dd>
            ))
          )}
          {field.notes?.map((note) => (
            <dd key={note} className="muted">
              <TaggedText text={note} tips={false} />
            </dd>
          ))}
        </div>
      ))}
    </dl>
  );
}

/** The box that tells what a piece or a stamp is and how it is. A preview on the map has only its stripe and its fields; held in the panel (`pinned`), its stripe offers the X of the panel, and its heading, which `heading` gives to the caller, can take the focus, from which the arrow keys scroll its body. */
export function InspectionBox({ inspection, pinned, heading, onClose }: InspectionBoxProps) {
  const titleId = useId();
  return (
    <Card
      aria-labelledby={titleId}
      header={{
        icon: <CardIcon kind="inspection" />,
        type: INSPECTION_TEXT.type,
        meta: pinned ? (
          <Button variant="small" aria-label={INSPECTION_TEXT.closeLabel} onClick={onClose}>
            {INSPECTION_TEXT.close}
          </Button>
        ) : undefined,
      }}
    >
      <h2 id={titleId} ref={heading} tabIndex={-1}>
        {inspection.entity && <EntityIcon entity={inspection.entity} />}
        <TaggedText text={inspection.title} tips={false} />
      </h2>
      <InspectionFields fields={inspection.fields} />
    </Card>
  );
}
