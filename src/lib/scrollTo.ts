"use client";

import { ScrollTrigger } from "./gsap";
import { getLenis } from "./lenis";

/**
 * Scroll to the sign-up ("Enter a different state of night"). It lives at the end of the pinned values
 * stage, so the target is the point in that pin where the sign-up has fully arrived, not an element top.
 */
export function scrollToEnter() {
  const st = ScrollTrigger.getById("values-stage");
  if (!st) {
    document.getElementById("enter")?.scrollIntoView({ behavior: "smooth" });
    return;
  }
  const d = st.animation?.duration() ?? 1;
  const settled = Math.max(0, d - 0.35) / d; // the stage timeline ends with a 0.35s hold
  const y = st.start + (st.end - st.start) * settled;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(y, { duration: 2.2 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}
