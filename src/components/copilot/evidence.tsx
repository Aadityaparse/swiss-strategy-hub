// evidence.tsx — shared primitives for labeled evidence (Historical Fact,
// Current Data, Simulation, AI Interpretation, Hypothesis, Assumption).

import { Badge } from "@/components/ui/badge";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import { HelpCircle } from "lucide-react";

export type EvidenceKind =
  | "Historical Fact"
  | "Current Data"
  | "Assumption"
  | "Simulation"
  | "AI Interpretation"
  | "Hypothesis"
  | "World Memory"
  | "Memory";

const kindStyles: Record<string, string> = {
  "Historical Fact": "bg-[#1f4e9c] text-white",
  "Current Data": "bg-[#16181d] text-white",
  Simulation: "bg-[#2e63c8]/10 text-[#1f4e9c] border border-[#1f4e9c]/40",
  "AI Interpretation": "bg-[#d5281b]/10 text-[#d5281b] border border-[#d5281b]/40",
  Hypothesis: "bg-[#d5281b]/10 text-[#d5281b] border border-[#d5281b]/40",
  Assumption: "bg-muted text-foreground border border-border",
  "World Memory": "bg-[#1f4e9c]/10 text-[#1f4e9c] border border-[#1f4e9c]/30",
  Memory: "bg-muted text-muted-foreground border border-border",
};

export function DataSourceLabel({
  kind,
  className,
}: {
  kind: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
        kindStyles[kind] ?? "bg-muted text-muted-foreground border border-border",
        className,
      )}
    >
      {kind}
    </span>
  );
}

/** "Why?" affordance revealing the evidence behind an insight. */
export function WhyHover({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <HoverCard openDelay={80} closeDelay={60}>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1 text-[11px] font-semibold uppercase tracking-widest text-[#1f4e9c] hover:text-[#d5281b]"
        >
          {title ?? "Why?"}
          <HelpCircle className="size-3.5" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-96 border-border shadow-lg">
        <div className="space-y-3">
          <p className="swiss-kicker">Evidence</p>
          {children}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

export function EvidenceRow({
  kind,
  label,
  detail,
}: {
  kind: string;
  label: string;
  detail: string;
}) {
  return (
    <div className="border-l-2 border-border pl-3">
      <div className="flex flex-wrap items-center gap-2">
        <DataSourceLabel kind={kind} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-foreground">{detail}</p>
    </div>
  );
}
