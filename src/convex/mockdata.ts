// mockdata.ts — six months of realistic company data for the Hindsight
// Strategy Co-Pilot prototype. Numbers are deliberately non-round and carry a
// coherent narrative: a pricing experiment (Month 4) that backfired against a
// competitor promotion, a support-cost surge (Month 5), and a recovery (Month 6).

// ---- Raw monthly financials (Mar 2026 – Aug 2026) ----

export interface MonthRaw {
  monthIndex: number; // 1..6
  label: string; // "Mar 2026"
  date: string; // ISO month-end
  revenue: number;
  cogs: number;
  salaries: number;
  marketing: number;
  operations: number;
  unitsSold: number;
  customers: number; // end of month
  newCustomers: number;
  churnedCustomers: number;
}

export const COMPANY = {
  name: "Northwind Instruments",
  sector: "B2B analytics hardware & SaaS",
  currency: "USD",
  periodLabel: "Mar 2026 – Aug 2026 (6 months)",
  baseline: "August 2026 (latest month)",
};

export const DEMO_MONTHS: MonthRaw[] = [
  { monthIndex: 1, label: "Mar 2026", date: "2026-03-31", revenue: 412_800, cogs: 214_600, salaries: 96_000, marketing: 38_400, operations: 41_200, unitsSold: 1_720, customers: 486, newCustomers: 38, churnedCustomers: 9 },
  { monthIndex: 2, label: "Apr 2026", date: "2026-04-30", revenue: 438_500, cogs: 225_400, salaries: 96_000, marketing: 36_100, operations: 43_100, unitsSold: 1_793, customers: 521, newCustomers: 44, churnedCustomers: 9 },
  { monthIndex: 3, label: "May 2026", date: "2026-05-31", revenue: 471_200, cogs: 242_800, salaries: 98_500, marketing: 41_700, operations: 44_300, unitsSold: 1_852, customers: 558, newCustomers: 47, churnedCustomers: 10 },
  { monthIndex: 4, label: "Jun 2026", date: "2026-06-30", revenue: 417_400, cogs: 219_500, salaries: 98_500, marketing: 45_100, operations: 46_800, unitsSold: 1_714, customers: 549, newCustomers: 33, churnedCustomers: 17 },
  { monthIndex: 5, label: "Jul 2026", date: "2026-07-31", revenue: 441_900, cogs: 233_900, salaries: 104_200, marketing: 42_800, operations: 56_800, unitsSold: 1_761, customers: 561, newCustomers: 34, churnedCustomers: 22 },
  { monthIndex: 6, label: "Aug 2026", date: "2026-08-31", revenue: 468_300, cogs: 245_200, salaries: 104_200, marketing: 44_600, operations: 48_900, unitsSold: 1_836, customers: 584, newCustomers: 42, churnedCustomers: 12 },
];

// ---- Decision records (Situation → Options → Action → Outcome → Lesson) ----

export interface DecisionRecord {
  ref: string;
  title: string;
  date: string;
  monthIndex: number; // 0 = historical (before the 6-month window), 1..6 = in window
  situation: string;
  options: string[];
  chosen: string;
  reason: string;
  expected: string;
  actual: string;
  impact: string;
  lesson: string;
  status: "successful" | "unsuccessful" | "ambiguous" | "pending";
}

export const HISTORICAL_DECISIONS: DecisionRecord[] = [
  {
    ref: "D-101",
    title: "5% price reduction on Product A",
    date: "2025-09-12",
    monthIndex: 0,
    situation:
      "Product A unit sales had been flat for two quarters while Apex Analytics undercut us on entry pricing.",
    options: [
      "Hold price and invest in bundling",
      "Reduce Product A list price by 5% ($240 → $228)",
      "Introduce volume discounts only",
    ],
    chosen: "Reduce Product A list price by 5% ($240 → $228).",
    reason:
      "Win-loss interviews showed price was the stated reason in 7 of 12 lost SMB deals; elasticity was believed to be favorable above a 6% cut.",
    expected: "Unit volume up 4–6% within two months; gross margin down less than 1.5 points.",
    actual:
      "Units rose 6.8% over the following two months and win rate on SMB deals improved from 31% to 38%; gross margin fell only 1.1 points.",
    impact: "≈ +$26k incremental monthly revenue for a ≈ $9k monthly margin give-up.",
    lesson:
      "Small (≤5%) cuts on Product A convert to volume when competitors are promotional; the elasticity cushion above 6% was never tested.",
    status: "successful",
  },
  {
    ref: "D-102",
    title: "10% price reduction on Product B",
    date: "2025-11-03",
    monthIndex: 0,
    situation:
      "Product B was losing renewals to Beacon Metrics' starter tier; leadership wanted to defend the base.",
    options: [
      "Match Beacon's starter price (-10%)",
      "Add services credit instead of a price cut",
      "Do nothing and accept churn",
    ],
    chosen: "Match Beacon's starter price with a 10% cut on Product B.",
    reason: "Sales leadership pushed for a fast, visible response before renewal season.",
    expected: "Hold renewals at 92%+; revenue roughly flat.",
    actual:
      "Renewals recovered to 93% but revenue per account fell; gross margin dropped 6.2 points and never recovered because the cut became permanent.",
    impact: "≈ -$31k monthly margin; the cut could not be reversed without a second churn wave.",
    lesson:
      "Deep (10%+) cuts on Product B anchor a permanently lower price — recovery pricing triggered a second churn wave the following year.",
    status: "unsuccessful",
  },
  {
    ref: "D-103",
    title: "12% holiday discount + marketing push",
    date: "2026-01-15",
    monthIndex: 0,
    situation: "Slow January pipeline; marketing proposed a bundled discount campaign.",
    options: [
      "12% discount plus $40k campaign",
      "8% discount plus $25k campaign",
      "Skip the campaign",
    ],
    chosen: "12% discount bundled with a $40k marketing campaign.",
    reason: "Board wanted an aggressive start to the year after a soft Q4 pipeline.",
    expected: "45–60 new customers in Q1 at CAC below $1,100.",
    actual:
      "Delivered 51 new customers but CAC reached $1,470 and 22% of discount cohort churned within 90 days, erasing most of the gain.",
    impact: "Roughly break-even on revenue; +$14k one-off cost, elevated Q2 churn tail.",
    lesson:
      "Steep discounts pull in low-fit customers — discount cohorts churned at roughly twice the baseline rate within 90 days.",
    status: "ambiguous",
  },
];

export const WINDOW_DECISIONS: DecisionRecord[] = [
  {
    ref: "D-201",
    title: "Enterprise expansion: hire 2 sales engineers + onboarding support",
    date: "2026-05-06",
    monthIndex: 3,
    situation:
      "Three enterprise opportunities stalled in Q2 for lack of integration support; pipeline value $610k.",
    options: [
      "Contract out integration work",
      "Hire 2 sales engineers + 1 onboarding specialist (~$5.7k/month added payroll)",
      "Defer expansion to H2",
    ],
    chosen: "Hire 2 sales engineers and 1 onboarding specialist.",
    reason: "Stalled deals cited integration effort, not price; payroll cost was recoverable from a single closed deal.",
    expected: "Two of three stalled deals closed by August; salaries step up in June.",
    actual:
      "One of three deals closed by August ($88k ARR); the sales-engineer ramp was slower than planned and salaries stepped up in June as expected.",
    impact: "Payroll +$5.7k/month from June; +$88k ARR closed so far.",
    lesson:
      "Enterprise expansion pays back slower than the sales cycle suggests — plan for a one-quarter engineer ramp.",
    status: "ambiguous",
  },
  {
    ref: "D-202",
    title: "Product A list price increase +4%",
    date: "2026-05-21",
    monthIndex: 3,
    situation:
      "Q1 margin pressure and a strong May gave an opening to lift Product A list price from $228 to $237.",
    options: [
      "Raise list price 4%",
      "Hold price, raise the entry tier only",
      "Raise price 4% with a loyalty discount for existing accounts",
    ],
    chosen: "Raise list price 4% with no loyalty discount at rollout.",
    reason: "D-101 suggested elasticity headroom and May revenue was at a six-month high.",
    expected: "Margin +2.5–3 points with less than 2% volume loss.",
    actual:
      "June revenue fell 11.4% against a competitor 20%-off promotion (Apex Analytics, May 19); churn doubled to 2.6% and 17 accounts left.",
    impact: "≈ -$54k June revenue vs May; margin plan inverted.",
    lesson:
      "The price increase collided with an active competitor promotion — timing against a rival campaign mattered more than the size of the increase.",
    status: "unsuccessful",
  },
  {
    ref: "D-203",
    title: "Roll back price increase + loyalty discount for churn-risk accounts",
    date: "2026-06-18",
    monthIndex: 4,
    situation:
      "June churn spiked to 2.6% (17 accounts) concentrated in accounts that saw the price increase.",
    options: [
      "Full rollback to $228",
      "Keep $237 list, offer 5% loyalty discount to churn-risk accounts for 2 billing cycles",
      "Hold price and increase retention spending",
    ],
    chosen: "Keep $237 list; grant a 5% loyalty discount to churn-risk accounts.",
    reason:
      "Churn was concentrated in price-affected cohorts; full rollback would repeat the D-102 anchoring problem.",
    expected: "Churn back under 2.2% within two months while keeping most of the list-price gain.",
    actual:
      "Churn fell from 2.6% to 2.2% by August; list price held, but net revenue per account is still below the May peak.",
    impact: "≈ -$3.4k/month discount cost; churn reduction valued at ≈ $9k/month retained revenue.",
    lesson:
      "A targeted loyalty discount stabilized price-driven churn within two billing cycles — confirm the pattern holds beyond this episode.",
    status: "successful",
  },
  {
    ref: "D-204",
    title: "Surge onboarding & support contractors",
    date: "2026-07-09",
    monthIndex: 5,
    situation:
      "July churn hit 3.1% (22 accounts) with a backlog of onboarding tickets after the June churn wave.",
    options: [
      "Surge contractor spend (~$8k/month for 2 months)",
      "Prioritize only enterprise accounts",
      "Accept the churn while hiring catches up",
    ],
    chosen: "Surge contractor spend for two months.",
    reason: "Onboarding backlog was the top cited churn reason in exit surveys.",
    expected: "Churn under 2.5% in August; operations cost +$8k for two months.",
    actual:
      "Churn fell to 2.2% in August; operations spend spiked to $56.8k in July and the contractors release in September.",
    impact: "≈ +$12k one-off cost; ≈ 10 accounts retained (~$21k annualized).",
    lesson:
      "Support surge spending works when churn has an onboarding root cause — but it is a one-shot lever, not a standing cost.",
    status: "successful",
  },
];

export const ALL_DECISIONS: DecisionRecord[] = [
  ...HISTORICAL_DECISIONS,
  ...WINDOW_DECISIONS,
];

// ---- Financial timeline events (Month 1 → 6) ----

export type TimelineKind =
  | "decision"
  | "pricing"
  | "marketing"
  | "product"
  | "competitor"
  | "financial";

export interface TimelineEvent {
  id: string;
  date: string;
  monthIndex: number;
  kind: TimelineKind;
  title: string;
  detail: string;
  decisionRef?: string; // links events to decision records
}

export const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: "E-01", date: "2026-03-04", monthIndex: 1, kind: "financial", title: "Distribution partnership signed", detail: "Meridian Distribution added us to their industrial catalogue; contribution visible in April." },
  { id: "E-02", date: "2026-03-12", monthIndex: 1, kind: "product", title: "Firmware 3.2 shipped", detail: "Remote provisioning cut setup time ~40%; cited in 6 of 38 new-customer wins in March." },
  { id: "E-03", date: "2026-04-02", monthIndex: 2, kind: "financial", title: "Logistics contract renegotiated", detail: "Freight rates down ~6%; COGS per unit improves from April onward." },
  { id: "E-04", date: "2026-04-27", monthIndex: 2, kind: "marketing", title: "Q2 demand-gen campaign launched", detail: "$31k campaign across search + industry newsletters; May revenue at six-month high." },
  { id: "E-05", date: "2026-05-06", monthIndex: 3, kind: "decision", title: "Enterprise expansion approved", detail: "Hired 2 sales engineers + onboarding specialist (D-201).", decisionRef: "D-201" },
  { id: "E-06", date: "2026-05-19", monthIndex: 3, kind: "competitor", title: "Apex Analytics: 20% off annual plans", detail: "Apex launched Pulse SMB suite with 20% off annual contracts — active during our price change.", decisionRef: "D-202" },
  { id: "E-07", date: "2026-05-21", monthIndex: 3, kind: "pricing", title: "Product A list price +4% ($228 → $237)", detail: "Rolled out with no loyalty discount at rollout (D-202).", decisionRef: "D-202" },
  { id: "E-08", date: "2026-06-30", monthIndex: 4, kind: "financial", title: "June revenue -11.4% vs May", detail: "Price increase + competitor promotion + churn spike to 2.6% (17 accounts)." },
  { id: "E-09", date: "2026-06-18", monthIndex: 4, kind: "decision", title: "Rollback plan + loyalty discount", detail: "List price held at $237; 5% loyalty discount for churn-risk accounts (D-203).", decisionRef: "D-203" },
  { id: "E-10", date: "2026-07-09", monthIndex: 5, kind: "decision", title: "Support surge approved", detail: "Onboarding contractor surge to clear the post-churn-wave backlog (D-204).", decisionRef: "D-204" },
  { id: "E-11", date: "2026-07-31", monthIndex: 5, kind: "financial", title: "July churn peaks at 3.1%", detail: "22 accounts churned; operations spend $56.8k on onboarding surge." },
  { id: "E-12", date: "2026-08-08", monthIndex: 6, kind: "competitor", title: "Apex Analytics cuts entry tier 12%", detail: "Apex reduced entry pricing to $199 — renewed price pressure in the SMB segment." },
  { id: "E-13", date: "2026-08-31", monthIndex: 6, kind: "financial", title: "August recovery", detail: "Revenue +5.9% vs July, churn down to 2.2%, profit recovered to $25.4k." },
];

// ---- Competitors & competitor events (WORLD MEMORY candidates) ----

export interface Competitor {
  id: string;
  name: string;
  segment: string;
  threatLevel: "high" | "medium" | "low";
  note: string;
}

export const COMPETITORS: Competitor[] = [
  { id: "apex", name: "Apex Analytics", segment: "Direct competitor — SMB + mid-market", threatLevel: "high", note: "Aggressive on price and promotion; launched Pulse SMB suite in May 2026." },
  { id: "beacon", name: "Beacon Metrics", segment: "Direct competitor — starter tier", threatLevel: "medium", note: "Price-led starter tier; causes most Product B renewal losses." },
  { id: "cirrus", name: "Cirrus Data", segment: "Adjacent — dashboards & reporting", threatLevel: "low", note: "Content-led growth; little overlap in hardware." },
];

export interface CompetitorEvent {
  id: string;
  competitorId: string;
  date: string;
  kind: "launch" | "pricing" | "promotion" | "announcement" | "partnership" | "campaign";
  headline: string;
  detail: string;
  source: string;
}

export const COMPETITOR_EVENTS: CompetitorEvent[] = [
  { id: "C-01", competitorId: "apex", date: "2026-03-18", kind: "announcement", headline: "Apex announces Pulse SMB suite", detail: "Press release teases an SMB-focused bundle launching in Q2.", source: "Press release" },
  { id: "C-02", competitorId: "cirrus", date: "2026-04-09", kind: "campaign", headline: "Cirrus launches benchmark content series", detail: "Comparison content targeting 'legacy dashboard' buyers.", source: "Public blog" },
  { id: "C-03", competitorId: "apex", date: "2026-05-19", kind: "promotion", headline: "Apex: 20% off annual plans at Pulse launch", detail: "Launch promotion active May 19 – Jun 30 — overlaps our price increase.", source: "Public pricing page" },
  { id: "C-04", competitorId: "beacon", date: "2026-06-10", kind: "partnership", headline: "Beacon partners with LogiChain for logistics vertical", detail: "Co-marketing with a logistics ERP; threatens our logistics accounts.", source: "Joint press release" },
  { id: "C-05", competitorId: "apex", date: "2026-06-26", kind: "pricing", headline: "Apex cuts entry tier 8%", detail: "Entry tier moved from $229 to $210; mid tier unchanged.", source: "Public pricing page" },
  { id: "C-06", competitorId: "cirrus", date: "2026-07-18", kind: "pricing", headline: "Cirrus cuts starter plan 5%", detail: "Starter plan $189 → $179 with an annual prepay nudge.", source: "Public pricing page" },
  { id: "C-07", competitorId: "apex", date: "2026-07-30", kind: "campaign", headline: "Apex launches 'Switch & Save' campaign", detail: "Switch incentive: 3 months free for teams migrating from competitors.", source: "LinkedIn / ads" },
  { id: "C-08", competitorId: "beacon", date: "2026-08-14", kind: "announcement", headline: "Beacon raises $24M Series B", detail: "Funding earmarked for enterprise features and inside sales hiring.", source: "Tech press" },
  { id: "C-09", competitorId: "apex", date: "2026-08-20", kind: "launch", headline: "Apex launches enterprise package", detail: "SSO, audit logs, dedicated CSM at $1,499/month — moves upmarket.", source: "Press release" },
];

// ---- Management observations & conversation (experience memory) ----

export const OBSERVATIONS: { id: string; date: string; text: string; tags: string[] }[] = [
  {
    id: "O-01",
    date: "2026-05-28",
    text: "Sales leadership observed that churn-risk accounts respond to targeted loyalty discounts within one billing cycle, based on the 2024 retention program.",
    tags: ["retention", "pricing", "observation"],
  },
  {
    id: "O-02",
    date: "2026-06-05",
    text: "Finance observed that marketing spend above 9% of revenue for two consecutive months has not historically converted into proportional revenue growth.",
    tags: ["marketing", "finance", "observation"],
  },
  {
    id: "O-03",
    date: "2026-06-30",
    text: "Customer success observed that exit interviews in June cited the price increase as the primary reason in 11 of 17 churned accounts, and Apex's promotion as a secondary factor.",
    tags: ["churn", "pricing", "observation"],
  },
  {
    id: "O-04",
    date: "2026-07-24",
    text: "Support observed that onboarding backlog depth was the strongest leading indicator of SMB churn in the July wave — accounts with 2+ open tickets churned at 3.4x baseline.",
    tags: ["support", "churn", "observation"],
  },
];

export const EXEC_CONVERSATION = {
  id: "CONV-01",
  date: "2026-08-12",
  context: "exec strategy meeting",
  transcript: [
    "CFO (2026-08-12T10:02): Margins recovered in August but we are exposed — Apex cut entry pricing 12% and our SMB list is now above theirs again.",
    "CEO (2026-08-12T10:05): I don't want a blanket price cut. Last time we went deeper than 6% we couldn't walk it back.",
    "CFO (2026-08-12T10:09): D-101 suggests a small, targeted move works when competitors are promotional. D-102 says deep cuts anchor us lower permanently.",
    "CEO (2026-08-12T10:12): Bring me a simulation of a modest price adjustment with the historical evidence before the board meeting.",
  ].join("\n"),
};

// ---- Memory seed records: what gets retained into Hindsight ----

export interface MemorySeed {
  bank: "experience" | "world";
  sourceId: string;
  text: string;
  context: string;
  occurredAt: string; // ISO date of the event
  tags: string[];
}

function decisionSeeds(d: DecisionRecord): MemorySeed[] {
  return [
    {
      bank: "experience",
      sourceId: `${d.ref}-decision`,
      text: `On ${d.date}, decision ${d.ref} (${d.title}): situation — ${d.situation} Chosen action — ${d.chosen} Rationale — ${d.reason} Expected outcome — ${d.expected}`,
      context: "strategy decision",
      occurredAt: d.date,
      tags: ["decision", ...d.title.toLowerCase().match(/price|pricing|marketing|support|expansion|hiring/) ?? ["strategy"]],
    },
    {
      bank: "experience",
      sourceId: `${d.ref}-outcome`,
      text: `Outcome of decision ${d.ref} (${d.title}, decided ${d.date}): ${d.actual} Financial impact — ${d.impact} Lesson learned — ${d.lesson}`,
      context: "decision outcome",
      occurredAt: d.date,
      tags: ["outcome", "lesson", ...d.title.toLowerCase().match(/price|pricing|marketing|support|expansion|hiring/) ?? ["strategy"]],
    },
  ];
}

export const MEMORY_SEED: MemorySeed[] = [
  ...ALL_DECISIONS.flatMap(decisionSeeds),
  ...OBSERVATIONS.map((o) => ({
    bank: "experience" as const,
    sourceId: o.id,
    text: o.text,
    context: "management observation",
    occurredAt: o.date,
    tags: o.tags,
  })),
  {
    bank: "experience",
    sourceId: EXEC_CONVERSATION.id,
    text: `In an executive meeting on ${EXEC_CONVERSATION.date}: ${EXEC_CONVERSATION.transcript}`,
    context: EXEC_CONVERSATION.context,
    occurredAt: EXEC_CONVERSATION.date,
    tags: ["conversation", "pricing", "board"],
  },
  ...COMPETITOR_EVENTS.map((e) => ({
    bank: "world" as const,
    sourceId: e.id,
    text: `On ${e.date}, ${COMPETITORS.find((c) => c.id === e.competitorId)?.name ?? e.competitorId} (${e.kind}): ${e.headline}. ${e.detail} Source: ${e.source}.`,
    context: "competitor intelligence",
    occurredAt: e.date,
    tags: ["competitor", e.kind, e.competitorId],
  })),
  {
    bank: "world",
    sourceId: "W-MKT-01",
    text: "Throughout 2026 the SMB analytics segment saw sustained promotional pressure: at least four public price reductions or launch promotions between March and August, led by Apex Analytics.",
    context: "market context",
    occurredAt: "2026-08-25",
    tags: ["market", "pricing", "trend"],
  },
  {
    bank: "world",
    sourceId: "W-MKT-02",
    text: "Industry buyers in the logistics vertical increasingly bundle analytics with ERP procurement; Beacon Metrics' June partnership with LogiChain signals that consolidation trend.",
    context: "market context",
    occurredAt: "2026-06-15",
    tags: ["market", "partnership", "vertical"],
  },
];

export const DEMO_QUESTIONS: { label: string; question: string }[] = [
  { label: "Why did profit fall?", question: "Why did our profit fall in the last two months?" },
  { label: "Last pricing experiment", question: "What happened the last time we reduced Product A's price?" },
  { label: "Price cut -7%?", question: "What if we reduce the price by 7%?" },
  { label: "Competitor move", question: "How should we interpret Apex Analytics' recent price reduction?" },
  { label: "Lessons to carry", question: "What lessons should we carry forward from the last six months?" },
  { label: "Risks", question: "What are the risks if we cut prices while Apex is promoting?" },
];
