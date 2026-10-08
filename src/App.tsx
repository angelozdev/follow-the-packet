import { useHash } from '@mantine/hooks';
import { useState } from 'react';
import { LEVELS } from './levels/registry';
import { loadProgress } from './storage/progress';
import { Roadmap } from './ui/shared/Roadmap';

const LEVEL_ROUTE = /^#\/level\/(\d{2}-\d{2})$/;

export function App() {
  const [hash] = useHash({ getInitialValueInEffect: false });
  const [progress] = useState(loadProgress);
  const levelId = LEVEL_ROUTE.exec(hash)?.[1];
  if (levelId === undefined) return <Roadmap levels={LEVELS} progress={progress} />;
  return (
    <main className="page">
      <h1>Nivel no encontrado</h1>
      <p>No existe el nivel {levelId}.</p>
      <a href="#/">Volver al roadmap</a>
    </main>
  );
}
