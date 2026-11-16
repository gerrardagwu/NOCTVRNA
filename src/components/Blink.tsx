"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { whileInView } from "@/lib/inView";
import s from "./Blink.module.css";

/** Eye centre and size, in percent of the owl artwork's own box. Measured from the green of each iris. */
export type Eye = { x: number; y: number; w: number; h: number };

export const OWL_EYES = {
  badge: [
    { x: 19.3, y: 53.4, w: 28, h: 22 },
    { x: 81.2, y: 53.6, w: 29, h: 21 },
  ],
  // The wide band of the owl's face used in the hero and header (cut from the poster art).
  face: [
    { x: 19.5, y: 41.0, w: 28, h: 39.2 },
    { x: 81.5, y: 41.9, w: 28.5, h: 39.2 },
  ],
  // The event flyer in the city section.
  poster: [
    { x: 19.6, y: 51.3, w: 28.6, h: 18.8 },
    { x: 81.8, y: 51.6, w: 28.6, h: 18.6 },
  ],
} satisfies Record<string, Eye[]>;

/**
 * Eyelids laid over an owl image. Place inside a positioned box the same size as the artwork.
 * Blinks every few seconds, now and then twice in a row, while it's on screen. `watch` is a selector for
 * the element whose visibility counts, for an owl that sits in a fixed layer (the hero's) rather than
 * scrolling with its section.
 */
export default function Blink({ eyes, className, watch }: { eyes: Eye[]; className?: string; watch?: string }) {
  const root = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const lids = root.current!.querySelectorAll(`.${s.eye}`);
      let next: gsap.core.Tween | null = null;
      let visible = false;

      const blink = () => {
        if (!visible) return;
        const tl = gsap.timeline({ onComplete: schedule });
        const times = Math.random() < 0.22 ? 2 : 1;
        for (let i = 0; i < times; i++) {
          // A slow, deliberate blink: the lid draws down, rests a beat, then lifts.
          tl.to(lids, { "--lid": 1, duration: 0.15, ease: "power2.inOut" }).to(lids, {
            "--lid": 0,
            duration: 0.3,
            ease: "power2.out",
            delay: 0.08,
          });
        }
      };
      const schedule = () => {
        if (visible) next = gsap.delayedCall(2.4 + Math.random() * 3.6, blink);
      };

      const target = (watch && document.querySelector(watch)) || root.current!;
      const stopWatching = whileInView(target, (v) => {
        visible = v;
        next?.kill();
        if (v) next = gsap.delayedCall(0.6 + Math.random() * 2, blink);
      });
      return () => {
        stopWatching();
        next?.kill();
      };
    },
    { scope: root, dependencies: [watch] },
  );

  return (
    <span ref={root} className={`${s.blink} ${className ?? ""}`} aria-hidden="true">
      {eyes.map((e, i) => (
        <span
          key={i}
          className={s.eye}
          style={{ left: `${e.x}%`, top: `${e.y}%`, width: `${e.w}%`, height: `${e.h}%` }}
        >
          <i className={`${s.lid} ${i === 0 ? s.left : s.right}`} />
        </span>
      ))}
    </span>
  );
}
