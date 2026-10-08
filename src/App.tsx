import { useEffect, useState } from 'react';
import { LEVELS, levelById } from './levels/registry';
import { loadProgress, saveStars, type Progress } from './storage/progress';
import { LevelScreen } from './ui/shared/LevelScreen';
import { Roadmap } from './ui/shared/Roadmap';
import { usePrefersReducedMotion } from './ui/shared/usePrefersReducedMotion';

function levelIdFrom(hash: string): string | null {
  const match = /^#\/level\/(\d{2}-\d{2})$/.exec(hash);
  return match ? match[1] : null;
}

export function App() {
  const [hash, setHash] = useState(() => window.location.hash);
  const [progress, setProgress] = useState<Progress>(() => loadProgress());
  const prefersReduced = usePrefersReducedMotion();
  const [skipAnimations, setSkipAnimations] = useState<boolean | null>(null);

  useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const reducedMotion = skipAnimations ?? prefersReduced;
  const levelId = levelIdFrom(hash);
  if (levelId === null) return <Roadmap levels={LEVELS} progress={progress} />;

  const level = levelById(levelId);
  if (!level) {
    return (
      <main className="page">
        <h1>Nivel no encontrado</h1>
        <p>No existe el nivel {levelId}.</p>
        <a href="#/">Volver al roadmap</a>
      </main>
    );
  }

  return (
    <LevelScreen
      key={level.id}
      level={level}
      reducedMotion={reducedMotion}
      onToggleMotion={() => setSkipAnimations(!reducedMotion)}
      onFinish={(stars) => setProgress(saveStars(level.id, stars))}
    />
  );
}
