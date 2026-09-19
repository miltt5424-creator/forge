import { subDays } from "date-fns";
import type { ForgeData, Habit } from "./types";
import { toKey, todayKey } from "./dates";
import { uid } from "./utils";

function isoDaysAgo(n: number) {
  return subDays(new Date(), n).toISOString();
}

function keyDaysAgo(n: number) {
  return toKey(subDays(new Date(), n));
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function exampleForge(): ForgeData {
  const startedAt = keyDaysAgo(27);
  const habits: Habit[] = [
    {
      id: uid(),
      rule: "Lever avant 6h",
      why: "Parce que la journée m'appartient si je la prends en premier.",
      tier: "core",
      category: "corps",
      rank: 0,
      paused: false,
      createdAt: isoDaysAgo(27),
    },
    {
      id: uid(),
      rule: "45 min de sport",
      why: "Parce que mon corps est l'outil. Pas un accessoire.",
      tier: "core",
      category: "corps",
      rank: 1,
      paused: false,
      createdAt: isoDaysAgo(27),
    },
    {
      id: uid(),
      rule: "20 pages de lecture",
      why: "Parce qu'un homme qui ne lit pas se répète.",
      tier: "core",
      category: "esprit",
      rank: 2,
      paused: false,
      createdAt: isoDaysAgo(27),
    },
    {
      id: uid(),
      rule: "Journal, 10 minutes",
      why: "Parce que je refuse de vivre sans me voir.",
      tier: "secondary",
      category: "esprit",
      rank: 3,
      paused: false,
      createdAt: isoDaysAgo(20),
    },
    {
      id: uid(),
      rule: "Appel à quelqu'un qui compte",
      why: "Parce que la discipline sans liens n'est qu'un isolement habillé.",
      tier: "secondary",
      category: "relations",
      rank: 4,
      paused: false,
      createdAt: isoDaysAgo(14),
    },
  ];

  const mornings: ForgeData["mornings"] = {};
  const evenings: ForgeData["evenings"] = {};
  const failures: ForgeData["failures"] = [];
  const today = todayKey();

  for (let i = 27; i >= 1; i--) {
    const date = keyDaysAgo(i);
    if (date >= today) continue;
    const available = habits.filter((h) => h.createdAt.slice(0, 10) <= date);
    const cores = available.filter((h) => h.tier === "core");
    const secondaries = available.filter((h) => h.tier === "secondary");
    const includeSecondary = hash(date + "sec") % 3 !== 0;
    const habitIds = [
      ...cores.map((h) => h.id),
      ...(includeSecondary ? secondaries.filter((h) => hash(date + h.id) % 2 === 0).map((h) => h.id) : []),
    ];
    mornings[date] = {
      date,
      habitIds,
      committedAt: `${date}T06:12:00.000Z`,
    };

    const collapse = hash(date) % 19 === 0;
    const results: Record<string, boolean> = {};
    for (const id of habitIds) {
      if (collapse) results[id] = false;
      else results[id] = hash(date + id) % 10 > 1;
    }
    const doneCount = Object.values(results).filter(Boolean).length;
    const reflection =
      collapse
        ? "Journée molle. J'ai négocié avec moi-même dès le matin."
        : doneCount === habitIds.length
          ? "Tenue. Rien à ajouter."
          : "Presque. Un pilier a lâché — pas d'excuse, une cause.";

    evenings[date] = {
      date,
      results,
      reflection,
      closedAt: `${date}T21:40:00.000Z`,
    };

    for (const id of habitIds) {
      if (results[id]) continue;
      const habit = habits.find((h) => h.id === id);
      failures.push({
        id: uid(),
        date,
        habitId: id,
        why: collapse
          ? "Pas de structure. J'ai laissé la journée décider à ma place."
          : `J'ai reculé sur « ${habit?.rule ?? "cette règle"} » dès que ça a frotté.`,
        correction: "Préparer la veille. Réduire la friction à une seule action de 2 minutes.",
        restartTomorrow: true,
        createdAt: `${date}T21:45:00.000Z`,
      });
    }
  }

  const reviews: ForgeData["reviews"] = {};
  const weekStarts = [keyDaysAgo(20), keyDaysAgo(13), keyDaysAgo(6)];
  const weekCopy = [
    {
      held: "Le lever et la lecture. Ça tient même les jours plats.",
      cracked: "Le sport dès que le travail déborde le soir.",
      standardJust: "Oui. Trois piliers, c'est juste. Pas plus.",
      adjust: "Sport le matin, pas en fin de journée. Couper le négociable.",
    },
    {
      held: "La constance du matin. Presque sans exception.",
      cracked: "Le journal. Je le traite encore comme un luxe.",
      standardJust: "Le Standard est juste. C'est l'exécution qui flotte.",
      adjust: "Journal collé au café. Pas de téléphone avant.",
    },
    {
      held: "Les piliers tiennent. Je commence à me reconnaître.",
      cracked: "Un dimanche entier lâché. Vieille habitude de 'jour off'.",
      standardJust: "Oui — et le dimanche n'est pas une exception.",
      adjust: "Protocole du dimanche : version courte, pas d'abandon.",
    },
  ];
  weekStarts.forEach((weekStart, i) => {
    const copy = weekCopy[i] ?? weekCopy[0]!;
    reviews[weekStart] = {
      weekStart,
      ...copy,
      writtenAt: `${weekStart}T20:00:00.000Z`,
    };
  });

  return {
    onboardingComplete: true,
    startedAt,
    identity: "Je suis un homme qui tient parole à lui-même.",
    identityUpdatedAt: isoDaysAgo(27),
    habits,
    mornings,
    evenings,
    failures,
    reviews,
  };
}
