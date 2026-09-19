import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined;

/** true si les clés Supabase sont présentes (sinon Forge reste 100 % local). */
export const syncConfigured = Boolean(url && key);

type Sb = ReturnType<typeof createClient>;
let client: Sb | null = null;

/** Client Supabase, uniquement côté navigateur. */
export function getSupabase(): Sb | null {
  if (!syncConfigured || typeof window === "undefined") return null;
  client ??= createClient(url!, key!);
  return client;
}
