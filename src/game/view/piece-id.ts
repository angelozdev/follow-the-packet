export type PieceRef = { kind: 'device' | 'firewall' | 'actor' | 'router' | 'packet'; id: string } | { kind: 'stamps'; ids: string[] } | { kind: 'edge' } | { kind: 'internet' };

const ID_KINDS = ['device', 'firewall', 'actor', 'router', 'packet'] as const;
const STAMPS_KIND = 'stamps';
const SEPARATOR = ':';
export const STAMPS_SEPARATOR = '|';

export const PIECE_ID = {
  device: (deviceId: string) => `device${SEPARATOR}${deviceId}`,
  firewall: (firewallId: string) => `firewall${SEPARATOR}${firewallId}`,
  actor: (actorId: string) => `actor${SEPARATOR}${actorId}`,
  router: (routerId: string) => `router${SEPARATOR}${routerId}`,
  packet: (flowId: string) => `packet${SEPARATOR}${flowId}`,
  stamps: (packetIds: readonly string[]) => `${STAMPS_KIND}${SEPARATOR}${packetIds.join(STAMPS_SEPARATOR)}`,
  edge: 'edge',
  internet: 'internet',
} as const;

function isIdKind(value: string): value is (typeof ID_KINDS)[number] {
  return (ID_KINDS as readonly string[]).includes(value);
}

/** Reads a piece id back into what it names, or null when it names nothing the map draws. The id of a list of stamps (`PIECE_ID.stamps`) reads back into the ids of its packets, in the order they were given. */
export function parsePieceId(pieceId: string): PieceRef | null {
  if (pieceId === PIECE_ID.edge) return { kind: 'edge' };
  if (pieceId === PIECE_ID.internet) return { kind: 'internet' };
  const separator = pieceId.indexOf(SEPARATOR);
  if (separator <= 0) return null;
  const kind = pieceId.slice(0, separator);
  const rest = pieceId.slice(separator + 1);
  if (kind === STAMPS_KIND) return { kind, ids: rest === '' ? [] : rest.split(STAMPS_SEPARATOR) };
  return isIdKind(kind) ? { kind, id: rest } : null;
}
