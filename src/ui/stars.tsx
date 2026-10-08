import { ROADMAP_TEXT } from '@/copy';
import { MAX_STARS } from '@/storage';

export function Stars({ count }: { count: number }) {
  return (
    <span className="stars-inline">
      <span aria-hidden="true">
        {'★'.repeat(count)}
        {'☆'.repeat(MAX_STARS - count)}
      </span>
      <span className="sr-only">{ROADMAP_TEXT.starsOf(count)}</span>
    </span>
  );
}
