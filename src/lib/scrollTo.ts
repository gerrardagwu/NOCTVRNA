"use client";

import { getLenis } from "./lenis";

/**
 * Scroll to the sign-up ("Enter a different state of night"). It's an ordinary full-screen section after the
 * values, and its lines finish rising in exactly as its top reaches the top of the screen, so that's the target.
 */
export function scrollToEnter() {
  const el = document.getElementById("enter");
  if (!el) return;
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(el, { duration: 2.2 });
  else el.scrollIntoView({ behavior: "smooth" });
}
