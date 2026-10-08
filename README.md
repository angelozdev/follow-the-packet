# Sigue el paquete

Juego para estudiar redes en AWS: predices dónde muere un paquete, lo ves viajar y arreglas (o atacas) la configuración. Un capítulo por módulo del curso; el capítulo 4 tiene 7 niveles de Security Groups basados en el [lab 03](../../labs/03-ping-connectivity/README.md).

Diseño: [spec](../../docs/specs/2026-10-07-follow-the-packet-design.md) · Plan: [plan](../../docs/plans/2026-10-07-follow-the-packet.md)

## Correr

```bash
npm install
npx playwright install chromium
npm run dev
```

## Validar

```bash
npm run check
```

Corre tipos, lint, tests unitarios y Playwright. "Listo" significa que pasó entero.

## Agregar un nivel

1. Crea `src/levels/NN-<capítulo>/NN-<slug>.ts` con `export default defineLevel({...})`. Usa un nivel existente como modelo.
2. `lesson` debe ser el texto exacto de su lección en `syllabus.md`, y `concept` una nota que exista en `concepts/`.
3. Corre `npm test`: los tests por nivel comprueban que arranca roto, que la solución gana con 3 estrellas, que la predicción coincide con el motor y que la solución solo usa opciones del nivel.
