// hypotheses.ts — rule-based competitor hypotheses over public events.
// Pure module (no Hindsight, no Convex internals): importable from queries.
// Every output is explicitly a hypothesis with listed evidence — never
// stated as fact.

import { COMPETITORS, COMPETITOR_EVENTS } from "./mockdata";

export interface CompetitorHypothesis {
  competitorId: string;
  competitorName: string;
  headline: string;
  statement: string;
  confidence: "low" | "medium" | "high";
  evidence: string[];
  basis: string;
}

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
