import { defineIncident } from '@/levels/contract/incident';
import { ADDRESS, CONCEPT, DEVICE, FIREWALL, GUARD_PIECES, LESSON, MESSAGE, NAME, ORIGIN, REPAIRED_STRETCH, TASK, pingTask, sendMove } from '@/levels/01-first-day/shared';

export default defineIncident({
  id: '01-11',
  chapter: 1,
  order: 11,
  title: 'El guardia',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['firewall', 'traffic', 'drop'],
  changes: REPAIRED_STRETCH,
  shown: GUARD_PIECES,
  report: `En «Cuando no vuelve», el {{ping}} a ${NAME.marta} no volvió y nadie avisó. Ahora el mapa muestra el {{firewall}} de ${NAME.marta}, que ya estaba ahí. Un {{firewall}} revisa el {{traffic|tráfico}} de un {{device|dispositivo}} y decide qué {{packet|paquetes}} deja pasar. Repite el ping a ${NAME.marta} y haz otro a ${NAME.lucia}, que no tiene {{firewall}}.`,
  tasks: [
    pingTask(TASK.guard, `Que veas dónde se detiene un {{ping}} a ${NAME.marta}.`, ADDRESS.marta.id, 'timeout', FIREWALL.marta),
    pingTask(TASK.lucia, `Que vuelva tu {{ping}} a ${NAME.lucia}.`, ADDRESS.lucia.id, 'replied', DEVICE.lucia.id),
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.marta, ADDRESS.lucia], message: [MESSAGE.ping] },
  hints: [`Mira dónde quedó el sello del {{ping}} a ${NAME.marta}.`, `Abre la caja del {{ping}} a ${NAME.marta} y lee «Dónde y por qué se detuvo».`],
  question: `¿Por qué no recibiste ningún aviso del {{ping}} a ${NAME.marta}?`,
  explanation: [
    {
      text: `Porque el {{ping}} nunca salió de ${NAME.you}.`,
      feedback: `No. El {{ping}} sí salió de ${NAME.you}: el mapa lo muestra detenido en el {{firewall}} de ${NAME.marta}.`,
      correct: false,
    },
    {
      text: `Porque el {{firewall}} de ${NAME.marta} {{drop|descartó}} el {{packet|paquete}} y no avisó.`,
      feedback:
        'Eso es. {{drop|Descartar}} es tirar el {{packet|paquete}} sin entregarlo ni reenviarlo. Quien lo tira puede avisar o callar, y este {{firewall}} calló: por eso solo ves un {{timeout}}.',
      correct: true,
    },
    {
      text: `Porque ${NAME.marta} estaba apagada.`,
      feedback: `No. El mapa muestra que el {{ping}} llegó hasta el {{firewall}} de ${NAME.marta}, que lo {{drop|descartó}}.`,
      correct: false,
    },
  ],
  solution: [sendMove(ADDRESS.marta.id, MESSAGE.ping.id), sendMove(ADDRESS.lucia.id, MESSAGE.ping.id)],
  takeaway:
    'Un {{firewall}} revisa el {{traffic|tráfico}} de un {{device|dispositivo}}. Puede {{drop|descartar}} un {{packet|paquete}}: tirarlo sin entregarlo. Si no avisa, quien lo envió solo ve un {{timeout}}.',
});
