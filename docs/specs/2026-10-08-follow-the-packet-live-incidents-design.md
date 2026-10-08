# Sigue el paquete: incidentes en vivo (rediseño de la mecánica)

Fecha: 2026-10-08 · Estado: diseño aprobado por partes en la conversación, pendiente de revisión del documento

Reemplaza la dinámica, el contrato del nivel, la interfaz y el flujo, y el desbloqueo de `docs/specs/2026-10-07-follow-the-packet-design.md`. De aquel spec siguen valiendo el propósito, el motor de simulación, el arte papel y tinta (con el cambio de colores de abajo), el stack y la base factual.

## Por qué

El estudiante jugó la versión 1 y la encontró estática y aburrida: "se siente igual que hacer el lab". No le gustó la fase de predicción. Quiere:

- una historia (nos atacan y hay que proteger);
- movimiento mientras configura;
- inspeccionar cada pieza pasando el mouse;
- tareas al estilo Among Us: te dicen el problema, vas al lugar, lo arreglas y ves la reacción.

El arte se queda.

## Base de diseño (investigación del 2026-10-08)

- **Autodeterminación** (competencia, autonomía, relación): predice disfrute y ganas de seguir jugando. En un juego para una persona, un personaje que pide ayuda reemplaza la relación. Fuente: <https://selfdeterminationtheory.org/SDT/documents/2010_PrzybylskiRigbyRyan_ROGP.pdf>
- **Flow:** metas claras, respuesta inmediata y un reto a la medida.
- **Hueco de curiosidad** (Loewenstein, 1994): primero el síntoma, la causa escondida. Fuente: <https://scispace.com/papers/the-psychology-of-curiosity-a-review-and-reinterpretation-2bj8cmzgxx>
- **Juice** (Jonasson y Purho): reacciones pequeñas a cada acción hacen que algo plano se sienta vivo. Fuente: <https://www.gdcvault.com/play/1016487/Juice-It-or-Lose>
- **Tensión sin castigo:**
  - Innersloth quitó de Among Us una versión con la nave siempre en crisis porque estresaba demasiado. Fuente: <https://www.gonintendo.com/archives/348994-among-us-devs-discuss-the-game-s-inception-what-changed-during-development-how-long>
  - En Keep Talking and Nobody Explodes, fallar debe venir de un error evitable. Fuente: <https://www.gamedeveloper.com/design/finding-the-fun-in-bomb-defusal-with-i-keep-talking-and-nobody-explodes-i->
- **Fallo productivo:** intentar el problema antes de la explicación mejora la comprensión (meta-análisis de 53 estudios). Fuente: <https://janfasen.nl/wp-content/uploads/2023/05/Sinha-and-Kapur-PS-I.pdf>
- **Modelos:**
  - las tareas de Among Us, "obstáculos pequeños" que dan razón para moverse por el mapa;
  - Papers, Please: revisar contra una política y encontrar lo que no cuadra;
  - Mini Metro: minimalista, pero el mundo nunca se detiene;
  - Opus Magnum: cualquier solución que funcione vale, con metas opcionales para hacerlo mejor.
- **Riesgo a evitar:** Hacknet se critica porque todo se reduce a "ejecuta el comando correcto".

## Decisiones

| Tema | Decisión | Descartado y por qué |
|------|----------|----------------------|
| Tensión | **Incidente sin reloj, con tráfico vivo** | Ataque en vivo con reloj: premia reflejos y estresa. Mezcla: queda para después de probar el prototipo |
| Comprobar que entendió | **Explicación al final**: Lucía pregunta «¿qué pasó?» y el jugador elige entre 3 | Predicción antes de actuar: con tráfico vivo se ve dónde muere el paquete. Sin pregunta: no comprueba el porqué |
| Forma de arreglar | **Tarjeta de tarea junto a la pieza** (estilo Among Us): se eligen «qué» y «desde dónde» con clic y se colocan con otro clic (o con teclado) | Panel al costado: sigue siendo un formulario. Etiquetas sobre el mapa: se amontonan con 4 o 5 reglas. Arrastrar y soltar: pide una librería y complica los tests; se agrega si la prueba del prototipo lo pide |
| Qué puedes tocar | **Ver, configurar, agregar.** Una pieza se ve desde que existe, ya configurada y con candado. Se vuelve configurable en el incidente que introduce su término. Las piezas opcionales llegan a un inventario cuando se aprenden | Todo editable desde el principio: no hay progresión ni curiosidad. Servidores sin protección para "agregarla": en AWS toda instancia tiene al menos un SG |
| Abrir de más | **Se ve al instante, sin castigo**: entran paquetes del atacante, el servidor tiembla, Lucía avisa y el jugador corrige ahí mismo | Solo perder una estrella al final: invisible. Perder el nivel: castiga experimentar |
| Niveles | **Un mismo mapa que crece**: el capítulo es una noche de guardia; cada incidente parte de la solución de referencia del anterior | Niveles sueltos: sin historia. Arrastrar los errores del jugador: un error del incidente 2 arruina el 5 |
| Términos | **Escalera de términos** para todo el juego: ningún texto, pieza ni ficha usa un término antes del incidente que lo introduce | — |
| Capítulos | **Se abren en orden**: un capítulo se desbloquea al terminar el anterior | Todos abiertos: rompe la escalera |
| Entrega | **Prototipo primero**: incidentes 04-01 y 04-02 completos; el estudiante los juega y se itera antes de construir el resto | Los 8 de una vez: un error de mecánica se descubre tarde. Retocar la versión 1: conserva la estructura que aburre |

## Personaje

**Lucía, de soporte.** Reporta cada incidente, avisa cuando algo raro entra, da las pistas y hace la pregunta final. Es el único personaje del prototipo.

## El incidente, paso a paso

1. **Aviso.** La tarjeta de Lucía muestra el problema con sus palabras y una lista de tareas (☐) al estilo Among Us.
2. **Mapa vivo.** Cada flujo de tráfico del incidente se repite en bucle:
   - lo pedido (por ejemplo, el ping de servidor1 a servidor2);
   - lo prohibido (el atacante que tantea);
   - el tráfico de ambiente.

   Un paquete bloqueado estalla en la barrera con un sello ✕. Uno que llega muestra ✓ en la puerta del edificio, y la respuesta vuelve por el camino. Nada apura al jugador.
3. **Investigar.** Pasar el mouse (o poner el foco) sobre una pieza muestra su configuración:
   - **servidor:** nombre, IPs, nombres DNS, ajustes de Linux y SGs asociados;
   - **barrera (SG):** reglas de entrada y, desde el incidente 3, de salida;
   - **actor:** nombre e IP;
   - **paquete:** qué es, de dónde a dónde, dónde murió y por qué.

   El cuadro solo muestra lo que la escalera ya introdujo. Las herramientas (tcpdump desde el incidente 7) son objetos que se ponen sobre el mapa.
4. **Tarjeta de tarea.**
   - Se abre con clic o Enter en una barrera.
   - Aparece pegada a la barrera, del lado con más espacio libre, sin tapar la barrera ni el camino principal.
   - Muestra las reglas actuales como filas «qué ← desde dónde», cada una con su botón ×.
   - Abajo hay una ranura vacía y dos bandejas de fichas, «Qué» y «Desde dónde», con lo que el incidente ofrece.
   - Se arma una regla eligiendo una ficha de cada bandeja: cada clic (o Enter) lleva la ficha a la ranura. Un clic sobre una ficha de la ranura la devuelve a su bandeja.
   - Con la regla completa, el mundo cambia y el tráfico reacciona al instante.
   - «Listo» o Esc cierran la tarjeta y devuelven el foco a la barrera.
5. **Abrir de más.** Si un flujo prohibido llega a su destino, el servidor tiembla (con "Sin animaciones": un sello de aviso fijo) y Lucía avisa una vez por episodio: «¡algo raro está entrando!». No hay castigo. Mientras dure, el incidente no se cierra.
6. **Cierre.**
   - Una tarea queda ✓ cuando todos sus flujos pedidos reciben respuesta y ningún flujo prohibido llega, sin interrupción durante 3 segundos.
   - Una barra muestra esos 3 segundos y vuelve a cero si la condición se rompe.
   - Con todas las tareas ✓, el incidente se cierra.
7. **«¿Qué pasó?».** Lucía hace la pregunta y el jugador elige entre 3 explicaciones. Cada opción trae su retroalimentación. Solo cuenta la primera elección.
8. **Estrellas:**
   - ★ incidente cerrado;
   - ★ solo lo justo: la batería de sondas no encuentra aperturas de más al cierre;
   - ★ explicación correcta a la primera.
9. **Resultado.** Estrellas, «Lo que te llevas» (una idea) y «Siguiente incidente».
10. **Pistas.** «¿Alguna pista?» en la tarjeta de Lucía da la pista 1 y después la 2. No cuestan estrellas.

## El mundo que crece

- El primer incidente de un capítulo define el **mundo base**.
- Cada incidente siguiente define **cambios** sobre el mundo que deja la solución de referencia del anterior:
  - agregar o quitar piezas (servidores, actores, SGs);
  - cambiar reglas, flags de Linux o destinos de apps.
- El jugador siempre empieza el incidente N desde ese mundo canónico, nunca desde su propia solución del N−1.

## Ver, configurar, agregar

Cada clase de pieza pasa por tres estados, y la escalera de términos los decide:

1. **Visible y ya configurada.** La pieza existe desde que existe en el mundo.
   - Se dibuja con su nombre sencillo y un candado.
   - Se puede inspeccionar en lenguaje sencillo, pero no se toca.
   - Su configuración es la que tendría en AWS. Por ejemplo, una NACL por defecto deja pasar todo.
2. **Configurable.** Desde el incidente que introduce su término, pierde el candado y abre su tarjeta de tarea.
   - Las barreras (SG) se configuran desde el 04-01.
   - Las reglas de salida, desde el 04-03.
   - El ajuste de Linux, desde el 04-07.
3. **En el inventario.** Lo que en AWS es opcional y se agrega (un segundo SG, una NACL propia, un NAT gateway, un balanceador) aparece en un inventario cuando se introduce su término. Se elige con un clic y se coloca con otro.

Lo configurable sale de la escalera, no de cada incidente: un incidente no puede abrir una pieza cuyo término todavía no se vio. El rigor no se negocia: si algo no puede existir en AWS (por ejemplo, una instancia sin SG), el juego no lo muestra.

El inventario no entra en el prototipo. Su primer uso candidato es el 04-08 (un segundo SG que se suma); su uso fuerte llega en capítulos con muchas piezas a la vez.

## Escalera de términos

- **Registro único** para todo el juego: cada término con su id (inglés, kebab-case), su nombre en pantalla y su definición corta en español.
- **Uso en textos:** los textos de los incidentes marcan cada término con una etiqueta (por ejemplo `{{security-group}}`). Se dibuja con su nombre, y la primera vez que aparece en el juego lleva la marca **nuevo** y su definición.
- **Uso en el mapa y en las fichas:**
  - Cada clase de pieza, campo del cuadro de inspección, ficha y herramienta declara el término que usa.
  - Antes de su término, una pieza puede aparecer con un nombre descriptivo. Por ejemplo, «entrada desde internet» antes de «internet gateway», o un actor sin su IP antes de «IP pública».
  - El nombre técnico aparece en el incidente que lo introduce.
- **Regla:**
  - cada término se introduce en exactamente un incidente;
  - cada término que usa un incidente se introdujo en ese incidente o en uno anterior;
  - el orden es el de los capítulos y, dentro de cada capítulo, el de los incidentes.
- Un capítulo nuevo agrega sus términos al registro cuando se crea.

### Capítulo 4 (IaaS): la noche de guardia

| # | Incidente | Rol | Problema | Términos nuevos |
|---|-----------|-----|----------|-----------------|
| 1 | El primer ping | Defensor | servidor1 no logra hacer ping a servidor2 | servidor, red privada (VPC), IP privada, ping, puerta = Security Group (SG), regla = «qué» + «desde dónde» (la puerta solo deja pasar) |
| 2 | Abre lo justo | Defensor | Alguien cambió la puerta de servidor2 y el ping volvió a fallar | ICMP, Echo Request (ida) y Echo Reply (vuelta), mínimo privilegio |
| 3 | El camino de vuelta | Defensor | Ahora servidor2 quiere hacer ping a servidor1 | stateful (la puerta recuerda la conversación), reglas de salida |
| 4 | Demasiado ancho | Atacante | Te piden probar si un servidor ajeno puede entrar | CIDR (/32, /16, 0.0.0.0/0), el rango de la VPC; entra servidor3 |
| 5 | La IP pública | Defensor | Una app llama a servidor2 por su IP pública y falla | IP pública, internet gateway, al salir cambia el remitente (NAT) |
| 6 | El nombre | Defensor | La misma app ahora usa el nombre del servidor | DNS, nombre público y privado (desde dentro, el nombre da la IP privada) |
| 7 | ¿Portero o dueño? | Defensor | «servidor2 está caído» | tcpdump, Linux puede ignorar el ping |
| 8 | El club default | Atacante | De dos servidores comprometidos, ¿cuál llega? | SG default, varias puertas se suman |

Lección citada por todos: `Lab: Comprobación de Conectividad entre Instancias EC2 usando PING`. Nota: `concepts/security-groups.md`.

## Prototipo: incidentes 04-01 y 04-02

### Mundo base (04-01)

- **Red privada (VPC):** `172.31.0.0/16`, región `eu-west-1`. El rango no se escribe en el mapa hasta el 04-04.
- **Subredes:** existen en el motor (`172.31.16.0/20` en `eu-west-1a`, `172.31.32.0/20` en `eu-west-1b`) pero no se dibujan, porque ningún término las introduce.
- **Servidores:**
  - **servidor1:** IP privada `172.31.16.131`, IP pública `54.78.154.66` (oculta hasta el 04-05) y su SG `sg-servidor1`.
  - **servidor2:** IP privada `172.31.38.97`, IP pública `34.244.254.100` (oculta) y su SG `sg-servidor2`.
- **SGs:** sin reglas de entrada y con toda la salida permitida. Es el comportamiento real de un SG nuevo en AWS.
- **Actores:** el atacante (`203.0.113.66`, IP oculta hasta el 04-05). Tu Mac no aparece en el prototipo.
- Linux contesta pings.

### 04-01 · El primer ping

- **Lucía:** «servidor1 no logra hacer ping a servidor2. ¿Lo revisas?»
- **Tarea:** ☐ Que servidor1 pueda hacer ping a servidor2.
- **Flujos:**
  - pedido: ping de servidor1 a la IP privada de servidor2;
  - prohibido: ping del atacante a servidor2.
- **Configurables** (por la escalera): las barreras de servidor1 y de servidor2, solo entrada. La "entrada desde internet" se ve con candado.
  - Arreglar la de servidor1 no sirve, y el tráfico vivo lo muestra: decide la entrada del destino.
- **Fichas:**
  - Qué: «Ping». Por dentro es Echo Request; el nombre técnico llega en el 04-02.
  - Desde dónde: «servidor1» (`sg-servidor1`) y «Todo internet» (`0.0.0.0/0`).
- **Solución de referencia:** en `sg-servidor2`, Ping ← servidor1.
- **Abrir de más visible:** Ping ← Todo internet deja entrar al atacante.
- **Pistas:**
  1. «Mira la puerta de servidor2: ¿qué deja pasar hoy?»
  2. «En la puerta de servidor2, agrega: Ping, desde servidor1.»
- **«¿Qué pasó?»:**
  - ✓ «La puerta de servidor2 solo deja pasar lo que una regla permite, y no había ninguna para el ping de servidor1.»
  - ✗ «servidor2 estaba apagado.»
  - ✗ «Faltaba una regla que prohibiera al atacante.» (La puerta no tiene «prohibir».)
- **Lo que te llevas:** «La puerta de un servidor solo deja pasar lo que una regla permite: qué + desde dónde.»

### 04-02 · Abre lo justo

- **Cambios sobre el mundo:** alguien del turno de día cambió la puerta de servidor2.
  - Quitó Ping ← servidor1.
  - Agregó Echo Reply ← Todo internet, «para abrir la respuesta del ping».
- **Lucía:** «Alguien cambió la puerta de servidor2: dice que "abrió la respuesta del ping". Ahora el ping de servidor1 vuelve a fallar.»
- **Tarea:** ☐ Que servidor1 vuelva a hacer ping a servidor2. Abrir solo lo justo no cierra la tarea; lo mide la ★2.
- **Flujos:**
  - pedido: ping de servidor1 a servidor2;
  - prohibido: ping del atacante a servidor2.
- **Fichas:**
  - Qué: «Echo Request (ida)», «Echo Reply (vuelta)» y «Ping completo (todo ICMP)».
  - Desde dónde: «servidor1» y «Todo internet».
- **Solución de referencia:** en `sg-servidor2`, quitar Echo Reply ← Todo internet y agregar Echo Request ← servidor1.
- **Solo lo justo (★2):**
  - Dejar Echo Reply ← Todo internet es una apertura de más.
  - Usar Ping completo ← servidor1 también lo es.
  - La batería de sondas ya prueba Echo Reply (tipo 0) en sus sondas ICMP (`SERVICES` en `src/engine/exposure/exposure.ts`).
- **Pistas:**
  1. «Un ping tiene ida y vuelta. ¿Cuál de las dos entra a servidor2?»
  2. «En la puerta de servidor2: Echo Request desde servidor1. Y quita la regla del turno de día.»
- **«¿Qué pasó?»:**
  - ✓ «Un ping tiene ida (Echo Request) y vuelta (Echo Reply). Para entrar a servidor2 solo hace falta permitir la ida, y solo desde servidor1.»
  - ✗ «Había que abrir la vuelta, porque es la que llega a servidor2.»
  - ✗ «Abrir todo el ICMP desde todo internet es suficiente y no tiene riesgo.»
- **Lo que te llevas:** «Para recibir un ping basta con dejar entrar la ida (Echo Request), y solo desde quien la necesita.»

### Fuera del prototipo

- Los incidentes 04-03 a 04-08: la escalera queda escrita arriba y se construyen después de la prueba.
- El rol de atacante y su interfaz.
- tcpdump como objeto.
- El inventario de piezas para agregar.
- Arrastrar y soltar.
- Sonido.
- Tu Mac.
- La mezcla con incidentes con reloj.

## Escena y arte

- Se queda todo lo del spec anterior: cámara isométrica fija con zoom y desplazamiento, papel y tinta, capa HTML para etiquetas.
- **Cambio de colores** respecto al spec del 2026-10-07:
  - el tráfico legítimo va en tinta, con forma de círculo;
  - el atacante va en bermellón, con forma de rombo;
  - bloqueado = estallido en la barrera + sello ✕; llegó = sello ✓ en la puerta.

  La forma y los sellos evitan depender del color.
- **Barrera con tarjeta abierta:** se resalta con un pulso suave.
- **Etiquetas del mapa:** son botones. El foco equivale a tener el mouse encima, y Enter abre la tarea. Las etiquetas y las tarjetas no se superponen; se colocan con la misma regla de «lado con más espacio».
- **Tráfico vivo:**
  - cada flujo sale cada pocos segundos, con desfase entre flujos;
  - al cambiar el mundo, los paquetes nuevos siguen el recorrido nuevo y los que están en vuelo terminan el suyo;
  - con "Sin animaciones", cada camino se pinta quieto (tinta si llega, bermellón hasta donde muere) con sus sellos.

## Arquitectura

Se mantiene el stack (Vite, TypeScript, React, React Three Fiber, drei, three, zod, Vitest, Testing Library, Playwright) y las capas de la regla `folder-structure` del proyecto: `engine`, `levels`, `copy`, `game`, `storage`, `scene`, `ui` y `testing`.

- **`engine`:** sin cambios de modelo. `simulate(world, packet)` sigue siendo puro y devuelve el recorrido. La batería de sondas ya prueba Echo Reply (tipo 0).
- **`copy`:** el registro de términos (nombre y definición) y los textos de los códigos de motivo del motor.
- **`levels`:**
  - el contrato del incidente (zod);
  - el registro (`import.meta.glob`) y los capítulos;
  - la construcción del mundo de inicio de cada incidente (cadena de soluciones y cambios);
  - el cálculo de los términos que usa un incidente.
- **`game`:** el estado de la sesión del incidente, en un reducer puro:
  - el mundo actual;
  - los recorridos de todos los flujos, recalculados en cada cambio;
  - las tareas, la barra de estabilidad (avanza con una acción `tick(ms)`), las pistas, la explicación y las estrellas.

  También calcula el contenido del cuadro de inspección de cada pieza, filtrado por los términos conocidos.
- **`scene`:**
  - dibuja el mundo;
  - anima los paquetes a partir de los recorridos (el reloj vive aquí, en un hook `use-*.ts`);
  - detecta el mouse sobre las piezas;
  - expone dónde anclar las tarjetas.
- **`ui`:** la tarjeta de Lucía con tareas y pistas, la tarjeta de tarea, el cuadro de inspección, la pregunta final, el resultado y el roadmap con desbloqueo en orden.
- **`storage`:** progreso por incidente, con los arreglos del backlog:
  - fusiona en memoria y guarda lo que pueda;
  - un dato malo descarta solo esa entrada.
- **Elegir y colocar:** con clic y teclado, sin librería. Si la prueba del prototipo pide arrastrar, las candidatas según `npm view` del 2026-10-08 son `@dnd-kit/react` 0.5.0 y `@atlaskit/pragmatic-drag-and-drop` 4.0.0. `@dnd-kit/core` 6.3.1 queda descartada: su última modificación en el registro es del 2024-12-05.

### Contrato del incidente

| Campo | Qué es |
|-------|--------|
| `id`, `chapter`, `order`, `title`, `role` | Identidad. `id` = `"04-01"`. `role`: `defender` o `attacker` |
| `lesson`, `concept` | Texto exacto de la lección en `syllabus.md` y ruta de la nota de concepto |
| `introduces` | Ids de los términos que este incidente introduce |
| `base` / `changes` | El primero del capítulo trae `base` (el mundo completo); los demás traen `changes` sobre el mundo canónico anterior |
| `report` | El mensaje de Lucía |
| `tasks` | Lista de tareas visibles, cada una con sus flujos |
| `flows` | Flujos de tráfico: paquete y tipo (`required`, `forbidden` o `ambient`) |
| `chips` | Fichas de «Qué» y de «Desde dónde» que ofrece el incidente |
| `tools` | Herramientas disponibles (vacío en el prototipo) |
| `hints` | Dos pistas, de menos a más |
| `explanation` | Tres opciones, cada una con su retroalimentación y si es la correcta |
| `solution` | Acciones de referencia |
| `takeaway` | «Lo que te llevas»: una idea |

## Tests y validación

"Listo" = `npm run check` pasa entero (tipos, lint, unitarios y Playwright).

1. **Motor:** se quedan los tests actuales. Se suma un test por arreglo:
   - la clave de las sondas distingue el camino público del privado;
   - `parseCidr` rechaza `10.0.0.0/`;
   - las sondas Echo Reply.
2. **Por incidente** (un mismo test genérico para cada archivo):
   - el esquema valida;
   - al empezar, alguna tarea no se cumple;
   - la solución de referencia cumple todas y la batería no encuentra aperturas de más;
   - de las 3 explicaciones, exactamente una es correcta;
   - hay 2 pistas;
   - la lección existe en `syllabus.md` y la nota de concepto existe.
3. **Cadena del mundo:** el mundo de inicio del incidente N es igual a la solución del N−1 más los cambios del N.
4. **Escalera:**
   - cada término del registro se introduce una sola vez y tiene definición;
   - ningún incidente usa (en textos, piezas visibles, campos de inspección, fichas o herramientas) un término que no se haya introducido antes o en él;
   - lo configurable de cada incidente coincide con lo que permite la escalera.
5. **Juego (reducer):** con un reloj falso:
   - la barra se llena en 3 segundos y vuelve a cero si la condición se rompe;
   - un flujo prohibido que llega impide el cierre y dispara el aviso una vez;
   - las estrellas;
   - solo cuenta la primera explicación.
6. **Interfaz (Testing Library + user-event):**
   - armar una regla con clic y con teclado;
   - quitar una regla;
   - Esc cierra la tarjeta y devuelve el foco;
   - una pieza con candado se inspecciona pero no abre tarjeta;
   - el cuadro de inspección no muestra campos de términos futuros;
   - los mensajes de Lucía.
7. **Guardado:**
   - con el almacenamiento bloqueado, el progreso de la sesión se fusiona y no se pierde;
   - una entrada mala se descarta sola;
   - un capítulo bloqueado no se abre por URL.
8. **De punta a punta (Playwright):**
   - jugar 04-01 y 04-02 hasta 3 estrellas, también con "Sin animaciones";
   - el progreso sobrevive a recargar;
   - sin errores de consola.
9. **Prueba humana:** el estudiante juega el prototipo y dice qué no lo engancha. Es la prueba que decide si se construyen los incidentes 04-03 a 04-08 con esta mecánica.

## Orden de trabajo

1. **Quitar lo que se va:**
   - la fase de predicción y su panel;
   - los 7 niveles en el formato viejo;
   - la pantalla de resultado;
   - el panel del atacante y el panel de herramientas.

   Todo queda en el historial de git.
2. **Refactor a las reglas del proyecto** de lo que se queda, con sus controles: estructura de carpetas, nombres kebab-case, alias `@/`, barrels, texto fuera del motor y versiones exactas. Ver `docs/plans/2026-10-08-follow-the-packet-followups.md`, bloques B y C.
3. **Prototipo** en una rama nueva a partir de `feat/follow-the-packet`.

## Relación con el backlog (`docs/plans/2026-10-08-follow-the-packet-followups.md`)

| Ítem | Destino |
|------|---------|
| A1 (toda la VPC da 3 estrellas) | En el prototipo no se puede elegir toda la VPC. El arreglo real llega con servidor3 en el 04-04 |
| A2 (tcpdump del que envía) | Sigue pendiente; hace falta en el 04-07 |
| A3 (clave de las sondas) | Se arregla en el prototipo (★2) |
| A4, A12 (guardado) | Se arreglan en el prototipo |
| A5 (animación que no se detiene) | Lo reemplaza el tráfico vivo |
| A6 (escena descentrada, etiquetas encimadas) | Pasa a ser un requisito de la escena nueva |
| A7 (04-07 se gana adivinando) | Se rediseña con el rol de atacante |
| A8 (niveles bloqueados por URL) | Se arregla con el desbloqueo en orden |
| A9, A10, A14 (tcpdump del intento anterior, pista tras ganar, estilos faltantes) | Desaparecen con la interfaz vieja |
| A11 (`parseCidr`) | Se arregla en el prototipo |
| A13 (foco) | Pasa a ser un requisito de la tarjeta de tarea |
| B1-B7, C1-C9 | Paso 2 del orden de trabajo. B4 (getent) desaparece con su panel, pero la regla se aplica al cuadro de inspección |
| D (reglas sin decidir) | Siguen pendientes |
