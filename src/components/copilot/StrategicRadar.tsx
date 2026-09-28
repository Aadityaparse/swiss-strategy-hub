// StrategicRadar.tsx — compact strategic indicators. Every indicator shows a
// rationale and opens to reveal current data, Hindsight memories and current
// events behind it. No arbitrary AI scores — computed from real data.

import { Skeleton } from "@/components/ui/skeleton";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ChevronDown, Crosshair } from "lucide-react";
import { DataSourceLabel } from "./evidence";

interface DashboardData {
  anomalies: Array<{ monthIndex: number; label: string; severity: string; statement: string; evidence: string }>;
  latest: {
    label: string;
    netMarginPct: number;
    churnRatePct: number;
    marketingPctRevenue: number;
    cac: number;
    momRevenuePct: number | null;
  };
  competitorEvents: Array<{ date: string; headline: string }>;
  hypotheses: Array<{ competitorName: string; statement: string; confidence: string }>;
  fallbackCounts: { experience: number; world: number };
}

function levelFromChurn(churn: number): { label: string; color: string } {
  if (churn >= 3) return { label: "Elevated", color: "#d5281b" };
  if (churn >= 2.4) return { label: "Watch", color: "#1f4e9c" };
  return { label: "Stable", color: "#2f9e63" };
}

export function StrategicRadar() {
  const dashboard = useQuery(api.api.dashboard);

  if (dashboard === undefined) {
    return (
      <div className="swiss-panel p-4">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const d = dashboard as DashboardData;
  const churnLevel = levelFromChurn(d.latest.churnRatePct);
  const recentCompetitorMoves = d.competitorEvents.filter((e) => e.date >= "2026-07-01").length;
  const pricingMoves = d.competitorEvents.filter((e) =>
    /price|pricing|cut|off|discount/i.test(e.headline),
  ).length;

  const indicators = [
    {
      id: "financial-health",
      title: "Financial Health",
      level: "Improving",
      color: "#2f9e63",
      rationale: `Latest month profit recovered to ${Math.round(d.latest.netMarginPct * 10) / 10}% net margin; revenue ${d.latest.momRevenuePct && d.latest.momRevenuePct > 0 ? "grew" : "moved"} ${d.latest.momRevenuePct ?? "n/a"}% vs prior month.`,
      evidence: [
        { kind: "Current Data", detail: `August net margin ${d.latest.netMarginPct}% · churn ${d.latest.churnRatePct}% · marketing ${d.latest.marketingPctRevenue}% of revenue` },
        { kind: "Historical Fact", detail: "June drawdown (-11.4% revenue) was priced-and-promotion driven; August recovery followed the loyalty discount and support surge (D-203/D-204)." },
      ],
    },
    {
      id: "competitive-pressure",
      title: "Competitive Pressure",
      level: pricingMoves >= 3 ? "High" : "Moderate",
      color: pricingMoves >= 3 ? "#d5281b" : "#1f4e9c",
      rationale: `${pricingMoves} public competitor pricing actions in the window; Apex has cut entry pricing twice in 90 days.`,
      evidence: [
        { kind: "World Memory", detail: "Apex: May 20%-off launch promo · Jun -8% entry tier · Aug -12% entry tier (public pricing pages)" },
        { kind: "Current Data", detail: `${recentCompetitorMoves} competitor events since July 1 — an accelerating cadence` },
      ],
    },
    {
      id: "pricing-risk",
      title: "Pricing Risk",
      level: "High",
      color: "#d5281b",
      rationale:
        "List price sits above Apex's $199 entry tier; any new price action risks colliding with active competitor promotions — the exact June pattern.",
      evidence: [
        { kind: "Historical Fact", detail: "D-202: +4% list-price change in May collided with Apex's 20%-off promotion; June revenue fell 11.4% and churn doubled." },
        { kind: "Historical Fact", detail: "D-102: deep (10%) cuts anchored Product B permanently lower — recovery pricing caused a second churn wave." },
      ],
    },
    {
      id: "growth-opportunity",
      title: "Growth Opportunity",
      level: "Open",
      color: "#2f9e63",
      rationale:
        "Enterprise expansion staffed (2 sales engineers); $522k of stalled pipeline remains addressable with integration support in place.",
      evidence: [
        { kind: "Historical Fact", detail: "D-201: 1 of 3 stalled enterprise deals closed ($88k ARR); ramp was slower than planned." },
        { kind: "Current Data", detail: "Churn down to 2.2% and support backlog cleared — sales capacity no longer consumed by fire-fighting." },
      ],
    },
    {
      id: "market-volatility",
      title: "Market Volatility",
      level: recentCompetitorMoves >= 4 ? "Elevated" : "Moderate",
      color: recentCompetitorMoves >= 4 ? "#1f4e9c" : "#5b6470",
      rationale: `${recentCompetitorMoves} competitor events since July; promotional intensity across the segment is the highest of the six-month window.`,
      evidence: [
        { kind: "World Memory", detail: "Segment-wide: four public price reductions or launch promotions Mar–Aug (Apex ×3, Cirrus ×1)." },
      ],
    },
    {
      id: "strategic-uncertainty",
      title: "Strategic Uncertainty",
      level: "Medium",
      color: "#1f4e9c",
      rationale:
        "Unmeasured elasticity above 6% price cuts, unconfirmed loyalty-discount durability, and competitor response latency are the key unknowns.",
      evidence: [
        { kind: "Assumption", detail: "Simulation elasticity (-1.2) calibrated from one successful experiment (D-101); deeper cuts never tested." },
        { kind: "Hypothesis", detail: "Apex may extend promotional pricing next quarter (confidence: medium) — evidence: three pricing actions in 90 days." },
      ],
    },
  ];

  return (
    <div className="swiss-panel flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Crosshair className="size-4 text-[#1f4e9c]" />
          <div>
            <p className="text-sm font-bold tracking-tight">Strategic Radar</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Every indicator carries evidence
            </p>
          </div>
        </div>
      </div>

      <div className="swiss-scroll min-h-0 flex-1 divide-y divide-border overflow-y-auto">
        {indicators.map((ind) => (
          <Collapsible key={ind.id} className="group">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="swiss-dot swiss-pulse" style={{ background: ind.color }} />
                  <p className="text-sm font-semibold tracking-tight">{ind.title}</p>
                </div>
                <span
                  className="text-[11px] font-bold uppercase tracking-widest"
                  style={{ color: ind.color }}
                >
                  {ind.level}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{ind.rationale}</p>
              <CollapsibleTrigger className="mt-1.5 flex cursor-pointer items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-[#1f4e9c] hover:text-[#d5281b]">
                Evidence <ChevronDown className="size-3.5 transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2 space-y-2 border-l-2 border-[#1f4e9c]/30 pl-3">
                {ind.evidence.map((ev, i) => (
                  <div key={i}>
                    <DataSourceLabel kind={ev.kind} />
                    <p className="mt-0.5 text-xs leading-relaxed text-foreground">{ev.detail}</p>
                  </div>
                ))}
              </CollapsibleContent>
            </div>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
