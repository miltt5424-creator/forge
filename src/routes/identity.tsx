import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/bits";
import { useForgeStore } from "@/lib/store";

export const Route = createFileRoute("/identity")({ component: IdentityPage });

function IdentityPage() {
  const identity = useForgeStore((s) => s.identity);
  const setIdentity = useForgeStore((s) => s.setIdentity);
  const resetAll = useForgeStore((s) => s.resetAll);
  const [editing, setEditing] = useState(!identity);
  const [draft, setDraft] = useState(identity);
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="mx-auto max-w-2xl forge-in">
      <PageHeader kicker="Identité" title="Qui tu deviens" />

      {!editing ? (
        <blockquote className="forge-in-2 border-l-2 border-accent py-2 pl-6">
          <p className="font-display text-3xl font-medium uppercase leading-[1.15] tracking-[0.06em] sm:text-4xl">
            {identity}
          </p>
        </blockquote>
      ) : (
        <div className="space-y-4">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Je suis un homme qui tient parole à lui-même."
            rows={4}
            className="min-h-32 text-lg"
          />
          <div className="flex gap-2">
            <Button
              disabled={!draft.trim()}
              onClick={() => {
                setIdentity(draft);
                setEditing(false);
              }}
            >
              Ancrer
            </Button>
            {identity && (
              <Button
                variant="ghost"
                onClick={() => {
                  setDraft(identity);
                  setEditing(false);
                }}
              >
                Annuler
              </Button>
            )}
          </div>
        </div>
      )}

      {!editing && (
        <div className="mt-10">
          <Button variant="outline" onClick={() => setEditing(true)}>
            Recalibrer la phrase
          </Button>
        </div>
      )}

      <p className="mt-12 max-w-md text-sm leading-relaxed text-muted">
        Ce n'est pas une affirmation magique. C'est le standard auquel tu te tiens quand
        personne ne regarde.
      </p>

      <div className="mt-24 border-t border-border pt-8">
        <p className="mb-4 text-[0.6875rem] uppercase tracking-[0.18em] text-faint">Zone de rupture</p>
        {!confirmReset ? (
          <Button variant="ghost" onClick={() => setConfirmReset(true)}>
            Réinitialiser Forge
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted">Tout l'historique local sera effacé. Irréversible.</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetAll}>
                Confirmer l'effacement
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Garder
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
