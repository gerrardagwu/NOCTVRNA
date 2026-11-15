"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import s from "./Strip.module.css";
import { STRIP_WORDS } from "./stripWords";

const REPEATS = 3; // one set is wider than any screen, so two sets loop seamlessly

/**
 * Endless marquee driven by page scroll: it always drifts, runs faster the harder you scroll and
 * turns around when you scroll back up.
 */
export default function Strip() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const track = root.current!.querySelector<HTMLElement>(`.${s.track}`)!;
      const set = track.firstElementChild as HTMLElement;
      const drift = prefersReducedMotion() ? 0 : 0.8; // px per frame at 60fps
      let width = set.offsetWidth;
      let x = 0;
      let lastY = window.scrollY;
      let dir = 1;
      let boost = 0;

      const ro = new ResizeObserver(() => (width = set.offsetWidth));
      ro.observe(set);

      const tick = (_time: number, deltaMs: number) => {
        const y = window.scrollY;
        const dy = y - lastY;
        lastY = y;
        if (dy !== 0) dir = dy > 0 ? 1 : -1;
        boost += (Math.min(Math.abs(dy), 90) * 0.55 - boost) * 0.1;
        x -= dir * (drift + boost) * (deltaMs / 16.67);
        if (x <= -width) x += width;
        else if (x > 0) x -= width;
        track.style.transform = `translate3d(${x}px, 0, 0)`;
      };

      gsap.ticker.add(tick);
      return () => {
        gsap.ticker.remove(tick);
        ro.disconnect();
      };
    },
    { scope: root },
  );

  const set = (key: string, hidden: boolean) => (
    <div className={s.set} key={key} aria-hidden={hidden || undefined}>
      {Array.from({ length: REPEATS }).flatMap((_, r) =>
        STRIP_WORDS.map(({ word, w, d }) => (
          <span className={s.item} key={`${r}-${word}`}>
            <svg className={s.word} width={w} height={22} viewBox={`0 0 ${w} 22`} aria-hidden="true">
              <path d={d} fill="currentColor" />
            </svg>
            <Image className={s.owl} src="/images/strip-owl.png" alt="" width={40} height={40} />
          </span>
        )),
      )}
    </div>
  );

  return (
    <div ref={root} className={s.strip} role="marquee" aria-label="Culture, sound, people, atmosphere">
      <div className={s.track}>
        {set("a", false)}
        {set("b", true)}
      </div>
    </div>
  );
}
