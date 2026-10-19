import { graphOf } from '@/scene/map2d/layout/arrange/assemble';
import type { MapLayout } from '@/scene/map2d/layout/arrange/geometry';
import { startsOnMap } from '@/scene/map2d/layout/stations';
import type { Fan } from '@/scene/map2d/marks/stamp-fan';
import { stillPackets, translationAt, wayOf } from '@/scene/map2d/marks/still-packets';
import type { DrawnRun, SentRun } from '@/scene/map2d/overlay/map-stamps';
import { FlightBody, FlightTags, type Flying } from './flight';
import { flightPlan, flowCycles, sendCycle, type Cycle, type FlightPlan } from './flight-plan';
import { StillTraffic } from './still-trace';

interface Flight {
  key: string;
  flying: Flying;
  plan: FlightPlan;
  cycle: Cycle;
}

interface TrafficProps {
  flows: readonly DrawnRun[];
  sent: readonly SentRun[];
  layout: MapLayout;
  fans: readonly Fan[];
  still: boolean;
}

function flightsOf(flows: readonly DrawnRun[], sent: readonly SentRun[], layout: MapLayout): Flight[] {
  const graph = graphOf(layout);
  const onMap = ({ packet }: DrawnRun) => startsOnMap(packet, layout.drawn);
  const flyingOf = (run: DrawnRun): Flying => {
    const way = wayOf(run, layout, graph);
    return { way, changesAt: translationAt(run, way.path, layout) };
  };
  const planOf = ({ way, changesAt }: Flying, wait: number) => flightPlan(way.path, way.look.end, wait, changesAt);
  const ofFlows = flows.filter(onMap).flatMap((run, index) => {
    const flying = flyingOf(run);
    const plan = planOf(flying, 0);
    return flowCycles(plan, index).map((cycle, copy): Flight => ({ key: `flow:${run.id}:${copy}`, flying, plan, cycle }));
  });
  const ofSent = sent.filter(onMap).map((run): Flight => {
    const flying = flyingOf(run);
    const plan = planOf(flying, 0);
    return { key: `send:${run.send}`, flying, plan, cycle: sendCycle(plan) };
  });
  return [...ofFlows, ...ofSent];
}

function FlyingTraffic({ flows, sent, layout }: Omit<TrafficProps, 'fans' | 'still'>) {
  const flights = flightsOf(flows, sent, layout);
  return (
    <>
      <g className="map-flights">
        {flights.map(({ key, flying, plan, cycle }) => (
          <FlightBody key={key} flying={flying} plan={plan} cycle={cycle} />
        ))}
      </g>
      <g className="map-flight-tags">
        {flights.flatMap(({ key, flying, plan, cycle }) => {
          const legs = flying.way.run.ports?.legs;
          return legs && plan.labels.length > 0 ? [<FlightTags key={key} flying={flying} legs={legs} plan={plan} cycle={cycle} bounds={layout.size} />] : [];
        })}
      </g>
    </>
  );
}

/** Takes the live flows and the packets the player sent (in the order they stand), the layout, the fans of the stamps and whether animations are off; returns the packets of the map. With animations off, the still map: the trace of each packet with its shape and its label. With animations on, the packets in flight: each live flow sends a packet every 3.5 seconds, shifted 1.1 seconds for every flow before it, in as many copies as the periods its trip lasts, and each packet the player sent flies once, from the moment its group is mounted, so a new send number starts a new flight; the labels of the packets with ports fly beside them. A packet that starts at a piece the map does not draw is not drawn. */
export function Traffic({ flows, sent, layout, fans, still }: TrafficProps) {
  return still ? <StillTraffic packets={stillPackets([...flows, ...sent], layout, fans)} /> : <FlyingTraffic flows={flows} sent={sent} layout={layout} />;
}
