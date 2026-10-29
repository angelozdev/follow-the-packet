import { ALMANAC_TEXT, type TermText } from '@/copy';
import type { Incident } from '@/levels';
import type { Progress } from '@/storage';
import { TaggedText } from '@/ui/tagged-text';

export interface Lesson {
  id: string;
  title: string;
  takeaway: TermText;
}

export function lessonsOf(incidents: Incident[], playedId: string, progress: Progress): Lesson[] {
  return incidents
    .slice(0, incidents.findIndex(({ id }) => id === playedId) + 1)
    .filter(({ id }) => (progress[id] ?? 0) > 0)
    .map(({ id, title, takeaway }) => ({ id, title, takeaway }));
}

export function AlmanacLessons({ lessons }: { lessons: Lesson[] }) {
  if (lessons.length === 0) return <p>{ALMANAC_TEXT.noLessons}</p>;
  return (
    <ol className="almanac__lessons">
      {lessons.map(({ id, title, takeaway }) => (
        <li key={id}>
          <h3>{title}</h3>
          <p>
            <TaggedText text={takeaway} />
          </p>
        </li>
      ))}
    </ol>
  );
}
