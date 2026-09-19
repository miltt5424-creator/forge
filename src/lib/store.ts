import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  EveningCheckin,
  FailureProtocol,
  ForgeData,
  Habit,
  HabitCategory,
  HabitTier,
  MorningCheckin,
  WeeklyReview,
} from "./types";
import { MAX_CORE } from "./types";
import { currentWeekStart, todayKey } from "./dates";
import { exampleForge } from "./seed";
import { uid } from "./utils";

const empty: ForgeData = {
  onboardingComplete: false,
  startedAt: null,
  identity: "",
  identityUpdatedAt: null,
  habits: [],
  mornings: {},
  evenings: {},
  failures: [],
  reviews: {},
};

interface ForgeStore extends ForgeData {
  completeOnboarding: (identity: string, first?: Omit<Habit, "id" | "createdAt" | "rank" | "paused">) => void;
  loadExample: () => void;
  setIdentity: (identity: string) => void;
  addHabit: (input: {
    rule: string;
    why: string;
    tier: HabitTier;
    category: HabitCategory;
  }) => { ok: true; id: string } | { ok: false; error: string };
  updateHabit: (
    id: string,
    patch: Partial<Pick<Habit, "rule" | "why" | "tier" | "category" | "paused">>,
  ) => { ok: true } | { ok: false; error: string };
  removeHabit: (id: string) => void;
  moveHabit: (id: string, dir: -1 | 1) => void;
  commitMorning: (habitIds: string[], date?: string) => void;
  closeEvening: (results: Record<string, boolean>, reflection: string, date?: string) => void;
  addFailure: (input: Omit<FailureProtocol, "id" | "createdAt">) => void;
  saveReview: (input: Omit<WeeklyReview, "writtenAt">) => void;
  resetAll: () => void;
}

function coreCount(habits: Habit[], exceptId?: string) {
  return habits.filter((h) => h.tier === "core" && !h.paused && h.id !== exceptId).length;
}

export const useForgeStore = create<ForgeStore>()(
  persist(
    (set, get) => ({
      ...empty,
      completeOnboarding: (identity, first) => {
        const now = new Date().toISOString();
        const habits: Habit[] = first
          ? [
              {
                id: uid(),
                rule: first.rule.trim(),
                why: first.why.trim(),
                tier: first.tier,
                category: first.category,
                rank: 0,
                paused: false,
                createdAt: now,
              },
            ]
          : [];
        set({
          onboardingComplete: true,
          startedAt: todayKey(),
          identity: identity.trim(),
          identityUpdatedAt: now,
          habits,
        });
      },
      loadExample: () => set({ ...exampleForge() }),
      setIdentity: (identity) =>
        set({
          identity: identity.trim(),
          identityUpdatedAt: new Date().toISOString(),
        }),
      addHabit: (input) => {
        const habits = get().habits;
        if (input.tier === "core" && coreCount(habits) >= MAX_CORE) {
          return {
            ok: false,
            error: `Tes piliers sont limités à ${MAX_CORE}. Pause ou rétrograde-en un avant d'en forger un autre.`,
          };
        }
        const id = uid();
        const rank = habits.reduce((m, h) => Math.max(m, h.rank), -1) + 1;
        set({
          habits: [
            ...habits,
            {
              id,
              rule: input.rule.trim(),
              why: input.why.trim(),
              tier: input.tier,
              category: input.category,
              rank,
              paused: false,
              createdAt: new Date().toISOString(),
            },
          ],
        });
        return { ok: true, id };
      },
      updateHabit: (id, patch) => {
        const habits = get().habits;
        const current = habits.find((h) => h.id === id);
        if (!current) return { ok: false, error: "Habitude introuvable." };
        const nextTier = patch.tier ?? current.tier;
        const nextPaused = patch.paused ?? current.paused;
        if (
          nextTier === "core" &&
          !nextPaused &&
          (current.tier !== "core" || current.paused) &&
          coreCount(habits, id) >= MAX_CORE
        ) {
          return {
            ok: false,
            error: `Tes piliers sont limités à ${MAX_CORE}.`,
          };
        }
        set({
          habits: habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        });
        return { ok: true };
      },
      removeHabit: (id) => set({ habits: get().habits.filter((h) => h.id !== id) }),
      moveHabit: (id, dir) => {
        const habits = [...get().habits].sort((a, b) => a.rank - b.rank);
        const i = habits.findIndex((h) => h.id === id);
        const j = i + dir;
        if (i < 0 || j < 0 || j >= habits.length) return;
        const tmp = habits[i]!.rank;
        habits[i] = { ...habits[i]!, rank: habits[j]!.rank };
        habits[j] = { ...habits[j]!, rank: tmp };
        set({ habits });
      },
      commitMorning: (habitIds, date = todayKey()) => {
        const morning: MorningCheckin = {
          date,
          habitIds,
          committedAt: new Date().toISOString(),
        };
        set({ mornings: { ...get().mornings, [date]: morning } });
      },
      closeEvening: (results, reflection, date = todayKey()) => {
        const evening: EveningCheckin = {
          date,
          results,
          reflection: reflection.trim(),
          closedAt: new Date().toISOString(),
        };
        set({ evenings: { ...get().evenings, [date]: evening } });
      },
      addFailure: (input) => {
        const entry: FailureProtocol = {
          ...input,
          id: uid(),
          createdAt: new Date().toISOString(),
        };
        set({ failures: [...get().failures, entry] });
      },
      saveReview: (input) => {
        const review: WeeklyReview = {
          ...input,
          weekStart: input.weekStart || currentWeekStart(),
          writtenAt: new Date().toISOString(),
        };
        set({ reviews: { ...get().reviews, [review.weekStart]: review } });
      },
      resetAll: () => set({ ...empty }),
    }),
    {
      name: "forge:v1",
      skipHydration: true,
      partialize: (state) => ({
        onboardingComplete: state.onboardingComplete,
        startedAt: state.startedAt,
        identity: state.identity,
        identityUpdatedAt: state.identityUpdatedAt,
        habits: state.habits,
        mornings: state.mornings,
        evenings: state.evenings,
        failures: state.failures,
        reviews: state.reviews,
      }),
    },
  ),
);

