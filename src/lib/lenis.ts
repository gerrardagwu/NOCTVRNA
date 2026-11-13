"use client";

import Lenis from "lenis";
import { gsap, ScrollTrigger, prefersReducedMotion } from "./gsap";

let instance: Lenis | null = null;

export const getLenis = () => instance;

/** Creates the single Lenis instance and drives it from GSAP's ticker so ScrollTrigger stays in sync. */
export function createLenis() {
  if (instance) return instance;

  instance = new Lenis({
    autoRaf: false,
    lerp: 0.085,
    wheelMultiplier: 0.9,
    smoothWheel: !prefersReducedMotion(),
  });

  instance.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
  return instance;
}

export function destroyLenis() {
  gsap.ticker.remove(raf);
  instance?.destroy();
  instance = null;
}

function raf(time: number) {
  instance?.raf(time * 1000);
}

export function scrollToTop() {
  if (instance) instance.scrollTo(0, { duration: 1.6 });
  else window.scrollTo({ top: 0, behavior: "smooth" });
}
