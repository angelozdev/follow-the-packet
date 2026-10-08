import type { Checkpoint } from '../../engine/types';
import { formatPacket } from '../../format';
import type { Level } from '../../levels/schema';

export function PredictPanel({ level, onPredict }: { level: Level; onPredict: (cp: Checkpoint) => void }) {
  return (
    <section className="card" aria-labelledby="predict-title">
      <h3 id="predict-title">Predice</h3>
      <p>
        Antes de tocar nada: <strong>{formatPacket(level.prediction.packet, level.network)}</strong>. ¿Dónde crees que muere?
      </p>
      <p className="muted">Elige aquí o haz clic en un círculo del mapa.</p>
      <div className="choices">
        {level.prediction.candidates.map((c) => (
          <button key={c.label} className="btn btn--choice" onClick={() => onPredict(c.checkpoint)}>
            {c.label}
          </button>
        ))}
      </div>
    </section>
  );
}
