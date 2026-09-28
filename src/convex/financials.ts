// financials.ts — deterministic financial analytics. Pure functions only:
// no LLM, no I/O. Every number shown in the UI comes from here.

import { DEMO_MONTHS, type MonthRaw } from "./mockdata";

export interface MonthKpi {
  monthIndex: number;
  label: string;
  date: string;
  revenue: number;
  expenses: number;
  cogs: number;
  grossProfit: number;
  grossMarginPct: number;
  netProfit: number;
  netMarginPct: number;
  unitsSold: number;
  asp: number; // average selling price
  marketing: number;
  marketingPctRevenue: number;
  newCustomers: number;
  churnedCustomers: number;
  customers: number; // end of month
  customersStart: number;
  churnRatePct: number;
  cac: number;
  momRevenuePct: number | null; // vs previous month
  momExpensesPct: number | null;
  momProfitPct: number | null;
  momMarketingPct: number | null;
}

export interface Anomaly {
  monthIndex: number;
  label: string;
  severity: "high" | "medium";
  statement: string;
  evidence: string;
}

export interface CompanyFinancials {
  months: MonthKpi[];
  totals: {
    revenue: number;
    expenses: number;
    netProfit: number;
    grossProfit: number;
    netMarginPct: number;
    grossMarginPct: number;
    unitsSold: number;
    avgAsp: number;
    avgCac: number;
    avgChurnPct: number;
    marketingTotal: number;
  };
  latest: MonthKpi;
  growthLatestPct: number;
  anomalies: Anomaly[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round0 = (n: number) => Math.round(n);

export function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return round1(((current - previous) / Math.abs(previous)) * 100);
}

export function computeMonthlyKpis(raw: MonthRaw[]): MonthKpi[] {
  const out: MonthKpi[] = [];
  for (let i = 0; i < raw.length; i++) {
    const m = raw[i];
    const expenses = m.cogs + m.salaries + m.marketing + m.operations;
    const grossProfit = m.revenue - m.cogs;
    const netProfit = m.revenue - expenses;
    const customersStart = m.customers - m.newCustomers + m.churnedCustomers;
    const prev = i > 0 ? out[i - 1] : null;

    out.push({
      monthIndex: m.monthIndex,
      label: m.label,
      date: m.date,
      revenue: m.revenue,
      expenses: round0(expenses),
      cogs: m.cogs,
      grossProfit: round0(grossProfit),
      grossMarginPct: round1((grossProfit / m.revenue) * 100),
      netProfit: round0(netProfit),
      netMarginPct: round1((netProfit / m.revenue) * 100),
      unitsSold: m.unitsSold,
      asp: round1(m.revenue / m.unitsSold),
      marketing: m.marketing,
      marketingPctRevenue: round1((m.marketing / m.revenue) * 100),
      newCustomers: m.newCustomers,
      churnedCustomers: m.churnedCustomers,
      customers: m.customers,
      customersStart,
      churnRatePct: round1((m.churnedCustomers / customersStart) * 100),
      cac: round0(m.marketing / m.newCustomers),
      momRevenuePct: prev ? pctChange(m.revenue, prev.revenue) : null,
      momExpensesPct: prev ? pctChange(expenses, prev.expenses) : null,
      momProfitPct: prev ? pctChange(netProfit, prev.netProfit) : null,
      momMarketingPct: prev ? pctChange(m.marketing, prev.marketing) : null,
    });
  }
  return out;
}

const ANOMALY_THRESHOLD = 5; // percent MoM change worth surfacing

export function detectAnomalies(months: MonthKpi[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  for (let i = 1; i < months.length; i++) {
    const cur = months[i];
    const prev = months[i - 1];
    const parts: string[] = [];
    let severity: "high" | "medium" = "medium";

    if (cur.momRevenuePct !== null && Math.abs(cur.momRevenuePct) >= ANOMALY_THRESHOLD) {
      parts.push(
        `revenue ${cur.momRevenuePct > 0 ? "grew" : "declined"} ${Math.abs(cur.momRevenuePct)}%`,
      );
    }
    if (cur.momExpensesPct !== null && Math.abs(cur.momExpensesPct) >= ANOMALY_THRESHOLD) {
      parts.push(
        `expenses ${cur.momExpensesPct > 0 ? "rose" : "fell"} ${Math.abs(cur.momExpensesPct)}%`,
      );
    }
    if (cur.momMarketingPct !== null && Math.abs(cur.momMarketingPct) >= ANOMALY_THRESHOLD) {
      parts.push(
        `marketing spend ${cur.momMarketingPct > 0 ? "increased" : "decreased"} ${Math.abs(cur.momMarketingPct)}%`,
      );
    }
    if (cur.churnRatePct - prev.churnRatePct >= 0.5) {
      parts.push(
        `churn rose from ${prev.churnRatePct}% to ${cur.churnRatePct}% (${cur.churnedCustomers} accounts)`,
      );
      severity = "high";
    }
    if (
      cur.momProfitPct !== null &&
      cur.momProfitPct <= -15 &&
      cur.momRevenuePct !== null &&
      cur.momRevenuePct > 0
    ) {
      parts.push(`profit fell ${Math.abs(cur.momProfitPct)}% despite revenue growth`);
      severity = "high";
    }

    if (parts.length >= 2 || (parts.length === 1 && severity === "high")) {
      const statement =
        parts.length === 2
          ? `In ${cur.label}, ${parts[0]} while ${parts[1]}.`
          : `In ${cur.label}, ${parts.join("; ")}.`;
      anomalies.push({
        monthIndex: cur.monthIndex,
        label: cur.label,
        severity,
        statement,
        evidence: `Revenue ${cur.momRevenuePct ?? "n/a"}% MoM · Expenses ${cur.momExpensesPct ?? "n/a"}% MoM · Marketing ${cur.momMarketingPct ?? "n/a"}% MoM · Churn ${prev.churnRatePct}% → ${cur.churnRatePct}%`,
      });
    }
  }
  return anomalies;
}

export function computeFinancials(raw: MonthRaw[] = DEMO_MONTHS): CompanyFinancials {
  const months = computeMonthlyKpis(raw);
  const totalRevenue = months.reduce((s, m) => s + m.revenue, 0);
  const totalExpenses = months.reduce((s, m) => s + m.expenses, 0);
  const totalGross = months.reduce((s, m) => s + m.grossProfit, 0);
  const totalNet = months.reduce((s, m) => s + m.netProfit, 0);
  const totalUnits = months.reduce((s, m) => s + m.unitsSold, 0);
  const totalMarketing = months.reduce((s, m) => s + m.marketing, 0);
  const latest = months[months.length - 1];

  return {
    months,
    totals: {
      revenue: totalRevenue,
      expenses: totalExpenses,
      netProfit: totalNet,
      grossProfit: totalGross,
      netMarginPct: round1((totalNet / totalRevenue) * 100),
      grossMarginPct: round1((totalGross / totalRevenue) * 100),
      unitsSold: totalUnits,
      avgAsp: round1(totalRevenue / totalUnits),
      avgCac: round0(totalMarketing / months.reduce((s, m) => s + m.newCustomers, 0)),
      avgChurnPct: round1(months.reduce((s, m) => s + m.churnRatePct, 0) / months.length),
      marketingTotal: totalMarketing,
    },
    latest,
    growthLatestPct: latest.momRevenuePct ?? 0,
    anomalies: detectAnomalies(months),
  };
}

export function formatMoney(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${round1(n / 1_000_000)}M`;
  if (Math.abs(n) >= 1_000) return `$${Math.round(n / 1_000)}k`;
  return `$${n}`;
}
