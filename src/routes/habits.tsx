import { useMemo, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Pause, Pencil, Play, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { HabitForm } from "@/components/habit-form";
import { DispersionWarning, HabitDots, PageHeader, Surface } from "@/components/bits";
import { useForgeStore } from "@/lib/store";
import { CATEGORY_LABEL, MAX_CORE, type Habit, type HabitCategory } from "@/lib/types";
import { activeHabits, coreHabits, habitDots, sortedHabits } from "@/lib/stats";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/habits")({ component: HabitsPage });

type Filter = "all" | "core" | "secondary" | "paused";

function HabitsPage() {
  const habits = useForgeStore((s) => s.habits);
  const evenings = useForgeStore((s) => s.evenings);
  const mornings = useForgeStore((s) => s.mornings);
  const updateHabit = useForgeStore((s) => s.updateHabit);
  const removeHabit = useForgeStore((s) => s.removeHabit);
  const moveHabit = useForgeStore((s) => s.moveHabit);

  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const list = useMemo(() => {
    let rows = sortedHabits(habits);
    if (filter === "core") rows = rows.filter((h) => h.tier === "core" && !h.paused);
    if (filter === "secondary") rows = rows.filter((h) => h.tier === "secondary" && !h.paused);
    if (filter === "paused") rows = rows.filter((h) => h.paused);
    return rows;
  }, [habits, filter]);

  const grouped = useMemo(() => {
    const map = new Map<HabitCategory, Habit[]>();
    for (const h of list) {
      const arr = map.get(h.category) ?? [];
      arr.push(h);
      map.set(h.category, arr);
    }
    return [...map.entries()];
  }, [list]);

  const cores = coreHabits(habits).length;
  const active = activeHabits(habits).length;

  return (
    <div className="mx-auto max-w-2xl forge-in">
      <PageHeader kicker="Ton Standard" title="Habitudes">
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          <Plus className="size-4" strokeWidth={1.75} />
          Ajouter
        </Button>
      </PageHeader>

      <div className="mb-6 flex flex-wrap items-center gap-4 text-sm text-muted">
        <span>
          <span className="tabular-nums text-foreground">{cores}</span>/{MAX_CORE} piliers
        </span>
        <span className="text-faint">·</span>
        <span>
          <span className="tabular-nums text-foreground">{active}</span> actives
        </span>
      </div>

      <div className="space-y-6">
        <DispersionWarning />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["all", "Toutes"],
            ["core", "Core"],
            ["secondary", "Secondaires"],
            ["paused", "En pause"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              "h-11 rounded-md px-3 text-sm transition-colors duration-150",
              filter === id
                ? "bg-accent text-accent-foreground"
                : "bg-card text-muted shadow-[var(--shadow-border)] hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-12 max-w-md text-sm leading-relaxed text-muted">
          {filter === "all"
            ? "Aucun pilier. Ajoute ce que tu refuses de rater — pas ce que tu aimerais faire un jour."
            : "Rien dans ce filtre."}
        </p>
      ) : (
        <div className="mt-8 space-y-8">
          {grouped.map(([cat, rows]) => (
            <section key={cat} className="space-y-3">
              <h2 className="font-display text-sm uppercase tracking-[0.18em] text-muted">
                {CATEGORY_LABEL[cat]}
              </h2>
              <ul className="space-y-2">
                {rows.map((h) => (
                  <li key={h.id}>
                    <Surface className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-foreground">{h.rule}</p>
                            <span className="text-[0.625rem] uppercase tracking-[0.14em] text-faint">
                              {h.tier === "core" ? "Pilier" : "Secondaire"}
                              {h.paused ? " · Pause" : ""}
                            </span>
                          </div>
                          <p className="mt-1 text-sm leading-relaxed text-muted">{h.why}</p>
                          <div className="mt-3">
                            <HabitDots states={habitDots(h.id, 7, evenings, mornings)} />
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-0.5">
                          <IconBtn label="Monter" onClick={() => moveHabit(h.id, -1)}>
                            <ChevronUp className="size-4" strokeWidth={1.75} />
                          </IconBtn>
                          <IconBtn label="Descendre" onClick={() => moveHabit(h.id, 1)}>
                            <ChevronDown className="size-4" strokeWidth={1.75} />
                          </IconBtn>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        <IconBtn
                          label="Modifier"
                          onClick={() => {
                            setEditing(h);
                            setOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" strokeWidth={1.75} />
                          <span className="text-xs">Modifier</span>
                        </IconBtn>
                        <IconBtn
                          label={h.paused ? "Reprendre" : "Mettre en pause"}
                          onClick={() => updateHabit(h.id, { paused: !h.paused })}
                        >
                          {h.paused ? (
                            <Play className="size-3.5" strokeWidth={1.75} />
                          ) : (
                            <Pause className="size-3.5" strokeWidth={1.75} />
                          )}
                          <span className="text-xs">{h.paused ? "Reprendre" : "Pause"}</span>
                        </IconBtn>
                        {confirmId === h.id ? (
                          <IconBtn
                            label="Confirmer la suppression"
                            onClick={() => {
                              removeHabit(h.id);
                              setConfirmId(null);
                            }}
                          >
                            <span className="text-xs text-foreground">Confirmer</span>
                          </IconBtn>
                        ) : (
                          <IconBtn label="Supprimer" onClick={() => setConfirmId(h.id)}>
                            <Trash2 className="size-3.5" strokeWidth={1.75} />
                            <span className="text-xs">Supprimer</span>
                          </IconBtn>
                        )}
                      </div>
                    </Surface>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setEditing(null);
        }}
      >
        <DialogContent>
          <DialogTitle>{editing ? "Recalibrer" : "Nouvelle habitude"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Ajuste la règle, pas le niveau d'exigence."
              : "Core = pilier, 5 maximum. Le reste est secondaire — et tu choisis chaque matin ce que tu engages vraiment."}
          </DialogDescription>
          <HabitForm
            initial={editing ?? undefined}
            onDone={() => {
              setOpen(false);
              setEditing(null);
            }}
            onCancel={() => {
              setOpen(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-md px-2.5 text-muted transition-colors duration-150 hover:bg-card-2 hover:text-foreground"
    >
      {children}
    </button>
  );
}
