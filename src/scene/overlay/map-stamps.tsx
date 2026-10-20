import type { ReactNode } from 'react';
import { stampOf, toPlainText, type TermText } from '@/copy';
import { StampButton, StampMore } from '@/scene/entities/stamp';
import type { Frame } from '@/scene/frame';
import type { Point } from '@/scene/layout/graph';
import type { StampEntry } from '@/scene/marks/reading-order';
import type { Fan } from '@/scene/marks/stamp-fan';
import type { StillRun } from '@/scene/marks/still-packets';
import type { InspectTrigger, TriggerProps } from '@/scene/overlay/inspect-trigger';

export type InspectStampsTrigger = (packetIds: readonly string[]) => TriggerProps;

export interface DrawnRun extends StillRun {
  pieceId: string;
  label: TermText;
}

export interface SentRun extends DrawnRun {
  send: number;
}

interface StampButtonsProps {
  fans: readonly Fan[];
  runs: readonly DrawnRun[];
  frame: Frame;
  inspectTrigger: InspectTrigger;
  inspectStampsTrigger: InspectStampsTrigger;
}

function Holder({ point, frame, children }: { point: Point; frame: Frame; children: ReactNode }) {
  return (
    <div className="map-stamp" style={{ left: frame.x + point[0], top: frame.y + point[1] }}>
      {children}
    </div>
  );
}

/** Takes the fans of stamps of the map, the runs they were made from, where the drawing stands in its layer, what inspects a packet and what inspects the list of a «+N» (it takes the ids of the packets of the place, which the screen turns into the id of the list); returns what draws one entry of the reading order that is a stamp or a «+N»: its button, named by its packet and how it ended (a «+N» by its list), in a holder at the pixels of its place in the fan with the frame added, with the trigger of its packet (a «+N» the one of its list). The caller puts each button where the reading order of the map says. */
export function stampButtons({ fans, runs, frame, inspectTrigger, inspectStampsTrigger }: StampButtonsProps): (entry: StampEntry) => ReactNode {
  const runById = new Map(runs.map((run) => [run.id, run]));
  const stampById = new Map(fans.flatMap(({ stamps }) => stamps.map((stamp) => [stamp.id, stamp] as const)));
  const moreById = new Map(fans.flatMap(({ more }) => (more ? [[more.id, more] as const] : [])));
  return ({ kind, id }) => {
    if (kind === 'more') {
      const more = moreById.get(id)!;
      return (
        <Holder key={`more:${id}`} point={more.point} frame={frame}>
          <StampMore hidden={more.count} total={more.ids.length} hidesProblem={more.hidesProblem} trigger={inspectStampsTrigger(more.ids)} />
        </Holder>
      );
    }
    const run = runById.get(id)!;
    return (
      <Holder key={`stamp:${id}`} point={stampById.get(id)!.point} frame={frame}>
        <StampButton state={stampOf(run)} name={toPlainText(run.label)} trigger={inspectTrigger(run.pieceId)} />
      </Holder>
    );
  };
}
