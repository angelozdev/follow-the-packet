import { useId, useState } from 'react';
import type { Session } from '@/game';
import { hasNews, luciaNews } from './lucia-news';

/** Takes the session and returns the fold of the zone of Lucía: whether it is folded (never at first, and never kept after the screen goes), the id of the zone the arrow controls and what the arrow does. The fold opens by itself in the same render that brings what is new for her, so her alert, her question and her result are never drawn hidden. */
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
