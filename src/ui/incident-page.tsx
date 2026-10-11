import { NOTICE_TEXT } from '@/copy';
import type { Incident } from '@/levels';
import { isUnlocked, type Progress } from '@/storage';
import { IncidentScreen } from './incident/incident-screen';
import { NoticePage } from './notice-page';

interface IncidentPageProps {
  incidents: Incident[];
  levelId: string;
  progress: Progress;
  onFinish: (levelId: string, stars: number) => void;
}

/** Opens an incident from its URL: a notice when it does not exist or is still locked, the incident screen otherwise. */
export function IncidentPage({ incidents, levelId, progress, onFinish }: IncidentPageProps) {
  const incident = incidents.find((candidate) => candidate.id === levelId);
  if (!incident) return <NoticePage variant="error" title={NOTICE_TEXT.notFound.title} body={NOTICE_TEXT.notFound.body(levelId)} />;
  if (!isUnlocked(incident, progress, incidents)) return <NoticePage variant="warning" title={NOTICE_TEXT.locked.title} body={NOTICE_TEXT.locked.body(levelId)} />;
  const next = incidents.at(incidents.indexOf(incident) + 1);
  return <IncidentScreen key={incident.id} incidents={incidents} incidentId={incident.id} nextId={next?.id ?? null} onFinish={(stars) => onFinish(incident.id, stars)} />;
}
