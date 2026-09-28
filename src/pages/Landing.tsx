import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  ChartLine,
  CircleDot,
  Compass,
  GitBranch,
  Globe2,
  Timer,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, Navigate } from "react-router";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
};

function SwissMark({ className = "size-9" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center border border-foreground bg-card ${className}`}
      aria-hidden
    >
      <div className="h-3.5 w-3.5 bg-[#d5281b]" />
    </div>
  );
}

const loop = [
  { label: "Remember", icon: BrainCircuit, note: "Hindsight Experience + World memory" },
  { label: "Understand", icon: ChartLine, note: "Deterministic six-month financial engine" },
  { label: "Simulate", icon: GitBranch, note: "What-if scenario canvas" },
  { label: "Explain", icon: Compass, note: "Evidence-backed AI interpretation" },
  { label: "Decide", icon: CircleDot, note: "Human-in-the-loop decision gate" },
  { label: "Learn", icon: Timer, note: "Outcomes retained back into memory" },
];

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="swiss-rule animate-pulse" />
      </main>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="swiss-grid-bg min-h-screen bg-background"
    >
      {/* Top bar */}
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <SwissMark />
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-tight">Hindsight</p>
              <p className="swiss-kicker">Strategy Co-Pilot</p>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a className="hover:text-foreground" href="#problem">Problem</a>
            <a className="hover:text-foreground" href="#system">System</a>
            <a className="hover:text-foreground" href="#loop">Method</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" className="cursor-pointer">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild className="cursor-pointer gap-2 bg-[#16181d] text-white hover:bg-[#16181d]/85">
              <Link to="/auth">
                Open the Co-Pilot
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:py-24 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Badge variant="outline" className="mb-6 border-[#d5281b] text-[#d5281b]">
              Self-hosted Hindsight memory · No cloud key
            </Badge>
            <h1 className="swiss-headline text-5xl md:text-7xl">
              Remember the past.
              <br />
              Understand the present.
              <br />
              <span className="text-[#1f4e9c]">Simulate the future.</span>
            </h1>
            <div className="swiss-rule mt-8" />
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              A persistent strategic intelligence system that connects
              organizational memory, six-month financial history, competitive
              intelligence and what-if simulation — so humans make
              better-informed strategic decisions.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="cursor-pointer gap-2 bg-[#16181d] text-white hover:bg-[#16181d]/85">
                <Link to="/auth">
                  Launch the dashboard
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <p className="text-xs text-muted-foreground">
                AI recommends. <span className="font-semibold text-foreground">Humans decide.</span>
              </p>
            </div>
          </div>

          {/* Memory panel mock — the product's core artifact */}
          <div className="lg:col-span-5">
            <motion.div
              {...fadeUp}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="swiss-panel"
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <p className="swiss-kicker">Hindsight · Memory Activity</p>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="swiss-dot bg-[#d5281b] swiss-pulse" />
                  live
                </span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { op: "RECALL", bank: "experience", q: "previous pricing experiments", n: 3 },
                  { op: "RETAIN", bank: "world", q: "Apex entry-tier cut -12%", n: 1 },
                  { op: "REFLECT", bank: "experience", q: "patterns across pricing decisions", n: 4 },
                ].map((row) => (
                  <div key={row.op + row.q} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold tracking-widest text-[#1f4e9c]">{row.op}</p>
                      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{row.bank} bank</p>
                    </div>
                    <p className="mt-1 text-sm text-foreground">"{row.q}"</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{row.n} grounded source(s) returned</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-border bg-secondary px-4 py-2.5">
                <p className="text-[11px] text-muted-foreground">
                  Every panel on the dashboard is driven by these operations.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Problem / solution */}
      <section id="problem" className="border-b border-border bg-secondary/60">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-3 md:py-20">
          {[
            {
              kicker: "01 — The problem",
              title: "Organizations forget",
              body: "Decisions are made, outcomes land in spreadsheets, and the reasoning evaporates. Six months later the same pricing debate restarts from zero — without the evidence of what happened last time.",
            },
            {
              kicker: "02 — The system",
              title: "Memory, not another chatbot",
              body: "Hindsight — self-hosted and open-source — retains decisions, outcomes and competitor moves in Experience and World memory banks, then recalls and reflects over them on demand.",
            },
            {
              kicker: "03 — The discipline",
              title: "Facts, simulations, hypotheses",
              body: "Financials and simulations are deterministic code. The AI interprets and explains — never calculates, never guarantees. Uncertainty is labeled: hypothesis, assumption, confidence.",
            },
          ].map((c, i) => (
            <motion.div
              key={c.kicker}
              {...fadeUp}
              transition={{ duration: 0.45, delay: 0.1 + i * 0.08 }}
            >
              <p className="swiss-kicker">{c.kicker}</p>
              <h3 className="swiss-headline mt-3 text-2xl">{c.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Core loop */}
      <section id="loop" className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <p className="swiss-kicker">The core loop</p>
          <h2 className="swiss-headline mt-3 max-w-2xl text-4xl md:text-5xl">
            One continuous learning cycle.
          </h2>
          <div className="mt-10 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {loop.map((step, i) => (
              <motion.div
                key={step.label}
                {...fadeUp}
                transition={{ duration: 0.4, delay: 0.05 + i * 0.06 }}
                className="group bg-card p-6 transition-colors hover:bg-accent"
              >
                <div className="flex items-center justify-between">
                  <step.icon className="size-5 text-[#1f4e9c]" />
                  <span className="swiss-num text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <p className="mt-4 text-lg font-bold tracking-tight">{step.label}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.note}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* System */}
      <section id="system" className="border-b border-border bg-secondary/60">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:py-20">
          <div>
            <p className="swiss-kicker">Inside the system</p>
            <h2 className="swiss-headline mt-3 text-4xl md:text-5xl">
              Four modules, one memory spine.
            </h2>
            <div className="swiss-rule mt-6" />
            <ul className="mt-8 space-y-5">
              {[
                { icon: ChartLine, t: "Financial Intelligence", d: "Six months of KPIs computed deterministically — revenue, margin, CAC, churn — with annotated anomalies and turning points." },
                { icon: Globe2, t: "Competitor Monitor", d: "Public competitor events distilled into strategic signals, with hypotheses that always show their evidence and confidence." },
                { icon: GitBranch, t: "Strategy Canvas", d: "A deterministic what-if engine. Historical recall accompanies every simulation — no invented numbers, no guaranteed predictions." },
                { icon: Activity, t: "Memory Inspector", d: "A live view of retain / recall / reflect operations against the self-hosted Hindsight server. Nothing faked; fallback is labeled." },
              ].map((f) => (
                <li key={f.t} className="flex gap-4">
                  <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center border border-border bg-card">
                    <f.icon className="size-4 text-[#1f4e9c]" />
                  </div>
                  <div>
                    <p className="font-semibold tracking-tight">{f.t}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="swiss-panel self-start p-6 font-mono text-xs leading-6 text-muted-foreground">
            <p className="swiss-kicker mb-4 font-sans">Architecture</p>
            <pre className="overflow-x-auto whitespace-pre">{`React + Vite + Recharts
        │
        ▼  queries · actions
┌───────────────────────┐
│  Orchestration layer  │
│  agent · financials   │
│  simulation · api     │
└──────────┬────────────┘
           │
┌──────────▼────────────┐
│  hindsight_client.ts  │
│  retain / recall /    │
│  reflect              │
└──────────┬────────────┘
           │
┌──────────▼────────────┐
│ HINDSIGHT (self-host) │
│ northwind-experience  │
│ northwind-world       │
└───────────────────────┘`}</pre>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-[#16181d] bg-[#16181d] text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 py-16 md:flex-row md:items-center">
          <div>
            <h2 className="swiss-headline text-4xl md:text-5xl">Let humans decide.</h2>
            <p className="mt-3 max-w-xl text-white/70">
              Open the executive dashboard, ask a real question, and watch the
              memory activity that answers it.
            </p>
          </div>
          <Button asChild size="lg" className="cursor-pointer gap-2 bg-white text-[#16181d] hover:bg-white/85">
            <Link to="/auth">
              Sign in
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-10 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <SwissMark className="size-6" />
          <span>Hindsight Strategy Co-Pilot — hackathon prototype</span>
        </div>
        <span>
          Hindsight runs self-hosted (open source). Simulations are estimates, not predictions.
        </span>
      </footer>
    </motion.div>
  );
}
