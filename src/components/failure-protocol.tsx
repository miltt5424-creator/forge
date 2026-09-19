import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Habit } from "@/lib/types";

export function FailureProtocol({
  habit,
  remaining,
  onSubmit,
}: {
  habit: Habit;
  remaining: number;
  onSubmit: (data: { why: string; correction: string; restartTomorrow: boolean }) => void;
}) {
  const [why, setWhy] = useState("");
  const [correction, setCorrection] = useState("");
  const [restart, setRestart] = useState<boolean | null>(null);

  const ready = why.trim() && correction.trim() && restart !== null;

  return (
    <div className="forge-in space-y-8">
      <header className="space-y-3">
        <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-muted">
          Protocole de raté{remaining > 1 ? ` · ${remaining} restants` : ""}
        </p>
        <h2 className="font-display text-3xl font-medium uppercase tracking-[0.08em]">{habit.rule}</h2>
        <p className="max-w-lg text-sm leading-relaxed text-muted">
          Pas de punition. Une cause, une correction, une décision.
        </p>
      </header>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fail-why">Pourquoi ça a foiré</Label>
          <Textarea
            id="fail-why"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="La vraie raison. Pas l'excuse."
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fail-fix">La plus petite action corrective</Label>
          <Textarea
            id="fail-fix"
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            placeholder="Une action que tu peux faire demain, petite."
            rows={3}
          />
        </div>
        <div className="space-y-3">
          <Label>Est-ce que tu recommences demain ?</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRestart(true)}
              className={`h-12 rounded-md text-sm font-medium transition-[background-color,box-shadow,color] duration-150 ${
                restart === true
                  ? "bg-accent text-accent-foreground"
                  : "bg-card text-muted shadow-[var(--shadow-border)] hover:text-foreground"
              }`}
            >
              Oui
            </button>
            <button
              type="button"
              onClick={() => setRestart(false)}
              className={`h-12 rounded-md text-sm font-medium transition-[background-color,box-shadow,color] duration-150 ${
                restart === false
                  ? "bg-accent text-accent-foreground"
                  : "bg-card text-muted shadow-[var(--shadow-border)] hover:text-foreground"
              }`}
            >
              Non
            </button>
          </div>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full sm:w-auto"
        disabled={!ready}
        onClick={() =>
          onSubmit({
            why,
            correction,
            restartTomorrow: restart === true,
          })
        }
      >
        Enregistrer
      </Button>
    </div>
  );
}
