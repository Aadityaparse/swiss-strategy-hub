// StrategyCanvas.tsx — the what-if Strategy Canvas. Levers write scenario
// parameters; the deterministic simulation engine computes projections on the
// backend; Hindsight recall accompanies every non-baseline run as historical
// evidence. Simulations are labeled as simulations, never predictions.

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { GitBranch, Landmark, Loader2 } from "lucide-react";
import { DataSourceLabel, WhyHover } from "./evidence";

interface SimResult {
  params: {
    priceDeltaPct: number;
    discountPct: number;
    marketingDeltaPct: number;
    volumeDeltaPct: number;
    hiringDeltaPct: number;
  };
  scenario: string;
  simulation: {
    revenue: number;
    costs: number;
    profit: number;
    marginPct: number;
    units: number;
    asp: number;
    deltas: {
      revenuePct: number;
      costsPct: number;
      profitPct: number;
      marginPts: number;
      unitsPct: number;
    };
    assumptions: string[];
  };
  historicalEvidence: Array<{ text: string; type: string; date: string; kind: string }>;
  historicalMode: "live" | "fallback";
}

interface LatestMonth {
  label: string;
  revenue: number;
  netProfit: number;
  netMarginPct: number;
  unitsSold: number;
}

function Delta({ pct, pts = false }: { pct: number; pts?: boolean }) {
  const positive = pct > 0;
  const neutral = pct === 0;
  return (
    <span
      className={`swiss-num text-xs font-semibold ${
        neutral ? "text-muted-foreground" : positive ? "text-[#1f4e9c]" : "text-[#d5281b]"
      }`}
    >
      {neutral ? "±0" : positive ? "+" : ""}
      {pct}
      {pts ? " pts" : "%"}
    </span>
  );
}

function fmtK(n: number): string {
  return `$${Math.round(n / 1000)}k`;
}

export function StrategyCanvas() {
  const financials = useQuery(api.api.financials);
  const simulate = useAction(api.actions.simulate);

  const [params, setParams] = useState({
    priceDeltaPct: -7,
    discountPct: 0,
    marketingDeltaPct: 0,
    volumeDeltaPct: 0,
    hiringDeltaPct: 0,
  });
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runIdRef = useRef(0);

  const runNow = useCallback(
    async (p: typeof params) => {
      const runId = ++runIdRef.current;
      setRunning(true);
      try {
        const res = await simulate({ ...p, recall: true });
        if (runIdRef.current === runId) setResult(res as unknown as SimResult);
      } catch {
        if (runIdRef.current === runId) setResult(null);
      } finally {
        if (runIdRef.current === runId) setRunning(false);
      }
    },
    [simulate],
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runNow(params);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [params, runNow]);

  const latest: LatestMonth | undefined = financials?.latest;
  const sim = result?.simulation;
  const isBaseline = Object.values(result?.params ?? params).every((v) => v === 0);

  const leverDefs: Array<{
    key: keyof typeof params;
    label: string;
    min: number;
    max: number;
    step?: number;
    suffix: string;
  }> = [
    { key: "priceDeltaPct", label: "Product A price", min: -20, max: 20, suffix: "%" },
    { key: "discountPct", label: "Promo discount", min: 0, max: 15, suffix: "%" },
    { key: "marketingDeltaPct", label: "Marketing budget", min: -30, max: 50, suffix: "%" },
    { key: "volumeDeltaPct", label: "Sales target / volume", min: -20, max: 20, suffix: "%" },
    { key: "hiringDeltaPct", label: "Payroll level", min: -20, max: 50, suffix: "%" },
  ];

  return (
    <div className="swiss-panel flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <GitBranch className="size-4 text-[#1f4e9c]" />
          <div>
            <p className="text-sm font-bold tracking-tight">Strategy Canvas</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Deterministic projection · baseline {latest?.label ?? "—"} actuals
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer text-xs"
          onClick={() =>
            setParams({ priceDeltaPct: 0, discountPct: 0, marketingDeltaPct: 0, volumeDeltaPct: 0, hiringDeltaPct: 0 })
          }
        >
          Reset to baseline
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 gap-0 md:grid-cols-2">
        {/* Levers */}
        <div className="space-y-5 border-b border-border p-4 md:border-b-0 md:border-r">
          {leverDefs.map((lever) => (
            <div key={lever.key}>
              <div className="flex items-baseline justify-between">
                <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {lever.label}
                </label>
                <span className="swiss-num text-sm font-bold">
                  {params[lever.key] > 0 ? "+" : ""}
                  {params[lever.key]}
                  {lever.suffix}
                </span>
              </div>
              <Slider
                className="mt-2 cursor-pointer"
                value={[params[lever.key]]}
                min={lever.min}
                max={lever.max}
                step={lever.step ?? 1}
                onValueChange={(v) =>
                  setParams((prev) => ({ ...prev, [lever.key]: v[0] ?? 0 }))
                }
              />
            </div>
          ))}
          <div className="border-t border-border pt-3">
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Scenario: <span className="font-medium text-foreground">{result?.scenario ?? "—"}</span>
              {running && <Loader2 className="ml-2 inline size-3 animate-spin text-[#1f4e9c]" />}
            </p>
          </div>
        </div>

        {/* Results */}
        <div className="flex min-h-0 flex-col">
          <div className="grid grid-cols-2 gap-px bg-border">
            {[
              { label: "Projected revenue", value: sim ? fmtK(sim.revenue) : "—", delta: sim?.deltas.revenuePct },
              { label: "Projected costs", value: sim ? fmtK(sim.costs) : "—", delta: sim?.deltas.costsPct },
              { label: "Projected profit", value: sim ? fmtK(sim.profit) : "—", delta: sim?.deltas.profitPct },
              { label: "Projected margin", value: sim ? `${sim.marginPct}%` : "—", delta: sim?.deltas.marginPts, pts: true },
              { label: "Unit volume", value: sim ? sim.units.toLocaleString() : "—", delta: sim?.deltas.unitsPct },
              { label: "Blended ASP", value: sim ? `$${sim.asp}` : "—", delta: undefined },
            ].map((cell) => (
              <div key={cell.label} className="bg-card p-3">
                <p className="swiss-kicker">{cell.label}</p>
                <div className="mt-1 flex items-baseline justify-between gap-2">
                  <p className="swiss-num text-xl font-bold tracking-tight">{cell.value}</p>
                  {cell.delta !== undefined && <Delta pct={cell.delta} pts={cell.pts} />}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DataSourceLabel kind="Simulation" />
                <span className="text-[11px] text-muted-foreground">
                  An estimate under stated assumptions — not a forecast, and not advice
                </span>
              </div>
              <WhyHover title="Assumptions">
                {(sim?.assumptions ?? []).map((a, i) => (
                  <p key={i} className="text-xs leading-relaxed text-muted-foreground">
                    · {a}
                  </p>
                ))}
              </WhyHover>
            </div>
          </div>

          {/* Historical evidence from Hindsight */}
          <div className="swiss-scroll min-h-0 flex-1 overflow-y-auto border-t border-border p-4">
            <div className="flex items-center justify-between">
              <p className="swiss-kicker">Historical evidence — recalled from Hindsight</p>
              {result?.historicalMode === "fallback" && (
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#d5281b]">
                  fallback
                </span>
              )}
            </div>
            {result === null && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Running first simulation…
              </div>
            )}
            {result && result.historicalEvidence.length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                No directly comparable prior experience found for this scenario.
              </p>
            )}
            <ul className="mt-3 space-y-2">
              {result?.historicalEvidence.map((h, i) => (
                <li key={i} className="border-l-2 border-[#1f4e9c]/40 pl-3">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {h.date || "undated"} · {h.kind}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-foreground">
                    {h.text.length > 260 ? h.text.slice(0, 260) + "…" : h.text}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
