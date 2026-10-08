export const ROADMAP_TEXT = {
  title: 'Sigue el paquete',
  lede: 'Un capítulo por módulo del curso. Cada incidente repasa una lección jugando.',
  soon: 'Próximamente',
  locked: '(bloqueado)',
  starsOf: (count: number) => `${count} de 3 estrellas`,
  role: { defender: 'Defensor', attacker: 'Atacante' },
} as const;

export const NOT_FOUND_TEXT = {
  title: 'Nivel no encontrado',
  body: (levelId: string) => `No existe el nivel ${levelId}.`,
  back: 'Volver al roadmap',
} as const;
