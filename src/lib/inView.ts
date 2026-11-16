"use client";

/**
 * Calls `onChange(true)` when `el` comes within `margin` of the screen and `onChange(false)` when it
 * leaves, so ambient loops (spins, pulses, blinks, the marquee) only run while someone can see them.
 * The browser's own clipping counts: an element moved out of a clipped stage is "out of view".
 * Returns a cleanup function.
 */
export function whileInView(el: Element, onChange: (visible: boolean) => void, margin = "120px 0px") {
  const io = new IntersectionObserver(([entry]) => onChange(entry.isIntersecting), { rootMargin: margin });
  io.observe(el);
  return () => io.disconnect();
}
