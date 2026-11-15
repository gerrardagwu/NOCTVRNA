"use client";

import { useEffect } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { createLenis, destroyLenis } from "@/lib/lenis";
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
    return () => destroyLenis();
  }, []);

  // Text metrics change once the real fonts are in; re-measure every scroll trigger.
  useEffect(() => {
    if (fontsReady) ScrollTrigger.refresh();
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
