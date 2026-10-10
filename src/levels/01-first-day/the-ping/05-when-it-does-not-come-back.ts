import { defineIncident } from '@/levels/contract/incident';
import { ADDRESS, CONCEPT, DEVICE, HIDDEN_FIREWALL, IP, LESSON, MESSAGE, NAME, ORIGIN, TASK, pingTask } from '@/levels/01-first-day/shared';

export default defineIncident({
  id: '01-05',
  chapter: 1,
  order: 5,
  title: 'Cuando no vuelve',
  role: 'defender',
  mechanic: 'send',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: ['timeout', 'host-unreachable'],
  changes: [HIDDEN_FIREWALL],
  report: `A veces un {{ping}} no vuelve. Hoy ves dos maneras: nadie dice nada, o aparece un aviso. Haz un ping a ${NAME.marta} y otro a la {{ip-address|IP}} ${IP.nobody}, que ningún {{device|dispositivo}} tiene. Compara qué ves en cada caso.`,
  tasks: [
    pingTask(TASK.silence, `Que veas el {{timeout}} de un {{ping}} a ${NAME.marta}.`, ADDRESS.marta.id, 'timeout'),
    pingTask(TASK.warning, `Que veas el aviso {{host-unreachable}} de un {{ping}} a la {{ip-address|IP}} ${IP.nobody}.`, ADDRESS.nobody.id, 'unreachable', DEVICE.you.id),
  ],
  flows: [],
  send: { from: [ORIGIN.you], to: [ADDRESS.marta, ADDRESS.nobody, ADDRESS.printer], message: [MESSAGE.ping] },
  hints: [
    'Fíjate de quién viene cada resultado: en un caso nadie dice nada y en el otro alguien avisa.',
    `Prueba la ${IP.nobody} y la ${IP.marta}, que es la IP de ${NAME.marta}. La ${IP.nobody} no es de ningún {{device|dispositivo}}.`,
  ],
  question: '¿Qué diferencia hay entre no recibir nada y recibir el aviso?',
  explanation: [
    {
      text: 'El silencio significa que el {{device|dispositivo}} está apagado.',
      feedback: `No. ${NAME.marta} está conectada y no contestó. El {{timeout}} no dice por qué.`,
      correct: false,
    },
    {
      text: 'Con el aviso, alguien te dice que no pudo entregar el {{packet|paquete}}. Con el {{timeout}}, nadie dice nada y no sabes por qué.',
      feedback: `Eso es. Aquí el aviso lo generó ${NAME.you}: buscó en su {{network|red}} quién tenía la ${IP.nobody} y nadie contestó. En el {{timeout}} no llegó ningún aviso.`,
      correct: true,
    },
    {
      text: 'El aviso significa que el {{device|dispositivo}} rechazó el {{ping}}.',
      feedback: `No. El aviso no es una respuesta del destino: ningún {{device|dispositivo}} tiene esa IP. Lo generó ${NAME.you} al no encontrar quién la tenía.`,
      correct: false,
    },
  ],
  solution: [
    { type: 'sendPacket', fromId: ORIGIN.you.id, toId: ADDRESS.marta.id, messageId: MESSAGE.ping.id },
    { type: 'sendPacket', fromId: ORIGIN.you.id, toId: ADDRESS.nobody.id, messageId: MESSAGE.ping.id },
  ],
  takeaway: 'Si un {{ping}} no vuelve, puede ser silencio ({{timeout}}) o un aviso ({{host-unreachable}}). Con el aviso, alguien te dice que no pudo entregar el {{packet|paquete}}. Con el silencio, nadie dice nada y no sabes por qué.',
});
