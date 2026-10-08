# Sigue el paquete: juego de redes en AWS

Fecha: 2026-10-07 · Estado: diseño aprobado por secciones, pendiente de revisión del documento

## Propósito

Juego para **estudiar**: repasar jugando lo aprendido en el curso, empezando por el lab 03 (conectividad entre instancias EC2 con `ping`). No es una pieza de portafolio; importa que enseñe bien.

Lo que más costó en el lab 03, y que el juego tiene que hacer visible:

1. Mezclar el **qué** de una regla (protocolo, puerto, tipo ICMP) con el **desde dónde** (origen).
2. Mirar la **salida** cuando decide la **entrada del destino**.
3. No saber **dónde murió** el paquete (lo resolvió `tcpdump`).

Los tres tienen la misma causa: no ver el camino del paquete. El juego lo muestra.

## Decisiones

| Tema | Decisión | Descartado y por qué |
|------|----------|----------------------|
| Dinámica | **Sigue el paquete**: un paquete a la vez; predices dónde muere, lo ves viajar, arreglas | *Brote* (virus): agrega una metáfora que hay que traducir; la idea útil (radio de impacto) se hará más adelante con paquetes reales. *Defensa* con reloj: premia reflejos, no comprensión. Contrato de conexiones, guardia de incidentes y duelo por turnos: posibles tipos de nivel futuros |
| Roles | **Cada nivel declara su rol**: defensor o atacante | Jugar cada nivel dos veces (no todo tema tiene ataque con sentido); dos campañas (más contenido que mantener) |
| Estructura | **Capítulos = los 20 módulos de `syllabus.md`** | — |
| Stack | **Vite + TypeScript + React + React Three Fiber** (+ drei) | Three.js puro con DOM a mano: la interfaz (editor de reglas, paneles) se enreda al crecer |
| Arte | **Papel y tinta**, minimalista | Estilo *Rise of Industry* (probado y descartado por el estudiante); diorama; plano técnico |
| Cámara | **Isométrica fija**, con zoom y desplazamiento | Giro en 4 posiciones: obliga a que la distribución y las etiquetas funcionen desde 4 ángulos |
| Alcance v1 | **Capítulo 4, 7 niveles de Security Groups** | NACL (el estudiante aún no hizo el nivel 3 del lab: el juego le daría las respuestas); V7 (exige simular el tiempo) |

## Ubicación

`projects/follow-the-packet/` (nombre de carpeta en inglés, según las convenciones del repo; en pantalla el juego se llama "Sigue el paquete"). Lleva su propio `README.md` con cómo correrlo.

## Arquitectura

```
projects/follow-the-packet/
├── index.html, package.json, vite.config.ts, tsconfig.json, README.md
├── src/
│   ├── engine/            TS puro: sin React ni Three.js
│   │   ├── types.ts         red, instancias, SGs, reglas, actores, paquete, recorrido
│   │   ├── simulate.ts      simulate(red, paquete) → recorrido
│   │   ├── stages/          una etapa por archivo (dns, route, sg-out, sg-in, os, reply)
│   │   ├── rules.ts         coincidencia de una regla → { what: boolean, from: boolean }
│   │   ├── dns.ts           nombre → IP según desde dónde se pregunta
│   │   ├── cidr.ts          utilidades de IPs y rangos
│   │   ├── exposure.ts      batería de sondas para "no abrir de más"
│   │   └── scoring.ts       estrellas
│   ├── levels/
│   │   ├── types.ts         contrato del nivel (esquema zod + tipo TS derivado)
│   │   ├── chapters.ts      los 20 módulos del pensum
│   │   ├── registry.ts      carga todos los niveles con import.meta.glob
│   │   └── 04-iaas/
│   │       ├── 01-where-ping-dies.ts … 07-default-club.ts
│   ├── game/              estado de la partida (reducer puro): brief → predecir → actuar → lanzar → resultado
│   ├── scene/             React Three Fiber: hoja, piezas, distribución automática, animación del recorrido
│   ├── ui/
│   │   ├── shared/          roadmap, brief, predicción, resultado, pistas, recorrido en texto
│   │   ├── defender/        editor de reglas
│   │   └── attacker/        panel de ataque y sondas
│   └── storage/           progreso en localStorage
└── tests/
    └── e2e/               Playwright
```

Los tests unitarios viven junto a cada archivo (`*.test.ts`).

**Flujo de datos:** nivel (datos) → `game` (estado) → acción del jugador → `engine.simulate` → recorrido → `scene` anima el recorrido y `ui` lo muestra en texto.

**Reglas de diseño:**

- `engine` no conoce React ni Three.js.
- Agregar un nivel = crear un archivo en `levels/<capítulo>/`. Nada más.
- Agregar un capítulo que necesite otra mecánica de red = agregar etapas en `engine/stages/` (por ejemplo, NACL: salida de la subred de origen y entrada de la subred de destino).

## Capítulos y niveles

- `chapters.ts` lista los 20 módulos con número y título; un test exige que coincidan con los encabezados `## N. Título` de `syllabus.md`.
- **Roadmap:** los 20 capítulos en orden. Con niveles: avance y estrellas. Sin niveles: "próximamente", en gris.
- **Desbloqueo:** dentro de un capítulo, secuencial. Los capítulos están todos abiertos (los niveles se agregan después de estudiar el tema, así que no adelantan nada).
- Cada nivel cita **el texto exacto** de su lección en `syllabus.md` y enlaza su nota de concepto.

### Capítulo 4 (IaaS), versión 1

| # | Archivo | Nivel | Rol | Idea | Del lab 03 |
|---|---------|-------|-----|------|------------|
| 1 | `01-where-ping-dies.ts` | ¿Dónde muere el `ping`? | Defensor | El SG solo permite; una regla es qué + desde dónde | Pasos 3-5 |
| 2 | `02-open-just-enough.ts` | Abre lo justo | Defensor | Lo que entra es el Echo Request; mínimo privilegio | Paso 4, V5 |
| 3 | `03-the-way-back.ts` | El camino de vuelta | Defensor | Stateful: la respuesta vuelve sola; iniciar en sentido contrario es otra conversación | V1 |
| 4 | `04-too-wide.ts` | El rango demasiado ancho | Atacante | Controlas un servidor de la VPC; la regla permite toda la VPC (`172.31.0.0/16`); entras por IP privada | Elección de origen del paso 4 |
| 5 | `05-public-ip-and-name.ts` | La IP pública y el nombre | Defensor | La app falla por apuntar a la IP pública; se arregla apuntando a la IP privada o al nombre DNS, no tocando el SG | V2, V3 |
| 6 | `06-doorman-or-owner.ts` | ¿Portero o dueño? | Defensor | "servidor2 está caído": con `tcpdump` se ve que llega y Linux no responde; no está caído | V4, V6 |
| 7 | `07-default-club.ts` | El club `default` | Atacante | De dos servidores comprometidos, solo el que está en el SG `default` llega al blanco que también lo está | V8 |

Lección citada por todos: `Lab: Comprobación de Conectividad entre Instancias EC2 usando PING`. Nota: `concepts/security-groups.md`.

## Contrato del nivel

Esquema zod en `levels/types.ts`; el tipo TS se deriva del esquema. Campos:

| Campo | Qué es |
|-------|--------|
| `id`, `chapter`, `order`, `title` | Identidad. `id` = `"04-01"` |
| `role` | `"defender"` o `"attacker"` |
| `lesson`, `concept` | Texto exacto de la lección en `syllabus.md`; ruta de la nota de concepto |
| `brief` | Una o dos frases, lenguaje simple |
| `network` | Estado inicial: VPC, subredes, instancias, SGs, flags de Linux, destinos de las apps, actores externos |
| `objective` | Defensor: `mustPass[]` y `mustBlock[]` (paquetes). Atacante: blanco (instancia + protocolo + puerto), orígenes y destinos disponibles, intentos máximos para la 2.ª estrella |
| `editable` | Qué puede tocar el jugador y qué opciones ofrecen los menús |
| `tools` | Subconjunto de `tcpdump`, `getent`, `rules` |
| `prediction` | Paquete, puntos candidatos y respuesta correcta |
| `hints` | Dos pistas en escalera |
| `solution` | Acciones de referencia (para los tests) |
| `takeaway` | "Lo que te llevas": una sola idea |

**Acciones del jugador:** agregar, editar y borrar reglas; asociar y quitar un SG a una instancia; cambiar el destino al que apunta una app; cambiar un flag de Linux (`icmp_echo_ignore_all`); elegir diagnóstico; componer y lanzar un ataque.

## Motor de simulación

TS puro y determinista.

**Modelo:** VPC (CIDR), subredes (AZ, CIDR), instancias (IP privada, IP pública opcional, nombres DNS público y privado, SGs, flags de Linux, puertos con programa escuchando, destinos de sus apps), SGs (reglas de entrada y salida; regla = qué + desde dónde, donde el origen es un CIDR o un SG), actores externos (tu Mac, atacante) con su IP.

**`simulate(network, packet)`** recorre etapas en orden; cada una añade un paso al recorrido con veredicto (`pass`, `drop`, `reject`, `info`) y motivo:

1. **DNS:** resuelve nombres; desde dentro de la VPC, el nombre público da la IP privada; desde fuera, la pública.
2. **Ruta:** IP privada desde fuera de la VPC → sin camino (timeout). IP pública → sale por el internet gateway; el origen cambia a la IP pública del emisor (NAT).
3. **SG de salida** del origen (si es una instancia).
4. **SG de entrada** del destino: unión de todos sus SGs; para cada regla, `what` y `from`. Un SG como origen solo coincide si el paquete viaja por IP privada dentro de la VPC.
5. **Linux del destino:** ignora el `ping` (llega sin respuesta), nada escucha en el puerto TCP (`refused`) o acepta.
6. **Vuelta:** la respuesta pasa por stateful; el paso lo dice.

**Resultado:** recorrido + final (`replied`, `timeout`, `refused`, `arrived-no-reply`) + lo que vería `tcpdump` en cada instancia (líneas `In`/`Out`).

**"No abrir de más" (defensor):** batería fija de sondas (desde internet, desde tu Mac, desde cada otra instancia; ICMP echo, TCP 22, 80, 443, 3306, 5432; UDP 53). Cada sonda que llega y no está en `mustPass` es una apertura de más.

**Estrellas:**

- Defensor: objetivo cumplido · sin aperturas de más · predicción acertada.
- Atacante: objetivo cumplido · en el número máximo de intentos del nivel o menos · predicción acertada.

**Fuera de v1:** tiempo y conexiones ya rastreadas (V7), NACL, IPv6.

**Base factual** (cada test del motor la cita):

- Comportamiento observado en la cuenta del estudiante en el lab 03 (`labs/03-ping-connectivity/README.md`, tabla de experimentos, 2026-10-07).
- Security group rules: <https://docs.aws.amazon.com/vpc/latest/userguide/security-group-rules.html> (consultada el 2026-10-06).
- Connection tracking: <https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/security-group-connection-tracking.html> (consultada el 2026-10-07): ICMP siempre se rastrea; cambiar una regla no corta conexiones rastreadas.

## Escena y arte: papel y tinta

- **Cámara:** ortográfica isométrica fija; zoom y desplazamiento; sin giro.
- **Aspecto:** papel cálido con grano sutil; rellenos claros y trazo de tinta con grosor real (`Line2`/`LineSegments2` de Three.js); sombras de contacto suaves.
- **Color:** tinta y papel + un acento bermellón. Paquete legítimo bermellón; atacante negro tinta. Resultado con **sellos** ✓ / ✕ (no depende del color).
- **Piezas:** VPC = hoja base; subred = zona de borde punteado con su AZ; instancia = bloque; SG = barrera delante de cada instancia; internet gateway = arco en el borde; tu Mac y el atacante = marcas fuera de la hoja.
- **Distribución automática:** columna por AZ, internet al fondo; caminos y barreras siempre delante de los edificios vistos desde la cámara. El nivel puede sobrescribir posiciones solo si hace falta.
- **Animación del recorrido:** DNS = nota "nombre → IP"; NAT = sello "origen → IP pública" en el arco; SG = la barrera muestra la lista del guardia con qué ✓/✗ y desde dónde ✓/✗; Linux = la puerta del edificio.
- **Textos:** etiquetas HTML sobre el 3D (drei `Html`), nítidas a cualquier zoom.

## Interfaz y flujo

- **Tipografía:** Newsreader (títulos), IBM Plex Sans (texto), IBM Plex Mono (IPs, comandos y reglas). Paneles = tarjetas de papel con borde de tinta.
- **Roadmap** → **nivel** en 4 fases fijas → **resultado**:
  1. *Brief:* rol, objetivo, lección del pensum.
  2. *Predecir:* clic en un punto candidato del camino.
  3. *Actuar:* defensor edita reglas; atacante arma el ataque; herramientas si el nivel las da. Los menús solo ofrecen lo que el nivel permite.
  4. *Lanzar:* el paquete viaja, aparecen los sellos y el recorrido en texto.
- **Resultado:** 3 estrellas; "Lo que te llevas" (una idea) con enlace a la nota de concepto; si falla, pista 1 → pista 2 → solución.
- Editar y relanzar sin límite; la predicción cuenta solo en el primer envío.
- Textos cortos, una idea por pantalla, sin términos sin definir.
- Accesibilidad: todo con teclado; sellos que no dependen del color; opción para saltar animaciones.
- Escritorio primero (Mac); móvil fuera de v1.
- Progreso (estrellas y niveles completados) en `localStorage`.

## Tests y validación

"Listo" = `npm run check` pasó entero: `tsc --noEmit`, ESLint, Vitest y Playwright.

1. **Motor (Vitest):** un test por comportamiento, citando el experimento del lab 03: unión de SGs y solo permitir; qué + desde dónde (paso 3); Echo Request tipo 8 frente a Echo Reply tipo 0 (V5); stateful (V1); NAT por la IP pública y SG como origen que deja de coincidir (V2); DNS según desde dónde (V3); Linux que ignora (V6); `refused` sin programa escuchando; SG `default` solo para sus miembros (V8); IP privada desde fuera = timeout.
2. **Por nivel (automáticos para cada archivo de `levels/`):** el esquema zod valida; el estado inicial no cumple el objetivo; la solución de referencia lo cumple con 3 estrellas; la respuesta de la predicción coincide con el motor; la lección existe en `syllabus.md` y la nota de concepto existe; `chapters.ts` coincide con `syllabus.md`.
3. **Interfaz (Testing Library):** el editor de reglas y el panel de ataque producen los datos correctos; las fases avanzan en orden (reducer puro).
4. **Partida completa (Playwright):** jugar el nivel 1 de punta a punta hasta 3 estrellas; el progreso sobrevive a recargar; cada nivel carga sin errores de consola; captura de cada nivel para revisión manual (sin comparación píxel a píxel).

## Escalar

- **Nivel nuevo:** un archivo en `levels/<NN-capítulo>/`; los tests por nivel lo validan solos.
- **Mecánica nueva** (NACL, V7, radio de impacto): etapas nuevas en `engine/stages/` y sus tests; los niveles existentes no cambian.
- **Próximos candidatos:** NACL (después del nivel 3 del lab 03), borrar una regla con el `ping` corriendo (V7), radio de impacto desde un servidor comprometido.
