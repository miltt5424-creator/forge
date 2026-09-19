import { useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, CalendarRange, Hammer, Quote, Sunrise } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForgeStore } from "@/lib/store";
import { Onboarding } from "@/components/onboarding";
import { SyncLink } from "@/components/sync-provider";

const NAV = [
  { to: "/", label: "Jour", icon: Sunrise },
  { to: "/habits", label: "Habitudes", icon: Hammer },
  { to: "/constancy", label: "Constance", icon: CalendarRange },
  { to: "/review", label: "Revue", icon: BookOpen },
  { to: "/identity", label: "Identité", icon: Quote },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const onboardingComplete = useForgeStore((s) => s.onboardingComplete);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    void useForgeStore.persist.rehydrate();
  }, []);

  if (!onboardingComplete) {
    // La page Compte reste accessible pour se connecter depuis un nouvel appareil
    if (pathname === "/compte") {
      return <div className="min-h-dvh bg-background px-4 py-10 sm:px-8">{children}</div>;
    }
    return <Onboarding />;
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-52 flex-col border-r border-border bg-background lg:flex">
        <div className="px-6 pt-8 pb-10">
          <Link to="/" className="font-display text-xl uppercase tracking-[0.38em] text-foreground">
            Forge
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors duration-150",
                  active ? "bg-card text-foreground" : "text-muted hover:bg-card-2 hover:text-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" strokeWidth={1.75} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 pb-3">
          <SyncLink />
        </div>
        <p className="px-6 pb-6 text-[0.6875rem] uppercase tracking-[0.18em] text-faint">
          Exigence. Pas de score.
        </p>
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm lg:hidden">
        <Link to="/" className="font-display text-lg uppercase tracking-[0.38em]">
          Forge
        </Link>
        <div className="flex items-center gap-2">
          <SyncLink compact />
          <span className="text-[0.6875rem] uppercase tracking-[0.16em] text-muted">Standard</span>
        </div>
      </header>

      <main className="px-4 pb-28 pt-6 sm:px-8 lg:ml-52 lg:px-12 lg:pb-16 lg:pt-10">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden">
        <ul className="grid grid-cols-5">
          {NAV.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex h-14 flex-col items-center justify-center gap-1 text-[0.625rem] uppercase tracking-[0.12em] transition-colors duration-150",
                    active ? "text-foreground" : "text-faint",
                  )}
                >
                  <item.icon className="size-4" strokeWidth={active ? 2 : 1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
