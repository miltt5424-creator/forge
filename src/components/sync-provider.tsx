import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Cloud, CloudOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { getSupabase, syncConfigured } from "@/lib/supabase";
import { initSync, startSync, stopSync, useSyncState, type SyncStatus } from "@/lib/sync";

/** Branche la synchro : lit la session Supabase et lance / arrête la synchro. */
export function SyncProvider() {
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    const disposeSync = initSync();
    const { data } = sb.auth.onAuthStateChange((_event, session) => {
      // setTimeout : on n'appelle pas Supabase directement dans ce callback (risque de blocage)
      setTimeout(() => {
        if (session?.user) startSync(session.user.id, session.user.email ?? null);
        else stopSync();
        useSyncState.setState({ checked: true });
      }, 0);
    });
    return () => {
      data.subscription.unsubscribe();
      disposeSync();
    };
  }, []);
  return null;
}

const LABEL: Record<SyncStatus, string> = {
  off: "Compte",
  syncing: "Synchro…",
  synced: "Synchronisé",
  offline: "Hors-ligne",
  error: "Erreur synchro",
};

/** Lien vers la page Compte, avec l'état de la synchro. */
export function SyncLink({ compact = false }: { compact?: boolean }) {
  const status = useSyncState((s) => s.status);
  if (!syncConfigured) return null;
  const Icon = status === "offline" || status === "error" ? CloudOff : Cloud;
  return (
    <Link
      to="/compte"
      aria-label={LABEL[status]}
      className={cn(
        "flex items-center gap-3 text-sm transition-colors duration-150",
        compact
          ? "size-9 justify-center rounded-md text-muted hover:text-foreground"
          : "h-11 rounded-md px-3 text-muted hover:bg-card-2 hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" strokeWidth={1.75} />
      {!compact && LABEL[status]}
    </Link>
  );
}
