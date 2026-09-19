import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, Surface } from "@/components/bits";
import { useForgeStore } from "@/lib/store";
import { currentWeekStart, formatWeekRange, isTodaySunday } from "@/lib/dates";
import { heldDays, windowScores } from "@/lib/stats";

export const Route = createFileRoute("/review")({ component: ReviewPage });

function ReviewPage() {
  const habits = useForgeStore((s) => s.habits);
  const mornings = useForgeStore((s) => s.mornings);
  const evenings = useForgeStore((s) => s.evenings);
  const startedAt = useForgeStore((s) => s.startedAt);
  const reviews = useForgeStore((s) => s.reviews);
  const saveReview = useForgeStore((s) => s.saveReview);

  const weekStart = currentWeekStart();
  const existing = reviews[weekStart];
  const sunday = isTodaySunday();

  const weekStats = useMemo(() => {
    const scores = windowScores(7, habits, mornings, evenings, startedAt, true);
    return heldDays(scores);
  }, [habits, mornings, evenings, startedAt]);

  const history = useMemo(
    () =>
      Object.values(reviews).sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1)),
    [reviews],
  );

  return (
    <div className="mx-auto max-w-2xl forge-in">
      <PageHeader kicker="Chaque dimanche" title="Revue hebdomadaire">
        <p className="text-sm text-muted">
          {weekStats.total > 0
            ? `${weekStats.held} jour${weekStats.held > 1 ? "s" : ""} tenu${weekStats.held > 1 ? "s" : ""} sur ${weekStats.total}`
            : "Pas encore de semaine à mesurer."}
        </p>
      </PageHeader>

      {sunday && !existing && (
        <p className="mb-6 text-sm text-foreground">Dimanche. C'est le moment de regarder en face.</p>
      )}

      {existing ? (
        <Surface className="space-y-6">
          <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-muted">
            Semaine du {formatWeekRange(existing.weekStart)}
          </p>
          <ReviewBlock q="Qu'est-ce qui a tenu ?" a={existing.held} />
          <ReviewBlock q="Qu'est-ce qui a craqué ?" a={existing.cracked} />
          <ReviewBlock q="Est-ce que mon Standard est encore juste ?" a={existing.standardJust} />
          <ReviewBlock q="Qu'est-ce que j'ajuste la semaine prochaine ?" a={existing.adjust} />
        </Surface>
      ) : (
        <ReviewForm
          weekStart={weekStart}
          onSave={(data) => saveReview({ weekStart, ...data })}
        />
      )}

      {history.filter((r) => r.weekStart !== weekStart).length > 0 && (
        <div className="mt-14 space-y-4">
          <h2 className="font-display text-sm uppercase tracking-[0.18em] text-muted">Archives</h2>
          {history
            .filter((r) => r.weekStart !== weekStart)
            .map((r) => (
              <Surface key={r.weekStart} className="space-y-4">
                <p className="text-[0.6875rem] uppercase tracking-[0.18em] text-faint">
                  {formatWeekRange(r.weekStart)}
                </p>
                <ReviewBlock q="Tenu" a={r.held} />
                <ReviewBlock q="Craqué" a={r.cracked} />
                <ReviewBlock q="Standard" a={r.standardJust} />
                <ReviewBlock q="Ajustement" a={r.adjust} />
              </Surface>
            ))}
        </div>
      )}
    </div>
  );
}

function ReviewBlock({ q, a }: { q: string; a: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-muted">{q}</p>
      <p className="text-sm leading-relaxed text-foreground">{a}</p>
    </div>
  );
}

function ReviewForm({
  weekStart,
  onSave,
}: {
  weekStart: string;
  onSave: (data: {
    held: string;
    cracked: string;
    standardJust: string;
    adjust: string;
  }) => void;
}) {
  const [held, setHeld] = useState("");
  const [cracked, setCracked] = useState("");
  const [standardJust, setStandardJust] = useState("");
  const [adjust, setAdjust] = useState("");
  const ready = [held, cracked, standardJust, adjust].every((v) => v.trim());

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        onSave({ held, cracked, standardJust, adjust });
      }}
    >
      <p className="text-sm text-muted">Semaine du {formatWeekRange(weekStart)}</p>
      <Field id="held" label="Qu'est-ce qui a tenu ?" value={held} onChange={setHeld} />
      <Field id="cracked" label="Qu'est-ce qui a craqué ?" value={cracked} onChange={setCracked} />
      <Field
        id="just"
        label="Est-ce que mon Standard est encore juste ?"
        value={standardJust}
        onChange={setStandardJust}
      />
      <Field
        id="adjust"
        label="Qu'est-ce que j'ajuste la semaine prochaine ?"
        value={adjust}
        onChange={setAdjust}
      />
      <Button type="submit" size="lg" disabled={!ready}>
        Clôturer la semaine
      </Button>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} value={value} onChange={(e) => onChange(e.target.value)} rows={3} />
    </div>
  );
}
