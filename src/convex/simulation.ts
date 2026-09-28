// simulation.ts — deterministic what-if strategy simulation. Pure functions:
// no LLM, no I/O. The Strategy Canvas and the simulate API use this module.

import { DEMO_MONTHS } from "./mockdata";

export interface SimulationParams {
  priceDeltaPct: number; // -20..+20 — Product A list price change
  discountPct: number; // 0..15 — additional promo discount on top of list
  marketingDeltaPct: number; // -30..+50 — marketing budget change
  volumeDeltaPct: number; // -20..+20 — sales target / production volume
  hiringDeltaPct: number; // -20..+50 — payroll level change
}

export const DEFAULT_SIM_PARAMS: SimulationParams = {
  priceDeltaPct: 0,
  discountPct: 0,
  marketingDeltaPct: 0,
  volumeDeltaPct: 0,
  hiringDeltaPct: 0,
};

export interface SimulationResult {
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
}

export function clampParam(v: unknown, min: number, max: number, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function runSimulation(params: SimulationParams): SimulationResult {
  const p = {
    priceDeltaPct: clampParam(params.priceDeltaPct, -20, 20),
    discountPct: clampParam(params.discountPct, 0, 15),
    marketingDeltaPct: clampParam(params.marketingDeltaPct, -30, 50),
    volumeDeltaPct: clampParam(params.volumeDeltaPct, -20, 20),
    hiringDeltaPct: clampParam(params.hiringDeltaPct, -20, 50),
  };

  // Deterministic baseline = latest actual month (August 2026).
  const latest = DEMO_MONTHS[DEMO_MONTHS.length - 1];
  const baselineRevenue = latest.revenue;
  const baselineCosts =
    latest.cogs + latest.salaries + latest.marketing + latest.operations;
  const baselineProfit = baselineRevenue - baselineCosts;
  const baselineUnits = latest.unitsSold;

  // Effective price factor: price change less discount pass-through.
  const netPriceFactor = (1 + p.priceDeltaPct / 100) * (1 - p.discountPct / 100);
  // Demand response: elasticity -1.2 on net price (calibrated from D-101),
  // plus an explicit volume lever for sales targets / production decisions.
  const elasticity = -1.2;
  const demandFactor =
    Math.pow(netPriceFactor, elasticity) * (1 + p.volumeDeltaPct / 100);

  const newUnits = baselineUnits * demandFactor;
  const newPrice = (baselineRevenue / baselineUnits) * netPriceFactor;
  const newRevenue = newUnits * newPrice;

  // Costs: marketing and payroll follow their own levers; COGS + operations
  // scale with unit volume.
  const newMarketing = latest.marketing * (1 + p.marketingDeltaPct / 100);
  const newSalaries = latest.salaries * (1 + p.hiringDeltaPct / 100);
  const unitEconomics = (latest.cogs + latest.operations) / latest.unitsSold;
  const newCogsOps = unitEconomics * newUnits;

  const newCosts = newMarketing + newSalaries + newCogsOps;
  const newProfit = newRevenue - newCosts;
  const newMargin = (newProfit / newRevenue) * 100;
  const baselineMarginPct = (baselineProfit / baselineRevenue) * 100;

  const assumptions: string[] = [
    "Baseline: August 2026 actuals (latest closed month).",
    `Net price factor ${(netPriceFactor * 100).toFixed(1)}% of current blended ASP after list change and discount.`,
    "Demand elasticity -1.2 on net price, calibrated from D-101 (a 5% cut lifted volume 6.8%); the >6% region was never tested, so treat large cuts as an extrapolation.",
    "COGS + operations scale linearly with unit volume; marketing and payroll follow their own levers.",
    "No competitor response modeled — historical pattern (D-202, May 2026) suggests rivals react to price moves within ~4 weeks.",
  ];

  return {
    revenue: Math.round(newRevenue),
    costs: Math.round(newCosts),
    profit: Math.round(newProfit),
    marginPct: r1(newMargin),
    units: Math.round(newUnits),
    asp: r1(newPrice),
    deltas: {
      revenuePct: r1(((newRevenue - baselineRevenue) / baselineRevenue) * 100),
      costsPct: r1(((newCosts - baselineCosts) / baselineCosts) * 100),
      profitPct: r1(((newProfit - baselineProfit) / Math.abs(baselineProfit)) * 100),
      marginPts: r1(newMargin - baselineMarginPct),
      unitsPct: r1((demandFactor - 1) * 100),
    },
    assumptions,
  };
}

export function describeScenario(p: SimulationParams): string {
  const parts: string[] = [];
  if (p.priceDeltaPct !== 0)
    parts.push(`Product A price ${p.priceDeltaPct > 0 ? "+" : ""}${p.priceDeltaPct}%`);
  if (p.discountPct !== 0) parts.push(`${p.discountPct}% promo discount`);
  if (p.marketingDeltaPct !== 0)
    parts.push(`marketing budget ${p.marketingDeltaPct > 0 ? "+" : ""}${p.marketingDeltaPct}%`);
  if (p.volumeDeltaPct !== 0)
    parts.push(`volume target ${p.volumeDeltaPct > 0 ? "+" : ""}${p.volumeDeltaPct}%`);
  if (p.hiringDeltaPct !== 0)
    parts.push(`payroll level ${p.hiringDeltaPct > 0 ? "+" : ""}${p.hiringDeltaPct}%`);
  return parts.length ? parts.join(", ") : "no changes (baseline)";
}
