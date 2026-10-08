import { useHash } from '@mantine/hooks';
import { useState } from 'react';
import { LEVELS } from '@/levels';
import { loadProgress } from '@/storage';
import { NotFound, Roadmap } from '@/ui';

const LEVEL_ROUTE = /^#\/level\/(\d{2}-\d{2})$/;

export function App() {
  const [hash] = useHash({ getInitialValueInEffect: false });
  const [progress] = useState(loadProgress);
  const levelId = LEVEL_ROUTE.exec(hash)?.[1];
  return levelId === undefined ? <Roadmap levels={LEVELS} progress={progress} /> : <NotFound levelId={levelId} />;
}
