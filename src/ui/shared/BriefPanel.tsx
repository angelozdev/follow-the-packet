import type { Level } from '../../levels/schema';

export function BriefPanel({ level, onStart }: { level: Level; onStart: () => void }) {
  return (
    <section className="card">
      <p>{level.brief}</p>
      <p className="muted">
        {level.role === 'defender'
          ? 'Eres el defensor: configura la red para que pase lo bueno y nada más.'
          : 'Eres el atacante: encuentra el camino que la configuración deja abierto.'}
      </p>
      <p className="muted">Repasa: {level.lesson}</p>
      <button className="btn btn--primary" onClick={onStart}>
        Empezar
      </button>
    </section>
  );
}
