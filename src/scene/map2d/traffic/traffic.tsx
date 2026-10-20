import { graphOf } from '@/scene/map2d/layout/arrange/assemble';
import type { MapLayout } from '@/scene/map2d/layout/arrange/geometry';
import type { Graph } from '@/scene/map2d/layout/graph';
import { startsOnMap } from '@/scene/map2d/layout/stations';
import type { Fan } from '@/scene/map2d/marks/stamp-fan';
import { stillPackets, translationAt, wayOf } from '@/scene/map2d/marks/still-packets';
import type { DrawnRun, SentRun } from '@/scene/map2d/overlay/map-stamps';
import { FlightBody, FlightTags, type Flying } from './flight';
import { flightPlan, flowCycles, sendCycle, type Cycle, type FlightPlan } from './flight-plan';
import { StillTraffic } from './still-trace';
import { flightKeyOf, useSendsInFlight } from './use-sends-in-flight';

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

function flyingOf(run: DrawnRun, layout: MapLayout, graph: Graph): Flying {
  const way = wayOf(run, layout, graph);
  return { way, changesAt: translationAt(run, way.path, layout) };
}

function planOf({ way, changesAt }: Flying): FlightPlan {
  return flightPlan(way.path, way.look.end, 0, changesAt);
}

function flightsOf(flows: readonly DrawnRun[], sent: readonly SentRun[], layout: MapLayout): Flight[] {
  const graph = graphOf(layout);
  const onMap = ({ packet }: DrawnRun) => startsOnMap(packet, layout.drawn);
  const ofFlows = flows.filter(onMap).flatMap((run, index) => {
    const flying = flyingOf(run, layout, graph);
    const plan = planOf(flying);
    return flowCycles(plan, index).map((cycle, copy): Flight => ({ key: `flow:${run.id}:${copy}`, flying, plan, cycle }));
  });
  const ofSent = sent.filter(onMap).map((run): Flight => {
    const flying = flyingOf(run, layout, graph);
    const plan = planOf(flying);
    return { key: flightKeyOf(run), flying, plan, cycle: sendCycle(plan) };
  });
  return [...ofFlows, ...ofSent];
}

function sendSeconds(run: SentRun, layout: MapLayout): number {
  return startsOnMap(run.packet, layout.drawn) ? planOf(flyingOf(run, layout, graphOf(layout))).duration : 0;
}

function useFlights(flows: readonly DrawnRun[], sent: readonly SentRun[], layout: MapLayout): Flight[] {
  const flying = useSendsInFlight(sent, (run) => sendSeconds(run, layout));
  return flightsOf(flows, flying, layout);
}

function FlyingTraffic({ flows, sent, layout }: Omit<TrafficProps, 'fans' | 'still'>) {
  const flights = useFlights(flows, sent, layout);
  return (
    <g className="map-flights">
      {flights.map(({ key, flying, plan, cycle }) => (
        <FlightBody key={key} flying={flying} plan={plan} cycle={cycle} />
      ))}
    </g>
  );
}

/** Takes the live flows and the packets the player sent, as `Traffic` does, and the layout; returns the labels of the packets with ports that are in flight, in a group (`g.map-flight-tags`) for an `svg` of its own, as large as the drawing, that `MapStage` puts over the HTML layer: the labels fly beside their packets over the stamps and the labels of the pieces, as the 3D labels do, while the packets themselves go under them. Each label has the plan and the cycle of its packet, so it moves with it; a packet with no ports has none. The sends in the air are the ones `Traffic` draws, from the same `sent` and layout. */
export function FlightLabels({ flows, sent, layout }: Omit<TrafficProps, 'fans' | 'still'>) {
  const flights = useFlights(flows, sent, layout);
  return (
    <g className="map-flight-tags">
      {flights.flatMap(({ key, flying, plan, cycle }) => {
        const legs = flying.way.run.ports?.legs;
        return legs && plan.labels.length > 0 ? [<FlightTags key={key} flying={flying} legs={legs} plan={plan} cycle={cycle} bounds={layout.size} />] : [];
      })}
    </g>
  );
}

/** Takes the live flows and the packets the player sent (in the order they stand), the layout, the fans of the stamps and whether animations are off; returns the packets of the map. With animations off, the still map: the trace of each packet with its shape and its label. With animations on, the packets in flight (`g.map-flights`): each live flow sends a packet every 3.5 seconds, shifted 1.1 seconds for every flow before it, in as many copies as the periods its trip lasts, and each packet the player sent flies once, from the moment its group is mounted, so a new send number starts a new flight, beside the earlier sends of the same combination that are still in the air (`useSendsInFlight`). Their labels are `FlightLabels`, which `MapStage` draws in an `svg` of its own over the HTML layer. A packet that starts at a piece the map does not draw is not drawn. */
export function Traffic({ flows, sent, layout, fans, still }: TrafficProps) {
  return still ? <StillTraffic packets={stillPackets([...flows, ...sent], layout, fans)} /> : <FlyingTraffic flows={flows} sent={sent} layout={layout} />;
}
