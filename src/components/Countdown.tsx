"use client";

import { useEffect, useImperativeHandle, useRef, type Ref, type RefObject } from "react";
import { now, syncClock } from "@/lib/clock";
import FlipDigit, { type FlipDigitHandle } from "./FlipDigit";
import s from "./Countdown.module.css";

/** 12 December 2026, 00:00 in Lagos (WAT, UTC+1, no daylight saving). */
export const EVENT_TIME = Date.UTC(2026, 11, 11, 23, 0, 0);

export type CountdownHandle = { start: (cascade: boolean) => void };

const GROUPS = [
  { label: "Days", first: 0 },
  { label: "Hour", first: 2 },
  { label: "Minute", first: 4 },
  { label: "Second", first: 6 },
] as const;

// The Figma file has six card shapes (all the same outline); the seconds pair reuses the first two.
const art = (i: number) => `/images/flip-${(i % 6) + 1}.svg`;

function remaining() {
  const seconds = Math.floor(Math.max(0, EVENT_TIME - now()) / 1000);
  const days = Math.min(99, Math.floor(seconds / 86400));
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return { days, hours, mins, secs };
}

/** Milliseconds until the displayed second next changes (plus a hair, so we land just after it). */
function untilNextSecond() {
  const left = EVENT_TIME - now();
  return left <= 0 ? 1000 : (left % 1000) + 15;
}

type Mode = "cascade" | "flip" | "snap";

type Parts = {
  digits: RefObject<(FlipDigitHandle | null)[]>;
  row: RefObject<HTMLDivElement | null>;
  timer: RefObject<number | undefined>;
};

/** Show the current time left on the cards: flip to it, thumb through to it, or jump straight there. */
function render({ digits, row }: Parts, mode: Mode) {
  const { days, hours, mins, secs } = remaining();
  const values = [days, hours, mins, secs].flatMap((n) => [Math.floor(n / 10), n % 10]);
  values.forEach((v, i) => {
    const digit = digits.current[i];
    if (mode === "snap") digit?.snap(v);
    else digit?.set(v, mode === "cascade");
  });
  row.current?.setAttribute("aria-label", `${days} days, ${hours} hours, ${mins} minutes and ${secs} seconds until 12 December 2026`);
}

/** Tick again exactly when the displayed second changes, and keep doing so. */
function schedule(parts: Parts) {
  window.clearTimeout(parts.timer.current);
  parts.timer.current = window.setTimeout(() => {
    render(parts, "flip");
    schedule(parts);
  }, untilNextSecond());
}

/**
 * Live countdown to the event. Every value is worked out fresh from the clock (device time corrected
 * against the server), and each tick is scheduled for the moment the second actually changes, so it
 * never drifts, never skips or doubles a second, and is right again the instant you come back to the tab.
 */
export default function Countdown({ ref }: { ref?: Ref<CountdownHandle> }) {
  const digits = useRef<(FlipDigitHandle | null)[]>([]);
  const row = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const started = useRef(false);

  useEffect(() => {
    const parts = { digits, row, timer };
    syncClock().then(() => {
      if (started.current) {
        render(parts, "flip");
        schedule(parts);
      }
    });

    // Background tabs throttle timers; on return, jump straight to the right time and re-check the clock.
    const onVisible = () => {
      if (document.hidden || !started.current) return;
      render(parts, "snap");
      schedule(parts);
      syncClock().then(() => {
        render(parts, "flip");
        schedule(parts);
      });
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      // Clear whichever tick is pending now; the id changes every second by design.
      window.clearTimeout(parts.timer.current);
    };
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      start(cascade) {
        if (started.current) return;
        started.current = true;
        const parts = { digits, row, timer };
        render(parts, cascade ? "cascade" : "flip");
        schedule(parts);
      },
    }),
    [],
  );

  return (
    <div ref={row} className={s.row} role="timer" aria-label="Countdown to 12 December 2026">
      {GROUPS.map(({ label, first }) => (
        <div className={s.group} key={label}>
          <div className={s.pair} data-cd-pair data-intro>
            {[first, first + 1].map((i) => (
              <FlipDigit
                key={i}
                art={art(i)}
                ref={(handle) => {
                  digits.current[i] = handle;
                }}
              />
            ))}
          </div>
          <div className={s.label} data-cd-label aria-hidden="true">
            <span data-intro>{label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
