import { useId, useState } from 'react';
import type { Session } from '@/game';
import { hasNews, luciaNews } from './lucia-news';

export function useLuciaFold(session: Session) {
  const controls = useId();
  const [folded, setFolded] = useState(false);
  const news = luciaNews(session);
  const [seen, setSeen] = useState(news);
  const arrived = hasNews(seen, news);
  const goneBack = hasNews(news, seen);
  if (arrived || goneBack) {
    setSeen(news);
    if (arrived) setFolded(false);
  }
  return { folded, controls, onToggle: () => setFolded((current) => !current) };
}
