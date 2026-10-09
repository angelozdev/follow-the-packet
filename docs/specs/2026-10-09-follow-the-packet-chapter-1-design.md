# Sigue el paquete: capítulo 1 «Tu primer día» y el catálogo de entidades

Fecha: 2026-10-09 · Estado: diseño aprobado por partes en la conversación; falta la revisión del spec escrito

Amplía `docs/specs/2026-10-08-follow-the-packet-live-incidents-design.md`. De aquel spec siguen valiendo, sin cambios salvo lo que se dice aquí:
- la mecánica `filter` del capítulo 4;
- la escalera de términos;
- la regla `rigorous-plain-copy`;
- el arte papel y tinta;
- el stack.

## Por qué

- **El módulo 1 del curso no tiene contenido técnico.** Sus lecciones son bienvenida, temario, cómo seguir el curso y uso de la IA (`syllabus.md`, sección 1). El capítulo 1 del juego no puede salir de ahí.
- **El 04-01 da por sabidos unos 13 conceptos que nunca define:** red, protocolo, dirección IP / IPv4, paquete, tráfico, internet, firewall, ida y vuelta (solicitud y respuesta), origen y destino. Ejemplos:
  - «firewall» aparece en la definición de Security Group (`projects/follow-the-packet/src/copy/terms.ts:18`);
  - «paquete» es la pieza central del mapa y no es un término (`src/copy/incident-ui.ts:8`).
- **El mapa no se explica solo.** Un novato no sabe que la losa es la VPC, que el punto es un paquete, qué son los sellos ✓/✕ ni qué indica el candado.
- **El estudiante no tiene base de redes** (regla `rigorous-plain-copy`). El artefacto 06 ya le mostró paquete, IP, puerto, VPC, subnet e Internet gateway. Nunca vio ping, ICMP ni Echo Request/Reply.

El capítulo 1 da el modelo mínimo para seguir un paquete en una red sin AWS. Así, en el 04-01 solo es nuevo lo de AWS.

## Decisiones

| Tema | Decisión | Descartado y por qué |
|------|----------|----------------------|
| Propósito | **Red simple sin AWS** que enseña los conceptos base y a leer el mapa | Solo un tutorial de la mecánica: los términos base quedan sin práctica. Sumar lo de AWS de los módulos 2 y 3: vacía esos capítulos |
| Mecánica | **Enviar paquetes:** eliges origen, destino y mensaje con fichas, y ves por dónde viaja el paquete. El último incidente es `filter`, como puente | Configurar un firewall desde el principio: es un ensayo del capítulo 4 y enseña reglas antes que IP. Solo observar: pasivo |
| Entidades | **Catálogo dentro de este juego:** cada entidad tiene una ficha de diseño y un componente propio, y se usa igual en todos los capítulos. Queda listo para sacarlo a un paquete si llega un segundo juego | Paquete compartido entre juegos: exige un monorepo sin tener un segundo juego. Guía para los artefactos HTML: son de un solo archivo y copiarían el diseño en vez de importarlo |
| Escenario | **Tu primer día en la oficina, con Lucía** | Tu casa: obliga a explicar router y Wi-Fi antes de tiempo. Red abstracta: pierde a Lucía y el porqué de cada tarea |
| Arquitectura | **Modelo genérico:** dispositivos y firewalls con tipo, un solo motor para todos los capítulos | Motor aparte para el capítulo 1: dos simuladores que se separan. Capítulo con guion: el resultado no lo calcula el motor y el texto puede mentir |
| Estrellas en `send` | **Cerrar, sin pistas, explicar** | «Sin abrir de más»: en `send` no hay nada que abrir |
| Progreso | **Un incidente con estrellas sigue abierto** aunque el anterior no las tenga | Bloquear el capítulo 4 hasta terminar el 1: el estudiante perdería acceso a lo que ya jugó |
| Entrega | **Tres planes:** modelo genérico, catálogo de entidades, capítulo 1. Prueba humana al final | Todo en un plan: el refactor del motor y el diseño visual se revisarían mezclados |

## Base de investigación (2026-10-09)

### Fuentes de las definiciones

Fuentes consultadas el 2026-10-09:
- **AWS:**
  - glosario general: https://docs.aws.amazon.com/general/latest/gr/glos-chap.html
  - What is computer networking: https://aws.amazon.com/what-is/computer-networking/
  - What is TCP/IP: https://aws.amazon.com/what-is/tcp-ip/
  - What is ICMP: https://aws.amazon.com/what-is/icmp/
  - What is routing: https://aws.amazon.com/what-is/routing/
  - What is network security: https://aws.amazon.com/what-is/network-security/
  - VPC, IP addressing: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-ip-addressing.html
  - VPC, CIDR blocks: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-cidr-blocks.html
  - Security group rules: https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html
  - EC2, instance addressing: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-instance-addressing.html
  - EC2, security group rules reference: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-rules-reference.html
- **IETF:** RFC 791, 792, 1122 y 1918 (https://www.rfc-editor.org/rfc/rfcNNNN).
- **IANA:** https://www.iana.org/assignments/icmp-parameters/icmp-parameters.xhtml
- **MDN:** glosario, https://developer.mozilla.org/en-US/docs/Glossary/ (Protocol, Packet, Internet, Firewall).

Qué define cada fuente:
- **AWS define:** IP address, IP privada y pública, route table, stateful/stateless y la regla de ping.
- **AWS no define:** paquete, protocolo, puerto, internet ni cliente/servidor. Para esos se usan MDN y las RFC.

### Afirmaciones verificadas

- **Internet no entrega paquetes a una IP privada.** RFC 1918, §3: «Because private addresses have no global meaning, routing information about private networks shall not be propagated on inter-enterprise links, and packets with private source or destination addresses should not be forwarded across such links. Routers in networks not using private address space, especially those of Internet service providers, are expected to be configured to reject (filter out) routing information about private networks.»
- **Rangos privados (RFC 1918, §3):** 10.0.0.0/8, 172.16.0.0/12 y 192.168.0.0/16. La VPC por defecto (172.31.0.0/16) cae dentro de 172.16.0.0/12.
- **Solo un Echo Request recibe respuesta.** RFC 1122, §3.2.2.6: «Every host MUST implement an ICMP Echo server function that receives Echo Requests and sends corresponding Echo Replies. A host SHOULD also implement an application-layer interface for sending an Echo Request and receiving an Echo Reply». Un Echo Reply va a la interfaz de la aplicación (el ping que lo espera), no al servidor de eco. Si nadie lo espera, no recibe respuesta.
- **Tipos de Echo:** Echo Request es el tipo 8 y Echo Reply el tipo 0 (RFC 792 e IANA).

### Avisos

- **Error en una página de AWS:** la página «What is ICMP» de AWS dice «Types 8 and 10» para Echo. Es un error: el 10 es Router Solicitation. Las cifras se toman de RFC 792 e IANA.
- **IP privada en una VPC:** AWS llama IP privada a cualquier IP dentro del CIDR de la VPC, aunque no sea de RFC 1918 (página CIDR blocks). En el juego todas las VPC usan rangos de RFC 1918, así que la definición de abajo es exacta para el juego.
- **Simplificación declarada:** el juego no modela ARP. En una red real, si ningún dispositivo tiene la IP de destino, la laptop pregunta en la red quién la tiene y, sin respuesta, el Echo Request ni sale. El juego dibuja el paquete perdido en la red. El texto dice solo lo exacto: «Ningún dispositivo de la red tiene esa IP: el paquete no llega a nadie.»

## Capítulo 1 · Introducción: «Tu primer día»

Lucía te recibe en la oficina y te enseña a seguir un paquete. El capítulo es un mapa que crece, como el capítulo 4: cada incidente parte del mundo del anterior.

### Mundo

| Pieza | Datos | Aparece en |
|-------|-------|------------|
| red de la oficina | rango `192.168.1.0/24` (en el modelo; no se muestra: CIDR llega en el 04-04) | 01-01 |
| tu laptop | `192.168.1.10` | 01-01 |
| laptop de Lucía | `192.168.1.11` | 01-01 |
| impresora | `192.168.1.20` | 01-01 |
| router de la oficina | conecta la red de la oficina con internet | 01-03 |
| internet | afuera de la oficina | 01-03 |
| casa de Lucía | actor en internet; su IP queda oculta hasta el 04-05, como la del atacante | 01-03 |
| firewall de la laptop de Lucía | reglas de entrada vacías; deja salir todo | 01-04 |

- Router e internet entran en el 01-03 y no antes. Una pieza visible lleva su nombre desde que aparece, y su término se introduce en ese incidente. Si estuvieran desde el 01-01, ese incidente cargaría con dos términos más.
- **Historia del firewall:** el firewall de Lucía llega en el 01-04 porque soporte lo activa en todas las laptops esa tarde.

### Cómo envías un paquete

- **Abrir la tarjeta:** haces clic en tu laptop y se abre una tarjeta tipo terminal junto a ella. Si eliges otro origen (en el 01-03), la tarjeta pasa junto a esa pieza.
- **Elegir:** eliges con fichas, sin texto libre. Hay tres bandejas: «Origen», «Destino» y «Mensaje». Cada incidente muestra solo las que necesita.
- **Ver la línea:**
  - Cuando el paquete es un ping, la tarjeta muestra el comando real, por ejemplo `ping 192.168.1.20`.
  - Un Echo Reply suelto no lo manda ningún comando común. La tarjeta lo muestra como «paquete armado a mano: ICMP · Echo Reply → 192.168.1.11», sin inventar un comando.
- **Enviar:** pulsas «Enviar». El motor simula el paquete y el mapa lo anima una vez, con su sello.
- **Ver el resultado:** el último paquete de cada combinación (origen, destino y mensaje) deja su sello en el mapa. Al pasar el mouse, la caja de inspección dice dónde llegó o murió y por qué.
- **Equivocarse no cuesta nada:** puedes enviar cuantas veces quieras.

### Incidentes

| # | Título | Tipo | Bandejas | Términos nuevos |
|---|--------|------|----------|-----------------|
| 01-01 | La dirección | `send` | Destino | dispositivo, red, dirección IP, IPv4, paquete, ping |
| 01-02 | Ida y vuelta | `send` | Destino, Mensaje | protocolo, ICMP, solicitud, respuesta, Echo Request, Echo Reply |
| 01-03 | Desde afuera | `send` | Origen, Destino, Mensaje | internet, router, IP privada |
| 01-04 | El firewall | `filter` | Type, Source | firewall, tráfico, regla |

Todos citan la lección `Lab: Comprobación de Conectividad entre Instancias EC2 usando PING`, porque el capítulo 1 del curso no tiene una lección técnica. Los textos finales se escriben en el plan 3; aquí va lo que cada incidente debe lograr.

#### 01-01 · La dirección

- **Pedido de Lucía:** «Haz ping a la impresora». Para saber su IP, pasas el mouse sobre ella.
- **Fichas de destino:**
  - `192.168.1.20`: la impresora;
  - `192.168.1.11`: la laptop de Lucía;
  - `192.168.1.30`: no la tiene ningún dispositivo.
- **Fijos:** el origen es tu laptop y el mensaje, ping.
- **Tarea:** que tu ping a la impresora vuelva con respuesta.
- **Elecciones equivocadas:**
  - `.11`: el ping llega a la laptop de Lucía y vuelve (sello ✓), pero la tarea no se cumple. Lucía: «esa es mi laptop».
  - `.30`: ningún dispositivo de la red tiene esa IP, y el ping no obtiene respuesta.
- **Pregunta de Lucía:** «¿cómo supo la red a quién entregar el paquete?»
  - ✓ Por la dirección IP de destino que lleva el paquete.
  - ✗ Por el nombre del dispositivo. (Los nombres llegan con DNS, en el 04-06.)
  - ✗ Lo manda a todos y contesta el que quiere.

#### 01-02 · Ida y vuelta

- **Pedido de Lucía:** «Haz que mi laptop te conteste».
- **Fichas:**
  - Destino: `192.168.1.11` y `192.168.1.20`.
  - Mensaje: «ICMP · Echo Request» y «ICMP · Echo Reply».
- **Tarea:** que la laptop de Lucía conteste tu Echo Request.
- **Elecciones equivocadas:**
  - Un Echo Reply llega a la laptop de Lucía (sello ✓ de entregado), pero no vuelve nada. La inspección dice: «un Echo Reply es una respuesta, y nadie lo contesta».
  - Un ping a la impresora vuelve, pero no es lo pedido.
- **Pregunta de Lucía:** «¿por qué tu Echo Reply no volvió?»
  - ✓ Solo un Echo Request pide respuesta; un Echo Reply ya es la respuesta.
  - ✗ La laptop de Lucía estaba apagada. (El sello ✓ muestra que lo recibió.)
  - ✗ ICMP solo funciona con impresoras.

#### 01-03 · Desde afuera

- **Cambios del mundo:** aparecen el router de la oficina, internet y la casa de Lucía.
- **Pedido de Lucía:** «Esta tarde trabajo desde casa. ¿Podré hacerle ping a tu laptop?»
- **Fichas:**
  - Origen: tu laptop y casa de Lucía.
  - Destino: `192.168.1.10`, `192.168.1.11` y `192.168.1.20`.
  - Mensaje: «ICMP · Echo Request» y «ICMP · Echo Reply».
- **Tareas:**
  1. **Experimento:** haz ping desde la casa de Lucía a tu laptop. Se cumple al enviarlo, con cualquier resultado.
  2. **Contraste:** haz ping desde tu laptop a la laptop de Lucía. Se cumple si vuelve con respuesta.
- **Lo que se ve:** el ping que sale de la casa de Lucía viaja por internet y muere ahí, antes del router de la oficina. La razón: «internet no entrega paquetes a una IP privada; la misma IP se repite en muchas redes».
- **Simplificación:** la red de la casa de Lucía no se dibuja. Su casa es un actor en internet, como el atacante del capítulo 4.
- **Pregunta de Lucía:** «¿por qué no llegó desde mi casa?»
  - ✓ `192.168.1.10` es una IP privada: fuera de la oficina no significa nada, e internet no la entrega.
  - ✗ El router de la oficina lo bloqueó. (Murió antes de llegar al router.)
  - ✗ Mi laptop no sabe hacer ping desde casa.

#### 01-04 · El firewall

- **Cambios del mundo:** la laptop de Lucía recibe su firewall, sin reglas de entrada.
- **Pedido de Lucía:** «Hazme ping otra vez». El ping de tu laptop a la de Lucía es un flujo vivo, como en el capítulo 4, y ahora muere en el firewall.
- **Fichas, con las mismas bandejas que el capítulo 4 para que el puente se reconozca:**
  - Type: «ICMP · Echo Request» y «ICMP · Echo Reply».
  - Source: «tu laptop (192.168.1.10)» y «impresora (192.168.1.20)».
  - En el modelo, la Source es un CIDR `/32`. La etiqueta no lo muestra porque CIDR todavía no se conoce.
- **Tarea:** que tu ping a la laptop de Lucía vuelva con respuesta.
- **Solución de referencia:** ICMP · Echo Request ← tu laptop.
- **Abrir de más (pierde la estrella del medio, medida con la batería de sondas):**
  - Echo Request ← impresora;
  - una regla de Echo Reply.
- **Pregunta de Lucía:** «¿qué hizo el firewall con tu primer ping?»
  - ✓ Lo bloqueó: ninguna regla dejaba pasar ese tráfico.
  - ✗ Lo dejó pasar, pero mi laptop no contestó.
  - ✗ Bloqueó solo la respuesta.
- **El puente:** el texto final del 01-04 no puede nombrar el Security Group, porque es un término del capítulo 4. El puente lo hace el 04-01: «Security Group: un firewall virtual de una instancia EC2».

## Catálogo de entidades

Cada entidad tiene **una ficha de diseño** (esta sección) y **un componente propio**. Las variantes de una entidad comparten forma base y se distinguen por un detalle y por su nombre oficial. El diseño visual de cada forma se trabaja en el plan 2 con las skills de diseño. Este spec fija el formato de la ficha y sus límites.

### Formato de la ficha

1. **Concepto:** el término del registro y su definición.
2. **Forma:** cómo se ve en el mapa isométrico de papel y tinta, y la misma silueta en pequeño como ícono 2D (SVG de un color, `currentColor`).
3. **Variantes:** cada una con su nombre oficial y su término.
4. **Estados:** los que la pieza puede mostrar. La pieza no decide nada: recibe la variante y el estado por props.
5. **Etiqueta:** nombre oficial, con la definición al pasar el mouse.
6. **Movimiento:** la animación y su versión quieta para «Sin animaciones».
7. **Accesibilidad:** nunca solo color: forma más texto. La pieza tiene una etiqueta para el lector de pantalla.

**Límites para todas las fichas:**
- **Tinta y papel:** las líneas van en tinta (`--ink`) sobre papel (`--paper-fill`).
- **Bermellón:** el bermellón (`--accent`) es solo para el peligro: bloqueado, intruso y alerta.
- **Ícono:** la silueta del ícono 2D es la misma que la de la pieza del mapa.

### Fichas

| Entidad | Variantes → término | Hoy | Estados | Movimiento |
|---------|---------------------|-----|---------|------------|
| Red | red de la oficina → `network` · VPC → `vpc` | losa sin etiqueta (`Sheet`) | normal | ninguno |
| Dispositivo | laptop → `device` · impresora → `device` · instancia EC2 → `ec2-instance` | «edificio» (`Building`) | normal · con candado · seleccionado (tarjeta abierta) · alerta «!» · tiembla | tiembla cuando entra algo prohibido; quieto: borde doble |
| Firewall | firewall de la laptop → `firewall` · Security Group → `security-group` | barrera (`Barrier`) | con candado · configurable · seleccionado · bloqueó algo | destello al bloquear; quieto: marca fija |
| Salida a internet | router → `router` · Internet gateway → `internet-gateway` | arco (`Gateway`) | con candado | ninguno |
| Internet | internet → `internet` | no existe | normal | ninguno |
| Actor | casa de Lucía · Atacante (sin término: son personajes) | cubo negro (`ActorMark`) | normal | ninguno |
| Paquete | Echo Request → `echo-request` · Echo Reply → `echo-reply`; legítimo o intruso → `packet` | punto · rombo (`PacketRun`) | en viaje · llegó · bloqueado · perdido | viaja por el camino; bloqueado estalla; perdido se desvanece; quieto: trazo del recorrido |
| Sello | llegó ✓ · bloqueado ✕ · perdido · intruso (sin término: es un signo del juego) | sello redondo (`Stamp`) | los cuatro de la variante | ninguno |

Notas de diseño:
- **Echo Request y Echo Reply se distinguen a la vista.** Por ejemplo, punto lleno de ida y anillo de vuelta. En el 01-02 hay que poder ver que lo que volvió es otro mensaje.
- **El intruso se reconoce sin color:** se distingue por la forma (rombo).
- **«Perdido» es un estado nuevo** del paquete y del sello. Sirve para el destino que nadie tiene (01-01) y para lo que internet no entrega (01-03). Debe distinguirse de «bloqueado»: perderse no es lo mismo que un firewall que dice no.

### Dónde vive

- **Código:** en `src/scene/entities/`, un archivo por entidad: `network.tsx`, `device.tsx`, `firewall.tsx`, `edge.tsx`, `internet.tsx`, `actor.tsx`, `packet.tsx` y `stamp.tsx`, más `index.ts` y `CLAUDE.md`. Son 10 archivos, dentro del máximo de 12 por carpeta.
- **Pieza e ícono juntos:** cada archivo exporta la pieza del mapa y su ícono 2D. Así, una entidad es un solo archivo.
- **Lo que se mueve:** `pieces.tsx`, `traffic/packet-run.tsx` y `traffic/stamp.tsx` pasan al catálogo. `traffic/` conserva el horario y los recorridos, y dibuja con las entidades.
- **Íconos en la interfaz:** el ícono acompaña al término en el glosario de Lucía y en la cabecera de la caja de inspección. Cada término declara su entidad y su variante cuando tiene una; los que no tienen entidad, como mínimo privilegio, van sin ícono.
- **Página `/entidades`:** muestra cada entidad en todas sus variantes y estados, en una cuadrícula. No se enlaza desde el mapa del curso. Sirve para revisar el diseño y para una prueba de Playwright con captura, en modo «Sin animaciones» y con tamaño de ventana fijo.

## Modelo genérico (motor)

```ts
network = {
  kind: 'office' | 'vpc',
  cidr,                                // rango de la red
  region?, subnets?,                   // solo en la VPC
  devices: [{ id, name, kind: 'laptop' | 'printer' | 'ec2-instance',
              privateIp, publicIp?, subnetId?, firewallIds,
              host: { ignoreIcmpEcho, listeningTcpPorts }, appTarget? }],
  firewalls: [{ id, name, kind: 'host-firewall' | 'security-group',
                inbound, outbound }],
  edge: 'router' | 'internet-gateway',
  actors: [...],                       // afuera, en internet
}
```

- **Renombres:**
  - `instances` → `devices`, `securityGroups` → `firewalls`, `sgIds` → `firewallIds`, `linux` → `host`.
  - Las etapas `sg-in`/`sg-out` → `firewall-in`/`firewall-out`, y `linux` → `host`.
  - El endpoint `instance` → `device`.
  - El nombre interno sigue en inglés. Lo visible lo da la escalera.
- **Source de tipo Security Group:** el peer `sg` existe solo para firewalls de tipo `security-group`. El esquema rechaza un peer `sg` en un firewall de tipo `host-firewall`.
- **Validación de una red `office`:**
  - sin `region`, sin `subnets` y sin `publicIp`;
  - las IP de los dispositivos caen en su `cidr`;
  - el `cidr` es un rango de RFC 1918;
  - sus firewalls son de tipo `host-firewall`.
- **Dispositivos de la oficina hacia afuera:** el juego no modela la NAT de la oficina. El esquema del incidente rechaza un flujo o una combinación de fichas que mande un paquete de un dispositivo de la oficina a un destino fuera de ella.
- **Resultados nuevos del recorrido:**

| Caso | Resultado | Razón en `src/copy/reasons.ts` |
|------|-----------|--------------------------------|
| Desde adentro, a una IP de la red que no tiene ningún dispositivo | perdido en la red | «Ningún dispositivo de la red tiene esa IP: el paquete no llega a nadie.» |
| Desde internet, a una IP privada | perdido en internet | «Internet no entrega paquetes a una IP privada: la misma IP se repite en muchas redes.» |
| Echo Reply que llega a un dispositivo | llegó, sin vuelta | «Un Echo Reply es una respuesta: llegó, y nadie lo contesta.» |
| Un dispositivo a su propia IP | llegó y volvió, sin salir a la red | «Va a la propia IP del dispositivo: no sale a la red.» |
| Bloqueado por un firewall de tipo `host-firewall` | bloqueado | «Se queda en el firewall de X: ninguna regla lo deja entrar.» (X es el dispositivo, como en los motivos del Security Group) |

- **Capítulo 4 sin cambios visibles:**
  - Antes del refactor se guardan como referencia los recorridos de todos los flujos del 04-01 y el 04-02 y el resultado de la batería de sondas.
  - Un test exige que, después del refactor, sean idénticos.
- **Sondas:** la batería (`extraOpenings`) recorre `devices` en vez de `instances`. Sigue probando Echo Reply (tipo 0).

## Mecánica `send` (juego e interfaz)

### Contrato del incidente

El incidente gana un campo `mechanic`. Los campos comunes no cambian: `id`, `chapter`, `order`, `title`, `role`, `lesson`, `concept`, `introduces`, `base`/`changes`, `report`, `hints`, `explanation` y `takeaway`.

| `mechanic` | Campos propios |
|------------|----------------|
| `filter` | `flows` (mínimo 1), `chips: { what, from }`, tareas sobre flujos y `solution` con `placeRule`/`removeRule`. Es lo de hoy |
| `send` | `send: { from, to, message }`: fichas de origen (endpoint), destino (IP) y mensaje (ICMP tipo 8 o 0), cada lista con al menos una ficha. Tareas `{ id, text, expect: { fromId, toId, messageId, outcome: 'replied' \| 'any' } }`. `flows` solo de tipo `ambient` (puede estar vacía). `solution` con jugadas `sendPacket` |

Reglas nuevas del esquema para `send`:
- cada `expect` usa fichas que el incidente ofrece;
- la solución cumple todas las tareas cuando se reproduce: es el mismo test que hoy reproduce la de `filter`;
- ninguna combinación de fichas manda un paquete de la oficina hacia afuera.

### Sesión

- **Jugada `sendPacket { fromId, toId, messageId }`:**
  - arma el paquete con las fichas;
  - lo simula con `simulate`;
  - lo guarda en `sent`, donde manda el último envío de cada combinación.
- **Cuándo se cumple una tarea de envío:** cuando hay un paquete enviado con su combinación y su resultado es el esperado. `replied` significa que la respuesta volvió; `any` acepta cualquier resultado.
- **Envío de la solución:**
  - «Enviar solución» y el rechazo de Lucía funcionan como hoy.
  - El rechazo se borra con un envío nuevo, igual que hoy se borra con un cambio de regla.
- **Estrellas:**
  - El tipo `Stars` pasa a `{ closed, middle, explained }`.
  - En `filter`, `middle` es «sin abrir de más», como hoy. En `send`, `middle` es «sin pistas»: cerrar sin haber abierto ninguna pista.
  - El guardado sigue siendo un número de 0 a 3 por incidente.

### Interfaz

- **Tarjeta terminal** (`ui/incident/`): se abre junto al origen y tiene las bandejas que el incidente ofrece.
  - Línea de comando: `ping <IP>` para un Echo Request. Para un Echo Reply, «paquete armado a mano: ICMP · Echo Reply → <IP>».
  - Botón «Enviar». Se usa con clic y con teclado.
  - Las bandejas son las mismas que en la tarjeta de tarea: `jscpd` exige cero duplicados.
- **Mapa:** cada envío se anima una vez. El último de cada combinación deja su sello.
- **Inspección:**
  - El dispositivo muestra nombre, tipo, IP y firewalls.
  - El paquete muestra origen, destino, mensaje, dónde llegó o murió, y por qué.
  - La IP de los actores sigue oculta hasta el 04-05.
  - El campo «mensaje» del paquete aparece cuando se conoce `echo-request` (01-02). En el 01-01, el paquete se muestra como ping de ida o de vuelta, sin nombrar el mensaje.
- **Configurable:** `configurableParts` pasa a mirar el tipo de firewall. Las reglas de un `host-firewall` se configuran cuando se conoce `rule`, y las de un `security-group` cuando se conoce `inbound-rule`.

## Escalera de términos

### Términos nuevos del capítulo 1

Cada definición tiene 120 caracteres o menos y usa solo términos introducidos antes o en el mismo incidente.

| Incidente | id | Nombre | Definición | Fuente |
|-----------|----|--------|------------|--------|
| 01-01 | `device` | dispositivo | Un equipo que puede enviar y recibir datos: una laptop, una impresora, un servidor. | AWS What is computer networking |
| 01-01 | `network` | red | Un conjunto de dispositivos conectados entre sí que pueden intercambiar datos. | AWS What is computer networking |
| 01-01 | `ip-address` | dirección IP (corto: IP) | El número que identifica a un dispositivo dentro de una red, para que los datos lleguen a él. | Glosario AWS, RFC 791 |
| 01-01 | `ipv4` | IPv4 | La versión 4 de IP: sus direcciones son cuatro números de 0 a 255 separados por puntos, como 192.168.1.20. | AWS VPC IP addressing, RFC 791 |
| 01-01 | `packet` | paquete | Un bloque de datos que viaja por una red con la dirección IP de origen y la de destino. | MDN Packet, AWS What is routing |
| 01-01 | `ping` | ping | Un comando que manda un paquete a una dirección IP y espera que vuelva otro: prueba el camino de ida y vuelta. | AWS EC2 security group rules reference |
| 01-02 | `protocol` | protocolo | Un acuerdo entre dispositivos sobre cómo intercambiar datos: qué mensajes existen y qué significa cada uno. | AWS What is computer networking, MDN Protocol |
| 01-02 | `request` | solicitud | Un mensaje que le pide algo a otro dispositivo. | MDN HTTP overview |
| 01-02 | `response` | respuesta | El mensaje con que un dispositivo contesta una solicitud. | MDN HTTP overview |
| 01-02 | `icmp` | ICMP | Internet Control Message Protocol: el protocolo de los mensajes de control entre dispositivos, como los del ping. | AWS What is ICMP, RFC 792 |
| 01-02 | `echo-request` | Echo Request | La solicitud ICMP del ping (tipo 8): le pide al destino que conteste con un Echo Reply. | RFC 792, IANA |
| 01-02 | `echo-reply` | Echo Reply | La respuesta ICMP del ping (tipo 0). Solo se envía al recibir un Echo Request, y nadie la contesta. | RFC 792, RFC 1122 §3.2.2.6, IANA |
| 01-03 | `internet` | internet | La red mundial formada por muchas redes unidas entre sí. | MDN Internet |
| 01-03 | `router` | router | Un dispositivo que conecta redes y reenvía cada paquete según su dirección IP de destino. | AWS What is routing |
| 01-03 | `private-ip` | IP privada | Una dirección IPv4 de uso interno (10.x, 172.16–31.x, 192.168.x): se repite en muchas redes e internet no la entrega. | RFC 1918 §3, AWS EC2 instance addressing |
| 01-04 | `firewall` | firewall | Un sistema que revisa el tráfico de un dispositivo y solo deja pasar lo que permite una de sus reglas. | AWS What is network security, MDN Firewall |
| 01-04 | `traffic` | tráfico | Los paquetes que circulan por una red. | AWS lo usa sin definirlo (Security group rules) |
| 01-04 | `rule` | regla | Un permiso del firewall: dice qué tráfico puede pasar (Type) y desde dónde (Source). | AWS Security group rules |

- **Términos que ya existían y se redefinen:** `ping`, `icmp`, `echo-request`, `echo-reply` y `private-ip`. Su definición de hoy nombra términos del capítulo 4 (instancia, VPC) o del mismo capítulo 1 en un orden que ya no sirve.
- **El nombre oficial de ICMP:** contiene «Internet» antes de que se introduzca `internet` en el 01-03. Es el nombre oficial y no se cambia. La prueba de fugas nueva compara palabras completas sin distinguir mayúsculas, así que el nombre de ICMP queda como excepción declarada en el test.
- **La prueba de fugas:** hoy compara con `includes` (`src/levels/ladder.test.ts:25`). Con nombres cortos como «red», debe comparar palabras completas para no marcar falsos positivos, como «red» dentro de «Redshift».

### Cambios en el capítulo 4

- **04-01:** deja de introducir `private-ip`, `ping`, `icmp` y `echo-request`. Introduce `ec2-instance`, `vpc`, `security-group`, `inbound-rule`, `anywhere-ipv4` e `internet-gateway`.
- **04-02:** deja de introducir `echo-reply` e introduce `least-privilege`.
- **Spec anterior:** la tabla «Capítulo 4 (IaaS): la noche de guardia» del spec de incidentes en vivo se actualiza con estos cambios.

## Progreso y desbloqueo

- **Regla nueva de `isUnlocked`:** un incidente está abierto si es el primero, si el anterior tiene estrellas, o si él mismo ya tiene estrellas. Las estrellas que el estudiante ya tiene en el 04-01 y el 04-02 los dejan abiertos.
- **Capítulos 2 y 3:** no tienen incidentes y siguen como «próximamente». En el orden del curso, el 04-01 va justo después del 01-04.

## Entrega

Hay tres planes, en este orden. Cada uno termina con `npm run check` en verde.

1. **Modelo genérico.** Refactor de motor, niveles, vista y escena, sin cambios visibles. Primero se guardan los recorridos de referencia del capítulo 4.
2. **Catálogo de entidades.**
   - Las piezas pasan a `src/scene/entities/` con su ficha.
   - Llegan las entidades nuevas: laptop, impresora, router, internet, firewall de laptop, paquete Echo Reply y el estado «perdido».
   - Llegan los íconos 2D en el glosario y en la inspección, y la página `/entidades` con su captura.
3. **Capítulo 1.** Incluye:
   - el contrato `send`, la jugada, las tareas y la estrella «sin pistas»;
   - la tarjeta terminal;
   - los incidentes 01-01 a 01-04 con sus textos;
   - la escalera y la regla de progreso.

   Al final, el estudiante juega el capítulo completo y se itera.

## Tests y validación

- **Motor:**
  - un test por resultado nuevo: IP sin dispositivo, IP privada desde internet, Echo Reply que llega y ping a sí mismo;
  - el esquema rechaza un peer `sg` en un `host-firewall` y una red `office` con `publicIp`;
  - los recorridos del capítulo 4 son idénticos a los de referencia.
- **Niveles:**
  - el esquema valida los cuatro incidentes y las reglas nuevas de `send`;
  - la escalera rechaza una definición que use un término todavía no visto, comparando palabras completas;
  - el 04-01 ya no introduce `icmp` ni `ping`;
  - cada término nuevo cumple el límite de 120 caracteres.
- **Juego:**
  - `sendPacket` en el reducer, también el reenvío de la misma combinación;
  - las tareas `replied` y `any`;
  - `middle` según la mecánica;
  - un incidente con estrellas sigue abierto aunque el anterior no las tenga.
- **Interfaz:**
  - la tarjeta terminal arma `ping <IP>` y la línea de Echo Reply;
  - se usa con clic y con teclado;
  - los íconos aparecen en el glosario.
- **Playwright:**
  - se juega del 01-01 al 01-04 entero;
  - el 04-01 sigue abierto con estrellas guardadas;
  - la captura de `/entidades` no cambia sin querer.

## Fuera de alcance

- Conceptos que esperan a su incidente: IP pública, NAT de la oficina, DNS, puertos, TCP, UDP, cliente/servidor y stateless.
- ARP (simplificación declarada arriba).
- Los capítulos 2 y 3.
- El inventario y arrastrar y soltar.

## Riesgos

- **Capturas de WebGL:** pueden variar entre máquinas. Se fijan el modo quieto, el tamaño de ventana y la densidad de píxeles, con una tolerancia pequeña. Si aun así fallan sin motivo, la prueba pasa a comparar la estructura de la página en vez de los píxeles.
- **Tamaño del refactor:** el plan 1 toca casi todas las capas. Lo protege la prueba de recorridos de referencia.
- **Nombres dentro de los motivos:** los motivos arman «el firewall de <nombre>». Los nombres de la oficina deben leerse bien ahí: «el firewall de la laptop de Lucía», no «de laptop de Lucía». El plan 3 elige el nombre de cada dispositivo con eso en mente.
- **Primer día lento:** cuatro incidentes antes del capítulo 4 pueden sentirse lentos. La prueba humana del plan 3 decide si alguno se fusiona.
