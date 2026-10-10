export type PieceRef = { kind: 'device' | 'firewall' | 'actor' | 'router' | 'packet'; id: string } | { kind: 'edge' } | { kind: 'internet' };

const ID_KINDS = ['device', 'firewall', 'actor', 'router', 'packet'] as const;
const SEPARATOR = ':';

export const PIECE_ID = {
  device: (deviceId: string) => `device${SEPARATOR}${deviceId}`,
  firewall: (firewallId: string) => `firewall${SEPARATOR}${firewallId}`,
  actor: (actorId: string) => `actor${SEPARATOR}${actorId}`,
  router: (routerId: string) => `router${SEPARATOR}${routerId}`,
  packet: (flowId: string) => `packet${SEPARATOR}${flowId}`,
  edge: 'edge',
  internet: 'internet',
} as const;

function isIdKind(value: string): value is (typeof ID_KINDS)[number] {
  return (ID_KINDS as readonly string[]).includes(value);
}

/** Reads a piece id back into what it names, or null when it names nothing the map draws. */
export function parsePieceId(pieceId: string): PieceRef | null {
  if (pieceId === PIECE_ID.edge) return { kind: 'edge' };
  if (pieceId === PIECE_ID.internet) return { kind: 'internet' };
  const separator = pieceId.indexOf(SEPARATOR);
  const kind = pieceId.slice(0, separator);
  return separator > 0 && isIdKind(kind) ? { kind, id: pieceId.slice(separator + 1) } : null;
}
