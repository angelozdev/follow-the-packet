import { defineIncident } from '@/levels/contract/incident';
import { ADDRESS, CONCEPT, INTERNET, INTERNET_PIECES, LESSON, MESSAGE, NAME, ORIGIN, SERVER, TASK, pingTask, sendMove } from '@/levels/01-first-day/shared';

export default defineIncident({
  id: '01-08',
  chapter: 1,
  order: 8,
  title: 'La red de redes',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['internet', 'private-ip', 'public-ip'],
  changes: INTERNET,
  shown: INTERNET_PIECES,
  report: `Ahora la oficina está conectada a {{internet}}. Allá hay un servidor, ${NAME.server}, con la {{public-ip|IP pública}} 198.51.100.50. Haz un {{ping}} al servidor y otro a la impresora de otra oficina, que tiene la {{private-ip|IP privada}} 10.0.0.10. Mira dónde llega cada uno.`,
  tasks: [
    pingTask(TASK.server, 'Que vuelva tu {{ping}} al servidor.', ADDRESS.server.id, 'replied', SERVER.id),
    pingTask(TASK.otherOffice, 'Haz un {{ping}} a 10.0.0.10 y comprueba que no vuelve nada.', ADDRESS.otherOffice.id, 'timeout'),
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.server, ADDRESS.otherOffice, ADDRESS.printer], message: [MESSAGE.ping] },
  hints: [
    'Compara a dónde llegó cada {{ping}}. Abre la caja de cada uno y lee su resultado.',
    '{{internet|Internet}} no entrega una {{private-ip|IP privada}}: muchas redes usan la misma, y no sabría a cuál llevarla.',
  ],
  question: '¿Por qué el {{ping}} a la impresora de otra oficina no llegó?',
  explanation: [
    {
      text: 'Porque el servidor de internet no contestó el {{ping}}.',
      feedback: 'No. El {{ping}} al servidor sí volvió. El otro murió afuera de la oficina, antes de llegar a su destino.',
      correct: false,
    },
    {
      text: 'Porque 10.0.0.10 es una {{private-ip|IP privada}} y {{internet}} no la entrega.',
      feedback:
        'Eso es. Muchas redes usan la misma {{private-ip|IP privada}}, así que {{internet}} no sabe a cuál llevar el {{packet|paquete}}: un {{router}} de afuera lo descarta sin avisar. La {{public-ip|IP pública}} del servidor sí se alcanza desde internet.',
      correct: true,
    },
    {
      text: `Porque ${NAME.router} no deja salir los {{ping|pings}} de la oficina.`,
      feedback: `No. El {{ping}} al servidor también salió por ${NAME.router}, y volvió.`,
      correct: false,
    },
  ],
  solution: [sendMove(ADDRESS.server.id, MESSAGE.ping.id), sendMove(ADDRESS.otherOffice.id, MESSAGE.ping.id)],
  takeaway:
    '{{internet|Internet}} no entrega una {{private-ip|IP privada}}: muchas redes usan la misma. Una {{public-ip|IP pública}} sí se alcanza desde {{internet}}.',
});
