"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import s from "./Loader.module.css";

const pageLoaded = () =>
  new Promise<void>((resolve) => {
    if (document.readyState === "complete") resolve();
    else window.addEventListener("load", () => resolve(), { once: true });
  });

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Full-screen owl from the Figma "Loader" frame. Holds until fonts and images are in, then lifts. */
export default function Loader({ onReveal }: { onReveal: () => void }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const owl = root.current!.querySelector(`.${s.owl}`);
      const reduce = prefersReducedMotion();

      const intro = gsap.timeline();
      intro
        .fromTo(
          owl,
          { autoAlpha: 0, scale: 0.86, filter: "brightness(0.15) drop-shadow(0px 0px 0px rgba(85,255,0,0))" },
          {
            autoAlpha: 1,
            scale: 1,
            filter: "brightness(1) drop-shadow(0px 0px 26px rgba(85,255,0,0.35))",
            duration: reduce ? 0.3 : 1.3,
            ease: "power2.out",
          },
        )
        .to(owl, {
          filter: "brightness(1.15) drop-shadow(0px 0px 40px rgba(85,255,0,0.5))",
          duration: 0.7,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

      const ready = Promise.all([document.fonts.ready, pageLoaded(), wait(reduce ? 300 : 1600)]);

      const lift = contextSafe!(() => {
        intro.pause();
        gsap
          .timeline({ onComplete: () => root.current?.setAttribute("hidden", "") })
          .to(owl, { scale: 1.35, autoAlpha: 0, filter: "blur(8px)", duration: reduce ? 0.2 : 0.8, ease: "power2.in" })
          .add(onReveal, reduce ? 0 : 0.45)
          .to(root.current, { autoAlpha: 0, duration: reduce ? 0.2 : 0.7, ease: "power2.out" }, reduce ? 0 : 0.5);
      });

      Promise.race([ready, wait(6000)]).then(lift);
    },
    { scope: root },
  );

  return (
    <div ref={root} className={s.loader} data-loader aria-hidden="true">
      <div className={s.owl}>
        <Image src="/images/loader-owl.png" alt="" width={318} height={318} priority />
      </div>
    </div>
  );
}
