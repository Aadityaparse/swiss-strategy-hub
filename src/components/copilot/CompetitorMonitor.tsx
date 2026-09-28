// CompetitorMonitor.tsx — competitor intelligence: per-competitor timelines
// of strategic events, plus hypothesis cards that always list evidence and
// confidence. All events are mock public data (labeled), stored into World
// memory on ingest.

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Globe2 } from "lucide-react";
import { useState } from "react";
import { DataSourceLabel, WhyHover } from "./evidence";

interface Competitor {
  id: string;
  name: string;
  segment: string;
  threatLevel: "high" | "medium" | "low";
  note: string;
}

interface CompetitorEvent {
  id: string;
  competitorId: string;
  date: string;
  kind: string;
  headline: string;
  detail: string;
  source: string;
}

interface Hypothesis {
  competitorId: string;
  competitorName: string;
  headline: string;
  statement: string;
  confidence: "low" | "medium" | "high";
  evidence: string[];
  basis: string;
}

const threatColor: Record<string, string> = {
  high: "#d5281b",
  medium: "#1f4e9c",
  low: "#5b6470",
};

const kindLabel: Record<string, string> = {
  launch: "LAUNCH",
  pricing: "PRICING",
  promotion: "PROMO",
  announcement: "NEWS",
  partnership: "PARTNERSHIP",
  campaign: "CAMPAIGN",
};

export function CompetitorMonitor() {
  const dashboard = useQuery(api.api.dashboard);
  const [selected, setSelected] = useState<string | null>("apex");

  if (dashboard === undefined) {
    return (
      <div className="swiss-panel p-4">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const competitors = dashboard.competitors as Competitor[];
  const events = (dashboard.competitorEvents as CompetitorEvent[]).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  const hypotheses = dashboard.hypotheses as Hypothesis[];

  const active = competitors.find((c) => c.id === selected) ?? competitors[0];
  const activeEvents = events.filter((e) => e.competitorId === active?.id);

  return (
    <div className="swiss-panel flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Globe2 className="size-4 text-[#1f4e9c]" />
          <div>
            <p className="text-sm font-bold tracking-tight">Competitor Monitor</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Strategic events · retained into World memory
            </p>
          </div>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
          mock public data
        </span>
      </div>

      {/* Competitor tabs */}
      <div className="flex gap-px border-b border-border bg-border">
        {competitors.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelected(c.id)}
            className={`cursor-pointer px-4 py-2 text-left text-xs transition-colors ${
              active?.id === c.id ? "bg-card font-bold" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span className="swiss-dot" style={{ background: threatColor[c.threatLevel] }} />
              {c.name}
            </span>
          </button>
        ))}
      </div>

      <div className="swiss-scroll min-h-0 flex-1 overflow-y-auto">
        {active && (
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-xs text-muted-foreground">{active.segment} · threat: {active.threatLevel}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/80">{active.note}</p>
          </div>
        )}

        {/* Timeline */}
        <div className="px-4 py-3">
          <p className="swiss-kicker">Event timeline</p>
          <div className="mt-2 space-y-0">
            {activeEvents.map((e) => (
              <div key={e.id} className="flex gap-3 border-l border-border pb-3 pl-3 last:pb-0">
                <div className="flex flex-col items-center">
                  <span className="swiss-dot mt-1" style={{ background: threatColor[active.threatLevel] }} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="swiss-num text-[11px] font-bold">{e.date}</span>
                    <span className="bg-secondary px-1 text-[9px] font-semibold tracking-widest text-muted-foreground">
                      {kindLabel[e.kind] ?? e.kind.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-foreground">{e.headline}</p>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{e.detail}</p>
                </div>
              </div>
            ))}
            {activeEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">No events on record for this competitor.</p>
            )}
          </div>
        </div>

        {/* Hypotheses for this competitor */}
        <div className="border-t border-border px-4 py-3">
          <p className="swiss-kicker">Possible next strategic responses — hypotheses</p>
          <div className="mt-2 space-y-3">
            {hypotheses
              .filter((h) => h.competitorId === active?.id)
              .map((h) => (
                <div key={h.headline} className="border border-[#d5281b]/25 bg-[#d5281b]/[0.03] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <DataSourceLabel kind="Hypothesis" />
                      <p className="text-xs font-bold tracking-tight">{h.headline}</p>
                    </div>
                    <Badge variant="outline" className="border-border text-[9px] uppercase tracking-widest">
                      confidence: {h.confidence}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-foreground">{h.statement}</p>
                  <div className="mt-2">
                    <WhyHover title="Evidence">
                      {h.evidence.map((ev, i) => (
                        <p key={i} className="text-xs leading-relaxed text-muted-foreground">
                          · {ev}
                        </p>
                      ))}
                      <p className="mt-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                        Basis: {h.basis}
                      </p>
                    </WhyHover>
                  </div>
                </div>
              ))}
            {hypotheses.filter((h) => h.competitorId === active?.id).length === 0 && (
              <p className="text-xs text-muted-foreground">No active hypotheses for this competitor.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
