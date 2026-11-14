"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
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
  const seconds = Math.floor(Math.max(0, EVENT_TIME - Date.now()) / 1000);
  const days = Math.min(99, Math.floor(seconds / 86400));
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return { days, hours, mins, secs };
}

export default function Countdown({ ref }: { ref?: Ref<CountdownHandle> }) {
  const digits = useRef<(FlipDigitHandle | null)[]>([]);
  const row = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearInterval(timer.current), []);

  useImperativeHandle(
    ref,
    () => ({
      start(cascade) {
        if (timer.current) return;
        const tick = (first: boolean) => {
          const { days, hours, mins, secs } = remaining();
          const values = [days, hours, mins, secs].flatMap((n) => [Math.floor(n / 10), n % 10]);
          values.forEach((v, i) => digits.current[i]?.set(v, first && cascade));
          row.current?.setAttribute(
            "aria-label",
            `${days} days, ${hours} hours, ${mins} minutes and ${secs} seconds until 12 December 2026`,
          );
        };
        tick(true);
        timer.current = window.setInterval(() => tick(false), 1000);
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
