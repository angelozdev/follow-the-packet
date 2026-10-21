import { defineIncident } from '@/levels/contract/incident';
import { CONCEPT, LESSON } from '@/levels/02-ports-and-names/shared';
import { CASES } from './cases';

export default defineIncident({
  id: '02-14',
  chapter: 2,
  order: 14,
  title: 'Guardia: no conecta',
  role: 'defender',
  mechanic: 'diagnose',
  lesson: LESSON,
  concept: CONCEPT,
  introduces: [],
  changes: [],
  report:
    'Hoy estás de guardia. Cada caso trae algo que no conecta: un {{ping}}, un {{nc}} o un {{dig}} que no vuelve. Cada caso es aparte: lo que cambió en uno no sigue en el siguiente. Haz tus pruebas, mira el mapa y las cajas, y nombra la causa de cada caso.',
  flows: [],
  diagnose: { cases: CASES },
  takeaway:
    'Para diagnosticar, haz las pruebas en orden. Primero, ¿el nombre da una {{ip-address|IP}}? Eso lo dice el {{dig}}. Después, ¿hay camino hasta esa IP? Eso lo dice el {{ping}}: si vuelve, lo hay. Por último, ¿contesta el {{port|puerto}}? Eso lo dice el {{nc}}: si conecta, contesta. En cada prueba mira qué volvió: la respuesta, un aviso o nada. {{nxdomain}} dice que el nombre no existe. {{net-unreachable}} viene de un {{router}} que no tiene ninguna {{route|ruta}} hacia ese destino. {{time-exceeded}} desde dos {{router|routers}} que se alternan quiere decir que el {{packet|paquete}} da vueltas entre ellos. {{port-unreachable}} y {{rst}} dicen que el {{packet|paquete}} llegó, pero ningún programa lo atiende en esa IP y ese puerto. Si no vuelve nada, el paquete se perdió o alguien lo descartó sin avisar: mira en el mapa dónde se detuvo. Y si el {{dig}} y el {{ping}} no están de acuerdo sobre un nombre, el {{hosts-file|archivo hosts}} puede tener una línea vieja.',
});
