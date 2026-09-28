// agent.ts — strategy reasoning orchestration. Determines whether historical
// memory is relevant to a question, recalls from the right Hindsight banks,
// runs the deterministic simulator when needed, and aggregates labeled
// evidence. The LLM (Hindsight reflect) explains; deterministic code computes.

"use node";

import type { ActionCtx } from "./_generated/server";
import {
  recallMemory,
  reflectMemory,
  type EvidenceSource,
} from "./hindsight_client";
import { computeFinancials, formatMoney } from "./financials";
import { describeScenario, runSimulation, type SimulationParams } from "./simulation";
import {
  COMPETITOR_EVENTS,
  COMPETITORS,
  OBSERVATIONS,
  TIMELINE_EVENTS,
} from "./mockdata";

// ------------------------------------------------- question classification

export type QuestionIntent =
  | "pricing_history" // "what happened last time we changed price?"
  | "profit_analysis" // "why did profit fall?"
  | "competitor" // competitor interpretation / risk
  | "simulation" // "what if ... 7% ..."
  | "lessons" // "what lessons should we carry forward?"
  | "general";

export function classifyQuestion(q: string): QuestionIntent {
  const s = q.toLowerCase();
  const asksHistory = /(last time|previously|history|historical|last year|past|before)/.test(s);
  const asksPricing = /(price|pricing|discount|cut|reduc)/.test(s);
  const asksProfit = /(profit|margin|revenue|fall|decline|drop|why)/.test(s);
  const asksCompetitor = /(competitor|apex|beacon|cirrus|rival|market)/.test(s);
  const asksSim = /(what if|simulate|scenario|would)/.test(s);
  const asksLessons = /(lesson|learn|carry forward|takeaway)/.test(s);

  if (asksLessons) return "lessons";
  if (asksSim && /\d/.test(s)) return "simulation";
  if (asksHistory && asksPricing) return "pricing_history";
  if (asksCompetitor) return "competitor";
  if (asksProfit) return "profit_analysis";
  if (asksSim) return "simulation";
  if (asksPricing) return "pricing_history";
  return "general";
}

/** Parse "reduce the price by 7%" / "-7%" style requests into sim params. */
export function parseSimParams(q: string): SimulationParams {
  const params: SimulationParams = {
    priceDeltaPct: 0,
    discountPct: 0,
    marketingDeltaPct: 0,
    volumeDeltaPct: 0,
    hiringDeltaPct: 0,
  };
  const s = q.toLowerCase();
  const priceMatch = s.match(/(?:price.{0,20}?|reduce(?:d)?\s+(?:the\s+)?price\s+by\s+|cut(?:ting)?\s+.*?by\s+|-\s*)(\d+(?:\.\d+)?)\s*%/);
  const marketingMatch = s.match(/marketing.{0,30}?(\d+(?:\.\d+)?)\s*%/);
  if (priceMatch) {
    const n = parseFloat(priceMatch[1]);
    const negative = /(reduce|cut|lower|drop|decrease|-)/.test(s);
    params.priceDeltaPct = negative ? -n : n;
  }
  if (marketingMatch) {
    const n = parseFloat(marketingMatch[1]);
    const negative = /(reduce|cut|lower|decrease|-)/.test(s);
    params.marketingDeltaPct = negative ? -n : n;
  }
  return params;
}

// ------------------------------------------------------- orchestration

export interface AskResult {
  answer: string;
  intent: QuestionIntent;
  operations: string[];
  evidence: Array<{ kind: string; label: string; detail: string }>;
  memoryMode: "live" | "fallback";
}

export async function askCopilot(
  ctx: ActionCtx,
  question: string,
): Promise<AskResult> {
  const intent = classifyQuestion(question);
  const operations: string[] = [];
  const evidence: AskResult["evidence"] = [];
  let memoryMode: "live" | "fallback" = "live";

  // 1. Recall from Hindsight — always attempt when the question plausibly
  //    touches history; competitor questions also search world memory.
  const financials = computeFinancials();

  let experienceSources: EvidenceSource[] = [];
  let worldSources: EvidenceSource[] = [];

  if (intent === "competitor") {
    const world = await recallMemory(ctx, {
      bank: "world",
      query: question,
      origin: "executive question",
    });
    worldSources = world.sources;
    memoryMode = world.mode;
    operations.push(`RECALL:world (${worldSources.length})`);
    const experience = await recallMemory(ctx, {
      bank: "experience",
      query: question,
      origin: "executive question",
    });
    experienceSources = experience.sources;
    operations.push(`RECALL:experience (${experienceSources.length})`);
  } else if (intent !== "general" || /price|profit|revenue|churn|marketing/.test(question.toLowerCase())) {
    const experience = await recallMemory(ctx, {
      bank: "experience",
      query: question,
      origin: "executive question",
    });
    experienceSources = experience.sources;
    memoryMode = experience.mode;
    operations.push(`RECALL:experience (${experienceSources.length})`);
    if (intent === "pricing_history" || intent === "simulation") {
      const world = await recallMemory(ctx, {
        bank: "world",
        query: "competitor pricing actions and promotions",
        origin: "executive question",
      });
      worldSources = world.sources;
      operations.push(`RECALL:world (${worldSources.length})`);
    }
  }

  // 2. Deterministic simulation when the question asks "what if ... N%".
  let simText = "";
  if (intent === "simulation") {
    const params = parseSimParams(question);
    const sim = runSimulation(params);
    operations.push(
      `SIMULATE (${describeScenario(params)})`,
    );
    evidence.push({
      kind: "Simulation",
      label: "Deterministic simulation — not a prediction",
      detail: `Scenario: ${describeScenario(params)}. Projected revenue ${formatMoney(sim.revenue)} (${sim.deltas.revenuePct >= 0 ? "+" : ""}${sim.deltas.revenuePct}% vs Aug), profit ${formatMoney(sim.profit)} (${sim.deltas.profitPct >= 0 ? "+" : ""}${sim.deltas.profitPct}%), margin ${sim.marginPct}% (${sim.deltas.marginPts >= 0 ? "+" : ""}${sim.deltas.marginPts} pts), units ${sim.units.toLocaleString()} (${sim.deltas.unitsPct >= 0 ? "+" : ""}${sim.deltas.unitsPct}%).`,
    });
    simText = `**Simulation (deterministic, from the scenario engine — not AI-generated numbers):** ${describeScenario(params)} → revenue ${formatMoney(sim.revenue)} (${sim.deltas.revenuePct >= 0 ? "+" : ""}${sim.deltas.revenuePct}%), profit ${formatMoney(sim.profit)} (${sim.deltas.profitPct >= 0 ? "+" : ""}${sim.deltas.profitPct}%), margin ${sim.marginPct}% (${sim.deltas.marginPts >= 0 ? "+" : ""}${sim.deltas.marginPts} pts).`;
  }

  // 3. Current data (deterministic) as evidence.
  const latest = financials.latest;
  evidence.push({
    kind: "Current Data",
    label: "Six-month financial engine",
    detail: `Latest month (${latest.label}): revenue ${formatMoney(latest.revenue)}, net margin ${latest.netMarginPct}%, churn ${latest.churnRatePct}%. Notable anomalies: ${financials.anomalies.map((a) => a.statement).join(" ") || "none detected"}`,
  });

  // 4. Historical evidence from recalled memories.
  for (const s of experienceSources.slice(0, 4)) {
    evidence.push({
      kind: "Historical Fact",
      label: `Experience memory (${s.date || "undated"})`,
      detail: s.text,
    });
  }
  for (const s of worldSources.slice(0, 4)) {
    evidence.push({
      kind: "World Memory",
      label: `Competitor/market memory (${s.date || "undated"})`,
      detail: s.text,
    });
  }

  // 5. Reflect for AI interpretation — the LLM explains using memory;
  //    numbers come from the deterministic engine, not the LLM.
  const reflectBank =
    intent === "competitor" && worldSources.length >= experienceSources.length
      ? "world"
      : "experience";
  const reflect = await reflectMemory(ctx, {
    bank: reflectBank,
    query: `${question}\n\nContext from the deterministic financial engine (use these numbers as given, do not recompute): latest month revenue ${formatMoney(latest.revenue)}, net margin ${latest.netMarginPct}%, churn ${latest.churnRatePct}%.${simText ? ` Simulation result: ${simText.replace(/\*\*/g, "")}` : ""}`,
    origin: "executive question",
  });
  operations.push(`REFLECT:${reflectBank} (${reflect.sources.length} sources)`);
  if (reflect.mode === "fallback") memoryMode = "fallback";

  // 6. Compose the final answer.
  const header =
    reflect.mode === "fallback"
      ? `> **[Fallback mode]** The self-hosted Hindsight server is unreachable, so this answer is synthesized from the labeled local fallback memory and deterministic calculations.\n\n`
      : "";
  const parts: string[] = [header + (reflect.answer ?? "")];
  if (simText) parts.push(simText);
  parts.push(
    `**AI Interpretation — for human decision.** This is an AI synthesis over organizational memory, not a recommendation to act. Every number above is either historical fact, current data from the financial engine, or a deterministic simulation.\n\n_AI recommends; humans decide._`,
  );
  const answer = parts.filter(Boolean).join("\n\n");

  return { answer, intent, operations, evidence, memoryMode };
}

// ------------------------------------------- competitor hypotheses

export interface CompetitorHypothesis {
  competitorId: string;
  competitorName: string;
  headline: string;
  statement: string;
  confidence: "low" | "medium" | "high";
  evidence: string[];
  basis: string;
}

/**
 * Rule-based hypotheses over public competitor events. Every output is
 * explicitly a hypothesis with listed evidence — never stated as fact.
 */
export function generateCompetitorHypotheses(): CompetitorHypothesis[] {
  const hypotheses: CompetitorHypothesis[] = [];
  const apex = COMPETITORS.find((c) => c.id === "apex")!;
  const apexEvents = COMPETITOR_EVENTS.filter((e) => e.competitorId === "apex");
  const pricingMoves = apexEvents.filter(
    (e) => e.kind === "pricing" || e.kind === "promotion",
  );

  if (pricingMoves.length >= 2) {
    hypotheses.push({
      competitorId: "apex",
      competitorName: apex.name,
      headline: "Continued promotional pressure",
      statement:
        "Apex Analytics may extend or repeat promotional pricing in the next quarter, most likely around renewal season.",
      confidence: "medium",
      evidence: [
        "May 19: 20%-off annual-plan launch promotion (public pricing page)",
        "Jun 26: entry tier cut 8% ($229 → $210) (public pricing page)",
        "Aug 8: entry tier cut a further 12% to $199 (public pricing page)",
        "Pattern: three pricing actions in roughly 90 days with an accelerating cadence",
      ],
      basis: "Observed pattern in public pricing events",
    });
  }
  hypotheses.push({
    competitorId: "apex",
    competitorName: apex.name,
    headline: "Two-front strategy: price down, enterprise up",
    statement:
      "By launching an enterprise package while cutting the entry tier, Apex is likely pursuing segment separation — defending the low end on price while moving upmarket. Expect targeted SMB switch offers rather than across-the-board cuts.",
    confidence: "medium",
    evidence: [
      "Aug 20: enterprise package launch at $1,499/month with SSO and dedicated CSM (press release)",
      "Aug 8: entry tier reduced 12% to $199 (public pricing page)",
      "Jul 30: 'Switch & Save' campaign offering 3 months free to switching teams (LinkedIn ads)",
    ],
    basis: "Observed product + pricing + campaign events",
  });
  const beacon = COMPETITORS.find((c) => c.id === "beacon")!;
  hypotheses.push({
    competitorId: "beacon",
    competitorName: beacon.name,
    headline: "Vertical bundling in logistics",
    statement:
      "Beacon Metrics may bundle analytics with logistics-ERP procurement and target our logistics accounts; a co-marketing push is a likely next step.",
    confidence: "low",
    evidence: [
      "Jun 10: partnership with LogiChain for the logistics vertical (joint press release)",
      "Aug 14: $24M Series B earmarked for enterprise features and inside sales (tech press)",
    ],
    basis: "Observed partnership and funding events",
  });
  return hypotheses;
}

// ------------------------------------------------- strategy brief

export interface StrategyBrief {
  executiveSummary: string[];
  currentState: string[];
  historicalEvidence: string[];
  competitiveContext: string[];
  scenarioAnalysis: string[];
  keyRisks: string[];
  opportunities: string[];
  assumptions: string[];
  aiHypotheses: string[];
  relevantMemory: string[];
  humanDecision: string;
}

export async function buildStrategyBrief(
  ctx: ActionCtx,
): Promise<{ brief: StrategyBrief; mode: "live" | "fallback" }> {
  const financials = computeFinancials();
  const latest = financials.latest;
  const mode: "live" | "fallback" = "live";

  const reflect = await reflectMemory(ctx, {
    bank: "experience",
    query:
      "Reflect on the last six months of decisions and outcomes: which strategies worked, which failed, which were ambiguous, and what patterns explain the results? What should leadership carry forward?",
    origin: "strategy brief",
  });
  const worldReflect = await reflectMemory(ctx, {
    bank: "world",
    query:
      "Summarize the competitive situation: what have competitors done over the last six months, what patterns exist, and what are the plausible hypotheses about their next moves? Present future actions as hypotheses with evidence.",
    origin: "strategy brief",
  });

  const brief: StrategyBrief = {
    executiveSummary: [
      `Revenue for the six-month window is ${formatMoney(financials.totals.revenue)} at a ${financials.totals.netMarginPct}% net margin; the latest month (${latest.label}) shows revenue ${formatMoney(latest.revenue)} and profit ${formatMoney(latest.netProfit)}.`,
      `June remains the structural turning point: revenue fell 11.4% against a competitor promotion while our +4% list-price change was in market; churn spiked to 2.6% before recovery measures brought it to 2.2% by August.`,
      `Hindsight memory shows the consistent pattern: small (≤5%) price moves on Product A converted to volume (D-101), deep (10%) cuts anchored a permanently lower price (D-102), and the one untested combination — a price increase during an active competitor promotion — is what produced the June drawdown (D-202).`,
    ],
    currentState: [
      `Latest month: revenue ${formatMoney(latest.revenue)}, expenses ${formatMoney(latest.expenses)}, net profit ${formatMoney(latest.netProfit)} (${latest.netMarginPct}% margin).`,
      `Churn ${latest.churnRatePct}% (${latest.churnedCustomers} accounts) — down from the July peak of 3.1% after the support surge (D-204) and loyalty discount (D-203).`,
      `Marketing is ${latest.marketingPctRevenue}% of revenue; CAC $${latest.cac} against a six-month average of $${financials.totals.avgCac}.`,
      `Enterprise expansion (D-201) has closed ${"$88k"} ARR of the $610k stalled pipeline so far; two sales engineers are ramping.`,
    ],
    historicalEvidence: reflect.sources.slice(0, 6).map((s) => `${s.date ? `(${s.date}) ` : ""}${s.text}`),
    competitiveContext: [
      "Apex Analytics ran three public pricing actions in 90 days (May promotion, June -8%, August -12% entry) while launching upmarket (enterprise package, Aug 20).",
      "Beacon Metrics is bundling into logistics via the LogiChain partnership (Jun 10) and just raised a $24M Series B earmarked for enterprise and inside sales (Aug 14).",
      "Cirrus Data is cutting its starter price (-5%, Jul 18) — generalized price pressure at the low end of the segment.",
    ],
    scenarioAnalysis: [
      "Deterministic simulation baseline: August 2026 actuals (revenue $468.3k, profit $25.4k, margin 5.4%).",
      "Historical response curve: ≤5% cuts on Product A lifted volume 4–6.8% at ≤1.5 margin points; 10% cuts on Product B recovered renewals but permanently ceded 6.2 margin points (D-102).",
      "The elasticity used by the simulator (-1.2) is calibrated from D-101 only; deeper cuts are an extrapolation and are labeled as assumptions in every simulation.",
    ],
    keyRisks: [
      "Pricing risk: renewed competitor promotions overlapping any new price action — the exact pattern that produced the June drawdown.",
      "Churn risk: price-sensitive SMB cohorts churned at roughly twice baseline after the January 12% discount (D-103); discount-driven acquisition carries a 90-day churn tail.",
      "Execution risk: enterprise ramp is slower than planned (1 of 3 stalled deals closed); payroll stepped up in June regardless of outcome.",
    ],
    opportunities: [
      "Targeted (not blanket) pricing moves: D-101 and D-203 both show small, targeted actions converting without margin damage.",
      "Support-surge lever works when churn has an onboarding root cause (D-204): churn fell 3.1% → 2.2% within two months.",
      "Enterprise pipeline: $522k of stalled pipeline remains addressable with integration support now staffed.",
    ],
    assumptions: [
      "Simulations assume no competitor response; history suggests rivals react within ~4 weeks.",
      "Elasticity is calibrated from one successful experiment (D-101); the >6% price-cut region has never been tested.",
      "Loyalty-discount stabilization (D-203) is confirmed over one episode; durability beyond two billing cycles is unverified.",
      "Demo dataset represents a six-month window (Mar–Aug 2026) for one organization.",
    ],
    aiHypotheses: [
      "HYPOTHESIS (confidence: medium): Apex will extend promotional pricing into next quarter — based on three pricing actions in 90 days.",
      "HYPOTHESIS (confidence: medium): A modest, targeted price adjustment on Product A (≤5%) would hold margin if timed away from competitor promotions — based on D-101/D-202 contrast.",
      "HYPOTHESIS (confidence: low): Beacon will bundle analytics into logistics-ERP procurement — based on the LogiChain partnership and Series B hiring plans.",
    ],
    relevantMemory: [
      ...worldReflect.sources.slice(0, 4).map((s) => `[World] ${s.date ? `(${s.date}) ` : ""}${s.text}`),
      ...reflect.sources.slice(0, 6).map((s) => `[Experience] ${s.date ? `(${s.date}) ` : ""}${s.text}`),
    ],
    humanDecision:
      "AI recommends; humans decide. This brief does not execute any action. Record the chosen direction in Decision Memory — the decision, rationale and eventual outcome will be retained into Hindsight so the next decision starts from experience.",
  };

  return { brief, mode };
}

// ------------------------------------------------ timeline helpers

export function timelineForMonth(monthIndex: number) {
  return TIMELINE_EVENTS.filter((e) => e.monthIndex === monthIndex);
}

export function observationTitles() {
  return OBSERVATIONS.map((o) => ({ id: o.id, date: o.date, text: o.text }));
}
