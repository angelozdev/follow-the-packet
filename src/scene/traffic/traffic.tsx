import { graphOf } from '@/scene/layout/arrange/assemble';
import type { MapLayout } from '@/scene/layout/arrange/geometry';
import type { Graph } from '@/scene/layout/graph';
import { startsOnMap } from '@/scene/layout/stations';
import type { Fan } from '@/scene/marks/stamp-fan';
import { stillPackets, translationAt, wayOf } from '@/scene/marks/still-packets';
import type { DrawnRun, SentRun } from '@/scene/overlay/map-stamps';
import { FlightBody, FlightTags, type Flying } from '@/scene/traffic/flight/flight';
import { flightPlan, flowCycles, sendCycle, type Cycle, type FlightPlan } from '@/scene/traffic/flight/flight-plan';
import { StillTraffic } from './still-trace';
import { flightKeyOf, useSendsInFlight } from '@/scene/traffic/flight/use-sends-in-flight';

interface Flight {
  key: string;
  flying: Flying;
  plan: FlightPlan;
  cycle: Cycle;
}

interface TrafficProps {
  flows: readonly DrawnRun[];
  sent: readonly SentRun[];
  inTheAir: readonly SentRun[];
  layout: MapLayout;
  fans: readonly Fan[];
  still: boolean;
}

type FlightsProps = Pick<TrafficProps, 'flows' | 'inTheAir' | 'layout'>;

const NO_SENDS: readonly SentRun[] = [];

function flyingOf(run: DrawnRun, layout: MapLayout, graph: Graph): Flying {
  const way = wayOf(run, layout, graph);
  return { way, changesAt: translationAt(run, way.path, layout) };
}

function planOf({ way, changesAt }: Flying): FlightPlan {
  return flightPlan(way.path, way.look.end, 0, changesAt);
}

function flightsOf(flows: readonly DrawnRun[], sends: readonly SentRun[], layout: MapLayout): Flight[] {
  const graph = graphOf(layout);
  const onMap = ({ packet }: DrawnRun) => startsOnMap(packet, layout.drawn);
  const ofFlows = flows.filter(onMap).flatMap((run, index) => {
    const flying = flyingOf(run, layout, graph);
    const plan = planOf(flying);
    return flowCycles(plan, index).map((cycle, copy): Flight => ({ key: `flow:${run.id}:${copy}`, flying, plan, cycle }));
  });
  const ofSent = sends.filter(onMap).map((run): Flight => {
    const flying = flyingOf(run, layout, graph);
    const plan = planOf(flying);
    return { key: flightKeyOf(run), flying, plan, cycle: sendCycle(plan) };
  });
  return [...ofFlows, ...ofSent];
}

function sendSeconds(run: SentRun, layout: MapLayout): number {
  return startsOnMap(run.packet, layout.drawn) ? planOf(flyingOf(run, layout, graphOf(layout))).duration : 0;
}

/** Takes the runs the player sent (the last of each combination of chips, as the session keeps them), the layout and whether animations are off; returns the sends in the air: those of `sent` and each earlier send of a combination that a newer one replaced, until its own trip ends (`useSendsInFlight`). It is one list for the packets (`Traffic`) and their labels (`FlightLabels`), so whoever draws both calls it once and hands it to both as `inTheAir`. With animations off nothing flies, and what it had kept is forgotten. */
export function useSendsInTheAir(sent: readonly SentRun[], layout: MapLayout, still: boolean): SentRun[] {
  return useSendsInFlight(still ? NO_SENDS : sent, (run) => sendSeconds(run, layout));
}

function FlyingTraffic({ flows, inTheAir, layout }: FlightsProps) {
  return (
    <g className="map-flights">
      {flightsOf(flows, inTheAir, layout).map(({ key, flying, plan, cycle }) => (
        <FlightBody key={key} flying={flying} plan={plan} cycle={cycle} />
      ))}
    </g>
  );
}

/** Takes the live flows, the sends in the air (`useSendsInTheAir`, the same list `Traffic` gets) and the layout; returns the labels of the packets with ports that are in flight, in a group (`g.map-flight-tags`) for an `svg` of its own, as large as the drawing, that `MapStage` puts over the HTML layer: the labels fly beside their packets over the stamps and the labels of the pieces, while the packets themselves go under them. Each label has the plan and the cycle of its packet, so it moves with it; a packet with no ports has none. */
export function FlightLabels({ flows, inTheAir, layout }: FlightsProps) {
  return (
    <g className="map-flight-tags">
      {flightsOf(flows, inTheAir, layout).flatMap(({ key, flying, plan, cycle }) => {
        const legs = flying.way.run.ports?.legs;
        return legs && plan.labels.length > 0 ? [<FlightTags key={key} flying={flying} legs={legs} plan={plan} cycle={cycle} bounds={layout.size} />] : [];
      })}
    </g>
  );
}

/** Takes the live flows, the packets the player sent (in the order they stand), the sends in the air (`useSendsInTheAir`, the same list `FlightLabels` gets), the layout, the fans of the stamps and whether animations are off; returns the packets of the map. With animations off, the still map: the trace of each packet with its shape and its label. With animations on, the packets in flight (`g.map-flights`): each live flow sends a packet every 3.5 seconds, shifted 1.1 seconds for every flow before it, in as many copies as the periods its trip lasts, and each packet the player sent flies once, from the moment its group is mounted, so a new send number starts a new flight, beside the earlier sends of the same combination that are still in the air (`inTheAir`). Their labels are `FlightLabels`, which `MapStage` draws in an `svg` of its own over the HTML layer. A packet that starts at a piece the map does not draw is not drawn. */
export function Traffic({ flows, sent, inTheAir, layout, fans, still }: TrafficProps) {
  return still ? <StillTraffic packets={stillPackets([...flows, ...sent], layout, fans)} /> : <FlyingTraffic flows={flows} inTheAir={inTheAir} layout={layout} />;
}
