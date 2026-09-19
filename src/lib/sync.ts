import { create } from "zustand";
import { getSupabase } from "./supabase";
import { useForgeStore } from "./store";
import { decideSync } from "./sync-decision";
import type { ForgeData } from "./types";

const META_KEY = "forge:sync-meta:v1";
const TABLE = "forge_data";
const PUSH_DELAY_MS = 1500;

/** Ce que cet appareil sait de la synchro (stocké dans le navigateur). */
interface Meta {
  userId: string | null;
  localUpdatedAt: string | null;
}

const EMPTY: ForgeData = {
  onboardingComplete: false,
  startedAt: null,
  identity: "",
  identityUpdatedAt: null,
  habits: [],
  mornings: {},
  evenings: {},
  failures: [],
  reviews: {},
};

const WATCHED = Object.keys(EMPTY) as (keyof ForgeData)[];

export type SyncStatus = "off" | "syncing" | "synced" | "offline" | "error";

interface SyncState {
  /** true une fois la session Supabase lue au démarrage */
  checked: boolean;
  status: SyncStatus;
  userId: string | null;
  email: string | null;
  lastSyncedAt: string | null;
  error: string | null;
}

export const useSyncState = create<SyncState>(() => ({
  checked: false,
  status: "off",
  userId: null,
  email: null,
  lastSyncedAt: null,
  error: null,
}));

const setSync = (patch: Partial<SyncState>) => useSyncState.setState(patch);

function readMeta(): Meta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<Meta>;
      return { userId: p.userId ?? null, localUpdatedAt: p.localUpdatedAt ?? null };
    }
  } catch {
    /* ignore */
  }
  return { userId: null, localUpdatedAt: null };
}

function writeMeta(meta: Meta) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

function snapshot(): ForgeData {
  const s = useForgeStore.getState();
  return {
    onboardingComplete: s.onboardingComplete,
    startedAt: s.startedAt,
    identity: s.identity,
    identityUpdatedAt: s.identityUpdatedAt,
    habits: s.habits,
    mornings: s.mornings,
    evenings: s.evenings,
    failures: s.failures,
    reviews: s.reviews,
  };
}

function errMsg(e: unknown): string {
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return String(e);
}

const isOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;

let currentUserId: string | null = null;
let applying = false;
let running = false;
let rerun = false;
let pushTimer: ReturnType<typeof setTimeout> | undefined;

/** Applique des données venues du cloud sans les re-marquer comme "modifiées". */
function applyToStore(data: Partial<ForgeData>) {
  applying = true;
  try {
    useForgeStore.setState({ ...EMPTY, ...data });
  } finally {
    applying = false;
  }
}

async function push(userId: string) {
  const sb = getSupabase();
  if (!sb) return;
  const updatedAt = readMeta().localUpdatedAt ?? new Date().toISOString();
  const { error } = await sb
    .from(TABLE)
    .upsert({ user_id: userId, data: snapshot(), updated_at: updatedAt }, { onConflict: "user_id" });
  if (error) throw error;
  writeMeta({ userId, localUpdatedAt: updatedAt });
}

function schedulePush() {
  clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    const userId = currentUserId;
    if (!userId) return;
    if (isOffline()) {
      setSync({ status: "offline" });
      return;
    }
    setSync({ status: "syncing" });
    try {
      await push(userId);
      setSync({ status: "synced", lastSyncedAt: new Date().toISOString(), error: null });
    } catch (e) {
      setSync({ status: isOffline() ? "offline" : "error", error: errMsg(e) });
    }
  }, PUSH_DELAY_MS);
}

/** Compare cet appareil et le cloud, puis pousse ou tire selon le plus récent. */
export async function syncNow(): Promise<void> {
  const userId = currentUserId;
  const sb = getSupabase();
  if (!userId || !sb) return;
  if (running) {
    rerun = true;
    return;
  }
  running = true;
  clearTimeout(pushTimer);
  setSync({ status: "syncing", error: null });
  try {
    if (isOffline()) {
      setSync({ status: "offline" });
      return;
    }
    const { data: row, error } = await sb
      .from(TABLE)
      .select("data, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;

    const meta = readMeta();
    const remote = row
      ? { updatedAt: row.updated_at as string, data: (row.data ?? {}) as Partial<ForgeData> }
      : null;

    let action = decideSync({
      userId,
      metaUserId: meta.userId,
      localAt: meta.localUpdatedAt,
      localHasData: useForgeStore.getState().onboardingComplete,
      remote: remote
        ? { updatedAt: remote.updatedAt, hasData: Boolean(remote.data.onboardingComplete) }
        : null,
    });

    if (action === "ask") {
      const keepCloud = window.confirm(
        "Cet appareil et ton compte ont chacun un Standard.\n\n" +
          "OK = garder celui de ton compte (cloud)\n" +
          "Annuler = garder celui de cet appareil et écraser le cloud",
      );
      action = keepCloud ? "pull" : "push";
    }

    if (action === "pull" && remote) {
      applyToStore(remote.data);
      writeMeta({ userId, localUpdatedAt: remote.updatedAt });
    } else if (action === "push") {
      if (!meta.localUpdatedAt) writeMeta({ userId, localUpdatedAt: new Date().toISOString() });
      await push(userId);
    } else if (action === "reset") {
      applyToStore(EMPTY);
      writeMeta({ userId, localUpdatedAt: null });
    } else {
      writeMeta({ userId, localUpdatedAt: meta.localUpdatedAt });
    }
    setSync({ status: "synced", lastSyncedAt: new Date().toISOString(), error: null });
  } catch (e) {
    setSync({ status: isOffline() ? "offline" : "error", error: errMsg(e) });
  } finally {
    running = false;
    if (rerun) {
      rerun = false;
      void syncNow();
    }
  }
}

export function startSync(userId: string, email: string | null) {
  if (currentUserId === userId) return;
  currentUserId = userId;
  setSync({ userId, email, status: "syncing", error: null });
  const stopWaiting = whenHydrated(() => {
    if (currentUserId === userId) void syncNow();
  });
  void stopWaiting;
}

export function stopSync() {
  currentUserId = null;
  clearTimeout(pushTimer);
  setSync({ userId: null, email: null, status: "off", error: null });
}

/** Attend que le store ait relu le localStorage avant de commencer. */
function whenHydrated(cb: () => void): () => void {
  const p = useForgeStore.persist;
  if (p.hasHydrated()) {
    cb();
    return () => {};
  }
  return p.onFinishHydration(() => cb());
}

/**
 * À appeler une fois (côté navigateur) :
 *  - note chaque vraie modification locale (même déconnecté)
 *  - pousse vers le cloud 1,5 s après la dernière modification (si connecté)
 *  - re-synchronise au retour sur l'appli et au retour du réseau
 */
export function initSync(): () => void {
  let disposed = false;
  let unsubStore: (() => void) | undefined;

  const stopWaiting = whenHydrated(() => {
    if (disposed) return;
    unsubStore = useForgeStore.subscribe((state, prev) => {
      if (applying) return;
      if (!WATCHED.some((k) => state[k] !== prev[k])) return;
      writeMeta({ ...readMeta(), localUpdatedAt: new Date().toISOString() });
      if (currentUserId) schedulePush();
    });
  });

  const onVisible = () => {
    if (document.visibilityState === "visible") void syncNow();
  };
  const onOnline = () => void syncNow();
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", onOnline);

  return () => {
    disposed = true;
    stopWaiting();
    unsubStore?.();
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("online", onOnline);
  };
}
