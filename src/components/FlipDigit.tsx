"use client";

import { useImperativeHandle, useRef, type Ref } from "react";
import { gsap } from "@/lib/gsap";
import s from "./Countdown.module.css";

export type FlipDigitHandle = {
  /** Show `n`. With `cascade`, run through every digit on the way like a calendar being thumbed open. */
  set: (n: number, cascade?: boolean) => void;
  /** Show `n` immediately, dropping any flips in progress or waiting. */
  snap: (n: number) => void;
};

type Step = { value: number; duration: number; cascade: boolean };

/**
 * One split-flap card. The card art is the Figma "Subtract" shape; each half is the same full card
 * clipped to the top or bottom, so the digit lines up across the hinge. A change lifts the bottom
 * flap up and over: its front shows the old digit's lower half, its back the new digit's upper half.
 */
export default function FlipDigit({ ref, art }: { ref?: Ref<FlipDigitHandle>; art: string }) {
  const top = useRef<HTMLSpanElement>(null);
  const bottom = useRef<HTMLSpanElement>(null);
  const front = useRef<HTMLSpanElement>(null);
  const back = useRef<HTMLSpanElement>(null);
  const flap = useRef<HTMLSpanElement>(null);
  const frontShade = useRef<HTMLElement>(null);
  const backShade = useRef<HTMLElement>(null);

  const shown = useRef(0);
  const target = useRef(0);
  const queue = useRef<Step[]>([]);
  const busy = useRef(false);
  const running = useRef<gsap.core.Timeline | null>(null);

  useImperativeHandle(
    ref,
    () => {
      const write = (el: HTMLElement | null, v: number) => {
        if (el) el.textContent = String(v);
      };

      const next = () => {
        const step = queue.current.shift();
        if (!step) {
          busy.current = false;
          return;
        }
        busy.current = true;
        const from = shown.current;
        const to = step.value;
        const d = step.duration;

        write(top.current, from);
        write(front.current, from);
        write(bottom.current, to);
        write(back.current, to);

        running.current = gsap
          .timeline({
            onComplete: () => {
              shown.current = to;
              write(top.current, to);
              write(front.current, to);
              gsap.set(flap.current, { rotateX: 0 });
              gsap.set([frontShade.current, backShade.current], { opacity: 0 });
              running.current = null;
              next();
            },
          })
          .fromTo(flap.current, { rotateX: 0 }, { rotateX: 180, duration: d, ease: d < 0.2 ? "none" : "power3.inOut" })
          .fromTo(frontShade.current, { opacity: 0 }, { opacity: 0.55, duration: d / 2, ease: "none" }, 0)
          .fromTo(backShade.current, { opacity: 0.55 }, { opacity: 0, duration: d / 2, ease: "none" }, d / 2);
      };

      const snap = (n: number) => {
        running.current?.kill();
        running.current = null;
        queue.current = [];
        busy.current = false;
        shown.current = target.current = n;
        [top, bottom, front, back].forEach((r) => write(r.current, n));
        gsap.set(flap.current, { rotateX: 0 });
        gsap.set([frontShade.current, backShade.current], { opacity: 0 });
      };

      return {
        snap,
        set(n, cascade = false) {
          if (n === target.current) return;
          // A hidden tab doesn't run animations, so flips would pile up and play late. Just show the value.
          if (document.hidden) return snap(n);
          // A newer tick replaces any plain flip still waiting, so the card never falls behind the clock.
          queue.current = queue.current.filter((step) => step.cascade);
          const values: number[] = [];
          if (cascade) {
            let v = target.current;
            while (v !== n) {
              v = (v + 1) % 10;
              values.push(v);
            }
          } else {
            values.push(n);
          }
          target.current = n;
          const last = values.length - 1;
          values.forEach((value, i) => {
            // Thumb quickly through the middle of the run, then land on the real digit with weight.
            const duration = !cascade ? 0.55 : i === last ? 0.6 : Math.max(0.07, 0.16 - i * 0.012);
            queue.current.push({ value, duration, cascade });
          });
          if (!busy.current) next();
        },
      };
    },
    [],
  );

  const face = { backgroundImage: `url(${art})` };

  return (
    <span className={s.card} data-card>
      <span className={`${s.half} ${s.top}`} style={face}>
        <span ref={top}>0</span>
      </span>
      <span className={`${s.half} ${s.bottom}`} style={face}>
        <span ref={bottom}>0</span>
      </span>
      <span className={s.flap} ref={flap}>
        <span className={`${s.half} ${s.front}`} style={face}>
          <span ref={front}>0</span>
          <i className={s.shade} ref={frontShade} style={{ maskImage: `url(${art})`, WebkitMaskImage: `url(${art})` }} />
        </span>
        <span className={`${s.half} ${s.back}`} style={face}>
          <span ref={back}>0</span>
          <i className={s.shade} ref={backShade} style={{ maskImage: `url(${art})`, WebkitMaskImage: `url(${art})` }} />
        </span>
      </span>
    </span>
  );
}
