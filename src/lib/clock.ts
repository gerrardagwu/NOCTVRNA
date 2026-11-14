"use client";

/**
 * Trusted "now" for the countdown. Starts on the device clock, then corrects it against the server's
 * clock (/api/time), allowing for half the round trip. If the server can't be reached, the device
 * clock is used as is.
 */
let offset = 0;
let pending: Promise<void> | null = null;

export const now = () => Date.now() + offset;

export function syncClock(): Promise<void> {
  if (pending) return pending;
  pending = (async () => {
    try {
      const sent = Date.now();
      const res = await fetch("/api/time", { cache: "no-store" });
      const received = Date.now();
      if (!res.ok) return;
      const { now: server } = (await res.json()) as { now: number };
      const roundTrip = received - sent;
      // A slow answer can't be trusted to the second; keep the device clock in that case.
      if (typeof server === "number" && roundTrip < 4000) offset = server + roundTrip / 2 - received;
    } catch {
      // Offline or no server (a static export): stay on the device clock.
    } finally {
      pending = null;
    }
  })();
  return pending;
}
