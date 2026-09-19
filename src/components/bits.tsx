import type { ReactNode } from "react";
import { DISPERSION_THRESHOLD } from "@/lib/types";
import { activeHabits } from "@/lib/stats";
import { useForgeStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function PageHeader({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {kicker && (
          <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-muted">{kicker}</p>
        )}
        <h1 className="font-display text-3xl font-medium uppercase tracking-[0.1em] sm:text-4xl">
          {title}
        </h1>
      </div>
      {children}
    </header>
  );
}

export function DispersionWarning() {
  const habits = useForgeStore((s) => s.habits);
  const n = activeHabits(habits).length;
  if (n < DISPERSION_THRESHOLD) return null;
  return (
    <p className="rounded-lg bg-card px-4 py-3 text-sm leading-relaxed text-foreground shadow-[var(--shadow-border)]">
      Tu as {n} habitudes actives. Est-ce que ton Standard est encore tenable ?
    </p>
  );
}

export function HabitDots({
  states,
}: {
  states: { date: string; state: "idle" | "done" | "miss" | "pending" }[];
}) {
  return (
    <div className="flex gap-1" aria-hidden>
      {states.map((s) => (
        <span
          key={s.date}
          className={cn(
            "size-2 rounded-sm",
            s.state === "done" && "bg-heat-4",
            s.state === "miss" && "bg-heat-1",
            s.state === "pending" && "bg-heat-2",
            s.state === "idle" && "bg-heat-0",
          )}
        />
      ))}
    </div>
  );
}

export function Percent({ value }: { value: number | null }) {
  if (value === null) return <span className="text-faint">—</span>;
  return <span className="tabular-nums">{value}%</span>;
}

export function Surface({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-xl bg-card p-5 shadow-[var(--shadow-border)] sm:p-6", className)}>
      {children}
    </section>
  );
}
