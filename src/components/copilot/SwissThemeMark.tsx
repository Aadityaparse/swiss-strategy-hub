// SwissThemeMark.tsx — the shared brand mark: a square frame with the Swiss
// red square, used in the masthead, auth page and download route.

export function SwissThemeMark({ className = "size-9" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center border border-foreground bg-card ${className}`}
      aria-hidden
    >
      <div className="h-3.5 w-3.5 bg-[#d5281b]" />
    </div>
  );
}
