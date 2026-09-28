// FinancialJourney.tsx — the six-month financial journey: auto-generated
// charts (Recharts), deterministic KPIs, contextual anomaly annotations, and
// the decision/event overlay. All numbers come from the backend engine.

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Line as RechartsLine,
  CartesianGrid,
  ComposedChart,
  Line,
  Area,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { useState } from "react";
import { DataSourceLabel } from "./evidence";

interface MonthKpi {
  monthIndex: number;
  label: string;
  revenue: number;
  expenses: number;
  grossProfit: number;
  netProfit: number;
  netMarginPct: number;
  grossMarginPct: number;
  unitsSold: number;
  asp: number;
  marketing: number;
  marketingPctRevenue: number;
  churnRatePct: number;
  cac: number;
  customers: number;
  momRevenuePct: number | null;
  momProfitPct: number | null;
  momMarketingPct: number | null;
}

interface Anomaly {
  monthIndex: number;
  label: string;
  severity: "high" | "medium";
  statement: string;
  evidence: string;
}

interface TimelineEvent {
  id: string;
  date: string;
  monthIndex: number;
  kind: string;
  title: string;
  detail: string;
}

const kindColor: Record<string, string> = {
  decision: "#16181d",
  pricing: "#d5281b",
  marketing: "#1f4e9c",
  product: "#2e63c8",
  competitor: "#d5281b",
  financial: "#5b6470",
};

function compactMoney(n: number): string {
  return `$${Math.round(n / 1000)}k`;
}

export function FinancialJourney() {
  const financials = useQuery(api.api.financials);
  const timeline = useQuery(api.api.dashboard); // provides timeline + anomalies via one subscription
  const [metric, setMetric] = useState<"profit" | "revenue-expenses" | "margin" | "units-asp" | "marketing" | "kpi">("profit");

  const months = financials?.months ?? [];
  const anomalies = timeline?.anomalies ?? [];

  const data = months.map((m: MonthKpi) => ({
    ...m,
    churnDisplay: m.churnRatePct,
  }));

  const juneAnomaly = anomalies.find((a: Anomaly) => a.monthIndex === 4);

  return (
    <div className="swiss-panel flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-bold tracking-tight">Six-Month Financial Journey</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Deterministic engine · Mar – Aug 2026
          </p>
        </div>
        <Tabs value={metric} onValueChange={(v) => setMetric(v as typeof metric)}>
          <TabsList className="h-8">
            {[
              ["profit", "Profit"],
              ["revenue-expenses", "Rev vs Exp"],
              ["margin", "Margin"],
              ["units-asp", "Units / ASP"],
              ["marketing", "Marketing"],
              ["kpi", "KPI"],
            ].map(([v, l]) => (
              <TabsTrigger key={v} value={v} className="cursor-pointer px-2.5 text-[11px]">
                {l}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="swiss-rule mt-2 hidden md:block" />
        </Tabs>
      </div>

      <div className="relative min-h-0 flex-1 p-4">
        {financials === undefined ? (
          <div className="flex h-full items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        ) : (
          <div className="flex h-full flex-col">
            {/* Anomaly annotation banner */}
            {juneAnomaly && (
              <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-l-2 border-[#d5281b] bg-[#d5281b]/[0.04] px-3 py-2">
                <div>
                  <div className="flex items-center gap-2">
                    <DataSourceLabel kind="Current Data" />
                    <p className="text-xs font-semibold text-foreground">
                      {juneAnomaly.statement}
                    </p>
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{juneAnomaly.evidence}</p>
                </div>
              </div>
            )}

            <div className="h-64 w-full md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    axisLine={{ stroke: "var(--border)" }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => compactMoney(v)}
                    width={44}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 0,
                      border: "1px solid var(--border)",
                      fontSize: 12,
                    }}
                    formatter={(value: number | string, name: string) => [
                      typeof value === "number" ? value.toLocaleString() : value,
                      name,
                    ]}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="plainline" />

                  {metric === "profit" && (
                    <>
                      <RechartsLine dataKey="revenue" stroke="#9aa4b2" strokeWidth={1.5} name="Revenue" dot={false} />
                      <RechartsLine dataKey="expenses" stroke="#c9ced6" strokeWidth={1.5} strokeDasharray="4 3" name="Expenses" dot={false} />
                      <Area
                        type="linear"
                        dataKey="netProfit"
                        stroke="#16181d"
                        strokeWidth={2}
                        fill="#16181d"
                        fillOpacity={0.08}
                        name="Net profit"
                        dot={{ r: 2.5, fill: "#16181d" }}
                      />
                    </>
                  )}
                  {metric === "revenue-expenses" && (
                    <>
                      <RechartsLine dataKey="revenue" stroke="#1f4e9c" strokeWidth={2} name="Revenue" dot={{ r: 2.5, fill: "#1f4e9c" }} />
                      <RechartsLine dataKey="expenses" stroke="#d5281b" strokeWidth={2} name="Expenses" dot={{ r: 2.5, fill: "#d5281b" }} />
                    </>
                  )}
                  {metric === "margin" && (
                    <>
                      <RechartsLine
                        dataKey="netMarginPct"
                        stroke="#16181d"
                        strokeWidth={2}
                        name="Net margin %"
                        dot={{ r: 2.5, fill: "#16181d" }}
                      />
                      <RechartsLine
                        dataKey="grossMarginPct"
                        stroke="#1f4e9c"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        name="Gross margin %"
                        dot={false}
                      />
                    </>
                  )}
                  {metric === "units-asp" && (
                    <>
                      <RechartsLine dataKey="unitsSold" stroke="#1f4e9c" strokeWidth={2} name="Units" dot={{ r: 2.5, fill: "#1f4e9c" }} />
                      <RechartsLine dataKey="asp" stroke="#d5281b" strokeWidth={1.5} strokeDasharray="4 3" name="Avg selling price" dot={false} yAxisId="asp" />
                      <YAxis yAxisId="asp" orientation="right" hide />
                    </>
                  )}
                  {metric === "marketing" && (
                    <>
                      <RechartsLine dataKey="marketing" stroke="#1f4e9c" strokeWidth={2} name="Marketing spend" dot={{ r: 2.5, fill: "#1f4e9c" }} />
                      <RechartsLine dataKey="marketingPctRevenue" stroke="#d5281b" strokeWidth={1.5} strokeDasharray="4 3" name="% of revenue" dot={false} />
                    </>
                  )}
                  {metric === "kpi" && (
                    <>
                      <RechartsLine dataKey="churnRatePct" stroke="#d5281b" strokeWidth={2} name="Churn %" dot={{ r: 2.5, fill: "#d5281b" }} />
                      <RechartsLine dataKey="cac" stroke="#1f4e9c" strokeWidth={1.5} name="CAC $" dot={false} />
                    </>
                  )}

                  {/* June anomaly marker */}
                  {juneAnomaly && (
                    <ReferenceLine
                      x="Jun 2026"
                      stroke="#d5281b"
                      strokeDasharray="3 3"
                      label={{
                        value: "▼ anomaly",
                        position: "top",
                        fill: "#d5281b",
                        fontSize: 10,
                      }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Decision → Event → Outcome overlay strip */}
            <div className="mt-4 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <p className="swiss-kicker">Decision → Event → Outcome</p>
                <div className="flex flex-wrap gap-3 text-[10px] uppercase tracking-widest text-muted-foreground">
                  {Object.entries(kindColor).map(([k, c]) => (
                    <span key={k} className="flex items-center gap-1">
                      <span className="swiss-dot" style={{ background: c }} />
                      {k}
                    </span>
                  ))}
                </div>
              </div>
              <div className="swiss-scroll mt-2 grid grid-flow-col auto-cols-[minmax(150px,1fr)] gap-2 overflow-x-auto pb-1">
                {months.map((m: MonthKpi) => {
                  const events = (timeline?.timeline ?? []).filter(
                    (e: TimelineEvent) => e.monthIndex === m.monthIndex,
                  );
                  return (
                    <div key={m.monthIndex} className="border-l border-border pl-2">
                      <p className="swiss-num text-[11px] font-bold">{m.label}</p>
                      <div className="mt-1 space-y-1">
                        {events.length === 0 && (
                          <p className="text-[10px] text-muted-foreground/60">—</p>
                        )}
                        {events.map((e: TimelineEvent) => (
                          <p
                            key={e.id}
                            title={`${e.title} — ${e.detail}`}
                            className="cursor-help truncate text-[11px] leading-tight"
                            style={{ color: kindColor[e.kind] ?? "#5b6470" }}
                          >
                            ● {e.title}
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
