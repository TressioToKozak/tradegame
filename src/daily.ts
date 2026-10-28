import type { State } from "./engine";
import { earn } from "./progression";
export type DailyKind = "inspect" | "list" | "deliver";
export interface DailyState {
  day: string;
  completed: Record<DailyKind, string[]>;
  claimed: DailyKind[];
}
export const dailyGoals = [
  {
    id: "inspect" as const,
    title: "Odbierz nową zdobycz",
    detail: "Skontroluj jedną butelkę.",
    target: 1,
    xp: 15,
    tab: "Magazyn",
  },
  {
    id: "list" as const,
    title: "Pokaż kolekcję światu",
    detail: "Wystaw jeden egzemplarz.",
    target: 1,
    xp: 20,
    tab: "Magazyn",
  },
  {
    id: "deliver" as const,
    title: "Zdobądź zaufanie",
    detail: "Doręcz zamówienie bez reklamacji.",
    target: 1,
    xp: 35,
    tab: "Zamówienia",
  },
];
const formatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Amsterdam",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
export const dailyKey = (at: number) => formatter.format(at);
export function daily(s: State): DailyState {
  const day = dailyKey(s.now);
  if (!s.daily || s.daily.day !== day)
    s.daily = {
      day,
      completed: { inspect: [], list: [], deliver: [] },
      claimed: [],
    };
  return s.daily;
}
export function recordDaily(s: State, kind: DailyKind, id: string) {
  const d = daily(s);
  if (!d.completed[kind].includes(id)) d.completed[kind].push(id);
}
export function claimDaily(s: State, kind: DailyKind) {
  const d = daily(s),
    goal = dailyGoals.find((g) => g.id === kind);
  if (!goal || d.completed[kind].length < goal.target)
    return "Cel nie jest jeszcze ukończony.";
  if (d.claimed.includes(kind)) return "Nagroda została już odebrana.";
  d.claimed.push(kind);
  earn(s, `daily:${d.day}:${kind}`, goal.xp);
  s.feed.unshift({
    at: s.now,
    text: `Cel dnia ukończony: ${goal.title}. +${goal.xp} PD.`,
  });
  return `Cel ukończony • +${goal.xp} PD`;
}
