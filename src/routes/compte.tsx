import { useState, type FormEvent } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/bits";
import { getSupabase, syncConfigured } from "@/lib/supabase";
import { syncNow, useSyncState, type SyncStatus } from "@/lib/sync";

export const Route = createFileRoute("/compte")({ component: ComptePage });

const STATUS_TEXT: Record<SyncStatus, string> = {
  off: "Non connecté",
  syncing: "Synchronisation en cours…",
  synced: "Synchronisé",
  offline: "Hors-ligne — les changements partiront au retour du réseau",
  error: "Erreur de synchronisation",
};

function frenchError(e: unknown): string {
  const msg =
    e && typeof e === "object" && "message" in e ? String((e as { message: unknown }).message) : String(e);
  if (/invalid login credentials/i.test(msg)) return "Email ou mot de passe incorrect.";
  if (/already registered/i.test(msg)) return "Un compte existe déjà avec cet email. Connecte-toi.";
  if (/at least \d+ characters/i.test(msg)) return "Mot de passe trop court (8 caractères minimum).";
  if (/email not confirmed/i.test(msg)) return "Email pas encore confirmé. Vérifie ta boîte mail.";
  if (/rate limit/i.test(msg)) return "Trop de tentatives. Réessaie dans quelques minutes.";
  if (/failed to fetch|network/i.test(msg)) return "Pas de connexion internet.";
  return msg;
}

function ComptePage() {
  const { checked, status, email, lastSyncedAt, error } = useSyncState();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    setFormError(null);
    setInfo(null);
    try {
      if (mode === "signup") {
        const { data, error: err } = await sb.auth.signUp({ email: emailInput.trim(), password });
        if (err) throw err;
        if (!data.session) setInfo("Compte créé. Vérifie ta boîte mail pour confirmer, puis connecte-toi.");
      } else {
        const { error: err } = await sb.auth.signInWithPassword({ email: emailInput.trim(), password });
        if (err) throw err;
      }
      setPassword("");
    } catch (err) {
      setFormError(frenchError(err));
    } finally {
      setBusy(false);
    }
  }

  async function onSignOut() {
    const sb = getSupabase();
    if (!sb) return;
    setBusy(true);
    try {
      await syncNow(); // pousse les derniers changements avant de partir
      await sb.auth.signOut();
    } finally {
      setBusy(false);
    }
  }

  if (!syncConfigured) {
    return (
      <div className="mx-auto max-w-md forge-in">
        <PageHeader kicker="Compte" title="Synchronisation" />
        <p className="text-sm leading-relaxed text-muted">
          La synchronisation n'est pas encore configurée : les clés Supabase manquent. Forge reste 100 % local pour
          l'instant.
        </p>
      </div>
    );
  }

  if (!checked) {
    return (
      <div className="mx-auto max-w-md forge-in">
        <PageHeader kicker="Compte" title="Synchronisation" />
        <p className="text-sm text-muted">Chargement…</p>
      </div>
    );
  }

  if (email) {
    return (
      <div className="mx-auto max-w-md forge-in">
        <PageHeader kicker="Compte" title="Synchronisation" />
        <div className="space-y-6">
          <div className="space-y-1 rounded-lg bg-card px-4 py-4 shadow-[var(--shadow-border)]">
            <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-muted">Connecté</p>
            <p className="text-foreground">{email}</p>
            <p className="pt-2 text-sm text-muted">{STATUS_TEXT[status]}</p>
            {lastSyncedAt && status === "synced" && (
              <p className="text-xs text-faint">
                Dernière synchro :{" "}
                {new Date(lastSyncedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            {error && <p className="pt-1 text-xs text-muted">{error}</p>}
          </div>
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={() => void syncNow()} disabled={busy || status === "syncing"}>
              Synchroniser maintenant
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/">Retour à Forge</Link>
            </Button>
            <Button size="lg" variant="ghost" onClick={onSignOut} disabled={busy}>
              Se déconnecter
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md forge-in">
      <PageHeader kicker="Compte" title="Synchronisation" />
      <p className="mb-6 text-sm leading-relaxed text-muted">
        Connecte-toi pour retrouver ton Standard sur tous tes appareils.
      </p>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {formError && <p className="text-sm text-foreground">{formError}</p>}
        {info && <p className="text-sm text-muted">{info}</p>}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {mode === "signup" ? "Créer mon compte" : "Se connecter"}
        </Button>
        <Button
          type="button"
          size="lg"
          variant="ghost"
          className="w-full"
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setFormError(null);
            setInfo(null);
          }}
        >
          {mode === "signup" ? "J'ai déjà un compte" : "Pas de compte ? En créer un"}
        </Button>
      </form>
    </div>
  );
}
