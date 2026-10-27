import { useId, type RefObject } from 'react';
import { Card } from '@/design';
import type { Inspection } from '@/game';
import { EntityIcon } from '@/scene';
import { InspectionBox, InspectionFields } from '@/ui/incident/inspection-box';
import { TaggedText } from '@/ui/tagged-text';

interface SelectionPanelProps {
  inspection: Inspection;
  packet: boolean;
  heading: RefObject<HTMLHeadingElement | null>;
  onClose: () => void;
}

function PiecePanel({ inspection, heading }: Pick<SelectionPanelProps, 'inspection' | 'heading'>) {
  const titleId = useId();
  return (
    <Card
      aria-labelledby={titleId}
      header={{
        title: (
          <h2 id={titleId} ref={heading} tabIndex={-1}>
            {inspection.entity && <EntityIcon entity={inspection.entity} />}
            <TaggedText text={inspection.title} tips={false} />
          </h2>
        ),
      }}
    >
      <InspectionFields fields={inspection.fields} />
    </Card>
  );
}

/** Takes what the player chose, whether it is a packet (or a list of stamps) and the ref of the heading of the panel, and returns the panel: for a piece, a card with its name and its icon on the stripe and the fields of its inspection; for a packet, its box with «Cerrar», which calls `onClose`. Both are a region named by their heading, never a dialog. */
export function SelectionPanel({ inspection, packet, heading, onClose }: SelectionPanelProps) {
  return packet ? <InspectionBox inspection={inspection} pinned heading={heading} onClose={onClose} /> : <PiecePanel inspection={inspection} heading={heading} />;
}
