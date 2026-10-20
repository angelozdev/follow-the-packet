import type { Box } from '@/scene/layout/arrange/geometry';
import { LABEL_PAD, labelWidth } from '@/scene/layout/metrics';

/** Takes the id of a packet, the text of its label and the box where the label stands; returns the label in SVG: a group with the class `packet-tag` that holds a rectangle on the box and the text, in the monospaced font of the map, with its `textLength` the width the layout computes for the text (the box without its padding), so the label is as wide as the layout says whichever font draws the arrow `→`, which the font served for the map does not have. */
export function PacketTag({ id, text, box }: { id: string; text: string; box: Box }) {
  return (
    <g className="packet-tag" data-packet={id}>
      <rect x={box.x} y={box.y} width={box.width} height={box.height} />
      <text x={box.x + LABEL_PAD / 2} y={box.y + box.height / 2} textLength={labelWidth(text) - LABEL_PAD}>
        {text}
      </text>
    </g>
  );
}
