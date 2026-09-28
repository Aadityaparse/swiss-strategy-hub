// DecisionMemory.tsx — Decision Memory: Situation → Options → Chosen action
// → Reason → Expected → Actual → Impact → Lesson. The "retain to Hindsight"
// action performs a REAL retain and the Memory Inspector shows it.

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Loader2, Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DataSourceLabel } from "./evidence";

interface DecisionRow {
  _id: string;
  ref: string;
  title: string;
  date: string;
  monthIndex: number;
  situation: string;
  options: string[];
  chosen: string;
  reason: string;
  expected: string;
  actual: string;
  impact: string;
  lesson: string;
  status: "successful" | "unsuccessful" | "ambiguous" | "pending";
  retained: boolean;
}

const statusStyle: Record<string, { bg: string; label: string }> = {
  successful: { bg: "#2f9e63", label: "successful" },
  unsuccessful: { bg: "#d5281b", label: "unsuccessful" },
  ambiguous: { bg: "#1f4e9c", label: "ambiguous" },
  pending: { bg: "#5b6470", label: "pending" },
};

export function DecisionMemory() {
  const decisions = useQuery(api.api.decisions);
  const retainDecision = useAction(api.actions.retainDecision);
  const ingest = useAction(api.actions.ingest);
  const clearChat = useMutation(api.api.clearChat);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleRetain = async (d: DecisionRow) => {
    setBusyId(d._id);
    try {
      const res = await retainDecision({ decisionId: d._id as Id<"decisions"> });
      toast.success(`Decision ${d.ref} retained into Hindsight`, {
        description:
          res.mode === "live"
            ? "Written to the self-hosted Hindsight experience bank."
            : "Hindsight offline — stored in the labeled local fallback memory.",
      });
    } catch {
      toast.error("Retain failed", { description: "Could not complete the memory operation." });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="swiss-panel flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-bold tracking-tight">Decision Memory</p>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Situation → Action → Outcome → Lesson
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer gap-1.5 text-xs"
          onClick={() => {
            void ingest()
              .then(() => toast.success("Ingest complete — both memory banks refreshed"))
              .catch(() => toast.error("Ingest failed"));
          }}
        >
          <RefreshCw className="size-3.5" /> Re-ingest demo data
        </Button>
      </div>

      <div className="swiss-scroll min-h-0 flex-1 divide-y divide-border overflow-y-auto">
        {decisions === undefined && (
          <div className="space-y-2 p-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}
        {decisions?.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No decision records yet. Run the ingest to seed the demo organization.
          </div>
        )}
        {decisions?.map((d: DecisionRow) => (
          <details key={d._id} className="group px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="swiss-dot shrink-0"
                  style={{ background: statusStyle[d.status].bg }}
                />
                <span className="swiss-num text-[11px] font-bold text-muted-foreground">{d.ref}</span>
                <span className="truncate text-sm font-semibold tracking-tight">{d.title}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {d.retained ? (
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#2f9e63]">
                    in memory ✓
                  </span>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="cursor-pointer gap-1 px-2 text-[11px]"
                    disabled={busyId === d._id}
                    onClick={(e) => {
                      e.preventDefault();
                      void handleRetain(d);
                    }}
                  >
                    {busyId === d._id ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : (
                      <Plus className="size-3" />
                    )}
                    Retain
                  </Button>
                )}
              </div>
            </summary>

            <div className="mt-3 space-y-2 border-t border-border pt-3">
              {[
                ["Situation", d.situation],
                ["Options considered", d.options.join("  ·  ")],
                ["Chosen action", d.chosen],
                ["Reason", d.reason],
                ["Expected outcome", d.expected],
                ["Actual outcome", d.actual || "—"],
                ["Financial impact", d.impact || "—"],
                ["Lesson", d.lesson],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[130px_1fr] gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-xs leading-relaxed text-foreground">{value}</p>
                </div>
              ))}
              <div className="pt-1">
                <DataSourceLabel kind={d.status === "pending" ? "Assumption" : "Historical Fact"} />
              </div>
            </div>
          </details>
        ))}
      </div>

      <div className="border-t border-border bg-secondary px-4 py-2">
        <p className="text-[11px] text-muted-foreground">
          Learning loop: outcome → lesson → Hindsight memory → future decisions.
        </p>
      </div>
    </div>
  );
}
