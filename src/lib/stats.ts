import { addDays, startOfWeek, subWeeks } from "date-fns";
import type { EveningCheckin, Habit, MorningCheckin } from "./types";
import { lastNKeysIncludingToday, toKey, todayKey } from "./dates";

export function activeHabits(habits: Habit[]) {
  return habits.filter((h) => !h.paused);
}

export function coreHabits(habits: Habit[]) {
  return activeHabits(habits)
    .filter((h) => h.tier === "core")
    .sort((a, b) => a.rank - b.rank);
}

export function secondaryHabits(habits: Habit[]) {
  return activeHabits(habits)
    .filter((h) => h.tier === "secondary")
    .sort((a, b) => a.rank - b.rank);
}

export function sortedHabits(habits: Habit[]) {
  return [...habits].sort((a, b) => {
    if (a.paused !== b.paused) return a.paused ? 1 : -1;
    if (a.tier !== b.tier) return a.tier === "core" ? -1 : 1;
    return a.rank - b.rank;
  });
}

export interface DayScore {
  date: string;
  committed: number;
  done: number;
  coreCommitted: number;
  coreDone: number;
  closed: boolean;
  ratio: number | null;
  coreRatio: number | null;
}

export function scoreDay(
  date: string,
  habits: Habit[],
  mornings: Record<string, MorningCheckin>,
  evenings: Record<string, EveningCheckin>,
  startedAt: string | null,
): DayScore {
  const empty: DayScore = {
    date,
    committed: 0,
    done: 0,
    coreCommitted: 0,
    coreDone: 0,
    closed: false,
    ratio: null,
    coreRatio: null,
  };
  if (startedAt && date < startedAt) return empty;

  const morning = mornings[date];
  const evening = evenings[date];
  const habitById = new Map(habits.map((h) => [h.id, h]));
  const focusIds = morning?.habitIds ?? [];
  const coreIds = habits
    .filter((h) => h.tier === "core" && !h.paused && h.createdAt.slice(0, 10) <= date)
    .map((h) => h.id);

  const committedIds = focusIds.filter((id) => habitById.has(id));
  const coreInFocus = committedIds.filter((id) => habitById.get(id)?.tier === "core");

  if (!evening) {
    const isPast = date < todayKey();
    if (!morning && !isPast) return empty;
    if (isPast && (morning || coreIds.length > 0)) {
      const coreCommitted = morning ? coreInFocus.length : coreIds.length;
      return {
        date,
        committed: morning ? committedIds.length : coreIds.length,
        done: 0,
        coreCommitted,
        coreDone: 0,
        closed: false,
        ratio: (morning ? committedIds.length : coreIds.length) > 0 ? 0 : null,
        coreRatio: coreCommitted > 0 ? 0 : null,
      };
    }
    return empty;
  }

  const done = committedIds.filter((id) => evening.results[id]).length;
  const coreDone = coreInFocus.filter((id) => evening.results[id]).length;
  const committed = committedIds.length;
  const coreCommitted = coreInFocus.length;

  return {
    date,
    committed,
    done,
    coreCommitted,
    coreDone,
    closed: true,
    ratio: committed > 0 ? done / committed : null,
    coreRatio: coreCommitted > 0 ? coreDone / coreCommitted : null,
  };
}

export function windowScores(
  days: number,
  habits: Habit[],
  mornings: Record<string, MorningCheckin>,
  evenings: Record<string, EveningCheckin>,
  startedAt: string | null,
  includeToday = false,
) {
  const keys = includeToday
    ? lastNKeysIncludingToday(days)
    : lastNKeysIncludingToday(days + 1).slice(0, -1);
  return keys.map((date) => scoreDay(date, habits, mornings, evenings, startedAt));
}

export function respectPercent(scores: DayScore[], kind: "core" | "focus") {
  const usable = scores.filter((s) =>
    kind === "core" ? s.coreRatio !== null : s.ratio !== null,
  );
  if (usable.length === 0) return null;
  const total = usable.reduce((acc, s) => {
    if (kind === "core") return acc + (s.coreDone / Math.max(1, s.coreCommitted));
    return acc + (s.done / Math.max(1, s.committed));
  }, 0);
  return Math.round((total / usable.length) * 100);
}

export function heldDays(scores: DayScore[]) {
  const usable = scores.filter((s) => s.coreRatio !== null);
  const held = usable.filter((s) => s.coreRatio === 1).length;
  return { held, total: usable.length };
}

export function habitDots(
  habitId: string,
  days: number,
  evenings: Record<string, EveningCheckin>,
  mornings: Record<string, MorningCheckin>,
) {
  const keys = lastNKeysIncludingToday(days);
  return keys.map((date) => {
    const committed = mornings[date]?.habitIds.includes(habitId) ?? false;
    const evening = evenings[date];
    if (!committed) return { date, state: "idle" as const };
    if (!evening) return { date, state: date < todayKey() ? ("miss" as const) : ("pending" as const) };
    return { date, state: evening.results[habitId] ? ("done" as const) : ("miss" as const) };
  });
}

export function heatmapCells(
  weeks: number,
  habits: Habit[],
  mornings: Record<string, MorningCheckin>,
  evenings: Record<string, EveningCheckin>,
  startedAt: string | null,
) {
  const today = new Date();
  const todayK = todayKey(today);
  const thisMonday = startOfWeek(today, { weekStartsOn: 1 });
  const gridStart = subWeeks(thisMonday, weeks - 1);
  const cells: { date: string; inFuture: boolean; score: DayScore }[] = [];
  for (let i = 0; i < weeks * 7; i++) {
    const date = toKey(addDays(gridStart, i));
    cells.push({
      date,
      inFuture: date > todayK,
      score: scoreDay(date, habits, mornings, evenings, startedAt),
    });
  }
  return cells;
}

export function heatLevel(ratio: number | null, inFuture: boolean, hasData: boolean) {
  if (inFuture || !hasData) return 0;
  if (ratio === null) return 0;
  if (ratio === 0) return 1;
  if (ratio < 0.5) return 2;
  if (ratio < 1) return 3;
  return 4;
}
