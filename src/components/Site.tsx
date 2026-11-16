"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { createLenis, destroyLenis, getLenis } from "@/lib/lenis";
import { onLowTier, probeFrames } from "@/lib/perfTier";
import { useFontsReady } from "@/lib/useFontsReady";
import Hero from "./Hero";
import Strip from "./Strip";
import Manifesto from "./Manifesto";
import Stack from "./Stack";
import Footer from "./Footer";

export default function Site() {
  // The hero intro (the logo switching on) starts as soon as the fonts are in, so nothing is measured or
  // revealed in a fallback face.
  const fontsReady = useFontsReady();

  // Smooth scroll lives for the life of the page. Every visit starts at the top, where the intro plays.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    createLenis();

    // Adaptive quality (see perfTier.ts). On a low-powered device, wheel scrolling goes back to the browser's
    // own, which scrolls on the compositor instead of on a busy main thread. Judge the device by its frame
    // times during the first real scroll as well as during the intro (below).
    const offLow = onLowTier(() => {
      const lenis = getLenis();
      if (lenis) lenis.options.smoothWheel = false;
    });
    let stopProbe = () => {};
    const onFirstScroll = () => (stopProbe = probeFrames(3));
    window.addEventListener("scroll", onFirstScroll, { passive: true, once: true });

    return () => {
      offLow();
      stopProbe();
      window.removeEventListener("scroll", onFirstScroll);
      destroyLenis();
    };
  }, []);

  // Text metrics change once the real fonts are in; re-measure every scroll trigger. The intro starts now
  // too: watch its frame rate for a few seconds.
  useEffect(() => {
    if (!fontsReady) return;
    ScrollTrigger.refresh();
    return probeFrames(4);
  }, [fontsReady]);

  return (
    <>
      <Hero play={fontsReady} />
      <main>
        <Strip />
        <Manifesto />
        <Stack />
      </main>
      <Footer />
    </>
  );
}
