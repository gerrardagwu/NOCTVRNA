"use client";

import { useRef } from "react";
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

/**
 * Eyelids laid over an owl image. Place inside a positioned box the same size as the artwork.
 * Blinks every few seconds, now and then twice in a row, for as long as it's on the page.
 */
export default function Blink({ eyes, className }: { eyes: Eye[]; className?: string }) {
  const root = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const lids = root.current!.querySelectorAll(`.${s.eye}`);
      let next: gsap.core.Tween | null = null;

      const blink = () => {
        const tl = gsap.timeline({ onComplete: schedule });
        const times = Math.random() < 0.22 ? 2 : 1;
        for (let i = 0; i < times; i++) {
          tl.to(lids, { "--lid": 1, duration: 0.07, ease: "power2.in" }).to(lids, {
            "--lid": 0,
            duration: 0.16,
            ease: "power3.out",
            delay: 0.03,
          });
        }
      };
      const schedule = () => {
        next = gsap.delayedCall(1.8 + Math.random() * 3.4, blink);
      };

      next = gsap.delayedCall(0.6 + Math.random() * 2, blink);
      return () => next?.kill();
    },
    { scope: root },
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
