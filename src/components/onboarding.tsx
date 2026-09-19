import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, CATEGORY_LABEL, type HabitCategory } from "@/lib/types";
import { useForgeStore } from "@/lib/store";

export function Onboarding() {
  const completeOnboarding = useForgeStore((s) => s.completeOnboarding);
  const loadExample = useForgeStore((s) => s.loadExample);
  const [step, setStep] = useState(0);
  const [identity, setIdentity] = useState("");
  const [rule, setRule] = useState("");
  const [why, setWhy] = useState("");
  const [category, setCategory] = useState<HabitCategory>("corps");

  return (
    <div className="relative min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-6 py-16">
        <p className="forge-in font-display text-sm uppercase tracking-[0.42em] text-muted">Forge</p>

        {step === 0 && (
          <div className="forge-in-2 mt-10 space-y-8">
            <h1 className="font-display text-4xl font-medium uppercase leading-[1.05] tracking-[0.08em] sm:text-5xl">
              Tu ne coches pas
              <br />
              des tâches.
            </h1>
            <div className="space-y-4 text-[1.0625rem] leading-relaxed text-muted">
              <p>Tu forges un caractère. Jour après jour.</p>
              <p>Moins de distractions. Plus d'exigence. La constance, pas la motivation.</p>
              <p className="text-foreground">Approche identitaire. Zéro badge. Zéro points.</p>
            </div>
            <div className="flex flex-col gap-3 pt-4">
              <Button size="lg" onClick={() => setStep(1)}>
                Forger mon Standard
              </Button>
              <Button size="lg" variant="ghost" onClick={loadExample}>
                Voir un Standard d'exemple
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="forge-in-2 mt-10 space-y-8">
            <h1 className="font-display text-3xl font-medium uppercase leading-tight tracking-[0.08em] sm:text-4xl">
              Qui es-tu en train de devenir ?
            </h1>
            <p className="text-sm leading-relaxed text-muted">
              Une phrase. Au présent. Pas un vœu — une identité.
            </p>
            <div className="space-y-3">
              <Label htmlFor="identity">Je suis le type d'homme qui…</Label>
              <Textarea
                id="identity"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
                placeholder="Je suis un homme qui tient parole à lui-même."
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button size="lg" disabled={!identity.trim()} onClick={() => setStep(2)}>
                Continuer
              </Button>
              <Button size="lg" variant="ghost" onClick={() => setStep(0)}>
                Retour
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="forge-in-2 mt-10 space-y-8">
            <h1 className="font-display text-3xl font-medium uppercase leading-tight tracking-[0.08em] sm:text-4xl">
              Premier pilier
            </h1>
            <p className="text-sm leading-relaxed text-muted">
              Un non-négociable. La règle exacte, et pourquoi tu refuses de la rater.
            </p>
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="rule">La règle</Label>
                <Input
                  id="rule"
                  value={rule}
                  onChange={(e) => setRule(e.target.value)}
                  placeholder="Lever avant 6h"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="why">Pourquoi c'est non-négociable</Label>
                <Textarea
                  id="why"
                  value={why}
                  onChange={(e) => setWhy(e.target.value)}
                  placeholder="Parce que la journée m'appartient si je la prends en premier."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat">Catégorie</Label>
                <select
                  id="cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as HabitCategory)}
                  className="flex h-11 w-full rounded-md bg-card px-3 text-sm text-foreground shadow-[var(--shadow-border)] outline-none focus-visible:shadow-[0_0_0_1px_var(--color-ring)]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-2">
              <Button
                size="lg"
                disabled={!rule.trim() || !why.trim()}
                onClick={() =>
                  completeOnboarding(identity, {
                    rule,
                    why,
                    tier: "core",
                    category,
                  })
                }
              >
                Commencer
              </Button>
              <Button size="lg" variant="ghost" onClick={() => completeOnboarding(identity)}>
                Plus tard — j'ajoute mes piliers après
              </Button>
            </div>
          </div>
        )}

        <div className="mt-12 flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-px flex-1 ${i <= step ? "bg-accent" : "bg-border"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
