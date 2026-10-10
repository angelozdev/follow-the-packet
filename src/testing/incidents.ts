import { INCIDENTS, type FilterIncident, type SendIncident } from '@/levels';
import { OFFICE, actor, device, officeNet } from './fixtures';

/** Returns a registered incident that filters with rules, by its id; throws when there is none. */
export function filterIncident(id: string): FilterIncident {
  const found = INCIDENTS.find((incident) => incident.id === id);
  if (found?.mechanic !== 'filter') throw new Error(`${id} is not a filter incident`);
  return found;
}

/** Returns a send incident on the chapter 1 office: ping the printer from your laptop and get its reply, and send anything from the attacker. */
export function sendIncident(): SendIncident {
  return {
    id: '09-01',
    chapter: 9,
    order: 1,
    title: 'Prueba',
    role: 'defender',
    lesson: 'Una lección',
    concept: 'concepts/una-nota.md',
    introduces: ['ping', 'echo-request', 'echo-reply'],
    base: officeNet(),
    mechanic: 'send',
    report: 'Haz {{ping}} a la impresora.',
    tasks: [
      { id: 'printer', text: 'Que vuelva el {{ping}} a la impresora.', expect: { fromId: 'you', toId: 'printer', messageId: 'ping', outcome: 'replied' } },
      { id: 'outside', text: 'Prueba desde afuera.', expect: { fromId: 'attacker', toId: 'lucia', messageId: 'ping', outcome: 'any' } },
    ],
    flows: [],
    send: {
      from: [
        { id: 'you', endpoint: device('your-laptop') },
        { id: 'attacker', endpoint: actor('attacker') },
      ],
      to: [
        { id: 'printer', address: OFFICE.printer },
        { id: 'lucia', address: OFFICE.lucia },
        { id: 'nobody', address: OFFICE.nobody },
      ],
      message: [
        { id: 'ping', label: '{{ping}}', icmpType: 8 },
        { id: 'reply', label: '{{echo-reply}}', icmpType: 0 },
      ],
    },
    hints: ['Primera.', 'Segunda.'],
    question: '¿Por qué volvió el {{ping}}?',
    explanation: [
      { text: 'A', feedback: 'a', correct: false },
      { text: 'B', feedback: 'b', correct: true },
      { text: 'C', feedback: 'c', correct: false },
    ],
    solution: [
      { type: 'sendPacket', fromId: 'you', toId: 'printer', messageId: 'ping' },
      { type: 'sendPacket', fromId: 'attacker', toId: 'lucia', messageId: 'ping' },
    ],
    takeaway: 'Una idea.',
  };
}
