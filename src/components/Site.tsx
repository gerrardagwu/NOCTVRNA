"use client";

import { useEffect, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { createLenis, destroyLenis } from "@/lib/lenis";
import Loader from "./Loader";
import Hero from "./Hero";
import Strip from "./Strip";
import Manifesto from "./Manifesto";
import Stack from "./Stack";
import Footer from "./Footer";

export default function Site() {
  const [revealed, setRevealed] = useState(false);

  // Smooth scroll lives for the life of the page; it stays paused until the loader lifts.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const lenis = createLenis();
    lenis.stop();
    return () => destroyLenis();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (!revealed) {
      root.style.overflow = "hidden";
      return;
    }
    root.style.overflow = "";
    createLenis().start();
    ScrollTrigger.refresh();
  }, [revealed]);

  return (
    <>
      <Loader onReveal={() => setRevealed(true)} />
      <Hero play={revealed} />
      <main>
        <Strip />
        <Manifesto />
        <Stack />
      </main>
      <Footer />
    </>
  );
}
