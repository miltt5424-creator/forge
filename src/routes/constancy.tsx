import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Heatmap } from "@/components/heatmap";
import { PageHeader, Percent, Surface } from "@/components/bits";
import { useForgeStore } from "@/lib/store";
import { formatDayShort } from "@/lib/dates";
import { heldDays, respectPercent, windowScores } from "@/lib/stats";

export const Route = createFileRoute("/constancy")({ component: ConstancyPage });

function ConstancyPage() {
  const habits = useForgeStore((s) => s.habits);
  const mornings = useForgeStore((s) => s.mornings);
  const evenings = useForgeStore((s) => s.evenings);
  const startedAt = useForgeStore((s) => s.startedAt);

  const s7 = useMemo(
    () => windowScores(7, habits, mornings, evenings, startedAt),
    [habits, mornings, evenings, startedAt],
  );
  const s30 = useMemo(
    () => windowScores(30, habits, mornings, evenings, startedAt),
    [habits, mornings, evenings, startedAt],
  );
  const s90 = useMemo(
    () => windowScores(90, habits, mornings, evenings, startedAt),
    [habits, mornings, evenings, startedAt],
  );
  const chart = useMemo(() => {
    return windowScores(30, habits, mornings, evenings, startedAt, true).map((d) => ({
      date: d.date,
      label: formatDayShort(d.date),
      standard: d.coreRatio === null ? null : Math.round(d.coreRatio * 100),
      focus: d.ratio === null ? null : Math.round(d.ratio * 100),
    }));
  }, [habits, mornings, evenings, startedAt]);

  const held = heldDays(s30);
  const hasHistory = s30.some((s) => s.coreRatio !== null || s.ratio !== null);

  return (
    <div className="mx-auto max-w-3xl forge-in">
      <PageHeader kicker="Réalité, pas un score" title="Constance" />

      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <StatCard label="7 jours" value={respectPercent(s7, "core")} />
        <StatCard label="30 jours" value={respectPercent(s30, "core")} />
        <StatCard label="90 jours" value={respectPercent(s90, "core")} />
      </div>
      <p className="mt-3 text-sm text-muted">
        Pourcentage de respect du Standard — tes piliers, pas tes envies du jour.
        {held.total > 0 && (
          <>
            {" "}
            <span className="text-foreground tabular-nums">
              {held.held}/{held.total}
            </span>{" "}
            jours intacts sur 30.
          </>
        )}
      </p>

      <Surface className="mt-8">
        <h2 className="mb-5 font-display text-sm uppercase tracking-[0.18em] text-muted">
          90 jours
        </h2>
        {hasHistory ? (
          <Heatmap habits={habits} mornings={mornings} evenings={evenings} startedAt={startedAt} />
        ) : (
          <p className="text-sm leading-relaxed text-muted">
            La constance se voit ici. Pas demain. Aujourd'hui.
          </p>
        )}
      </Surface>

      <Surface className="mt-6">
        <h2 className="mb-5 font-display text-sm uppercase tracking-[0.18em] text-muted">
          Régularité · 30 jours
        </h2>
        {chart.some((d) => d.standard !== null) ? (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chart} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="rgba(237,235,230,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#5c5a55", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: "#5c5a55", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${v}`}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    background: "#141413",
                    border: "1px solid #2a2925",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#edebe6",
                  }}
                  formatter={(value) => [`${value}%`, ""]}
                  labelFormatter={(label) => String(label)}
                />
                <Line
                  type="monotone"
                  dataKey="standard"
                  stroke="#c8c4ba"
                  strokeWidth={1.75}
                  dot={false}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="focus"
                  stroke="#7a776f"
                  strokeWidth={1.25}
                  dot={false}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted">Rien à tracer tant qu'une journée n'est pas close.</p>
        )}
        <div className="mt-4 flex gap-6 text-[0.6875rem] uppercase tracking-[0.14em] text-muted">
          <span className="flex items-center gap-2">
            <i className="h-px w-4 bg-heat-4" /> Standard
          </span>
          <span className="flex items-center gap-2">
            <i className="h-px w-4 bg-heat-3" /> Focus
          </span>
        </div>
      </Surface>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number | null }) {
  return (
    <Surface className="text-center">
      <p className="text-[0.6875rem] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 font-display text-3xl font-medium tracking-wide sm:text-4xl">
        <Percent value={value} />
      </p>
    </Surface>
  );
}
