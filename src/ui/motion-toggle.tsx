import { SCREEN_TEXT } from '@/copy';

/** The "Sin animaciones" checkbox. */
export function MotionToggle({ still, className, onChange }: { still: boolean; className: string; onChange: (still: boolean) => void }) {
  return (
    <label className={className}>
      <input type="checkbox" checked={still} onChange={(event) => onChange(event.target.checked)} /> {SCREEN_TEXT.motion}
    </label>
  );
}
