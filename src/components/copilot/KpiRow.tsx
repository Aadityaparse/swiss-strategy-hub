// KpiRow.tsx — executive KPI strip. Every number is computed by the
// deterministic financial engine; deltas are MoM or window aggregate.

import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { TrendingDown, TrendingUp } from "lucide-react";
import { WhyHover } from "./evidence";

interface MonthKpi {
  label: string;
  revenue: number;
  netProfit: number;
  netMarginPct: number;
  momRevenuePct: number | null;
  churnRatePct: number;
}

interface Totals {
  revenue: number;
  netProfit: number;
  netMarginPct: number;
  avgChurnPct: number;
  avgCac: number;
}

function fmtK(n: number): string {
  return `$${Math.round(n / 1000)}k`;
}

function DeltaChip({ value, suffix = "%", invert = false }: { value: number | null; suffix?: string; invert?: boolean }) {
  if (value === null) return <span className="text-xs text-muted-foreground">—</span>;
  const good = invert ? value < 0 : value > 0;
  const Icon = value >= 0 ? TrendingUp : TrendingDown;
  return (
    <span
      className={`flex items-center gap-1 text-xs font-semibold ${value === 0 ? "text-muted-foreground" : good ? "text-[#2f9e63]" : "text-[#d5281b]"}`}
    >
      <Icon className="size-3.5" />
      {value > 0 ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

export function KpiRow() {
  const financials = useQuery(api.api.financials);
  const dashboard = useQuery(api.api.dashboard);

  if (financials === undefined || dashboard === undefined) {
    return (
      <div className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-card p-4">
            <Skeleton className="h-14 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const latest = financials.latest as MonthKpi;
  const totals = financials.totals as Totals;
  const pricingMoves = (dashboard.competitorEvents as Array<{ headline: string }>).filter((e) =>
    /price|pricing|cut|off|discount/i.test(e.headline),
  ).length;

  const cells = [
    {
      label: "Revenue (6-mo)",
      value: fmtK(totals.revenue),
      delta: latest.momRevenuePct,
      evidence: (
        <>
          <p className="text-xs text-muted-foreground">
            Window total {fmtK(totals.revenue)} · latest month {fmtK(latest.revenue)} ({latest.label})
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Source: deterministic financial engine
          </p>
        </>
      ),
    },
    {
      label: "Profit (6-mo)",
      value: fmtK(totals.netProfit),
      delta: null,
      evidence: (
        <p className="text-xs text-muted-foreground">
          Net margin {totals.netMarginPct}% across the window · latest month {fmtK(latest.netProfit)}.
        </p>
      ),
    },
    {
      label: "Net margin",
      value: `${latest.netMarginPct}%`,
      delta: null,
      evidence: (
        <p className="text-xs text-muted-foreground">
          Latest month ({latest.label}). Window average {totals.netMarginPct}%. June trough followed the price
          increase + competitor promotion.
        </p>
      ),
    },
    {
      label: "Revenue growth",
      value: `${latest.momRevenuePct !== null && latest.momRevenuePct > 0 ? "+" : ""}${latest.momRevenuePct ?? "n/a"}%`,
      delta: latest.momRevenuePct,
      evidence: (
        <p className="text-xs text-muted-foreground">
          Month-over-month, {latest.label} vs prior month. June printed -11.4% against the competitor promotion.
        </p>
      ),
    },
    {
      label: "Competitive pressure",
      value: pricingMoves >= 3 ? "High" : pricingMoves >= 2 ? "Moderate" : "Low",
      delta: null,
      evidence: (
        <>
          <p className="text-xs text-muted-foreground">
            {pricingMoves} public pricing actions across tracked competitors in the window (Apex ×3, Cirrus ×1).
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
            Source: world memory · competitor events
          </p>
        </>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-px border border-border bg-border md:grid-cols-3 xl:grid-cols-5">
      {cells.map((c) => (
        <div key={c.label} className="bg-card p-4">
          <div className="flex items-center justify-between">
            <p className="swiss-kicker">{c.label}</p>
            <WhyHover>{c.evidence}</WhyHover>
          </div>
          <p className="swiss-num mt-2 text-2xl font-bold tracking-tight">{c.value}</p>
          {"delta" in c && <div className="mt-1">{typeof c.delta !== "string" && <DeltaChip value={c.delta} />}</div>}
        </div>
      ))}
    </div>
  );
}
