# Sigue el paquete: el mapa en 2D (SVG)

Fecha: 2026-10-12 · Estado: borrador para revisar. El estudiante decidió migrar el mapa de 3D (three.js con React Three Fiber) a 2D (SVG). Este documento fija cómo se dibuja, cómo se calcula, cómo se prueba y qué se borra. La única decisión abierta para el estudiante es el aspecto (claro u oscuro): ver «El aspecto». Todo lo demás está decidido, y lo que no preguntó el estudiante está en «Decididas sin el estudiante (para revisar)». Plan de implementación: [`docs/plans/2026-10-12-follow-the-packet-2d-map.md`](../plans/2026-10-12-follow-the-packet-2d-map.md). Prototipos: una página HTML con mapas calculados, en el scratchpad de la sesión (`2d-map-prototypes.html`; la publica la sesión principal).

Se escribió sobre `feat/chapter-2` en `a4f6e1f`, con `src/scene/` tal como está ahí. La Tarea 28 bis (el merge de `main` y la caja que se aparta) entra antes de empezar este trabajo y cambia los nombres de tres cosas de la escena, que este documento usa ya con su nombre nuevo: `GameScene` recibe `inspectTrigger` en lugar de `onInspect`, y `PieceLabel` y el sello reciben `trigger` (se leyó en la rama `merge/28bis` en `626a144`, antes de los commits de D, sin tocarla).

## Resumen

1. El arte va en SVG y todo lo que es texto o control (etiquetas, sellos, nombres de grupo, tarjetas) sigue en HTML, encima. El mapa se dibuja a escala 1:1: una unidad del dibujo es un píxel CSS.
2. En vez de encogerse, el mapa se reacomoda según el ancho: una fila de izquierda a derecha, la misma fila más compacta, o una serpiente en el teléfono. No hay cámara, zoom ni desplazamiento.
3. Dónde están las piezas lo calculan funciones puras (filas, carriles y un grafo de enlaces) que se prueban en Vitest sin navegador, y las colisiones se calculan en vez de medirse.
4. Hoy la altura de un sello dice el lugar donde terminó su paquete (puerta, firewall o camino). En 2D lo dice la posición a lo largo del enlace, y los sellos de un mismo lugar se abren en abanico a lo ancho del enlace.
5. Los paquetes en vuelo se animan con SMIL (un estándar del navegador, sin dependencia). Para las pruebas, el reloj de la animación se detiene y se lleva a un instante exacto.
6. Se borran `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three`, la cámara y `swiftshader`. Las e2e bajan de 126 a 6; el resto de lo que hoy prueban pasa a Vitest puro, a Vitest con Testing Library y a Vitest en modo navegador.

## Por qué

Lo siguiente son las razones que dio el estudiante. Las cifras vienen de la sesión principal y esta sesión no las volvió a medir.

- El mapa 3D y sus pruebas inestables se llevaron cerca del 21 % del tiempo de agentes.
- 6 de las 10 decisiones de la noche del 2026-10-11 fueron cosas que se pisan en el mapa (O-1, O-4 y sus derivadas).
- El SVG se reacomoda al móvil y el 3D se recorta.
- Los diagramas de arquitectura de AWS son 2D, con cajas agrupadas, y el objetivo del estudiante es trabajar en cloud.

Lo que sí se midió aquí, sobre `11587fc` (`pnpm check` completo en verde del 2026-10-12, con el log guardado en el scratchpad):

- 126 pruebas e2e en 6 archivos, 835 s de tiempo de prueba y 2,1 min de reloj con 8 trabajadores.
- `card-layout.spec.ts` tiene 10 pruebas y suma 350,6 s (el 42 % del tiempo de prueba). Dos de ellas, de 120 s y 102 s, son el camino crítico de toda la suite.
- `chapter-1.spec.ts` (41 pruebas) suma 182,6 s y `chapter-2.spec.ts` (28) suma 203,4 s.
- `pnpm check:fast` tarda 11,3 s (Vitest: 2938 pruebas en 98 archivos, 5,9 s).
- El paquete de producción pesa 1 660 629 bytes (463 744 con gzip) en el `dist/` del 2026-10-12, que no se reconstruyó para este documento.
- Importan `three` o `@react-three/*` 16 archivos de `src/scene/` y 2 pruebas (`layout.test.ts` y `use-packet-runs.test.ts`).

## Lo que no cambia

El motor (`src/engine/`), el contrato y los niveles (`src/levels/`), los textos (`src/copy/`), las tarjetas y la caja de inspección en su contenido, y lo que `src/game/view/` calcula: qué piezas se dibujan, sus etiquetas y candados, los sellos y su caja. La escena sigue recibiendo lo mismo de la vista:

- `world`, `pieces`, `flows`, `sent`, `still`, `blockName` y `activePieceId`;
- `overlay` (la tarjeta abierta), `inspectTrigger` y `onActivate`.

Solo cambian `src/scene/` con sus pruebas, el CSS del mapa en `src/styles.css`, la fila del mapa en el teléfono (ver «Escala») y lo que dependa del 3D en los archivos de configuración y de pruebas que lista «Qué se borra». Una excepción: la mitad de `game` y `copy` de la regla de «+N» (O-4 = G) sale de la Tarea 28 quinquies y se hace antes de la escena (ver «Retomar el capítulo 2» en el plan), porque no depende del renderer.

## Lo que dibuja hoy la escena y su equivalente en 2D

| Hoy (3D) | En 2D | Qué regla de rigor se conserva |
|---|---|---|
| Losa de la oficina o de la VPC, con muro la de oficina | Caja punteada con su nombre | Una caja agrupa lo que es de una misma red |
| Losa de cada piso y su nombre (`FloorLabel`) | Caja de piso anidada en la de la oficina, con su nombre | El nombre de un piso es el de la red local |
| Contorno del bloque (`block`) y su nombre | Rectángulo punteado alrededor de las filas marcadas, con el bloque en la esquina | Nunca rodea una pieza que no está dentro |
| Laptop, impresora, instancia EC2 y servidor de internet | El icono del catálogo, más grande | Una variante por modelo, nunca una pieza hermana |
| Firewall: barra entre dos postes, delante de su equipo | Barra sobre el enlace del equipo, entre su puerta y el camino | Un firewall solo se dibuja si el jugador conoce su término |
| Router, borde y Internet gateway: arco con dos antenas o sin ellas | Caja con antenas (router) o sin ellas (Internet gateway), sobre la línea principal | Los routers van de la oficina hacia afuera, en orden |
| Internet: globo | Globo sobre la línea principal | Una sola pieza, fuera de toda red |
| Servidores de internet y de nombres, clientes (atacante, tú, casa) | Carriles a la derecha del bus de internet | Un servidor de nombres solo se dibuja con el término de su rol |
| Camino: banda sombreada con dos líneas, y un ramal a cada puerta | Enlaces: línea gruesa de tinta suave | Todo paquete viaja por un enlace dibujado |
| Paquete: punto (ICMP), cuadrado (TCP), hexágono (UDP), lleno si pide y anillo si responde; intruso con segundo borde rojo; aviso: triángulo con «!» | Las mismas formas, en SVG | La forma dice el protocolo y el borde dice el papel |
| Rastro del paquete (línea, roja si lo frenan, a rayas si se pierde) | La misma línea | Un color nunca es lo único que dice un estado |
| Ráfaga al bloquear, encogerse al perderse, aparecer un aviso propio | Los mismos finales, con SMIL | Sin animaciones, cada final es una marca quieta |
| Sello (botón HTML ✓ ✕ ? !) a la altura de su lugar | El mismo botón, en el lugar del enlace donde terminó el paquete | El lugar del sello es un hecho de la traza |
| Etiqueta de pieza (botón HTML) | Igual, en la capa HTML | Un botón por pieza |
| Etiqueta de un paquete con puertos (HTML) | Texto de SVG que viaja con el paquete | Cambia al cruzar el router que traduce |
| Cámara isométrica, `MapControls` (zoom de 18 a 110 y paneo), luces y sombras de contacto | Nada | El mapa no cambia de tamaño de un incidente a otro |
| Tarjeta anclada con `Html` de drei y `useCardSide` (proyección en cada fotograma) | Tarjeta HTML puesta en píxeles, una vez por cada layout | Una tarjeta nunca tapa una pieza que el jugador compara |
| Temblor del equipo con un intruso, pulso del firewall elegido | `animateTransform` de SMIL | Sin animaciones: doble borde y barra más gruesa |
| Modo quieto (`still`) | Igual: sin SMIL, con rastros | Cada animación tiene su versión quieta |

## Cómo se dibuja

### Dos capas, a escala 1:1

- **SVG (`aria-hidden`):** cajas de grupo, enlaces, piezas, rastros, paquetes en vuelo y las etiquetas de los paquetes. Es arte: nadie lo opera.
- **HTML encima:** las etiquetas de las piezas (botones), los sellos (botones), los nombres de grupo, la tarjeta abierta y la caja de inspección. Es lo que el jugador lee, enfoca y pulsa. Sus botones, sus estilos (`.map-button`, `.stamp`) y sus pruebas con roles no cambian.
- **Por qué la escala 1:1:** un SVG que solo se encoge deja la letra de 12 px en unos 5 px a 390 px de ancho, y el HTML de encima no se encoge con él. Con 1 unidad = 1 px, el SVG y la capa HTML comparten medidas exactas y el ancho de una etiqueta (ver «Layout determinista») sirve tal cual para las dos capas.
- La capa HTML se posiciona con `left` y `top` en píxeles que salen del layout. Es la misma `.html-layer` de hoy, con `overflow: clip` (no `hidden`), por lo que el navegador no la desplaza cuando algo toma el foco (arreglado en la Tarea 28, ver `tests/e2e/CLAUDE.md`). **Conserva las clases que leen las pruebas y la caja de inspección:** `.html-layer`, `.map-button`, `button.stamp`, `.caption` (en la capa), `.map-card` y, en la etiqueta de un paquete (que es un grupo de SVG), `.packet-tag`. Así los ayudantes de e2e que miden cajas (`map-boxes.ts`, `still-scene.ts`) siguen sirviendo con el mapa nuevo; el único que lee el lienzo es `drawnBox` (`page.locator('canvas')`, comprobado con `grep`), y mientras exista, mide en su lugar el contenido del SVG.

### Grupos: pisos, oficina, VPC y subredes

- Una caja punteada de tinta suave, esquinas de 14 px, con su nombre arriba a la izquierda en el estilo `caption`.
- Con un solo piso, esa caja es la de la oficina. Con dos o más, la caja de la oficina rodea a las de los pisos (como los grupos de VPC y subred de AWS).
- **Un nombre solo dice lo que el jugador ya conoce** (`rigorous-plain-copy`, `explained-behavior-changes`): el nombre del piso o «Oficina» siempre; el bloque de IPs (`192.168.1.0/24`) solo cuando se conoce `cidr` (se presenta en el 02-04: el 02-03 no lo muestra y el 02-13 sí); «VPC» y el nombre de una subred solo con el término que los presenta. El texto sale de `src/copy/` y cada parte declara su término, como los campos de la caja de inspección.
- El router de la oficina cruza el borde de su caja, como en la imagen de referencia: está dentro de la oficina y fuera de ella.

### Piezas, enlaces y estaciones

- **Un equipo** es su icono con el nombre a la izquierda (en el modo serpiente, encima). A su derecha sale un enlace hasta el bus de su piso, una línea vertical que une todos sus equipos. **Un servidor** es lo mismo al revés: carril a la derecha del bus de internet, con el nombre a su derecha.
- **El nombre de una pieza va afuera del pasillo de su enlace.** Así el abanico de sellos (ver más abajo) nunca cae sobre un nombre.
- **El firewall** es una barra sobre el enlace de su equipo. Su etiqueta («firewall tu-laptop», «Security Group servidor2») va debajo del enlace, pasada la barra, en dos líneas: el nombre oficial del término y el nombre del recurso. Dos líneas porque el nombre completo mide de 165 a 187 px y sus dos partes miden de 79 a 115.
- **La línea principal** va de izquierda a derecha: bus de la oficina, router, globo de internet, bus de los servidores. Cada bloque de piezas se centra sobre ella.
- **Estaciones.** Un paquete no tiene coordenadas: su camino es una lista de estaciones con nombre, y el layout sabe dónde está cada una.

| Estación | Dónde está | Qué dice que pasó |
|---|---|---|
| `door:<equipo>` | El borde del equipo que da a su enlace | Llegó al equipo |
| `doorstep:<equipo>` | 62 px del borde, sobre el enlace | Nunca salió del equipo (un ping a sí mismo, una IP inválida, sin puerta de enlace) |
| `firewall:<equipo>` | La barra | Un firewall que el jugador conoce lo frenó |
| `road:<equipo>` | El cruce del enlace con el bus | Se perdió en el camino de su red |
| `bus-end:<piso>` | Un cabo de 40 px más allá del último equipo del bus | La IP no la tiene nadie |
| `router:<id>`, `internet` | El icono | Murió en ese router o en internet |
| `mid:<a>-<b>` | La mitad del enlace entre dos paradas dibujadas | Murió en un router que el mapa no dibuja |
| `door:<servidor>` | El borde del servidor que da al carril | Llegó al servidor o al cliente |

- `stationsFor(trace, packet, drawn)` sustituye a `pathFor`: las mismas ramas (el aviso del propio equipo, el firewall oculto, el router que descarta, la salida de la oficina), con una estación donde hoy hay un punto. Devuelve nombres, no coordenadas, así que sus pruebas son listas de texto.
- El layout entrega un grafo: estaciones como nodos y enlaces como aristas, algunas con codos. `route(grafo, estaciones)` completa los tramos con el camino más corto (Dijkstra, con desempate por el orden de los nodos) y devuelve los puntos.

### Los sellos

**El lugar.** Cada sello se pone sobre el enlace por el que viajó su paquete. Si el paquete terminó en una pieza o en una barra (la puerta de un equipo o de un servidor, el firewall, un router, internet), el sello va 22 px antes, hacia donde venía: la mitad de su caja medida (36 px) más 4, para que no tape la pieza ni la barra donde se detuvo. Si terminó en un punto del enlace (el umbral, el camino, la mitad entre dos paradas), el sello va en ese punto. Cada lugar lleva una marca (un punto de tinta suave) que se ve aunque no tenga sellos.

**El abanico.** Los sellos de un mismo lugar se abren a lo ancho del enlace, centrados en la marca, a 25 px uno del otro. Nunca se mueven a lo largo del enlace, y por eso la posición a lo largo sigue diciendo el lugar. Hoy es al revés: el lugar lo dice la altura y el abanico se abre en horizontal. El mapa 2D conserva la regla y cambia el eje.

**Por qué no engaña.**

1. El sello está sobre la misma línea que dibuja su paquete, así que se lee junto a su camino.
2. Las marcas de dos lugares seguidos de un enlace están a 40 px o más, y la caja de un sello mide 36: un sello nunca queda más cerca de otro lugar que del suyo.
3. Los sellos se abren a lo ancho, nunca a lo largo: apilar mucho no cambia el lugar.
4. Si no caben, no se esconde nada: el último es «+N» y su lista nombra todos.
5. El estado (✓ ✕ ? !) sigue diciendo el resultado, y la lista dice dónde terminó cada paquete con las mismas palabras de hoy.

**Cuántos caben.** Un abanico de `n` casillas mide `36 + 25 (n − 1)` px. La capa de layout reserva 3 casillas por lugar: la fila de un equipo mide 100 px de alto, más que `2 × 43 + 4`, que es lo que ocupa un abanico de 3 más una holgura. En el 02-03, tres sellos en la puerta de `laptop-lucia` caben. Si un lugar tiene más sellos que casillas, se ven los que caben menos uno y la última casilla es «+N», con `N = k − (n − 1)` y nunca menos de 2.

**Lo que cambia respecto a la Tarea 28 quinquies** (decidida O-4 = G):

- «+N» es el mismo sello (círculo, aro, 32 px y letra de 18 px), distinguido por su texto. Desde 10 escondidos, el número baja a 14 px. Abre la caja de inspección con la lista de todos los sellos del lugar al pasar el mouse, al enfocarlo o al tocarlo.
- La prioridad no cambia: los sellos con problema (✕, ?, ! e intruso) no entran en «+N» mientras haya otros que puedan entrar. Entre iguales, los más antiguos. J16 sigue abierta (cómo se ve un «+N» que esconde un problema) y el centinela también.
- **El O-9 deja de tener objeto.** Cada lugar es una marca distinta del enlace, así que no hay grupos encadenados ni escalera de 14 px: cada sello ya está a la altura, o mejor, a la posición, de su lugar.
- **El O-8 se conserva.** La etiqueta del paquete de un sello escondido no se dibuja en el mapa quieto; su texto va en la lista de «+N».
- **Se acaba el modelo de ancho de etiquetas del plan** (`labelSpans`, la proyección isométrica de cada etiqueta): el layout ya conoce la caja exacta de cada etiqueta en píxeles.

### Los paquetes y su etiqueta

**Quieto** (`still`): el rastro entero, con la forma del paquete a la mitad y, si lo contestaron, un anillo cerca del origen. Un aviso del propio equipo aparece al final del camino. La etiqueta del paquete lleva el texto de su tramo. Si dos formas caen en el mismo punto, la segunda se corre 12 px a lo largo de su camino (regla pura, probada).

**En vuelo** (SMIL, sin dependencia): cada paquete es un grupo de SVG con su forma y su etiqueta.

- `animateMotion` lo lleva por el camino a unos 120 px por segundo (el 3D iba a 3,2 unidades por segundo con 38 px por unidad: 121,6).
- Un `animate` discreto de la opacidad esconde la forma que ya cruzó y muestra la que vuelve (el anillo de la respuesta o el aviso).
- Los finales de siempre: ráfaga si lo bloquean, encoger y desvanecer si se pierde, aparecer en su sitio si es un aviso del propio equipo. Duran `PACKET_END_S`, 0,5 s.
- Un flujo vivo manda un paquete cada 3,5 s, desplazado 1,1 s por posición. Si su viaje dura más que el período, dibuja `ceil(viaje / 3,5)` copias, cada una con un período más largo y desplazadas, para no cambiar el tráfico.
- Cada envío del jugador es un grupo con `key` igual al número de envío: un envío nuevo lo vuelve a montar y SMIL arranca de cero. Un envío que espera a otro (la consulta DNS, Tarea 28 quater) lleva `begin` con esa espera.
- **Tiempos puros.** `flightPlan(camino, final, espera)` devuelve la duración, los `keyTimes`, los instantes del cambio de etiqueta y los finales. Lo prueba Vitest sin navegador.
- **Instante exacto.** `svg.pauseAnimations()` y `svg.setCurrentTime(t)` detienen la animación en `t` y las pruebas miden la posición del paquete sin esperar. MDN pone las dos en «Baseline: Widely available» (`animateMotion` desde enero de 2020 y `setCurrentTime` desde julio de 2015; no se leyeron las versiones por navegador). En el prototipo, con el Chromium de Playwright 1.64.0, el paquete cambió de posición entre `setCurrentTime(1.5)` y `setCurrentTime(3.4)` y su etiqueta cambió de tramo.

**La etiqueta de un paquete con puertos** («TCP 51514 → 80»): texto de SVG en monoespaciada dentro de un rectángulo, con `textLength` igual a su ancho calculado (ver «Layout determinista»). Va en SVG y no en HTML por dos razones: viaja con el paquete (SMIL no mueve HTML) y `textLength` fija su ancho aunque la flecha «→» caiga en otra fuente. En vuelo tiene una por tramo, y un `animate` discreto muestra la que toca: la privada antes del router que traduce y la pública después; la respuesta lleva los puertos al revés. Quieta, `placeTags` la separa de los sellos, de las etiquetas de pieza, de las cajas y de otras etiquetas: la sube o la baja de 22 en 22 px, hasta tres pasos arriba y dos abajo (O-10 = A, del plan). En vuelo la etiqueta sigue al paquete aunque pase sobre un sello, como hoy.

### La consulta DNS dibujada (O-2 = A)

- Un `ping` o un `nc` por nombre dibuja primero su pregunta: un datagrama UDP (hexágono) del equipo al resolver y su respuesta, con su etiqueta «UDP 51516 → 53» que pasa a «UDP 40003 → 53» al cruzar el router, y su propio sello en la puerta del resolver. Después sale el paquete que preguntó.
- Si el nombre salió del archivo hosts, o el equipo no tiene resolver, no hay pregunta: no se dibuja nada hacia el resolver. En el 02-13 eso se ve: `dig tienda.lucia.example` dibuja la pregunta y `ping tienda.lucia.example` va directo al servidor.
- La pregunta usa `stationsFor` sobre `Trace.question` y cuenta entre los sellos de su lugar (el resolver). Un paquete cuya búsqueda falló se queda en su `doorstep`, como el que nunca salió.
- Quieto: la pregunta y el paquete se dibujan a la vez. En vuelo: el paquete espera a que vuelva la respuesta.
- La etiqueta de la pregunta es de otro tramo que la del paquete: no se mezclan.

### Tarjetas y caja de inspección

- La tarjeta es HTML dentro de `.html-layer`. Se ancla al cuadro de la etiqueta de su pieza. Las funciones de lado, dock y alto (`terminalSide`, `dockOffset`, `dockRoom`, `cardTop`, `sideHeight`) ya trabajan en píxeles y se quedan; solo cambia de dónde sale el ancla: del layout y no de proyectar un punto con la cámara. Se calcula una vez por layout, no en cada fotograma (el mapa no se mueve).
- `MAP_MARKS` y `MAP_CARD` (Tarea 28 bis) siguen siendo selectores válidos: lo que la caja de inspección mide en el DOM no cambia.
- Una barra con el título flota sobre los 56 px de arriba del mapa: el mapa se dibuja debajo de ella.

### El catálogo (`/entidades`)

Una cuadrícula de 5 columnas de especímenes en SVG, cada uno con su leyenda. `catalog-grid.ts` (la rejilla alineada con la cámara) se borra y `catalog-cells.tsx` pasa a dibujar SVG. Los especímenes nuevos de «+N» («+2» y «+12») entran aquí. Las dos capturas de tolerancia cero se regraban a propósito (ver «Estrategia de pruebas»).

## Layout determinista

### Contrato

`layoutMap(world, pieces, { width })` es una función pura: sin DOM, sin azar y sin leer relojes. El mismo mundo, las mismas piezas y el mismo ancho dan el mismo layout. Devuelve:

- `mode`: `row`, `row-compact` o `stack`;
- `size`: ancho y alto del dibujo;
- `groups`: las cajas, con su texto;
- `links`: los enlaces, con sus puntos;
- `nodes` y `stations`: dónde está cada estación;
- `marks`: dónde se para un sello y a lo largo de qué eje se abre su abanico, con el número de casillas que caben;
- `labels`: la caja de cada etiqueta de pieza;
- `icons`: la caja de cada pieza.

No recibe los envíos del jugador: el tamaño del mapa no depende de lo que se dibuja encima (la regla de hoy se mantiene). Los sellos y las etiquetas de paquete se colocan después, con `fanStamps` y `placeTags`, sobre este layout.

### Cómo decide el modo

El modo sale de lo que cabe, no de un ancho fijo. Se prueba la fila con su densidad normal; si su ancho natural pasa del ancho disponible, la fila compacta (menos aire en el tronco y en el carril); si tampoco cabe, la serpiente. En el prototipo, con tres mapas, la fila normal entra desde 845 px (01-08), 484 px (02-03) y 899 px (02-13), y la compacta desde 819 px (01-08) y 873 px (02-13). A 1280 px de ventana el mapa mide 900 px (la ventana menos el panel de 380), así que el 02-13 entra en fila con 1 px de sobra. Un ancho natural tan justo es un riesgo, ver «Riesgos».

### La fila

- Los pisos se apilan en la caja de la oficina. Cada equipo es una fila de 100 px de alto, con su firewall, su etiqueta y la reserva de su abanico. Los equipos sin cable van fuera de las cajas, a la derecha de la última.
- El bus de cada piso sale al router por un tronco. Con varios pisos, los troncos corren en paralelo, 16 px entre centros (12 px de aire de borde a borde, con el trazo de 4 px; cambiado en M24 bis, antes 8 px entre sí), y se juntan en el router. El tronco de un piso cruza el muro de su piso y corre por un canal fuera del muro más externo de su grupo, a 12 px de borde a borde del muro (cambiado en M24 bis: antes corría entre el bus y el muro, a 3 px); el bus se queda a 11 px del muro de su propio piso.
- Router, globo y bus de los servidores van sobre la línea principal; los servidores y los clientes son carriles de 100 px de alto, centrados en ella.
- El mapa de una gateway de otra oficina (el router de la sucursal del 02-07) se pone como un segundo grupo bajo la oficina, con su propio bus, unido por el enlace privado. No está prototipado ni medido.
- Si hay más filas que alto de ventana, el mapa se desplaza hacia abajo dentro de su caja. Hoy el mayor piso tiene 5 equipos. Un piso de 8 equipos mide 878 px de alto en el prototipo.

### La serpiente

Cuando la fila no cabe, la tubería se dobla como un texto que pasa de línea:

- las filas de la oficina cuelgan a la izquierda de un bus a la derecha, con el nombre del equipo encima;
- el router, el globo y el bus de los servidores van en una segunda línea, de derecha a izquierda;
- los servidores cuelgan a la derecha de ese bus, con su nombre a la derecha.

El ancho mínimo que admite es 360 px. El prototipo, con un barrido de 340 a 1440 px de 4 en 4 sobre tres mapas, no halló solapes ni piezas fuera del mapa desde 356 px. Debajo de 360 px el mapa mantiene 360 px y su caja se desplaza de lado: no se escala. El nombre más largo que hoy existe, `servidor-autoritativo-noticias`, mide 230 px de etiqueta y cabe: 24 + 48 + 44 + 6 + 230 = 352.

### El ancho de las etiquetas

Todas las etiquetas del mapa van en monoespaciada (cambia la tipografía del nombre de un firewall, un router y internet, que hoy usan el cuerpo con el nombre propio en mono). Así el ancho no depende de una tabla por glifo: es `caracteres × 0,6 em + 14 px` (el relleno de 6 px y el borde de 1 px a cada lado), con la fuente de 12 px. Con 12 px, un carácter mide 7,2 px. **El candado y el aviso `!` suman su ancho:** `PieceLabel` los dibuja dentro del botón, un espacio, el icono de 1,2 em con su margen de 0,35 em, y para el aviso un círculo de 15 px y un espacio. Valores de partida derivados del CSS, sin medir: 26 px el candado y 22 px el aviso. Los fija una prueba del navegador que mide las etiquetas con candado y con aviso de los incidentes del capítulo 1 y del 4, y el modelo los toma del resultado.

**Se verificó que Plex Mono es monoespaciada.** Con `fontTools` (versión 4.63.0) se leyó el archivo de la versión 20 de Plex Mono que sirve Google Fonts para `index.html` (subconjunto `latin`, `https://fonts.gstatic.com/s/ibmplexmono/v20/-F63fjptAgt5VM-kVkqdyU8n1i8q131nj-o.woff2`, descargado el 2026-10-12):

- `unitsPerEm` = 1000 y `isFixedPitch` = 1;
- 221 de sus 229 glifos tienen avance 600 (0,6 em); los 8 restantes son marcas combinables y avanzan 0;
- están presentes `·`, `«`, `»`, las vocales con tilde y la `ñ`.

**Dos hallazgos que cambian el diseño:**

1. **La flecha «→» (U+2192) no está en la fuente que se sirve.** Ningún `unicode-range` de la hoja de Google (cirílico, vietnamita, latino ni latino extendido) la cubre, y el archivo latino tampoco la trae (sí trae `↑` y `↓`). Hoy el navegador la dibuja con otra fuente, y su ancho no es 0,6 em. Por eso la etiqueta de un paquete es texto de SVG con `textLength`: fija su ancho aunque la flecha caiga en otra fuente. Tampoco están `✓` y `✕`, que van dentro del círculo del sello y no entran en un ancho.
2. **Las fuentes monoespaciadas del sistema no avanzan igual, y el navegador de las pruebas no es el del jugador.** Con `fontTools`, Menlo avanza 0,602 em y SF Mono (la fuente de `ui-monospace` en macOS) 0,618. En el Chromium de Playwright 1.64.0 (156.0.8078.4, el de las e2e) se midió el ancho de una cadena de 35 caracteres a 12 px con varias pilas: `ui-monospace` solo no se reconoce (0,444 em por carácter: cae a otra fuente), `ui-monospace, monospace` y `monospace` dan 0,6 em, `Menlo` 0,602 y la pila propuesta (`IBM Plex Mono, Menlo, Consolas, monospace`) 0,602. O sea: en las pruebas la pila de hoy cae en `monospace` a 0,6 em, y un Chrome o un Safari de un Mac sí reconocen `ui-monospace` y usarían SF Mono a 0,618: mientras Plex Mono no carga (o si no carga), una etiqueta de 30 caracteres sería unos 6,5 px más ancha que el modelo en el jugador, y las pruebas no lo verían. Por eso la pila de las etiquetas del mapa es `IBM Plex Mono, Menlo, Consolas, monospace`, sin `ui-monospace` (Consolas es la de Windows y se espera que avance menos de 0,6; no se midió aquí). **Se redefine solo dentro del mapa** (`.map-stage { --font-mono: … }`), no en `tokens.css`: el token global sigue como está, y las capturas de tolerancia cero del catálogo y las líneas de código de las tarjetas no cambian por esto antes del cambio de mapa.

**Tope:** un nombre de más de 32 caracteres hace fallar una prueba pura que recorre los mundos registrados. Con 32 caracteres la etiqueta mide 245 px.

**La etiqueta que no cabe se corta (decidido por el estudiante el 2026-10-20, sobre un prototipo dibujado: https://claude.ai/artifact/LHnMUK5woLg2uJ1hKTSnfv).** Una etiqueta de una línea que haría el mapa más ancho que su pantalla se corta a los caracteres que caben y termina en «…», con su candado; la cantidad la decide el espacio, nunca un número fijo; no baja de 12 caracteres (debajo de eso la serpiente se ensancha como antes); una etiqueta de más de una línea (la del firewall) nunca se corta; el nombre completo sigue siendo el nombre accesible de la pieza («servidor-autoritativo-noticias con candado») y la caja de INSPECCIÓN lo muestra entero al pasar el mouse y al enfocar. Con el candado, `servidor-autoritativo-noticias` (30 caracteres) se dibuja `servidor-autoritativo-not…` a 360 px y entero desde 382 px.

**Una prueba en el navegador** (Vitest en modo navegador) compara el ancho del modelo con el de cada etiqueta de pieza del DOM, de todos los incidentes registrados: el DOM nunca mide más que el modelo, y lo supera en menos de 2 px. Si cambia la fuente, falla esa prueba y no el mapa en silencio.

### Colisiones

Una función `collisions(layout, sellos, etiquetas)` devuelve los pares de cajas que se pisan, de tipos que no se deben pisar (etiqueta, sello, etiqueta de paquete, nombre de grupo, pieza), salvo dos sellos del mismo abanico (hasta lo que mide su abanico). **Una prueba pura recorre todos los incidentes registrados, en cada estado posible** (los envíos que ofrecen sus fichas, y los mundos de partida y resuelto de los que tienen flujos), **en los anchos de 360, 390, 768, 900, 1060, 1280 y 1440 px**, y exige que no haya ninguna. Hoy esa garantía son unas 40 pruebas e2e que miden el DOM en dos ventanas, una por estado muestreado.

### Orden de lectura

Los botones de la capa HTML van en el DOM en el orden del mapa (de arriba abajo y de izquierda a derecha, por pieza y con sus sellos al lado), para que el Tab recorra el mapa como se lee. Una prueba pura lo fija.

## Escala

- El `viewBox` es `0 0 ancho alto`: lo que mide el layout, que es lo que mide su contenedor (con `useElementSize` de `@mantine/hooks`, que ya es dependencia). Una unidad es un píxel, a 360, 390, 1280 y 1440.
- **Del móvil a 1440.** A 390 px, serpiente de 390 px de ancho y el alto que pida. A 1280×800 (mapa de 900 × 800), fila de 845 a 899 px. A 1440×900 (mapa de 1060 × 900), la fila entra para los tres mapas del prototipo.
- El dibujo se centra horizontalmente en su caja y se coloca debajo de la barra del título (56 px).
- **Sin zoom ni desplazamiento.** Se quitan `MapControls` (el 3D deja acercar de 18 a 110 y mover con el mouse). Solo se necesitaban para ver un mapa que se recortaba. Si el dibujo es más alto que su caja, la caja se desplaza hacia abajo; nunca de lado, salvo por debajo de 360 px.
- **En el teléfono la fila del mapa pasa de `65vh` a `auto`**: el mapa crece en alto y la página se desplaza.

## Qué se borra

- **Dependencias:** `three`, `@react-three/fiber`, `@react-three/drei` y `@types/three` (cuatro entradas de `package.json` y sus líneas de `pnpm-lock.yaml`). La regla `prefer-established-libraries` cambia su línea «3D rendering» por «mapa 2D: SVG a mano; animación: SMIL, un estándar del navegador».
- **Código de `src/scene/` que se reescribe en SVG** (su versión 3D se borra): `game-scene.tsx`, `entities/{device,firewall,internet,network,packet,stamp,edge,actor}.tsx`, `traffic/{traffic,flow-traffic,use-packet-runs}.ts*` y `catalog/catalog-scene.tsx`.
- **Código de `src/scene/` que se borra:** `map-canvas.tsx`, `road.tsx`, `ink.tsx` (las cajas 3D; `InkIcon` se queda), `overlay/floor-label.tsx` (el nombre del piso pasa a ser el de un grupo), `edges.ts` y su prueba, `theme.ts` (si nada más lee `token()` y `tokenPx()`; se comprueba con `grep` en la tarea), `html-layer.ts` (el portal de drei; `MAP_MARKS` y `MAP_CARD` pasan a una constante), `overlay/use-card-side.ts`, `overlay/card-anchor.tsx` y `overlay/piece-anchor.tsx` (se reescriben sin `Html`), `catalog/catalog-grid.ts` y su prueba. De `layout.ts`: la cámara (`CAMERA_ZOOM`, `cameraPosition`, `sideForNdc`), la proyección isométrica (`UNIT_PX_X`, `UNIT_PX_Y`, `onScreen`), `spreadStamps`, `clearOfNames` y `spreadTags` en su forma isométrica, y los tipos `Vec3`.
- **Pruebas que solo existían por el 3D:** las tres de `card-layout.spec.ts` que prueban el ayudante `standStill` y el reloj pausado fotograma a fotograma; en `chapter-1.spec.ts`, `the labels of the map stand where they belong from the first moment they show` y `in 06 and 08 the map is at full size: two laptops of a floor stand as far apart as at any window` (por dos ventanas cada una); los ayudantes `still-scene.ts` (`standStill`, `freezeTime`, `stepFrame`, `passTheGrace`) y las partes de `map-boxes.ts` que miden el dibujo en un lienzo.
- **Configuración:** `launchOptions: { args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }` en `playwright.config.ts`; `three` y `@react-three/*` en `ENGINE_PACKAGES` de `eslint.config.js` (la regla de pureza del motor deja de nombrarlos) y en `.claude/rules/pure-domain-core.md`.
- **Guías y documentos:** `src/scene/CLAUDE.md` (8,8 KB), las guías de `src/scene/*/`, `tests/e2e/CLAUDE.md` (28 KB, casi todo sobre esperar a que una escena 3D quede quieta) y la de `tests/e2e/snapshots/`; las menciones del 3D en `DESIGN.md` y en `README.md`.
- **No se borra:** `layout.ts` se reescribe, no se borra; `pathFor`, `pointAt`, `cumulativeLengths`, `roundTrip`, `tagAt` y `translationDistance` se quedan en su forma 2D.

## El aspecto

Hoy el juego es de papel y tinta, claro y con un solo tema (`DESIGN.md`). La imagen de referencia que le gustó al estudiante es oscura. Las dos opciones usan el mismo dibujo; cambian los valores de los roles de color. Están dibujadas en los prototipos, con los colores reales para el claro y con valores derivados de la imagen para el oscuro.

**A · Claro, papel y tinta. Recomendada.**

- Es el aspecto de hoy y el que `DESIGN.md` llama «un solo tema». El mapa va sobre `--color-shade` (`#efe8da`), las etiquetas en `--color-surface` y las líneas en `--color-ink-soft`.
- Cuesta lo menos: no cambia ningún token, ningún par de contraste y ninguna captura del catálogo más allá de las piezas nuevas.
- El mapa tiene los colores de las tarjetas y del panel que lo rodean.

**B · Oscuro, como la referencia.**

- Los roles son los mismos y los valores salen de la imagen (leídos con Pillow): fondo del mapa `#312d29`, etiquetas `#262320`, líneas `#bab1a2`, trazos y signos `#ece6d8`. El mapa va sobre `--color-shade` oscuro; las etiquetas, en `--color-surface` oscuro.
- No es solo el mapa. Las tarjetas, el panel y las cajas leen esos mismos roles, así que todo el juego pasa a oscuro: o por elección fija, o siguiendo `prefers-color-scheme`. Un mapa oscuro dentro de un juego claro mezclaría dos looks.
- Cuesta un bloque oscuro en `tokens.css`, sus pares de contraste en `tokens.test.ts`, las dos capturas del catálogo en oscuro y rehacer en `DESIGN.md` la decisión de «un solo tema». El grano del papel (`--grain`) no se ve sobre fondo oscuro.
- Los valores oscuros que ya vio el estudiante en las páginas de decisión del capítulo 2 son los de los roles (`#1c1a17` página, `#262320` etiquetas, `#312d28` mapa, `#ece6d8` tinta, `#b9b1a2` tinta suave, `#ff8f6b` peligro, `#86b896` éxito).

**Contraste medido** (fórmula de luminancia relativa de WCAG 2.2, calculada, no con la prueba del repositorio):

| Par | Mínimo | Claro | Oscuro |
|---|---|---|---|
| Texto: tinta sobre la etiqueta | 4,5 | 13,36 | 12,56 |
| Texto: tinta sobre el mapa | 4,5 | 11,61 | 10,98 |
| Texto: tinta suave sobre el mapa | 4,5 | 5,61 | 6,43 |
| Trazo: enlaces y cajas punteadas sobre el mapa | 3 | 5,61 | 6,43 |
| Trazo: tinta sobre el mapa | 3 | 11,61 | 10,98 |
| Signo del sello: peligro sobre la etiqueta | 3 | 5,26 | 6,99 |
| Trazo: peligro sobre el mapa | 3 | 4,57 | 6,11 |

Todos pasan en los dos aspectos. Los valores de la imagen de referencia se midieron en una captura de 1890 × 1022 px; los de `--color-danger` y `--color-success` oscuros no están en ella.

## Estrategia de pruebas

El estudiante preguntó si con Vitest y Testing Library basta. **Casi: basta para todo menos para lo que necesita la geometría real de un navegador**, y para eso Vitest tiene su propio modo navegador, que corre las pruebas en Chromium real. Quedan cuatro capas.

### Las cuatro capas

- **(a) Vitest y funciones puras**, en `pnpm check:fast`. Layout, estaciones, abanico, etiquetas, colisiones, tiempos de vuelo, colocación de tarjetas y qué se dibuja. Sin DOM, en milisegundos.
- **(b) Vitest y Testing Library en jsdom**, en `pnpm check:fast`. Comportamiento de los componentes: roles, nombres, foco, teclado, qué texto lleva una pieza o un sello, qué pasa al pulsar.
- **(c) Vitest en modo navegador** (Chromium real, `pnpm test:browser`). Solo lo que necesita geometría o CSS reales y jsdom no calcula: que una tarjeta no tape «Listo», que las tarjetas quepan a 390 px y se desplacen, el ancho real de las etiquetas contra el modelo, el estilo calculado de los primitivos, las capturas del catálogo y los instantes exactos de la animación.
- **(d) Playwright**: jugar cada capítulo de punta a punta, el roadmap y el progreso guardado, sobre la compilación de producción.

### Lo que se verificó del modo navegador

El proyecto ya trae `vitest` 5.0.3. Vitest 5.0.3 declara `@vitest/browser-playwright` como dependencia par opcional, exactamente en `5.0.3`; **no está instalada** (se comprobó en `node_modules/vitest/package.json` y en `node_modules/@vitest/`). En el registro de npm (`pnpm view`, 2026-10-12) `@vitest/browser-playwright@5.0.3` existe, se publicó el 2026-09-30, y declara `vitest: 5.0.3` y `playwright: *` como pares. Dependencias: `@vitest/browser@5.0.3` y `@vitest/mocker@5.0.3`.

- **Existe y no es experimental.** La entrada de Vitest 4 dice «With this release we are removing the `experimental` tag from Browser Mode» (https://vitest.dev/blog/vitest-4). La guía de 5.0 lo describe con `provider: playwright()` de `@vitest/browser-playwright`, `enabled: true` y `instances: [{ browser: 'chromium' }]` («at least one instance is required»), y `headless` opcional (https://vitest.dev/guide/browser/).
- **Varios proyectos.** `test.projects` con `extends: true` (por defecto desde 5.0) y `vitest --project <nombre>` (https://vitest.dev/guide/projects). El proyecto de jsdom y el del navegador conviven en el mismo `vite.config.ts`.
- **Viewport.** `browser.viewport` por defecto 414 × 896 es el del iframe de las pruebas, y `page.viewport(ancho, alto)` lo cambia («Change the size of iframe's viewport») (https://vitest.dev/config/browser/viewport y https://vitest.dev/api/browser/context). Una prueba a 390 px lo hace con eso. En el código del proveedor (5.0.3, sin UI y en modo sin cabeza) `page.viewport` fija el tamaño del iframe con variables CSS y además llama a `page.setViewportSize` de Playwright, así que las `@media` deberían leer ese ancho: se leyó, no se corrió, y M1 lo comprueba.
- **Pruebas visuales.** `toMatchScreenshot` existe y «Vitest does not define a default tolerance for mismatched pixels»; guarda las referencias en `__screenshots__` junto a las pruebas, por navegador y plataforma, y avisa de que los resultados varían entre entornos (https://vitest.dev/guide/browser/visual-regression-testing).
- **Rueda del mouse.** La documentación dice que `userEvent.wheel` (desde 4.1.0) «fires a wheel event» y que sirve para código que escucha ese evento, no para llevar un elemento a la vista (https://vitest.dev/api/browser/interactivity). **El código del proveedor dice otra cosa:** se bajó el paquete `@vitest/browser-playwright@5.0.3` del registro a un directorio fuera del proyecto y su `wheel` hace `hover` sobre el elemento con Playwright y después llama a `context.page.mouse.wheel(deltaX, deltaY)`, que es la rueda real de Playwright, la misma que usan las e2e de hoy (`dist/index.js`, líneas 796 a 803). No se corrió: la tarea M1 comprueba que desplaza el cuerpo de una tarjeta dentro del iframe. Si no desplaza, las cinco pruebas con rueda de la tabla se quedan en e2e.
- **Versión y antigüedad.** La regla del estudiante pide una versión exacta y de al menos 14 días. 5.0.3 cumple 14 días el 2026-10-14. No se agrega antes. La 5.0.2 sí tiene 14 días, pero exigiría bajar `vitest` a 5.0.2: no se recomienda.
- **No se agrega `vitest-browser-react`.** Regla «una librería por trabajo»: el `render` de Testing Library ya está y también corre en el navegador (la guía de componentes lo documenta como puente con `page.elementLocator`).
- **Sin verificar:** cuánto tarda en arrancar Chromium dentro de Vitest, cómo se reparten los archivos entre páginas (la página `config/browser/isolate` dio 404 y el código del proveedor no lo aclaró) y si `expect.element` (que reintenta hasta que se cumple) cuenta como espera fija. La regla de la Tarea 19 bis prohíbe `waitForTimeout`, `setTimeout` y `setInterval` en `tests/**`; `eslint.config.js` solo la aplica ahí, así que la tarea M1 la extiende a los `*.browser.test.*` de `src/`.
- Las páginas de la documentación se leyeron con un resumidor: las frases entre comillas son las que devolvió. El paquete y sus versiones sí se verificaron en el registro.

### Qué pasa con las 126 e2e de hoy

La lista exacta sale de `pnpm exec playwright test --list` (2026-10-12, en `a4f6e1f`): 126 pruebas en 6 archivos. Los 4 o 5 que trae la Tarea 28 bis (las del pin de la caja y el oráculo) se clasifican igual y se cuentan al terminar el merge.

| Archivo | Prueba o grupo | Hoy | Pasa a |
|---|---|---|---|
| `card-layout.spec.ts` (10) | `a box is measured only once the scene stands still`, `a scene that never stands still is reported and not measured`, `with the clock paused the scene still moves to its rest frame by frame...` (3) | e2e | **Se borran**: prueban el ayudante de esperar a una escena 3D |
| | `a card opened on a narrow map never scrolls the layer of the labels...`, `the tab of a Message in the cards of the game covers nothing...`, `no card is clipped and cards never overlap, at 390 px and at desktop width`, `a card beside a piece stays inside the map, with its foot in view...` (4) | e2e | (c) |
| | `the last element of every card can be reached by scrolling on a low screen`, `an inspection box that does not fit scrolls under the mouse...`, `the body of the card that classifies scrolls to its last bin...` (3) | e2e | (c), con la rueda: se quedan en (d) si falla la prueba de M1 |
| `chapter-1.spec.ts` (41) | `chapter 1 is played from 01-01 to 01-14...` (1) | e2e | **(d)** |
| | `the roadmap lists the fourteen incidents...`, `chapter 1 opens at 01-01 and 04-01 opens once...`, `04-01 stays locked after 01-14 has a star...`, `04-01 stays open with its stored stars...`, las dos de lectores de pantalla sobre los sellos de 05 y 11, `in 07 picking the gateway in the Ajustes de red tab...`, `in 13 the tabs Entrada and Salida... with the keyboard` (8) | e2e | (b) |
| | `in 10 the question about the broken stretch cannot be answered from the map...` (1) | e2e | (a) |
| | Por cada ventana de 1280×800 y de 1440×900, `in 05 the warning ... does not travel`, `after the pings of 08, no label or stamp overlaps...`, `after the four tests of case 1 of 14...`, `in 01-09 and 01-10 no label or stamp...`, `in 01-10, before the traceroute...` (10) y `in 06, 08 and 10 the whole map and its labels fit...`, `in 10, before the traceroute, the whole map ... fit`, `in 14 the whole map ... fit` (6) | e2e | (a): el barrido de colisiones y de ancho |
| | Por cada ventana, `in 01-01 the open card of the printer covers none...`, `in 01-02 the open terminal covers...`, `in 01-07 the open settings card covers none...` (6), y los de la terminal: `...keeps Enviar and Listo in view`, `in 06 the open terminal covers...`, `in 10 the open terminal, with the traceroute listed, covers...` (5) | e2e | (c) |
| | `the labels of the map stand where they belong...` y `in 06 and 08 the map is at full size...` (4) | e2e | **Se borran** (la cámara que saltaba y el mapa que se encogía ya no existen) |
| `chapter-2.spec.ts` (28) | `02-01 is played...` a `02-09 is played...` (9) y `chapter 2 opens at 02-01...` | e2e | Un solo **(d)** nuevo, el capítulo 2 entero; el de desbloqueo pasa a (b) |
| | `in 02-01 ... wears the port...`, `in 02-02 ... TCP and both ports...`, `in 02-03 a refusal leaves the stamp Llegó...`, `the still drawing of a translated packet...` (4) | e2e | (b) |
| | `in 02-04 placing a device inside the block draws it inside the outline...` (1) | e2e | (a) |
| | `a translated packet changes its label at the router...` (1, 31 s) | e2e | (c), con `setCurrentTime`, y (a) para el instante del cambio |
| | Por cada ventana, las 6 de solapes y de que el mapa cabe (02-01, 02-02, 02-04, 02-07 dos, 02-09 y 02-10) (12) | e2e | (a) |
| `entities.spec.ts` (17) | La captura de las piezas | e2e | (c), `toMatchScreenshot`, sobre SVG |
| | El resto de los especímenes de la interfaz (13): el botón primario como sello (3, con el pulsado), las letras de las opciones, la captura de la interfaz, `Table` (3), la tarjeta «Salida» (2) y `Message` (3) | e2e | (c): estilo calculado, cajas y capturas; no dependen del 3D |
| | `the specimens of the outline of the block and of the intruders are part of the capture`, `the entity catalog also runs with its animations, without errors`, `the roadmap does not link to the entity catalog` (3) | e2e | (b) |
| `incidents.spec.ts` (27) | `04-01 and 04-02 reach 3 stars, and the progress survives a reload` (1) | e2e | **(d)** |
| | `starts checked from the system preference...`, `an intrusion shows its alert inside the label...`, `a locked incident does not open from its URL`, `focus goes to the card heading...`, `sending with Anywhere-IPv4 open gets Lucía's reply...` (5) | e2e | (b) |
| | `labels and stamps do not overlap, and the open card does not cover its Security Group`, `the inspection box floats inside the window...`, `a term shows its definition inside the window...` y las 18 de `the inspection box of <pieza> lies inside the window...` (21) | e2e | (c); las 18 son una sola prueba con 18 casos |
| `roadmap.spec.ts` (3) | `the roadmap loads every chapter, grouped by level, without console errors` | e2e | **(d)** |
| | `the roadmap fits a phone screen, without a horizontal scroll` | e2e | (c) |
| | `an unknown incident leads back to the roadmap` | e2e | (b) |

**Totales (126):** (a) 30, (b) 22, (c) 55, se borran 7 y 12 se quedan en (d) o se funden. De estas 12: las 3 que se quedan tal cual (capítulo 1, capítulo 4 con su recarga y la carga del roadmap) y las 9 de «02-0X is played», que se funden en una sola del capítulo 2. Hasta 5 de las 55 de (c) vuelven a (d) si falla la prueba de la rueda de M1 (`the last element...`, `an inspection box that does not fit scrolls...`, `the body of the card that classifies scrolls...` y, de `entities.spec.ts`, `a long Table in a card on the map...` y `an unfolded output in a card on the map...`). Los totales salen de contar los títulos de la lista; las pruebas del merge de la Tarea 28 bis y de la 28 quinquies no se cuentan aquí.

### Cuántas e2e quedan: 6

1. El capítulo 1 jugado de punta a punta con 3 estrellas por incidente (la de hoy).
2. El capítulo 2 jugado de punta a punta (nueva: reemplaza las 9 de «02-0X is played» y la de desbloqueo; el 02-14 se suma con la Tarea 34).
3. El capítulo 4 jugado, con su progreso que sobrevive a una recarga (la de hoy).
4. El roadmap carga todos los capítulos agrupados por nivel y sin errores de consola (la de hoy).
5. El progreso guardado en el navegador vuelve tras una recarga y desbloquea lo que debe (nueva, corta: lo que hoy repiten cuatro pruebas).
6. Un incidente jugado con toque a 390×844 sobre la compilación real, sin desplazamiento lateral y con cada pieza al alcance (nueva: la regresión que justifica esta migración).

Serían 11 solo si la prueba de la rueda de M1 fallara con las 5 pruebas que la usan; el código del proveedor sugiere que no falla, y no se corrió.

**Medido con la Tarea M23 (2026-10-20).** Cada cifra es una sola medición, no un promedio, con la máquina a una carga de 2 a 3 y nada más corriendo en la carpeta. La e2e quedó en estas 6 pruebas y la corrida entera tardó 18 s de reloj (18,4 s según Playwright), contra los 2,1 min de B0. `pnpm check:fast` tardó 19 s (Vitest 3530 pruebas en 132 archivos, jscpd con 0 clones), `pnpm test:browser` 117 s de reloj (116 s según Vitest; 240 pruebas en 19 archivos) y `pnpm check`, que es esa secuencia, unos 154 s, o sea 2 min 34 s, contra los 2 min 20 s de B0. La e2e pasó de 2,1 min a 18 s, pero el `pnpm check` entero creció unos 14 s, porque la capa del navegador, que en B0 no existía, ahora tarda unos 2 min.

### Tiempo del `pnpm check`

- **Hoy** (medido el 2026-10-12 sobre `11587fc`): `check:fast` 11,3 s y la e2e 2,1 min, o sea unos 2 min 20 s. La e2e es el 92 %.
- **Después (derivado, no medido).** De las e2e que se quedan, la más larga es la del capítulo 1: 56 s hoy, y ese número incluye el costo de dibujar WebGL con `swiftshader`, que desaparece. Con 6 pruebas y trabajadores de sobra, la e2e queda en un minuto o menos (cota superior, derivada del tiempo de la más larga). Lo que no se pudo medir es el modo navegador (no está instalado): arrancar Chromium y correr unas 55 pruebas de geometría, sin servidor ni compilación, se estima en 20 a 40 s. El barrido de colisiones (a) suma unos segundos a `check:fast`: no medido. Sumado, `pnpm check` queda alrededor de 1 min 30 s a 2 min, y lo que gana sobre todo es el ciclo por tarea: hoy `check:fast` más la e2e que toca (de 1 a 2 min para `card-layout` o `chapter-2`), y después `check:fast` más `test:browser` (estimado 20 a 40 s).
- **Scripts.** `test` pasa a `vitest run --project unit`; `test:browser` corre el proyecto del navegador; `check` es `check:fast`, `test:browser` y `e2e`. `check:fast` sigue sin navegador. La prueba `scripts/package-scripts.test.ts` fija hoy `check` como `['check:fast', 'e2e']`: cambia a propósito en M1.

### Reglas que se mantienen (Tarea 19 bis)

Nada de esperas fijas, ni `retries`, ni `skip`, ni `fixme`, ni `test.fail`. En el navegador se espera con `expect.element` (que reintenta hasta que se cumple) y no con tiempos. Las pruebas de animación no esperan: detienen el reloj de SMIL y lo llevan a un instante. Cada prueba que sale de e2e se borra en el mismo commit que la recibe en su capa nueva.

## Decididas sin el estudiante (para revisar)

Ninguna de estas pasa el umbral para abrírsela al estudiante: o una sola opción pasa sus tres criterios (rigurosa, visual y entendible), o la diferencia no cambia de forma importante lo que se aprende ni lo que se ve. Cada una tiene su porqué.

1. **Dos capas y escala 1:1** (arte en SVG, texto y controles en HTML). Otra opción era todo en SVG con `viewBox` que escala. Por qué no se abre: escalar deja la letra en 5 px a 390 px y no pasa «entendible».
2. **El mapa se reacomoda en vez de encogerse** (fila, fila compacta y serpiente), con 360 px de mínimo. Por qué no se abre: la única otra opción es escalar.
3. **Sin zoom ni desplazamiento.** Es un cambio de lo que el jugador puede hacer: el 3D se acercaba y se movía. Se quita porque era el remedio de un mapa que se recortaba. Por qué no se abre: mantenerlo exige una transformación que desalinea la capa HTML.
4. **Todas las etiquetas en monoespaciada**, con la pila `IBM Plex Mono, Menlo, Consolas, monospace` (sin `ui-monospace`, y solo dentro del mapa) y la etiqueta de un firewall en dos líneas. Cambia lo que se ve (hoy el término va en el cuerpo y el nombre en mono). Por qué no se abre: es lo que hace exacto el ancho, y la imagen de referencia ya las muestra así.
5. **La etiqueta de un paquete es SVG con `textLength`.** Por qué no se abre: es decisión técnica y no cambia lo que se aprende.
6. **El lugar de un sello es la posición a lo largo del enlace, y el abanico se abre a lo ancho**, con 22 px de retroceso, 25 px de paso y 3 casillas. Por qué no se abre: la otra opción (sellos junto a la pieza, como en la referencia) pierde la diferencia entre puerta, firewall y camino, y deja de ser rigurosa.
7. **El O-9 (escalera de 14 px) queda sin objeto** y la salvaguarda también: cada lugar es una marca distinta. Por qué no se abre: no hay nada que decidir.
8. **Animación con SMIL**, 120 px/s, copias para los flujos largos y un grupo nuevo por envío. Por qué no se abre: no cambia lo que se ve ni lo que se aprende y no suma dependencia (la regla `prefer-established-libraries` pide una librería para infraestructura genérica: aquí la infraestructura es el navegador).
9. **Las piezas son los iconos del catálogo, más grandes**, y el router y el Internet gateway estrenan un frente nuevo (caja con o sin antenas), porque el arco era 3D. El arte de los prototipos es simbólico, no el final. Por qué no se abre: hoy cada pieza ya tiene su icono en el catálogo.
10. **Los nombres de los grupos dicen siempre el nombre y solo dicen el bloque o «VPC» con su término.** Por qué no se abre: la otra opción rompe la escalera de términos.
11. **No se adopta la numeración de los paquetes de la referencia** (los círculos «1» y «2» sobre los enlaces). Los flujos vivos no tienen número y los textos del juego no numeran los envíos. Si el estudiante la quiere, es una variante del paquete, con su texto en la caja.
12. **En el teléfono el mapa crece en alto** (la fila de la cuadrícula pasa de `65vh` a `auto`).
13. **Una bandera de compilación** (`VITE_MAP_RENDERER`, por defecto `3d`) mantiene los capítulos jugables hasta que el 2D iguale al 3D.
14. **El modo navegador de Vitest** como tercera capa, con `@vitest/browser-playwright` 5.0.3 exacto y sin `vitest-browser-react`.
15. **El orden:** primero la Tarea 28 bis, la 28 ter, la migración, y después 28 quater, 28 quinquies y 29 a 35. La mitad de `game` y `copy` de la 28 quinquies se hace antes de la escena.
16. **Las capturas de `/entidades` pasan a `toMatchScreenshot` de Vitest** cuando el modo navegador exista.
17. **Las sombras de contacto y las luces desaparecen.** Es un cambio visual menor: el 2D es plano.
18. **Dos formas de paquete en el mismo punto, en el dibujo quieto:** la segunda se corre 12 px a lo largo de su camino. Es una regla pura y no la dibujó el prototipo. Por qué no se abre: sin ella, los paquetes que comparten un tronco se tapan (se vio en el prototipo del 01-08 antes de afinar sus posiciones).

## Riesgos y lo que no se pudo verificar

- **Los prototipos no son el juego.** Son un script de JavaScript suelto, no código de React ni del repositorio. El arte de las piezas es simbólico. Nada de esto se corrió en el juego.
- **SMIL dentro de React.** Los prototipos escriben SVG como texto. React 19 debe pasar bien `keyPoints`, `keyTimes`, `calcMode` y `repeatCount`: no se comprobó. La primera tarea de vuelo (M14) lo prueba antes de seguir.
- **Se prototiparon tres mapas** (01-08, 02-03, 02-13) más el 02-03 con cinco sellos. No se prototiparon: la sucursal del 02-07, un VPC del capítulo 4 con sus subredes, un piso de 5 equipos, tres pisos en serpiente y los dos primeros routers de la calle. «Cómo crece» de los pisos y las piezas son medidas de sintéticos del mismo prototipo.
- **El 02-13 cabe en fila por 1 px** a 1280 px de ventana (899 de 900). A una ventana de 1270 px el mapa pasa a la compacta, y por debajo de 1253 px a la serpiente. Es un salto de forma que el jugador vería al redimensionar. No se decidió suavizarlo.
- **No se midió el ancho de Plex Sans.** Por eso las etiquetas van en mono; si el estudiante prefiere el cuerpo para las palabras de un término, hace falta una tabla de anchos por glifo que las e2e con otra fuente no cumplirían.
- **Las pruebas del navegador** no se corrieron: el paquete del proveedor no está instalado. De la rueda y de `page.viewport` se leyó el código del proveedor (tarball de 5.0.3 en un directorio fuera del proyecto) pero no se ejecutó; el tiempo de arranque y el reparto de archivos entre páginas están sin verificar (ver «Estrategia de pruebas»).
- **El tiempo de `pnpm check` después** es una derivación, no una medida.
- **Las cifras del 21 % del tiempo de agentes y de las 6 decisiones de 10** las trae la sesión principal; no se volvieron a medir.
- **El contraste** se calculó con la fórmula de WCAG 2.2, no con la prueba de `tokens.test.ts`, y los valores oscuros de peligro y éxito no salen de la imagen.
- **Los nombres que cambia la Tarea 28 bis** (`inspectTrigger`, `trigger`) se leyeron en la rama `merge/28bis` en `626a144`, antes de los commits de D, que no se vieron.
- **Los conteos de `layout.test.ts`** (115 pruebas) por categoría salen de leer sus `describe`: unas 35 de `pathFor`, 40 de disposición, 20 de tarjetas en píxeles, 6 de puertos, 16 de sellos y etiquetas y unas 5 de cámara. Son aproximados.
- **La estimación de horas** del plan se deriva de los tiempos de los commits de las Tareas 8 a 28; no se midió.

## Fuentes (consultadas el 2026-10-12)

- IBM Plex Mono, v20, subconjunto `latin`, y la hoja de `https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&display=swap`: leídos con `curl` y `fontTools` 4.63.0. Menlo y SF NS Mono: `/System/Library/Fonts/Menlo.ttc` y `SFNSMono.ttf`, leídos con `fontTools`.
- Vitest 4, Browser Mode estable y `toMatchScreenshot`: https://vitest.dev/blog/vitest-4. Guía de Browser Mode: https://vitest.dev/guide/browser/. Proyectos: https://vitest.dev/guide/projects. Viewport: https://vitest.dev/config/browser/viewport y https://vitest.dev/api/browser/context. Interacciones (`wheel`): https://vitest.dev/api/browser/interactivity. Órdenes: https://vitest.dev/api/browser/commands. Pruebas visuales: https://vitest.dev/guide/browser/visual-regression-testing. Componentes: https://vitest.dev/guide/browser/component-testing. Leídas con un resumidor.
- `@vitest/browser-playwright`: `pnpm view` (versión, fecha de publicación y pares) y `node_modules/vitest/package.json` del proyecto (5.0.3).
- MDN, `animateMotion`: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/animateMotion («Baseline: Widely available», desde enero de 2020). MDN, `setCurrentTime`: https://developer.mozilla.org/en-US/docs/Web/API/SVGSVGElement/setCurrentTime (desde julio de 2015). MDN, `textLength`: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/textLength («text displays at the same width regardless of conditions including web fonts failing to load»; julio de 2015).
- Prototipos: el barrido de anchos, el contraste y el movimiento por `setCurrentTime` se corrieron en Chromium de Playwright 1.64.0 sobre la página `2d-map-prototypes.html`.
- Medidas de las e2e: `baseline-11587fc-check.log` y `baseline-time.txt` del scratchpad, y `pnpm exec playwright test --list` sobre `a4f6e1f`.
- WCAG 2.2, criterios 1.4.3 y 1.4.11 (los mismos umbrales que usa `DESIGN.md`).
