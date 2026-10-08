import { useHash } from '@mantine/hooks';
import { useState } from 'react';
import { INCIDENTS } from '@/levels';
import { loadProgress, saveStars } from '@/storage';
import { IncidentPage, Roadmap } from '@/ui';

const LEVEL_ROUTE = /^#\/level\/(\d{2}-\d{2})$/;

export function App() {
  const [hash] = useHash({ getInitialValueInEffect: false });
  const [progress, setProgress] = useState(loadProgress);
  const levelId = LEVEL_ROUTE.exec(hash)?.[1];
  if (levelId === undefined) return <Roadmap levels={INCIDENTS} progress={progress} />;
  return <IncidentPage incidents={INCIDENTS} levelId={levelId} progress={progress} onFinish={(id, stars) => setProgress(saveStars(progress, id, stars))} />;
}
