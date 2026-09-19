import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORIES,
  CATEGORY_LABEL,
  MAX_CORE,
  type Habit,
  type HabitCategory,
  type HabitTier,
} from "@/lib/types";
import { coreHabits } from "@/lib/stats";
import { useForgeStore } from "@/lib/store";

interface Fields {
  rule: string;
  why: string;
  tier: HabitTier;
  category: HabitCategory;
}

export function HabitForm({
  initial,
  onDone,
  onCancel,
}: {
  initial?: Habit;
  onDone: () => void;
  onCancel: () => void;
}) {
  const habits = useForgeStore((s) => s.habits);
  const addHabit = useForgeStore((s) => s.addHabit);
  const updateHabit = useForgeStore((s) => s.updateHabit);
  const [fields, setFields] = useState<Fields>({
    rule: initial?.rule ?? "",
    why: initial?.why ?? "",
    tier: initial?.tier ?? "secondary",
    category: initial?.category ?? "autre",
  });
  const [error, setError] = useState<string | null>(null);

  const cores = coreHabits(habits).length;
  const coreFull =
    fields.tier === "core" && cores >= MAX_CORE && (!initial || initial.tier !== "core" || initial.paused);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!fields.rule.trim() || !fields.why.trim()) {
      setError("La règle et la raison sont exigées.");
      return;
    }
    if (initial) {
      const res = updateHabit(initial.id, fields);
      if (!res.ok) {
        setError(res.error);
        return;
      }
    } else {
      const res = addHabit(fields);
      if (!res.ok) {
        setError(res.error);
        return;
      }
    }
    onDone();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="space-y-2">
        <Label htmlFor="habit-rule">La règle exacte</Label>
        <Input
          id="habit-rule"
          value={fields.rule}
          onChange={(e) => setFields((f) => ({ ...f, rule: e.target.value }))}
          placeholder="45 min de sport"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="habit-why">Pourquoi c'est non-négociable</Label>
        <Textarea
          id="habit-why"
          value={fields.why}
          onChange={(e) => setFields((f) => ({ ...f, why: e.target.value }))}
          placeholder="Parce que…"
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="habit-tier">Niveau</Label>
          <select
            id="habit-tier"
            value={fields.tier}
            onChange={(e) => setFields((f) => ({ ...f, tier: e.target.value as HabitTier }))}
            className="flex h-11 w-full rounded-md bg-card-2 px-3 text-sm text-foreground shadow-[var(--shadow-border)] outline-none focus-visible:shadow-[0_0_0_1px_var(--color-ring)]"
          >
            <option value="core">Pilier (core)</option>
            <option value="secondary">Secondaire</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="habit-cat">Catégorie</Label>
          <select
            id="habit-cat"
            value={fields.category}
            onChange={(e) => setFields((f) => ({ ...f, category: e.target.value as HabitCategory }))}
            className="flex h-11 w-full rounded-md bg-card-2 px-3 text-sm text-foreground shadow-[var(--shadow-border)] outline-none focus-visible:shadow-[0_0_0_1px_var(--color-ring)]"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {fields.tier === "core" && (
        <p className="text-sm text-muted">
          {cores}/{MAX_CORE} piliers actifs. Les piliers restent visibles chaque matin.
        </p>
      )}
      {coreFull && (
        <p className="text-sm text-foreground">
          Tes piliers sont limités à {MAX_CORE}. Pause ou rétrograde-en un avant.
        </p>
      )}
      {error && <p className="text-sm text-foreground">{error}</p>}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={coreFull}>
          {initial ? "Enregistrer" : "Ajouter"}
        </Button>
      </div>
    </form>
  );
}
