import { defineIncident } from '@/levels/contract/incident';
import { CONCEPT, LESSON, NAME, OPEN_YOUR_OUTBOUND } from '@/levels/01-first-day/shared';
import { CASES } from './cases';

export default defineIncident({
  id: '01-14',
  chapter: 1,
  order: 14,
  title: 'Guardia final',
  role: 'defender',
  mechanic: 'diagnose',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: [],
  changes: OPEN_YOUR_OUTBOUND,
  report: `Hoy estás de guardia. Antes de empezar, alguien cambió la configuración del {{firewall}} de ${NAME.you}: ahora deja salir todo. Cada caso trae un {{ping}} que no vuelve. Haz tus pruebas, mira el mapa y las cajas, y nombra la causa de cada caso.`,
  flows: [],
  diagnose: { cases: CASES },
  takeaway:
    'Para diagnosticar, prueba de lo más cercano a lo más lejano: el {{loopback}} de tu laptop, tu {{ip-address|IP}}, tu {{router}} y después {{internet}}. Dónde se detiene el {{packet|paquete}} y qué vuelve (la respuesta, un aviso o nada) apuntan a la causa.',
});
