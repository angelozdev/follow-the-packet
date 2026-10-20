import { useCallback, type ReactNode } from 'react';
import type { PortLabels } from '@/copy';
import type { Box } from '@/scene/layout/arrange/geometry';
import type { Point } from '@/scene/layout/graph';
import { LABEL_HEIGHT, labelWidth, type LabelBox } from '@/scene/layout/metrics';
import { legTextAt } from '@/scene/marks/packet-tags';
import { GLYPH_BOX, seedsOf, type GlyphRole, type Seed, type StillGlyph, type Way } from '@/scene/marks/still-packets';
import { keyframes, labelRide, motionOf, routeOf, type Cycle, type FlightPlan, type Keyframes, type Span } from './flight-plan';
import { PacketTag } from '@/scene/traffic/packet-tag';
import { PacketGlyph, pathData } from '@/scene/traffic/still-trace';

const ANIMATIONS = 'animate, animateMotion, animateTransform';
const BURST_RADIUS = 10;
const BURST_GROWTH = 2.5;
const SHAPE_BOX: Box = { x: -GLYPH_BOX / 2, y: -GLYPH_BOX / 2, width: GLYPH_BOX, height: GLYPH_BOX };

export interface Flying {
  way: Way;
  changesAt?: number;
}

type Scale = ReadonlyArray<readonly [number, number]>;

function listOf(values: readonly number[]): string {
  return values.join(';');
}

function clockOf({ begin, period, repeats }: Cycle) {
  return { begin: repeats ? `${begin}s` : 'indefinite', dur: `${period}s`, repeatCount: repeats ? 'indefinite' : 1 };
}

function beginAfter(root: SVGGElement, wait: number) {
  const animations = [...root.querySelectorAll(ANIMATIONS)].filter((each): each is SVGAnimationElement => 'beginElementAt' in each);
  animations.forEach((animation) => animation.beginElementAt(wait));
  return () => animations.forEach((animation) => animation.endElement());
}

function useBeginsWhenMounted({ begin, repeats }: Cycle) {
  return useCallback((root: SVGGElement) => (repeats ? undefined : beginAfter(root, begin)), [begin, repeats]);
}

function Animation({ cycle, name, type, calcMode, frames }: { cycle: Cycle; name: string; type?: string; calcMode: 'discrete' | 'linear'; frames: Keyframes }) {
  const timing = { attributeName: name, calcMode, keyTimes: listOf(frames.keyTimes), values: listOf(frames.values), ...clockOf(cycle) };
  return type === undefined ? <animate {...timing} /> : <animateTransform {...timing} type={type} />;
}

/** Takes the cycle a packet is run in, the span of that cycle where its content shows and, optionally, how the content scales during the cycle (pairs of seconds and scale); returns the content in a group that is hidden except during the span, and scaled as asked. */
function Shown({ cycle, span, scale, children }: { cycle: Cycle; span: Span; scale?: Scale; children: ReactNode }) {
  return (
    <g opacity={0}>
      <Animation cycle={cycle} name="opacity" calcMode="discrete" frames={keyframes(cycle.period, [[0, 0], [span.from, 1], [span.to, 0]])} />
      {scale && <Animation cycle={cycle} name="transform" type="scale" calcMode="linear" frames={keyframes(cycle.period, scale)} />}
      {children}
    </g>
  );
}

function Motion({ cycle, route, keyTimes, keyPoints }: { cycle: Cycle; route: readonly Point[]; keyTimes: readonly number[]; keyPoints: readonly number[] }) {
  return <animateMotion path={pathData(route)} calcMode="linear" keyPoints={listOf(keyPoints)} keyTimes={listOf(keyTimes)} {...clockOf(cycle)} />;
}

function shapeOf(seed: Seed): StillGlyph {
  return { ...seed, point: [0, 0], box: SHAPE_BOX };
}

function scaleOf(plan: FlightPlan, role: GlyphRole): Scale | undefined {
  const { ending, travel } = plan;
  if (role === 'going' && ending?.kind === 'shrink') return [[0, 1], [travel, 1], [ending.to, 0]];
  return undefined;
}

/** Takes a packet in flight, its plan and the cycle it is run in; returns the packet: a group that an `animateMotion` carries along the route of the packet (the path, and the same path back when the packet is answered or a warning comes back along it) at 120 px per second, with its shapes each shown during its own span of the flight (the shape of the protocol going, the ring or the warning coming back, the warning of the sender's own device at the end of the path), the going shape shrinking away when the packet is lost, and a ring that bursts at the end of the path when it is blocked. The shapes are drawn around the point where the group stands, hidden except while they show. A send begins when the group is mounted, once the wait of its plan has gone by. */
export function FlightBody({ flying, plan, cycle }: { flying: Flying; plan: FlightPlan; cycle: Cycle }) {
  const { way } = flying;
  const begin = useBeginsWhenMounted(cycle);
  return (
    <g className="map-flight" data-packet={way.run.id} data-end={plan.end} ref={begin}>
      <g className="map-flight__body">
        <Motion cycle={cycle} route={routeOf(way.path, plan.end)} {...motionOf(plan, cycle.period)} />
        {seedsOf(way).flatMap((seed) => {
          const span = plan.glyphs[seed.role];
          return span ? [<Shown key={seed.role} cycle={cycle} span={span} scale={scaleOf(plan, seed.role)}><PacketGlyph glyph={shapeOf(seed)} /></Shown>] : [];
        })}
        {plan.ending?.kind === 'burst' && (
          <Shown cycle={cycle} span={plan.ending} scale={[[0, 1], [plan.ending.from, 1], [plan.ending.to, BURST_GROWTH]]}>
            <circle className="map-burst" r={BURST_RADIUS} />
          </Shown>
        )}
      </g>
    </g>
  );
}

function centeredBox({ width, height }: LabelBox): Box {
  return { x: -width / 2, y: -height / 2, width, height };
}

/** Takes a packet in flight, the labels it wears leg by leg, its plan, the cycle it is run in and the size of the drawing; returns the labels of the packet: a group that an `animateMotion` carries beside the packet, above its shape and kept inside the drawing (`labelRide`), with one label for each leg and direction of the flight, each shown only while the packet is in that leg: the label of the first leg before the router that translates the ports and the label of the last leg after it, and the answer coming back, with the ports swapped, from the last leg to the first. */
export function FlightTags({ flying, legs, plan, cycle, bounds }: { flying: Flying; legs: readonly PortLabels[]; plan: FlightPlan; cycle: Cycle; bounds: LabelBox }) {
  const { way, changesAt } = flying;
  const begin = useBeginsWhenMounted(cycle);
  const texts = plan.labels.map(({ distance, back }) => legTextAt(legs, changesAt, distance, back));
  const ride = labelRide(routeOf(way.path, plan.end), { width: Math.max(...texts.map((text) => labelWidth(text))), height: LABEL_HEIGHT }, bounds, cycle.period);
  return (
    <g className="map-flight-tag" data-packet={way.run.id} ref={begin}>
      <Motion cycle={cycle} route={ride.centers} keyTimes={ride.keyTimes} keyPoints={ride.keyPoints} />
      {plan.labels.map((span, index) => (
        <Shown key={`${span.back}:${span.from}`} cycle={cycle} span={span}>
          <PacketTag id={way.run.id} text={texts[index]} box={centeredBox({ width: labelWidth(texts[index]), height: LABEL_HEIGHT })} />
        </Shown>
      ))}
    </g>
  );
}
