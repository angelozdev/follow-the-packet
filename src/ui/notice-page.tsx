import { NOTICE_TEXT } from '@/copy';
import { Button } from '@/design';

export function NoticePage({ title, body }: { title: string; body: string }) {
  return (
    <main className="page">
      <h1>{title}</h1>
      <p>{body}</p>
      <Button variant="text" href="#/">
        {NOTICE_TEXT.back}
      </Button>
    </main>
  );
}
