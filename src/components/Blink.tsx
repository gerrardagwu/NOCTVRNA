"use client";

import { useImperativeHandle, useRef, type Ref } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import s from "./Blink.module.css";

/** Eye centre and size, in percent of the owl artwork's own box. Measured from the green of each iris. */
export type Eye = { x: number; y: number; w: number; h: number };

export const OWL_EYES = {
  badge: [
    { x: 19.3, y: 53.4, w: 28, h: 22 },
    { x: 81.2, y: 53.6, w: 29, h: 21 },
  ],
  loader: [
    { x: 19.7, y: 52.6, w: 28, h: 23 },
    { x: 81.4, y: 53.6, w: 29, h: 21 },
  ],
  poster: [
    { x: 19.5, y: 51.8, w: 28, h: 18 },
    { x: 81.5, y: 52.2, w: 28.5, h: 18 },
  ],
} satisfies Record<string, Eye[]>;

export type BlinkHandle = {
  /** Stop the idle blinking and close the eyes slowly; resolves once they're shut. */
  shut: (duration?: number) => Promise<void>;
};

/** Base timings for one blink, in seconds; `pace` stretches them. */
const CLOSE = 0.08;
const HOLD = 0.04;
const OPEN = 0.17;

/**
 * Eyelids laid over an owl image. Place inside a positioned box the same size as the artwork.
 * Blinks every few seconds, now and then twice in a row, for as long as it's on the page.
 * `pace` slows the blink itself (1.6 reads as relaxed, 2.5 as sleepy).
 */
export default function Blink({
  eyes,
  className,
  pace = 1.6,
  ref,
}: {
  eyes: Eye[];
  className?: string;
  pace?: number;
  ref?: Ref<BlinkHandle>;
}) {
  const root = useRef<HTMLSpanElement>(null);
  const next = useRef<gsap.core.Tween | null>(null);
  const current = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const lids = root.current!.querySelectorAll(`.${s.eye}`);

      const blink = () => {
        const tl = gsap.timeline({ onComplete: schedule });
        const times = Math.random() < 0.22 ? 2 : 1;
        for (let i = 0; i < times; i++) {
          tl.to(lids, { "--lid": 1, duration: CLOSE * pace, ease: "power2.in" }).to(lids, {
            "--lid": 0,
            duration: OPEN * pace,
            ease: "power3.out",
            delay: HOLD * pace,
          });
        }
        current.current = tl;
      };
      const schedule = () => {
        next.current = gsap.delayedCall(2 + Math.random() * 3.4, blink);
      };

      next.current = gsap.delayedCall(0.6 + Math.random() * 2, blink);
      return () => next.current?.kill();
    },
    { scope: root },
  );

  useImperativeHandle(
    ref,
    () => ({
      shut: (duration = 0.5) =>
        new Promise<void>((resolve) => {
          next.current?.kill();
          current.current?.kill();
          const lids = root.current?.querySelectorAll(`.${s.eye}`);
          if (!lids?.length || prefersReducedMotion()) return resolve();
          gsap.to(lids, { "--lid": 1, duration, ease: "power2.inOut", onComplete: resolve });
        }),
    }),
    [],
  );

  return (
    <span ref={root} className={`${s.blink} ${className ?? ""}`} aria-hidden="true">
      {eyes.map((e, i) => (
        <span
          key={i}
          className={s.eye}
          style={{ left: `${e.x}%`, top: `${e.y}%`, width: `${e.w}%`, height: `${e.h}%` }}
        >
          <i className={s.upper} />
          <i className={s.lower} />
        </span>
      ))}
    </span>
  );
}
