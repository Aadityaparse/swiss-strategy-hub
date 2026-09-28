// ExecutiveAI.tsx — the executive input box + AI Strategy Brief. Each answer
// is grounded: the panel shows which memory operations ran, the labeled
// evidence used, and ends with the human-decision gate.

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ArrowUpRight, Loader2, ScrollText, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { DataSourceLabel } from "./evidence";

interface ChatMessage {
  _id: string;
  role: "user" | "assistant";
  content: string;
  evidence?: Array<{ kind: string; label: string; detail: string }>;
  operations?: string[];
  createdAt: number;
}

const DEMO_QUESTIONS = [
  "Why did our profit fall in the last two months?",
  "What happened the last time we reduced Product A's price?",
  "What if we reduce the price by 7%?",
  "How should we interpret Apex Analytics' recent price reduction?",
  "What lessons should we carry forward from the last six months?",
];

interface Brief {
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

function renderRich(text: string) {
  // Minimal markdown rendering: **bold** and paragraphs. Answers are generated
  // server-side; this avoids importing a markdown dependency for two tokens.
  return text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} className="h-2" />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={i} className="text-sm leading-relaxed text-foreground">
        {parts.map((p, j) =>
          p.startsWith("**") && p.endsWith("**") ? (
            <strong key={j}>{p.slice(2, -2)}</strong>
          ) : (
            <span key={j}>{p}</span>
          ),
        )}
      </p>
    );
  });
}

export function ExecutiveAI() {
  const chat = useQuery(api.api.listChat);
  const ask = useAction(api.actions.ask);
  const buildBrief = useAction(api.actions.buildBrief);
  const clearChatMutation = useMutation(api.api.clearChat);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [chat?.length]);

  const handleAsk = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || pending) return;
    setPending(true);
    setQuestion("");
    try {
      await ask({ question: trimmed });
    } catch (e) {
      toast.error("The co-pilot could not answer", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setPending(false);
    }
  };

  const handleBrief = async () => {
    setBriefLoading(true);
    try {
      const res = await buildBrief({});
      setBrief((res as { brief: Brief }).brief);
      toast.success("Strategy brief generated", {
        description: "Facts, assumptions and simulations are labeled separately.",
      });
    } catch {
      toast.error("Brief generation failed");
    } finally {
      setBriefLoading(false);
    }
  };

  return (
    <div className="swiss-panel flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#1f4e9c]" />
          <div>
            <p className="text-sm font-bold tracking-tight">Executive AI</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Ask anything — answers are grounded in memory and data
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer gap-1.5 text-xs"
            onClick={() => void clearChatMutation()}
            disabled={pending}
          >
            Clear
          </Button>
          <Button
            size="sm"
            className="cursor-pointer gap-1.5 bg-[#16181d] text-xs text-white hover:bg-[#16181d]/85"
            onClick={() => void handleBrief()}
            disabled={briefLoading}
          >
            {briefLoading ? <Loader2 className="size-3.5 animate-spin" /> : <ScrollText className="size-3.5" />}
            Strategy Brief
          </Button>
        </div>
      </div>

      {/* Conversation */}
      <div ref={scrollRef} className="swiss-scroll min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {chat === undefined && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}
        {chat?.length === 0 && (
          <div className="py-6 text-center">
            <p className="swiss-kicker">Start with a real question</p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {DEMO_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void handleAsk(q)}
                  className="cursor-pointer border border-border bg-secondary px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-[#1f4e9c] hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {chat?.map((m: ChatMessage) =>
          m.role === "user" ? (
            <div key={m._id} className="flex justify-end">
              <p className="max-w-[85%] bg-[#16181d] px-3 py-2 text-sm text-white">{m.content}</p>
            </div>
          ) : (
            <div key={m._id} className="space-y-2">
              {m.operations && m.operations.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {m.operations.map((op, i) => (
                    <span
                      key={i}
                      className="border border-[#1f4e9c]/30 bg-[#1f4e9c]/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-[#1f4e9c]"
                    >
                      {op}
                    </span>
                  ))}
                </div>
              )}
              <div className="space-y-1.5 border-l-2 border-[#d5281b] pl-3">
                {renderRich(m.content)}
              </div>
              {m.evidence && m.evidence.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer list-none text-[11px] font-semibold uppercase tracking-widest text-[#1f4e9c] hover:text-[#d5281b]">
                    Evidence used ({m.evidence.length})
                  </summary>
                  <div className="mt-2 space-y-2">
                    {m.evidence.map((ev, i) => (
                      <div key={i} className="border-l-2 border-border pl-3">
                        <div className="flex items-center gap-2">
                          <DataSourceLabel kind={ev.kind} />
                          <span className="text-[11px] text-muted-foreground">{ev.label}</span>
                        </div>
                        <p className="mt-0.5 text-xs leading-relaxed text-foreground">{ev.detail}</p>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          ),
        )}

        {pending && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-[#1f4e9c]" />
            Recalling memory, computing, reflecting…
          </div>
        )}

        {/* Strategy Brief */}
        {brief && (
          <div className="border border-[#16181d]">
            <div className="flex items-center justify-between border-b border-[#16181d] bg-[#16181d] px-3 py-2 text-white">
              <p className="text-xs font-bold uppercase tracking-widest">Strategy Brief</p>
              <span className="text-[10px] uppercase tracking-widest text-white/60">
                facts · assumptions · simulations — labeled
              </span>
            </div>
            <div className="swiss-scroll max-h-[480px] space-y-4 overflow-y-auto p-4">
              {[
                ["Executive summary", brief.executiveSummary, "Current Data"],
                ["Current state", brief.currentState, "Current Data"],
                ["Historical evidence", brief.historicalEvidence, "Historical Fact"],
                ["Competitive context", brief.competitiveContext, "World Memory"],
                ["Scenario analysis", brief.scenarioAnalysis, "Simulation"],
                ["Key risks", brief.keyRisks, "AI Interpretation"],
                ["Opportunities", brief.opportunities, "AI Interpretation"],
                ["Assumptions", brief.assumptions, "Assumption"],
                ["AI hypotheses", brief.aiHypotheses, "Hypothesis"],
                ["Relevant memory", brief.relevantMemory, "Memory"],
              ].map(([title, items, kind]) => (
                <div key={title as string}>
                  <div className="flex items-center gap-2">
                    <p className="swiss-kicker">{title as string}</p>
                    <DataSourceLabel kind={kind as string} />
                  </div>
                  <ul className="mt-1.5 space-y-1.5">
                    {(items as string[]).length === 0 && (
                      <li className="text-xs text-muted-foreground">—</li>
                    )}
                    {(items as string[]).map((item, i) => (
                      <li key={i} className="border-l-2 border-border pl-3 text-xs leading-relaxed text-foreground">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="border-l-2 border-[#d5281b] bg-[#d5281b]/[0.04] p-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[#d5281b]">
                  Human decision
                </p>
                <p className="mt-1 text-sm leading-relaxed text-foreground">{brief.humanDecision}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleAsk(question);
              }
            }}
            placeholder="Ask about history, competitors, scenarios — e.g. “What happened when we last changed price?”"
            className="min-h-[52px] resize-none text-sm"
            disabled={pending}
          />
          <Button
            size="icon"
            className="size-[52px] shrink-0 cursor-pointer bg-[#1f4e9c] text-white hover:bg-[#1f4e9c]/85"
            onClick={() => void handleAsk(question)}
            disabled={pending || !question.trim()}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <ArrowUpRight className="size-4" />}
          </Button>
        </div>
        <p className="mt-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
          AI interprets · deterministic code calculates · humans decide
        </p>
      </div>
    </div>
  );
}
