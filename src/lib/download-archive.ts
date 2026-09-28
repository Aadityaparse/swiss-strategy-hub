// download-archive.ts — builds the project zip in the browser from the
// embedded base64 payload and triggers a local save. No server file needed,
// which works inside sandboxed previews where direct file links fail.

import { ARCHIVE_BASE64, ARCHIVE_SHA256 } from "@/generated/archive/archive";

export const ARCHIVE_FILENAME = "hindsight-strategy-copilot.zip";

/**
 * Build the zip as an object URL. Returned so callers can also offer a
 * manual "open in new tab" fallback if the automatic save is blocked.
 */
export function buildArchiveObjectUrl(): string {
  const buffer = base64ToArrayBuffer(ARCHIVE_BASE64);
  const blob = new Blob([buffer], { type: "application/zip" });
  return URL.createObjectURL(blob);
}

/** Decode a base64 string into a freshly allocated byte buffer. */
function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

/**
 * Trigger a local save of the embedded archive. Resolves to true when a
 * download anchor was created (browsers may still block silently, which is
 * why the caller offers an open-in-tab fallback).
 */
export function downloadProjectArchive(): boolean {
  const buffer = base64ToArrayBuffer(ARCHIVE_BASE64);
  const blob = new Blob([buffer], { type: "application/zip" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = ARCHIVE_FILENAME;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

export { ARCHIVE_SHA256 };
