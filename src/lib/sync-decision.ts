/**
 * Décide quoi faire au moment de synchroniser (fonction pure, sans effet de bord).
 *  - push  : envoyer les données de cet appareil vers le cloud
 *  - pull  : remplacer les données de cet appareil par celles du cloud
 *  - ask   : les deux côtés ont des données → on demande à l'utilisateur
 *  - reset : les données locales appartiennent à un autre compte → on repart de zéro
 *  - noop  : rien à faire
 */
export type SyncAction = "push" | "pull" | "ask" | "reset" | "noop";

export interface SyncDecisionInput {
  userId: string;
  /** Compte auquel cet appareil est lié (null = jamais synchronisé). */
  metaUserId: string | null;
  /** Dernière modification locale connue (ISO), null si inconnue. */
  localAt: string | null;
  /** L'appareil contient un Standard (onboarding terminé). */
  localHasData: boolean;
  /** Ligne du cloud, ou null si le compte n'a encore rien enregistré. */
  remote: { updatedAt: string; hasData: boolean } | null;
}

export function decideSync(i: SyncDecisionInput): SyncAction {
  const sameAccount = i.metaUserId === i.userId;
  const neverLinked = i.metaUserId === null;

  if (!i.remote) {
    if (sameAccount || neverLinked) return i.localHasData ? "push" : "noop";
    return "reset";
  }

  if (sameAccount) {
    const remoteAt = Date.parse(i.remote.updatedAt) || 0;
    const localAt = i.localAt ? Date.parse(i.localAt) || 0 : 0;
    if (remoteAt > localAt) return "pull";
    if (localAt > remoteAt) return "push";
    return "noop";
  }

  if (neverLinked) {
    if (!i.localHasData) return "pull";
    if (!i.remote.hasData) return "push";
    return "ask";
  }

  return "pull";
}
