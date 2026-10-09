# Sigue el paquete: hoja de ruta

Las ideas que van saliendo para el juego y hacia dónde va. Los errores y las deudas técnicas no van aquí sino en el [backlog de pendientes](2026-10-08-follow-the-packet-followups.md).

- **Cómo se anota:** una fila por idea, con qué es, por qué importa, de dónde salió (con fecha) y su estado.
- **Estados:**
  - `en curso`: hay un plan ejecutándose;
  - `siguiente`: aprobada, espera turno;
  - `idea`: anotada, sin decidir;
  - `descartada`: se queda en la tabla con el motivo.
- **Cuando una idea se vuelve plan:** su fila enlaza el spec o el plan, y el detalle vive ahí.

## En curso

| Idea | Por qué | Origen | Estado |
|------|---------|--------|--------|
| **Catálogo de entidades** (capítulo 1, plan 2): cada pieza del mapa en su archivo, con su ícono 2D; piezas de oficina; Echo Request y Echo Reply por forma; estado «perdido»; página `#/entidades` | Las mismas piezas sirven en todos los capítulos, y la captura de Playwright avisa si una cambia sin querer | [Spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md), 2026-10-09 | `en curso`: [plan 2](2026-10-09-follow-the-packet-entity-catalog.md). Tareas 1 a 10 hechas (`91f30b1..f2fee1e`), falta la 11 |
| **El nombre propio se ve como etiqueta.** En «Security Group servidor2», «servidor2» va en letra de código dentro de una cajita sombreada (estilo B); «Security Group» queda igual. Aplica al mapa, a la tarjeta del Security Group y a la caja de inspección | «Para saber que no son entidades». Además es fiel a AWS: «servidor2» es el valor de la etiqueta `Name` del recurso | Prueba del estudiante, 2026-10-09. [Prototipo con las opciones](https://claude.ai/artifact/MDFXJtYLUqMHtJgxxQHQ71) | `en curso`: Tarea 11 del [plan 2](2026-10-09-follow-the-packet-entity-catalog.md) |

## Siguiente

| Idea | Por qué | Origen | Estado |
|------|---------|--------|--------|
| **Capítulo 1 jugable** (plan 3): la jugada «enviar», la tarjeta terminal, los incidentes 01-01 a 01-04, la escalera de términos y la regla de progreso; incluye F4 a F6 del backlog | Es la introducción antes de AWS: dirección IP, ping, ida y vuelta, internet y firewall | [Spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md), 2026-10-09 | `siguiente`: plan por escribir |
| **Design system del juego.** Un `DESIGN.md` con los colores, las letras, la escala tipográfica y de espacios y las reglas visuales. Una sección nueva en `#/entidades` con cada elemento de la interfaz en vivo (botones, fichas, tarjetas, etiquetas del mapa, nombre propio y sellos), dentro de la captura de Playwright | Hoy los colores viven en `src/styles.css` y se repiten en `src/scene/theme.ts`. Las reglas están repartidas en dos specs y los tamaños se eligieron caso por caso. Con un catálogo, un cambio sin querer rompe la prueba | Pregunta del estudiante, 2026-10-09. Relacionado con el bloque D del backlog (reglas `design-tokens` y `primitive-semantic-tokens` sin decidir) | `siguiente`: después del plan 2 |

## Ideas

| Idea | Por qué | Origen | Estado |
|------|---------|--------|--------|
| **Nombres propios en los textos de Lucía** con el mismo estilo de etiqueta | Sería coherente con el mapa y las tarjetas. Quedó fuera de la Tarea 11 porque hay que marcar los nombres en todos los textos de los incidentes | Revisión del estilo B, 2026-10-09 | `idea`: si se hace, también las fichas que hoy no marcan nombres |
| **Prueba humana del capítulo 1:** decidir si algún incidente se fusiona | Cuatro incidentes antes del capítulo 4 pueden sentirse lentos | Riesgo «Primer día lento» del [spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md) | `idea`: al cerrar el plan 3 |
| **Forma de TCP y UDP en el mapa** | Hoy se dibujan como solicitudes. Lo decide el capítulo que traiga el primer flujo TCP | Decisión 12 del [plan 2](2026-10-09-follow-the-packet-entity-catalog.md), 2026-10-09 | `idea` |
| **Conceptos que esperan su incidente:** IP pública, NAT de la oficina, DNS, puertos, TCP, UDP, cliente/servidor y stateless | Cada término entra en el incidente que lo necesita, ni antes ni después | «Fuera de alcance» del [spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md) | `idea` |
| **Capítulos 2 y 3** | Completar el recorrido del curso entre la introducción y el capítulo 4 | [Spec del capítulo 1](../specs/2026-10-09-follow-the-packet-chapter-1-design.md) | `idea` |
| **Inventario y arrastrar y soltar** | Hoy se elige con clic y teclado. Arrastrar solo entra si la prueba lo pide | [Spec de incidentes en vivo](../specs/2026-10-08-follow-the-packet-live-incidents-design.md), 2026-10-08 | `idea` |
