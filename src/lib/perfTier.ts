"use client";

import { gsap } from "./gsap";

/**
 * Adaptive quality. On a low-powered device the page swaps its few effects that cost the GPU or the main
 * thread on every frame for near-identical cheap ones (CSS keyed on html[data-perf="low"]):
 *  - the header's frosted glass (backdrop blur, re-rendered every frame while content scrolls under it)
 *    becomes a slightly denser tint of the same colour;
 *  - wheel smooth-scrolling is left to the browser (phones scroll natively anyway).
 * Everything else, every animation included, stays as designed.
 *
 * How a device is judged low-powered:
 *  - up front, as the page starts up and before it hydrates (perfTierScript.ts, run by app/layout.tsx): an
 *    Android phone with 2 GB of memory or less, 4 or fewer cores, or Data Saver on (the header it restyles
 *    is hidden until the page scrolls, so nothing visibly swaps);
 *  - while it runs: measured frame times. During the hero's intro and the first scroll, if frames come in
 *    slower than ~45 fps for most of the window, the page switches. It never switches back during a visit.
 * `?perf=low` or `?perf=high` in the address forces a tier (for testing).
 */

type Listener = () => void;
const listeners = new Set<Listener>();

export const isLowTier = () => typeof document !== "undefined" && document.documentElement.dataset.perf === "low";
const isForced = () => typeof document !== "undefined" && "perfForced" in document.documentElement.dataset;

/** Runs `fn` now if the page is already low tier, or when it switches. Returns an unsubscribe. */
export function onLowTier(fn: Listener) {
  if (isLowTier()) fn();
  else listeners.add(fn);
  return () => listeners.delete(fn);
}

function goLow() {
  if (isLowTier() || isForced()) return;
  document.documentElement.dataset.perf = "low";
  listeners.forEach((fn) => fn());
  listeners.clear();
}

/**
 * Samples frame times from GSAP's ticker (already running, so no extra loop) for `seconds`, and switches to
 * the low tier if the device can't keep up. Ignores huge gaps (a background tab, a debugger).
 */
export function probeFrames(seconds: number) {
  if (isLowTier() || isForced() || typeof document === "undefined") return () => {};
  const deltas: number[] = [];
  let elapsed = 0;
  const sample = (_t: number, deltaMs: number) => {
    if (document.hidden) return;
    if (deltaMs < 250) deltas.push(deltaMs);
    elapsed += deltaMs;
    if (elapsed < seconds * 1000) return;
    stop();
    if (deltas.length < 30) return;
    const sorted = [...deltas].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const slow = deltas.filter((d) => d > 34).length / deltas.length;
    // Below ~45 fps most of the time, or a third of frames visibly dropped.
    if (median > 22 || slow > 0.33) goLow();
  };
  const stop = () => gsap.ticker.remove(sample);
  gsap.ticker.add(sample);
  return stop;
}
