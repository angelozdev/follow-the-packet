import { NOT_FOUND_TEXT } from '@/copy';

export function NotFound({ levelId }: { levelId: string }) {
  return (
    <main className="page">
      <h1>{NOT_FOUND_TEXT.title}</h1>
      <p>{NOT_FOUND_TEXT.body(levelId)}</p>
      <a href="#/">{NOT_FOUND_TEXT.back}</a>
    </main>
  );
}
