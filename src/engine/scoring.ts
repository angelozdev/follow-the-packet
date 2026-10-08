export interface Stars {
  objective: boolean;
  tight: boolean;
  prediction: boolean;
  count: 0 | 1 | 2 | 3;
}

/** Defensor: tight = no abrir de más. Atacante: tight = en los intentos máximos o menos. */
export function scoreStars(objective: boolean, tight: boolean, prediction: boolean): Stars {
  const count = objective ? ((1 + Number(tight) + Number(prediction)) as 1 | 2 | 3) : 0;
  return { objective, tight, prediction, count };
}
