// download-archive.ts — builds the project zip in the browser from the
// embedded base64 payload and triggers a local save. No server file needed,
// which works inside sandboxed previews where direct file links fail.

import { ARCHIVE_BASE64, ARCHIVE_SHA256 } from "@/generated/archive/archive";

export const ARCHIVE_FILENAME = "hindsight-strategy-copilot.zip";

export function downloadProjectArchive(): void {
  const binary = atob(ARCHIVE_BASE64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: "application/zip" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = ARCHIVE_FILENAME;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export { ARCHIVE_SHA256 };
