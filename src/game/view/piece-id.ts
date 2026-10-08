export type PieceRef = { kind: 'server' | 'barrier' | 'actor' | 'packet'; id: string } | { kind: 'gateway' };

const ID_KINDS = ['server', 'barrier', 'actor', 'packet'] as const;
const SEPARATOR = ':';

export const PIECE_ID = {
  server: (instanceId: string) => `server${SEPARATOR}${instanceId}`,
  barrier: (sgId: string) => `barrier${SEPARATOR}${sgId}`,
  actor: (actorId: string) => `actor${SEPARATOR}${actorId}`,
  packet: (flowId: string) => `packet${SEPARATOR}${flowId}`,
  gateway: 'gateway',
} as const;

function isIdKind(value: string): value is (typeof ID_KINDS)[number] {
  return (ID_KINDS as readonly string[]).includes(value);
}

/** Reads a piece id back into what it names, or null when it names nothing the map draws. */
export function parsePieceId(pieceId: string): PieceRef | null {
  if (pieceId === PIECE_ID.gateway) return { kind: 'gateway' };
  const separator = pieceId.indexOf(SEPARATOR);
  const kind = pieceId.slice(0, separator);
  return separator > 0 && isIdKind(kind) ? { kind, id: pieceId.slice(separator + 1) } : null;
}
