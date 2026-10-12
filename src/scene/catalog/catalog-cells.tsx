import type { ReactNode } from 'react';
import { CATALOG_TEXT, entityName, type EntityRef, type EntityVariants, type PacketShape, type StampState } from '@/copy';
import type { ClientActor, FirewallKind } from '@/engine';
import {
  ActorPiece,
  DevicePiece,
  EdgePiece,
  FirewallPiece,
  InternetPiece,
  NetworkPiece,
  type NetworkVariant,
  PACKET_Y,
  PacketGlyph,
  PacketTrace,
  StampPiece,
  type DeviceVariant,
  type PacketEnd,
} from '@/scene/entities';
import { labelOffset, type Vec2 } from '@/scene/layout';
import { PieceAnchor } from '@/scene/overlay/piece-anchor';
import type { MapPiece, MapPieceKind } from '@/scene/overlay/piece-label';
import { FlowTraffic } from '@/scene/traffic/flow-traffic';
import { screenToGround } from './catalog-grid';

export interface CatalogCell {
  id: string;
  caption: string;
  draw: (still: boolean) => ReactNode;
}

type PieceEntity = Extract<EntityRef, { kind: MapPieceKind }>;
interface TraceEnd {
  end: Extract<PacketEnd, keyof typeof CATALOG_TEXT.state>;
  message: PacketShape;
  intruder: boolean;
  stamp: StampState;
}

const ORIGIN: Vec2 = [0, 0];
const NETWORK_SIZE = { width: 3.2, depth: 2.2 };
const TRACE_HALF = 1.7;
const TRACE: Vec2[] = [screenToGround(-TRACE_HALF, 0), screenToGround(TRACE_HALF, 0)];
const DEVICE_STATES = ['normal', 'locked', 'selected', 'alert'] as const;
const FIREWALL_STATES = ['locked', 'configurable', 'selected', 'blocking'] as const;
const TRACE_ENDS: TraceEnd[] = [
  { end: 'replied', message: 'echo-request', intruder: false, stamp: 'arrived' },
  { end: 'arrived', message: 'echo-reply', intruder: false, stamp: 'arrived' },
  { end: 'blocked', message: 'echo-request', intruder: false, stamp: 'blocked' },
  { end: 'lost', message: 'echo-request', intruder: false, stamp: 'lost' },
  { end: 'arrived', message: 'echo-request', intruder: true, stamp: 'intruder' },
];
const WARNED_END: TraceEnd = { end: 'warned', message: 'echo-request', intruder: false, stamp: 'warned' };
const TRANSPORT_ROWS: [PacketShape, PacketShape][] = [['tcp-request', 'tcp-reply'], ['udp-request', 'udp-reply']];
const ignore = () => {};

function Label({ id, entity, locked, state }: { id: string; entity: PieceEntity; locked: boolean; state: MapPiece['state'] }) {
  const piece: MapPiece = { ...entity, id, anchorId: id, label: entityName(entity), locked, state };
  return <PieceAnchor piece={piece} position={labelOffset(entity.kind)} onInspect={ignore} onActivate={ignore} />;
}

function deviceCell(variant: DeviceVariant, state: (typeof DEVICE_STATES)[number]): CatalogCell {
  const id = `device-${variant}-${state}`;
  return {
    id,
    caption: CATALOG_TEXT.state[state],
    draw: (still) => (
      <>
        <DevicePiece position={ORIGIN} variant={variant} selected={state === 'selected'} intruded={state === 'alert'} still={still} />
        <Label id={id} entity={{ kind: 'device', variant }} locked={state === 'locked'} state={state === 'alert' ? 'intruded' : 'normal'} />
      </>
    ),
  };
}

function deviceRow(variant: DeviceVariant): CatalogCell[] {
  return DEVICE_STATES.map((state) => deviceCell(variant, state));
}

function firewallRow(variant: FirewallKind): CatalogCell[] {
  return FIREWALL_STATES.map((state) => {
    const id = `firewall-${variant}-${state}`;
    return {
      id,
      caption: CATALOG_TEXT.state[state],
      draw: (still) => (
        <>
          <FirewallPiece position={ORIGIN} variant={variant} selected={state === 'selected'} blocking={state === 'blocking'} still={still} />
          <Label id={id} entity={{ kind: 'firewall', variant }} locked={state === 'locked'} state={state === 'blocking' ? 'blocking' : 'normal'} />
        </>
      ),
    };
  });
}

function networkCell(variant: NetworkVariant): CatalogCell {
  return { id: `network-${variant}`, caption: entityName({ kind: 'network', variant }), draw: () => <NetworkPiece variant={variant} {...NETWORK_SIZE} /> };
}

function edgeCell(variant: EntityVariants['edge']): CatalogCell {
  const id = `edge-${variant}`;
  return {
    id,
    caption: CATALOG_TEXT.state.locked,
    draw: () => (
      <>
        <EdgePiece position={ORIGIN} variant={variant} />
        <Label id={id} entity={{ kind: 'edge', variant }} locked state="normal" />
      </>
    ),
  };
}

const INTERNET_CELL: CatalogCell = {
  id: 'internet',
  caption: CATALOG_TEXT.state.normal,
  draw: () => (
    <>
      <InternetPiece position={ORIGIN} />
      <Label id="internet" entity={{ kind: 'internet', variant: 'internet' }} locked={false} state="normal" />
    </>
  ),
};

function actorCell(variant: ClientActor['kind']): CatalogCell {
  const id = `actor-${variant}`;
  return {
    id,
    caption: CATALOG_TEXT.state.normal,
    draw: () => (
      <>
        <ActorPiece position={ORIGIN} variant={variant} />
        <Label id={id} entity={{ kind: 'actor', variant }} locked={false} state="normal" />
      </>
    ),
  };
}

function packetCell(message: PacketShape, intruder: boolean): CatalogCell {
  return {
    id: `packet-${message}-${intruder}`,
    caption: entityName({ kind: 'packet', variant: message, intruder }),
    draw: () => (
      <group position={[0, PACKET_Y, 0]}>
        <PacketGlyph message={message} intruder={intruder} />
      </group>
    ),
  };
}

function transportRow([request, reply]: [PacketShape, PacketShape]): CatalogCell[] {
  return [packetCell(request, false), packetCell(reply, false), packetCell(request, true), packetCell(reply, true)];
}

function traceCell({ end, message, intruder, stamp }: TraceEnd, index: number): CatalogCell {
  const id = `trace-${end}-${stamp}`;
  const look = { path: TRACE, message, intruder, end };
  const caption = intruder ? CATALOG_TEXT.intruder : CATALOG_TEXT.state[end];
  return {
    id,
    caption,
    draw: (still) => (
      <>
        {still ? <PacketTrace {...look} /> : <FlowTraffic look={look} index={index} />}
        <StampPiece position={TRACE[1]} state={stamp} name={caption} pieceId={id} onInspect={ignore} />
      </>
    ),
  };
}

/** Every entity of the map in every variant and state, one row per entity or variant, in the order of the catalog in the chapter 1 design; the packets of TCP and UDP, each with its intruder's version, come last, so the cells of the rows above keep their place. */
export const CATALOG_ROWS: CatalogCell[][] = [
  [networkCell('office'), networkCell('vpc'), networkCell('block')],
  deviceRow('laptop'),
  deviceRow('printer'),
  [...deviceRow('ec2-instance'), deviceCell('internet-server', 'normal')],
  firewallRow('host-firewall'),
  firewallRow('security-group'),
  [edgeCell('router'), edgeCell('internet-gateway'), INTERNET_CELL],
  [actorCell('attacker'), actorCell('you'), actorCell('home')],
  [packetCell('echo-request', false), packetCell('echo-reply', false), packetCell('echo-request', true), packetCell('echo-reply', true), traceCell(WARNED_END, TRACE_ENDS.length)],
  TRACE_ENDS.map(traceCell),
  ...TRANSPORT_ROWS.map(transportRow),
];
