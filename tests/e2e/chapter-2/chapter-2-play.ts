import type { Page } from '@playwright/test';
import { openTerminal, sendMessage } from '@e2e/cards';
import { submitAndFinish } from '@e2e/closing';
import type { PlayedIncident } from '@e2e/chapter-1/chapter-1-play';

export const NC_TO_THE_APP = 'nc · puerto 3000';
export const NC_TO_THE_DATABASE = 'nc · puerto 5432';

async function playOneMachineManyServices(page: Page) {
  const terminal = await openTerminal(page);
  await sendMessage(terminal, 'ping');
  await sendMessage(terminal, NC_TO_THE_APP);
  await sendMessage(terminal, NC_TO_THE_DATABASE);
  await submitAndFinish(page, /no al servicio: la app escucha en un puerto/);
}

async function playOpeningAConnection(page: Page) {
  const terminal = await openTerminal(page);
  await sendMessage(terminal, NC_TO_THE_APP);
  await sendMessage(terminal, NC_TO_THE_DATABASE);
  await submitAndFinish(page, /Al puerto de origen que eligió tu-laptop/);
}

/** How each incident of chapter 2 is played with the mouse, in game order. Each content task adds the incident it builds: its title as the roadmap shows it and the moves that earn the stars. */
export const CHAPTER_2: PlayedIncident[] = [
  { id: '02-01', title: 'Un equipo, muchos servicios', play: playOneMachineManyServices },
  { id: '02-02', title: 'Abrir una conexión', play: playOpeningAConnection },
];

/** The id of the last incident of chapter 2 that is built: while chapter 2 is incomplete it is the one right before 04-01 in game order, so the one whose star opens 04-01. */
export const LAST_BUILT_OF_CHAPTER_2: string = CHAPTER_2[CHAPTER_2.length - 1].id;
