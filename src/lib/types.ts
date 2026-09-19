export const CATEGORIES = [
  "corps",
  "esprit",
  "travail",
  "relations",
  "autre",
] as const;

export type HabitCategory = (typeof CATEGORIES)[number];
export type HabitTier = "core" | "secondary";

export const CATEGORY_LABEL: Record<HabitCategory, string> = {
  corps: "Corps",
  esprit: "Esprit",
  travail: "Travail",
  relations: "Relations",
  autre: "Autre",
};

export const MAX_CORE = 5;
export const DISPERSION_THRESHOLD = 10;

export interface Habit {
  id: string;
  rule: string;
  why: string;
  tier: HabitTier;
  category: HabitCategory;
  rank: number;
  paused: boolean;
  createdAt: string;
}

export interface MorningCheckin {
  date: string;
  habitIds: string[];
  committedAt: string;
}

export interface EveningCheckin {
  date: string;
  results: Record<string, boolean>;
  reflection: string;
  closedAt: string;
}

export interface FailureProtocol {
  id: string;
  date: string;
  habitId: string;
  why: string;
  correction: string;
  restartTomorrow: boolean;
  createdAt: string;
}

export interface WeeklyReview {
  weekStart: string;
  held: string;
  cracked: string;
  standardJust: string;
  adjust: string;
  writtenAt: string;
}

export interface ForgeData {
  onboardingComplete: boolean;
  startedAt: string | null;
  identity: string;
  identityUpdatedAt: string | null;
  habits: Habit[];
  mornings: Record<string, MorningCheckin>;
  evenings: Record<string, EveningCheckin>;
  failures: FailureProtocol[];
  reviews: Record<string, WeeklyReview>;
}
