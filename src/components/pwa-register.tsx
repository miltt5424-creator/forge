import { useEffect } from "react";

/** Enregistre le service worker (production uniquement, pour ne pas gêner le dev). */
export function PwaRegister() {
  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
