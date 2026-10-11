import { MESSAGE_TEXT, NOTICE_TEXT } from '@/copy';
import { Button, Message, type MessageVariant } from '@/design';

export function NoticePage({ title, body, variant }: { title: string; body: string; variant: MessageVariant }) {
  return (
    <main className="page">
      <h1>{title}</h1>
      <Message variant={variant} words={MESSAGE_TEXT}>
        {body}
      </Message>
      <Button variant="text" href="#/">
        {NOTICE_TEXT.back}
      </Button>
    </main>
  );
}
