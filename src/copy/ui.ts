export const ROADMAP_TEXT = {
  title: 'Sigue el paquete',
  lede: 'Un capítulo por módulo del curso. Cada incidente repasa una lección jugando.',
  soon: 'Próximamente',
  locked: '(bloqueado)',
  starsOf: (count: number) => `${count} de 3 estrellas`,
  role: { defender: 'Defensor', attacker: 'Atacante' },
} as const;

export const NOTICE_TEXT = {
  notFound: { title: 'Incidente no encontrado', body: (id: string) => `No existe el incidente ${id}.` },
  locked: { title: 'Incidente bloqueado', body: (id: string) => `Para abrir el ${id}, termina antes los incidentes anteriores.` },
  back: 'Volver al roadmap',
} as const;
