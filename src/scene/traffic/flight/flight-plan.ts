import { lengthOf, type Point } from '@/scene/layout/graph';
import type { LabelBox } from '@/scene/layout/metrics';
import { GLYPH_BOX, type GlyphRole } from '@/scene/marks/still-packets';
import type { FlowLook } from '@/scene/traffic/flow-look';

export const PACKET_SPEED = 120;
export const PACKET_END_SECONDS = 0.5;
export const FLOW_PERIOD = 3.5;
export const FLOW_OFFSET = 1.1;
export const LABEL_GAP = 2;

type PacketEnd = FlowLook['end'];

const COMES_BACK: readonly PacketEnd[] = ['replied', 'warned'];
const ENDING_KIND: Partial<Record<PacketEnd, Ending['kind']>> = { blocked: 'burst', lost: 'shrink', 'self-warned': 'appears' };

export interface Span {
  from: number;
  to: number;
}

export interface LabelWindow extends Span {
  back: boolean;
  distance: number;
}

export interface Ending extends Span {
  kind: 'burst' | 'shrink' | 'appears';
}

export interface FlightPlan {
  end: PacketEnd;
  begin: number;
  length: number;
  turn: number;
  travel: number;
  duration: number;
  glyphs: Partial<Record<GlyphRole, Span>>;
  labels: LabelWindow[];
  ending?: Ending;
}

export interface Cycle {
  begin: number;
  period: number;
  repeats: boolean;
}

export interface Keyframes {
  keyTimes: number[];
  values: number[];
}

export interface Motion {
  keyTimes: number[];
  keyPoints: number[];
}

export interface LabelRide extends Motion {
  centers: Point[];
}

function glyphSpans(end: PacketEnd, turn: number, travel: number, duration: number): FlightPlan['glyphs'] {
  if (end === 'self-warned') return { appears: { from: 0, to: duration } };
  const going = { from: 0, to: end === 'lost' ? duration : turn };
  return COMES_BACK.includes(end) ? { going, answer: { from: turn, to: travel } } : { going };
}

function splitSpan(from: number, to: number, cuts: readonly number[]): Span[] {
  const edges = [from, ...cuts, to];
  return edges.slice(1).map((edge, index) => ({ from: edges[index], to: edge }));
}

function labelWindows(end: PacketEnd, length: number, turn: number, travel: number, changesAt: number | undefined): LabelWindow[] {
  if (end === 'self-warned') return [];
  const distanceAtSecond = (seconds: number, back: boolean) => (back ? length - PACKET_SPEED * (seconds - turn) : PACKET_SPEED * seconds);
  const windowsOf = (spans: readonly Span[], back: boolean): LabelWindow[] =>
    spans.filter(({ from, to }) => to > from).map(({ from, to }) => ({ back, from, to, distance: distanceAtSecond((from + to) / 2, back) }));
  const going = windowsOf(splitSpan(0, turn, changesAt === undefined ? [] : [changesAt / PACKET_SPEED]), false);
  const coming = end === 'replied' ? windowsOf(splitSpan(turn, travel, changesAt === undefined ? [] : [turn + (length - changesAt) / PACKET_SPEED]), true) : [];
  return [...going, ...coming];
}

/** Takes the points of the path of a packet, how its run ends, the seconds it waits before it leaves and, when the ports of the packet change on the way, how far along the path they do; returns the plan of its flight, in seconds from the moment it leaves: how long it takes to reach the end of the path (`turn`), how long it is in the air (`travel`: twice the path when it comes back) and how long it is on the map (`duration`: the travel and the half second of its end), when each of its shapes shows, the windows of its labels (each with the distance along the path where the packet stands halfway through it, and whether it is the answer coming back) and its ending: a burst when it is blocked, a shrink when it is lost, and the warning of its own device, which does not travel and appears at the end of the path. */
export function flightPlan(path: readonly Point[], end: PacketEnd, wait: number, changesAt?: number): FlightPlan {
  const length = lengthOf(path).at(-1) ?? 0;
  const turn = end === 'self-warned' ? 0 : length / PACKET_SPEED;
  const travel = COMES_BACK.includes(end) ? 2 * turn : turn;
  const duration = travel + PACKET_END_SECONDS;
  const kind = ENDING_KIND[end];
  return {
    end,
    begin: wait,
    length,
    turn,
    travel,
    duration,
    glyphs: glyphSpans(end, turn, travel, duration),
    labels: labelWindows(end, length, turn, travel, changesAt),
    ...(kind && { ending: { kind, from: travel, to: duration } }),
  };
}

/** Takes the points of a path and how the run ends; returns the points a packet moves along: the path, and the same path back when the packet is answered or a warning comes back along it. */
export function routeOf(path: readonly Point[], end: PacketEnd): Point[] {
  return COMES_BACK.includes(end) ? [...path, ...path.slice(0, -1).reverse()] : [...path];
}

/** Takes a plan and the seconds since the packet left; returns how far along its route (`routeOf`) the packet is: 120 px for every second until the end of its travel, and where it stays during its ending. A warning of the device that sends does not travel: it is at the end of the path from the start. */
export function distanceAt({ end, length, travel }: FlightPlan, seconds: number): number {
  return end === 'self-warned' ? length : PACKET_SPEED * Math.min(Math.max(seconds, 0), travel);
}

/** Takes a plan and the seconds of the cycle that it is run in; returns how the packet moves along its route in that cycle, as the `keyTimes` and `keyPoints` of an `animateMotion`: it leaves at the start, reaches the end of the route when its travel is over and stays there for its ending. */
export function motionOf({ end, travel }: FlightPlan, period: number): Motion {
  if (end === 'self-warned' || travel === 0) return { keyTimes: [0, 1], keyPoints: [1, 1] };
  return { keyTimes: [0, travel / period, 1], keyPoints: [0, 1, 1] };
}

/** Takes the plan of a send; returns the second, counted from the moment the player sent it, when its answer is back at its sender: the moment a send that waits for it may leave. */
export function answerBackAt({ begin, travel }: FlightPlan): number {
  return begin + travel;
}

/** Takes the plan of a send; returns its cycle: it leaves once, `begin` seconds after the player sent it, and it is on the map for as long as its plan says. */
export function sendCycle({ begin, duration }: FlightPlan): Cycle {
  return { begin, period: duration, repeats: false };
}

/** Takes the plan of a live flow and its place among the flows; returns the cycles of its copies: a packet leaves every 3.5 seconds, shifted 1.1 seconds for every flow before it, and a packet that is on the map for longer than the period needs one copy for every period it lasts, each with a period of as many periods and shifted by one, so the map has as many packets of the flow as it ever had. */
export function flowCycles({ duration }: FlightPlan, index: number): Cycle[] {
  const copies = Math.ceil(duration / FLOW_PERIOD);
  return Array.from({ length: copies }, (_, copy) => ({ begin: index * FLOW_OFFSET + copy * FLOW_PERIOD, period: copies * FLOW_PERIOD, repeats: true }));
}

/** Takes the seconds of a cycle and the values an attribute takes at some moments of it, as pairs of seconds and value in order; returns them as the `keyTimes` (shares of the cycle) and `values` of an animation: the first value from the start, each value from its moment on and the last until the end of the cycle. A moment that is repeated keeps its last value. */
export function keyframes(period: number, points: ReadonlyArray<readonly [number, number]>): Keyframes {
  const shares = points.map(([seconds, value]) => [Math.min(seconds / period, 1), value] as const);
  const [first, last] = [shares[0], shares[shares.length - 1]];
  const edges = [...(first[0] > 0 ? [[0, first[1]] as const] : []), ...shares, ...(last[0] < 1 ? [[1, last[1]] as const] : [])];
  const kept = edges.filter(([share], index) => share !== edges[index + 1]?.[0]);
  return { keyTimes: kept.map(([share]) => share), values: kept.map(([, value]) => value) };
}

function clamp(value: number, low: number, high: number): number {
  return high < low ? (low + high) / 2 : Math.min(Math.max(value, low), high);
}

function distinct(times: readonly number[], points: readonly number[]): Motion {
  const kept = times.map((time, index) => [time, points[index]] as const).filter(([time, point], index, all) => time !== all[index + 1]?.[0] || point !== all[index + 1]?.[1]);
  return { keyTimes: kept.map(([time]) => time), keyPoints: kept.map(([, point]) => point) };
}

/** Takes the points of a route, the size of a label, the size of the drawing and the seconds of the cycle; returns where the label of the packet rides: its center over each point of the route (above the packet, clear of its shape) kept inside the drawing, and the `keyTimes` and `keyPoints` that make an `animateMotion` along those centers be at each of them when the packet is at its point, so the label goes with the packet whatever the distance the drawing's edge makes it shorten. */
export function labelRide(route: readonly Point[], { width, height }: LabelBox, bounds: LabelBox, period: number): LabelRide {
  const rise = GLYPH_BOX / 2 + height / 2 + LABEL_GAP;
  const centers = route.map(([x, y]): Point => [clamp(x, width / 2, bounds.width - width / 2), clamp(y - rise, height / 2, bounds.height - height / 2)]);
  const [packet, label] = [lengthOf(route), lengthOf(centers)];
  const total = label[label.length - 1];
  const times = [...packet.map((distance) => distance / PACKET_SPEED / period), 1];
  const points = [...label.map((distance) => (total === 0 ? 0 : distance / total)), 1];
  return { centers, ...distinct(times, points) };
}
