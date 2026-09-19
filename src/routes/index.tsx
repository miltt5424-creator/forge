import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FailureProtocol } from "@/components/failure-protocol";
import { DispersionWarning, PageHeader, Percent, Surface } from "@/components/bits";
import { useForgeStore } from "@/lib/store";
import {
  currentWeekStart,
  formatDayLong,
  hourOfDay,
  isTodaySunday,
  todayKey,
} from "@/lib/dates";
import { activeHabits, coreHabits, respectPercent, secondaryHabits, windowScores } from "@/lib/stats";
import { cn } from "@/lib/utils";
import type { Habit } from "@/lib/types";

export const Route = createFileRoute("/")({ component: TodayPage });

function TodayPage() {
  const habits = useForgeStore((s) => s.habits);
  const mornings = useForgeStore((s) => s.mornings);
  const evenings = useForgeStore((s) => s.evenings);
  const failures = useForgeStore((s) => s.failures);
  const identity = useForgeStore((s) => s.identity);
  const reviews = useForgeStore((s) => s.reviews);
  const startedAt = useForgeStore((s) => s.startedAt);

  const date = todayKey();
  const morning = mornings[date];
  const evening = evenings[date];
  const cores = coreHabits(habits);
  const secondaries = secondaryHabits(habits);
  const active = activeHabits(habits);

  const pendingMisses = useMemo(() => {
    if (!evening) return [];
    const focus = morning?.habitIds ?? [];
    return focus
      .filter((id) => evening.results[id] === false)
      .filter((id) => !failures.some((f) => f.date === date && f.habitId === id))
      .map((id) => habits.find((h) => h.id === id))
      .filter((h): h is Habit => Boolean(h));
  }, [evening, morning, failures, date, habits]);

  const s7 = useMemo(
    () => windowScores(7, habits, mornings, evenings, startedAt),
    [habits, mornings, evenings, startedAt],
  );

  const weekStart = currentWeekStart();
  const showSunday = isTodaySunday() && !reviews[weekStart];
  const hour = hourOfDay();

  return (
    <div className="mx-auto max-w-2xl forge-in">
      <PageHeader kicker={formatDayLong(date)} title="Aujourd'hui">
        <div className="text-right">
          <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-muted">Standard · 7j</p>
          <p className="font-display text-2xl tabular-nums">
            <Percent value={respectPercent(s7, "core")} />
          </p>
        </div>
      </PageHeader>

      {identity && (
        <p className="mb-8 max-w-xl text-sm italic leading-relaxed text-muted">« {identity} »</p>
      )}

      <div className="space-y-6">
        <DispersionWarning />

        {showSunday && (
          <Link
            to="/review"
            className="block rounded-xl bg-card px-5 py-4 text-sm shadow-[var(--shadow-border)] transition-[box-shadow] duration-150 hover:shadow-[var(--shadow-border-hover)]"
          >
            <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-muted">Dimanche</p>
            <p className="mt-1 text-foreground">La revue de la semaine n'est pas faite.</p>
          </Link>
        )}

        {active.length === 0 && (
          <Surface>
            <p className="text-sm leading-relaxed text-muted">
              Aucun pilier actif. Un Standard vide n'est pas de la simplicité — c'est de
              l'absence.
            </p>
            <Button asChild className="mt-4">
              <Link to="/habits">Définir un pilier</Link>
            </Button>
          </Surface>
        )}

        {active.length > 0 && !morning && (
          <MorningCommit date={date} cores={cores} secondaries={secondaries} />
        )}

        {morning && !evening && (
          <HonestReview
            date={date}
            habits={habits}
            focusIds={morning.habitIds}
            late={hour >= 18}
          />
        )}

        {evening && pendingMisses.length > 0 && <MissQueue items={pendingMisses} date={date} />}

        {evening && pendingMisses.length === 0 && (
          <DayClosed
            date={date}
            habits={habits}
            focusIds={morning?.habitIds ?? []}
            results={evening.results}
            reflection={evening.reflection}
          />
        )}
      </div>
    </div>
  );
}

function MorningCommit({
  date,
  cores,
  secondaries,
}: {
  date: string;
  cores: Habit[];
  secondaries: Habit[];
}) {
  const commitMorning = useForgeStore((s) => s.commitMorning);
  const [selected, setSelected] = useState<string[]>(() => cores.map((h) => h.id));

  function toggle(id: string, locked?: boolean) {
    if (locked) return;
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  }

  return (
    <div className="forge-in-2 space-y-6">
      <div>
        <h2 className="font-display text-xl uppercase tracking-[0.12em]">Engagement du jour</h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
          Tes piliers sont déjà là. Ajoute seulement ce que tu t'engages vraiment à tenir
          aujourd'hui — pas ce que tu aimerais avoir fait.
        </p>
      </div>

      {cores.length > 0 && (
        <section className="space-y-2">
          <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-muted">Piliers</p>
          {cores.map((h) => (
            <SelectRow
              key={h.id}
              habit={h}
              selected={selected.includes(h.id)}
              onToggle={() => toggle(h.id)}
              badge="Core"
            />
          ))}
        </section>
      )}

      {secondaries.length > 0 && (
        <section className="space-y-2">
          <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-muted">Secondaires</p>
          {secondaries.map((h) => (
            <SelectRow
              key={h.id}
              habit={h}
              selected={selected.includes(h.id)}
              onToggle={() => toggle(h.id)}
            />
          ))}
        </section>
      )}

      <Button size="lg" disabled={selected.length === 0} onClick={() => commitMorning(selected, date)}>
        Je m'engage · {selected.length}
      </Button>
    </div>
  );
}

function SelectRow({
  habit,
  selected,
  onToggle,
  badge,
}: {
  habit: Habit;
  selected: boolean;
  onToggle: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex w-full items-start gap-4 rounded-lg bg-card px-4 py-3.5 text-left shadow-[var(--shadow-border)] transition-[box-shadow,background-color] duration-150",
        selected ? "shadow-[var(--shadow-border-hover)]" : "opacity-70 hover:opacity-100",
      )}
    >
      <span
        className={cn(
          "mt-0.5 size-5 shrink-0 rounded-sm border transition-colors duration-150",
          selected ? "border-accent bg-accent" : "border-border bg-transparent",
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-foreground">{habit.rule}</span>
          {badge && (
            <span className="text-[0.625rem] uppercase tracking-[0.14em] text-faint">{badge}</span>
          )}
        </span>
        <span className="mt-0.5 block text-sm text-muted">{habit.why}</span>
      </span>
    </button>
  );
}

function HonestReview({
  date,
  habits,
  focusIds,
  late,
}: {
  date: string;
  habits: Habit[];
  focusIds: string[];
  late: boolean;
}) {
  const closeEvening = useForgeStore((s) => s.closeEvening);
  const focus = focusIds
    .map((id) => habits.find((h) => h.id === id))
    .filter((h): h is Habit => Boolean(h));
  const [results, setResults] = useState<Record<string, boolean | null>>(
    Object.fromEntries(focusIds.map((id) => [id, null])),
  );
  const [reflection, setReflection] = useState("");

  const allAnswered = focusIds.every((id) => results[id] !== null && results[id] !== undefined);

  return (
    <div className="forge-in-2 space-y-6">
      <div>
        <h2 className="font-display text-xl uppercase tracking-[0.12em]">
          {late ? "Revue du soir" : "Revue honnête"}
        </h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
          Pas de négociation. Fait, ou pas fait. Une phrase pour toi — pas pour un tableau.
        </p>
      </div>

      <ul className="space-y-3">
        {focus.map((h) => (
          <li key={h.id} className="rounded-xl bg-card p-4 shadow-[var(--shadow-border)] sm:p-5">
            <p className="font-medium">{h.rule}</p>
            <p className="mt-1 text-sm text-muted">{h.why}</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Verdict
                active={results[h.id] === true}
                onClick={() => setResults((r) => ({ ...r, [h.id]: true }))}
              >
                Fait
              </Verdict>
              <Verdict
                active={results[h.id] === false}
                onClick={() => setResults((r) => ({ ...r, [h.id]: false }))}
              >
                Pas fait
              </Verdict>
            </div>
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <Label htmlFor="reflection">Une phrase de réflexion</Label>
        <Textarea
          id="reflection"
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Ce qui s'est vraiment passé."
          rows={3}
        />
      </div>

      <Button
        size="lg"
        disabled={!allAnswered || !reflection.trim()}
        onClick={() => {
          const locked: Record<string, boolean> = {};
          for (const id of focusIds) locked[id] = results[id] === true;
          closeEvening(locked, reflection, date);
        }}
      >
        Clôturer la journée
      </Button>
    </div>
  );
}

function Verdict({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-12 rounded-md text-sm font-medium transition-[background-color,color] duration-150",
        active ? "bg-accent text-accent-foreground" : "bg-card-2 text-muted hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function MissQueue({ items, date }: { items: Habit[]; date: string }) {
  const addFailure = useForgeStore((s) => s.addFailure);
  const updateHabit = useForgeStore((s) => s.updateHabit);
  const current = items[0];
  if (!current) return null;

  return (
    <Surface>
      <FailureProtocol
        habit={current}
        remaining={items.length}
        onSubmit={({ why, correction, restartTomorrow }) => {
          addFailure({
            date,
            habitId: current.id,
            why,
            correction,
            restartTomorrow,
          });
          if (!restartTomorrow) updateHabit(current.id, { paused: true });
        }}
      />
    </Surface>
  );
}

function DayClosed({
  date,
  habits,
  focusIds,
  results,
  reflection,
}: {
  date: string;
  habits: Habit[];
  focusIds: string[];
  results: Record<string, boolean>;
  reflection: string;
}) {
  const focus = focusIds
    .map((id) => habits.find((h) => h.id === id))
    .filter((h): h is Habit => Boolean(h));
  const done = focus.filter((h) => results[h.id]).length;

  return (
    <div className="forge-in-2 space-y-6">
      <div>
        <h2 className="font-display text-xl uppercase tracking-[0.12em]">Journée close</h2>
        <p className="mt-2 text-sm text-muted">
          <span className="tabular-nums text-foreground">
            {done}/{focus.length}
          </span>{" "}
          tenues. C'est la réalité de {formatDayLong(date)}.
        </p>
      </div>
      <ul className="space-y-2">
        {focus.map((h) => (
          <li
            key={h.id}
            className="flex items-center justify-between gap-4 rounded-lg bg-card px-4 py-3 shadow-[var(--shadow-border)]"
          >
            <span className="text-sm">{h.rule}</span>
            <span className="text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
              {results[h.id] ? "Tenu" : "Raté"}
            </span>
          </li>
        ))}
      </ul>
      {reflection && (
        <blockquote className="border-l-2 border-border pl-4 text-sm leading-relaxed text-muted">
          {reflection}
        </blockquote>
      )}
    </div>
  );
}
