import { useEffect, useState } from 'react';
import type { SentRun } from '@/scene/map2d/overlay/map-stamps';

interface Entry {
  run: SentRun;
  endsAt: number;
  over: boolean;
}

interface Ledger {
  entries: readonly Entry[];
  newest: ReadonlyMap<string, number>;
}

const MS_PER_SECOND = 1000;
const NOTHING_SENT: Ledger = { entries: [], newest: new Map() };

/** Takes a run the player sent; returns the key of its flight: its combination of chips and its send number, so two sends of one combination are two flights. */
export function flightKeyOf({ id, send }: SentRun): string {
  return `send:${id}:${send}`;
}

function arrived(ledger: Ledger, sent: readonly SentRun[], now: number, secondsOf: (run: SentRun) => number): Ledger {
  const stands = new Set(sent.map(flightKeyOf));
  const ids = new Set(sent.map(({ id }) => id));
  const kept = ledger.entries.filter(({ run, over }) => ids.has(run.id) && !(over && !stands.has(flightKeyOf(run))));
  const fresh = sent.filter(({ id, send }) => send > (ledger.newest.get(id) ?? 0));
  if (fresh.length === 0 && kept.length === ledger.entries.length) return ledger;
  const entries = fresh.map((run): Entry => ({ run, endsAt: now + secondsOf(run) * MS_PER_SECOND, over: false }));
  return { entries: [...kept, ...entries], newest: new Map([...ledger.newest, ...fresh.map(({ id, send }): [string, number] => [id, send])]) };
}

function finishedBy(ledger: Ledger, deadline: number): Ledger {
  return { ...ledger, entries: ledger.entries.map((entry) => (entry.endsAt <= deadline ? { ...entry, over: true } : entry)) };
}

function inFlight(ledger: Ledger, sent: readonly SentRun[]): SentRun[] {
  const current = new Map(sent.map((run) => [flightKeyOf(run), run]));
  const ids = new Set(sent.map(({ id }) => id));
  const recorded = ledger.entries.flatMap(({ run, over }) => current.get(flightKeyOf(run)) ?? (over || !ids.has(run.id) ? [] : [run]));
  const known = new Set(ledger.entries.map(({ run }) => flightKeyOf(run)));
  return [...recorded, ...sent.filter((run) => !known.has(flightKeyOf(run)))];
}

/** Takes the runs the player sent (the last of each combination of chips, as the session keeps them) and the seconds a run is on the map; returns the runs to draw in flight: those of `sent` and, besides, each earlier send of a combination that a newer send has replaced, until its own trip ends (`secondsOf` after it was first seen, on a timer), as the 3D map keeps one packet for each send. They come in the order they first stood, so a flight never changes place among the others when a new one joins or an old one goes, and an earlier send keeps the run it left with. A combination that leaves `sent` takes its flights with it, and a send that has ended while it is still the last of its combination stays in the list, finished and invisible, as before. */
export function useSendsInFlight(sent: readonly SentRun[], secondsOf: (run: SentRun) => number): SentRun[] {
  const [ledger, setLedger] = useState(NOTHING_SENT);

  useEffect(() => {
    const now = Date.now();
    setLedger((current) => arrived(current, sent, now, secondsOf));
  }, [sent, secondsOf]);

  useEffect(() => {
    const pending = ledger.entries.filter(({ over }) => !over).map(({ endsAt }) => endsAt);
    if (pending.length === 0) return;
    const deadline = Math.min(...pending);
    const timer = setTimeout(() => setLedger((current) => finishedBy(current, deadline)), Math.max(0, deadline - Date.now()));
    return () => clearTimeout(timer);
  }, [ledger]);

  return inFlight(ledger, sent);
}
