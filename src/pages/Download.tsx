import { Button } from "@/components/ui/button";
import { SwissThemeMark } from "@/components/copilot/SwissThemeMark";
import { ARCHIVE_SHA256, ARCHIVE_FILENAME, downloadProjectArchive } from "@/lib/download-archive";
import { ArrowDownToLine, CheckCircle2, FileArchive } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
  const [saving, setSaving] = useState(false);

  const handleDownload = () => {
    setSaving(true);
    try {
      downloadProjectArchive();
      toast.success("Archive generated", {
        description: `${ARCHIVE_FILENAME} saved to your downloads.`,
      });
    } catch {
      toast.error("Could not generate the archive", {
        description: "Try the direct link below, or ask for a fresh export.",
      });
    } finally {
      setTimeout(() => setSaving(false), 600);
    }
  };

  return (
    <main className="swiss-grid-bg flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="swiss-panel swiss-ink-top w-full max-w-lg">
        <div className="flex items-center gap-3 border-b border-border px-6 py-4">
          <SwissThemeMark className="size-9 shrink-0" />
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
          <h1 className="swiss-headline mt-3 text-3xl">{ARCHIVE_FILENAME}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The full codebase in a single archive. The file is assembled
            locally in your browser from the embedded build payload — no
            server round-trip, so it works even in sandboxed previews.
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

          <Button
            size="lg"
            className="mt-6 w-full cursor-pointer gap-2 bg-[#1f4e9c] text-white hover:bg-[#1f4e9c]/85"
            onClick={handleDownload}
            disabled={saving}
          >
            <ArrowDownToLine className="size-4" />
            {saving ? "Assembling archive…" : "Download the zip"}
          </Button>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-[#2f9e63]" />
            Integrity: sha256 {ARCHIVE_SHA256.slice(0, 16)}…
          </p>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            If your browser blocks the save, open{" "}
            <a className="underline hover:text-foreground" href="/hindsight-strategy-copilot.zip">
              /hindsight-strategy-copilot.zip
            </a>{" "}
            directly, or the archive also sits at the project root.
          </p>
          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            After unzipping: bun install → bun convex dev --once → bun run dev
          </p>
        </div>
      </div>
    </main>
  );
}
