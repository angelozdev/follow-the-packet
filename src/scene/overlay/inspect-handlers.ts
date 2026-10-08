export type OnInspect = (pieceId: string | null) => void;

/** Returns the props that inspect a piece while the mouse is over it or it has the focus, and stop when either leaves. */
export function inspectHandlers(pieceId: string, onInspect: OnInspect) {
  const inspect = () => onInspect(pieceId);
  const leave = () => onInspect(null);
  return { onMouseEnter: inspect, onMouseLeave: leave, onFocus: inspect, onBlur: leave };
}
