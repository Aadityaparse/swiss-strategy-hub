// MemoryInspector.tsx — live view of actual Hindsight operations
// (retain / recall / reflect) logged by the backend. Shows the bank,
// operation, query and the grounded sources returned. Fallback operations
// are always labeled as such.

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Database, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface MemorySource {
  text: string;
  type: string;
  date: string;
  kind: string;
}

interface ActivityRow {
  _id: string;
  kind: "RETAIN" | "RECALL" | "REFLECT";
  bank: "experience" | "world";
  query?: string;
  summary: string;
  sources: MemorySource[];
  origin: string;
  mode: "live" | "fallback";
  createdAt: number;
}

const opColor: Record<string, string> = {
  RETAIN: "bg-[#16181d] text-white",
  RECALL: "bg-[#1f4e9c] text-white",
  REFLECT: "bg-[#d5281b] text-white",
};

export function MemoryInspector() {
  const activity = useQuery(api.memory.listActivity, { limit: 30 });
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="swiss-panel flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-[#1f4e9c]" />
          <div>
            <p className="text-sm font-bold tracking-tight">Memory Inspector</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              A verbatim ledger of operations against the memory server
            </p>
          </div>
        </div>
        {activity === undefined && <Skeleton className="h-4 w-16" />}
      </div>

      <div className="swiss-scroll min-h-0 flex-1 divide-y divide-border overflow-y-auto">
        {activity === undefined && (
          <div className="space-y-2 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {activity?.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No memory operations yet. Ingest the demo data to populate
            Experience and World memory.
          </div>
        )}
        <AnimatePresence initial={false}>
          {activity?.map((row: ActivityRow) => (
            <motion.div
              key={row._id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-bold tracking-widest ${opColor[row.kind]}`}
                  >
                    {row.kind}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    {row.bank}
                  </span>
                  {row.mode === "fallback" && (
                    <Badge variant="outline" className="border-[#d5281b] px-1 py-0 text-[9px] text-[#d5281b]">
                      FALLBACK
                    </Badge>
                  )}
                </div>
                <span className="swiss-num text-[10px] text-muted-foreground">
                  {new Date(row.createdAt).toLocaleTimeString()}
                </span>
              </div>

              {row.query && (
                <p className="mt-1.5 truncate text-sm italic text-foreground">
                  "{row.query}"
                </p>
              )}
              <p className="mt-0.5 text-xs text-muted-foreground">{row.summary}</p>

              {row.sources.length > 0 && (
                <button
                  type="button"
                  onClick={() => setExpanded(expanded === row._id ? null : row._id)}
                  className="mt-1.5 cursor-pointer text-[11px] font-semibold uppercase tracking-widest text-[#1f4e9c] hover:text-[#d5281b]"
                >
                  {expanded === row._id ? "Hide" : "Show"} {row.sources.length} source{row.sources.length === 1 ? "" : "s"}
                </button>
              )}
              {expanded === row._id && (
                <ul className="mt-2 space-y-1.5 border-l-2 border-[#1f4e9c]/30 pl-3">
                  {row.sources.map((s, i) => (
                    <li key={i} className="text-xs leading-relaxed text-muted-foreground">
                      <span className="font-mono text-[10px] text-foreground">✓</span>{" "}
                      {s.date && <span className="text-foreground">{s.date} — </span>}
                      {s.text.length > 180 ? s.text.slice(0, 180) + "…" : s.text}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="border-t border-border bg-secondary px-4 py-2">
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <RefreshCw className="size-3" />
          Streamed live from the backend — each entry is an operation the system actually performed.
        </p>
      </div>
    </div>
  );
}
