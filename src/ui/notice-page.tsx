import { NOTICE_TEXT } from '@/copy';

export function NoticePage({ title, body }: { title: string; body: string }) {
  return (
    <main className="page">
      <h1>{title}</h1>
      <p>{body}</p>
      <a href="#/">{NOTICE_TEXT.back}</a>
    </main>
  );
}
