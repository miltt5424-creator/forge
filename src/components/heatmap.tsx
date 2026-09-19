import { formatDayLong } from "@/lib/dates";
import { heatLevel, heatmapCells, type DayScore } from "@/lib/stats";
import type { EveningCheckin, Habit, MorningCheckin } from "@/lib/types";
import { cn } from "@/lib/utils";

const LEVEL = [
  "bg-heat-0",
  "bg-heat-1",
  "bg-heat-2",
  "bg-heat-3",
  "bg-heat-4",
] as const;

const DOW = ["L", "M", "M", "J", "V", "S", "D"];

export function Heatmap({
  habits,
  mornings,
  evenings,
  startedAt,
  weeks = 13,
}: {
  habits: Habit[];
  mornings: Record<string, MorningCheckin>;
  evenings: Record<string, EveningCheckin>;
  startedAt: string | null;
  weeks?: number;
}) {
  const cells = heatmapCells(weeks, habits, mornings, evenings, startedAt);
  const cols = Math.ceil(cells.length / 7);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="flex flex-col justify-between py-0.5 text-[0.625rem] leading-none text-faint">
          {DOW.map((d, i) => (
            <span key={`${d}-${i}`} className="flex h-3 items-center sm:h-3.5">
              {d}
            </span>
          ))}
        </div>
        <div
          className="grid w-full flex-1 gap-1"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gridTemplateRows: "repeat(7, minmax(0, 1fr))",
            gridAutoFlow: "column",
          }}
        >
          {cells.map((cell) => {
            const ratio = cell.score.coreRatio ?? cell.score.ratio;
            const hasData = ratio !== null;
            const level = heatLevel(ratio, cell.inFuture, hasData);
            return (
              <div
                key={cell.date}
                title={titleFor(cell.date, cell.score, cell.inFuture)}
                className={cn(
                  "aspect-square min-h-3 rounded-sm sm:min-h-3.5",
                  LEVEL[level],
                  cell.inFuture && "opacity-30",
                )}
              />
            );
          })}
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5 text-[0.625rem] uppercase tracking-[0.14em] text-faint">
        <span>Faible</span>
        {LEVEL.map((c) => (
          <span key={c} className={cn("size-2.5 rounded-sm", c)} />
        ))}
        <span>Tenu</span>
      </div>
    </div>
  );
}

function titleFor(date: string, score: DayScore, inFuture: boolean) {
  const label = formatDayLong(date);
  if (inFuture) return label;
  if (score.coreRatio === null && score.ratio === null) return `${label} — pas de donnée`;
  const pct = Math.round((score.coreRatio ?? score.ratio ?? 0) * 100);
  if (!score.closed) return `${label} — ${pct}% (journée non close)`;
  return `${label} — ${pct}% du Standard`;
}
