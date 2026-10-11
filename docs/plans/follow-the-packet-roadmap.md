# Sigue el paquete: hoja de ruta

Las ideas que van saliendo para el juego y hacia dónde va. Los errores y las deudas técnicas no van aquí sino en el [backlog de pendientes](2026-10-08-follow-the-packet-followups.md).

- **Cómo se anota:** una fila por idea, con qué es, por qué importa, de dónde salió (con fecha) y su estado.
- **Estados:**
  - `hecho`: entregada; la fila pasa a «Hecho» con sus commits;
  - `en curso`: hay un plan ejecutándose;
  - `siguiente`: aprobada, espera turno;
  - `idea`: anotada, sin decidir;
  - `descartada`: se queda en la tabla con el motivo.
- **Cuando una idea se vuelve plan:** su fila enlaza el spec o el plan, y el detalle vive ahí.

## En curso

| Idea | Por qué | Origen | Estado |
|------|---------|--------|--------|
| **Capítulo 1 jugable** (plan 3): la jugada «enviar», la tarjeta terminal, los incidentes 01-01 a 01-04, la escalera de términos y la regla de progreso; incluye F4 a F6 del backlog | Es la introducción antes de AWS: dirección IP, ping, ida y vuelta, internet y firewall | [Spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md), 2026-10-09 | `en curso`: [plan 3](2026-10-09-follow-the-packet-chapter-1-send.md). Tareas 1 a 11 hechas (`20bc9be..1b5010f`, el commit de los documentos y el commit de la revisión final). Sus cuatro incidentes los reemplazó el capítulo 1 en catorce subcapítulos (fila de «Hecho»). Falta la prueba humana, que ahora es la del capítulo entero (fila «Prueba humana del capítulo 1 entero», en «Siguiente») |
| **Design system del juego.** Tokens en un solo lugar (paleta y roles, escala tipográfica y de espacios, líneas, radios, sombras y foco), un componente por elemento con sus variantes (`Button`, `Choice`, `ChipTray`, `Card`, `NameTag`, leyenda) y `DESIGN.md`. Incluye lo que trajo el plan 3: la tarjeta terminal, el botón «Enviar» y su estado deshabilitado, y la ficha elegida con un nombre. La sección «Elementos de la interfaz» de `#/entidades` y su captura de Playwright, que no tolera ningún píxel distinto, salvo los bordes que cuenta como antialiasing, avisan si algo cambia sin querer | «Que no creemos 5 versiones de un button, sino que mantengamos un estándar». Los colores vivían en `src/styles.css` y se repetían en `src/scene/theme.ts`; los tamaños se elegían caso por caso | Pregunta del estudiante, 2026-10-09. Cierra G1 y decide parte del bloque D del backlog | `en curso`: [plan](2026-10-09-follow-the-packet-design-system.md). Tareas 1 a 7 hechas |
| **Temario de 33 capítulos.** El roadmap deja de copiar los 20 módulos del curso y muestra los 33 capítulos del juego, agrupados en cinco niveles (0 Bases a 4 Especialista), con el 24 opcional. `CHAPTERS` guarda el nivel, el título, los módulos del curso que juega cada capítulo y si es opcional; un test lo compara con el documento de capítulos. Los capítulos 1 y 4 conservan su número, sus carpetas, sus ids y el progreso guardado | El juego va de cero a experto y su orden no es el del curso: los capítulos 2 «Puertos y nombres» y 3 «La web por dentro» van antes del 4 | «Cambia todo el temario del juego para que muestre los 33 caps», 2026-10-10. [Capítulos del juego](../research/2026-10-09-follow-the-packet-chapters.md) | `en curso`: [plan](2026-10-10-follow-the-packet-33-chapters.md). Tareas 1 y 2 hechas; queda I1 en el backlog |

## Siguiente

| Idea | Por qué | Origen | Estado |
|------|---------|--------|--------|
| **Prueba humana del capítulo 1 entero:** jugar los catorce subcapítulos de seguido, con el servidor del estudiante, y entrar después al capítulo 4. Comprueba lo que lista la sección «Prueba humana del capítulo entero» del plan: el mapa del bloque 3, la salida de traceroute, el peso del 12, las pestañas, los casos del 14 sin pistas y si el capítulo entero se siente largo. Decisión pendiente del «primer día lento»: qué subcapítulo se fusiona con otro o se separa | Catorce subcapítulos antes del capítulo 4 pueden sentirse lentos. La decide el estudiante al jugarlos, no el código | Decidido por el estudiante, 2026-10-10: una sola prueba del capítulo entero, después de la Tarea 28, y no una por bloque. Riesgo «Primer día lento» del [spec del capítulo 1 en catorce](../specs/2026-10-10-follow-the-packet-chapter-1-fourteen-design.md) | `siguiente`: la Tarea 28 del [plan](2026-10-10-follow-the-packet-chapter-1-fourteen.md) ya está hecha. Lo que anote la prueba se agrega al backlog después de hacerla |

## Hecho

| Idea | Por qué | Origen | Estado |
|------|---------|--------|--------|
| **Capítulo 1 en catorce subcapítulos** (motor, contrato y contenido): reemplaza los cuatro incidentes de «Tu primer día» por catorce, en cinco bloques, con el estilo B para todas las tarjetas, las pestañas «Entrada» y «Salida» y una sola prueba humana, la del capítulo entero, al final | Cuatro incidentes cargaban demasiado, y el capítulo 4 daba por sabidos el salto, el TTL, la puerta de enlace, la diferencia entre silencio y aviso, y la dirección de una regla. Cada subcapítulo es una sola idea | [Spec](../specs/2026-10-10-follow-the-packet-chapter-1-fourteen-design.md), 2026-10-10 | `hecho`: [plan](2026-10-10-follow-the-packet-chapter-1-fourteen.md). Las Tareas 0 a 28 están hechas (`c3340a9..aa37fd6` y el commit de los documentos; en ese rango, `f7c6b6e` es del lab 04 y no del plan). Al cerrar: Vitest 1853 tests en 70 archivos y Playwright 61. Los pendientes que dejó están en el [bloque J del backlog](2026-10-08-follow-the-packet-followups.md). Falta la prueba humana (fila «Prueba humana del capítulo 1 entero», en «Siguiente») |
| **Catálogo de entidades** (capítulo 1, plan 2): cada pieza del mapa en su archivo, con su ícono 2D; piezas de oficina; Echo Request y Echo Reply por forma; estado «perdido»; página `#/entidades` | Las mismas piezas sirven en todos los capítulos, y la captura de Playwright avisa si una cambia sin querer | [Spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md), 2026-10-09 | `hecho`: [plan 2](2026-10-09-follow-the-packet-entity-catalog.md). Las 11 tareas están hechas (`91f30b1..c8b2798`) |
| **El nombre propio se ve como etiqueta.** En «Security Group servidor2», «servidor2» va en letra de código dentro de una cajita sombreada (estilo B); «Security Group» queda igual. Aplica al mapa, a la tarjeta del Security Group y a la caja de inspección | «Para saber que no son entidades». Además es fiel a AWS: «servidor2» es el valor de la etiqueta `Name` del recurso | Prueba del estudiante, 2026-10-09. [Prototipo con las opciones](https://claude.ai/artifact/MDFXJtYLUqMHtJgxxQHQ71) | `hecho`: Tarea 11 del [plan 2](2026-10-09-follow-the-packet-entity-catalog.md) (`6e5630d`, `c8b2798`) |

## Ideas

| Idea | Por qué | Origen | Estado |
|------|---------|--------|--------|
| **Nombres propios en los textos de Lucía** con el mismo estilo de etiqueta | Sería coherente con el mapa y las tarjetas. Quedó fuera de la Tarea 11 porque hay que marcar los nombres en todos los textos de los incidentes | Revisión del estilo B, 2026-10-09 | `idea`: si se hace, también las fichas que hoy no marcan nombres |
| **Forma de TCP y UDP en el mapa** | Hoy se dibujan como solicitudes. Lo decide el capítulo que traiga el primer flujo TCP | Decisión 12 del [plan 2](2026-10-09-follow-the-packet-entity-catalog.md), 2026-10-09 | `idea` |
| **Conceptos que esperan su incidente:** IP pública, NAT de la oficina, DNS, puertos, TCP, UDP, cliente/servidor y stateless | Cada término entra en el incidente que lo necesita, ni antes ni después | «Fuera de alcance» del [spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md) | `idea` |
| **Capítulos 2 «Puertos y nombres» y 3 «La web por dentro»** | Las bases de redes y de la web antes de AWS: puertos, TCP, UDP, CIDR, rutas, NAT, DNS, HTTP y TLS | [Spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md); sus fichas, en los [capítulos del juego](../research/2026-10-09-follow-the-packet-chapters.md), 2026-10-10 | `idea`: ya están en el roadmap como «Próximamente»; falta la investigación de cada uno |
| **Inventario y arrastrar y soltar** | Hoy se elige con clic y teclado. Arrastrar solo entra si la prueba lo pide | [Spec de incidentes en vivo](../specs/2026-10-08-follow-the-packet-live-incidents-design.md), 2026-10-08 | `idea` |
