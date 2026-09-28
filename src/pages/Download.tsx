import { Button } from "@/components/ui/button";
import { SwissThemeMark } from "@/components/copilot/SwissThemeMark";
import { ArrowDownToLine, FileArchive } from "lucide-react";

const INCLUDE = [
  "React frontend — landing, auth, executive dashboard, all panels",
  "Convex backend — agent, financial & simulation engines, API layer",
  "Hindsight integration — retain / recall / reflect with fallback mode",
  "Six-month demo dataset, competitor events and decision records",
  "README with architecture, local Hindsight setup and demo flow",
];

const EXCLUDE = [
  "node_modules (restore with bun install)",
  "Generated Convex types (recreate with bun convex dev --once)",
  "Environment files with live secrets — manage via the API Keys tab",
];

export default function Download() {
  return (
    <main className="swiss-grid-bg flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="swiss-panel swiss-ink-top w-full max-w-lg">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <SwissThemeMark />
          <div className="leading-tight">
            <p className="text-sm font-bold tracking-tight">Hindsight</p>
            <p className="swiss-kicker">Strategy Co-Pilot</p>
          </div>
        </div>

        <div className="px-6 py-6">
          <div className="flex items-center gap-2">
            <FileArchive className="size-4 text-[#1f4e9c]" />
            <p className="swiss-kicker">Project archive — complete source</p>
          </div>
          <h1 className="swiss-headline mt-3 text-3xl">
            hindsight-strategy-copilot.zip
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The full codebase in a single archive, exported from the current
            state of the project.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="swiss-kicker mb-2">Included</p>
              <ul className="space-y-1.5">
                {INCLUDE.map((item) => (
                  <li key={item} className="text-xs leading-relaxed text-foreground">
                    ✓ {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="swiss-kicker mb-2">Not included</p>
              <ul className="space-y-1.5">
                {EXCLUDE.map((item) => (
                  <li key={item} className="text-xs leading-relaxed text-muted-foreground">
                    — {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Button asChild size="lg" className="mt-6 w-full cursor-pointer gap-2 bg-[#1f4e9c] text-white hover:bg-[#1f4e9c]/85">
            <a href="/hindsight-strategy-copilot.zip" download>
              <ArrowDownToLine className="size-4" />
              Download the zip
            </a>
          </Button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            After unzipping: bun install → bun convex dev --once → bun run dev
          </p>
        </div>
      </div>
    </main>
  );
}
