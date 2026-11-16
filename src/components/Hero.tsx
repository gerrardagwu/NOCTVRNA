"use client";

import Image from "next/image";
import { useRef, type MouseEvent } from "react";
import { gsap, ScrollTrigger, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { scrollToTop } from "@/lib/lenis";
import { scrollToEnter } from "@/lib/scrollTo";
import Blink, { OWL_EYES } from "./Blink";
import Countdown, { type CountdownHandle } from "./Countdown";
import s from "./Hero.module.css";

/**
 * Header geometry the hero logo and countdown shrink into (the owl stays in the hero and fades with it).
 * Desktop: logo left, countdown centred, Get Access ticket right. Mobile: logo left, ticket right, and the
 * countdown hangs just below the header on the right in a small tab (tabX / tabY are its padding).
 */
const HEADER = {
  desktop: { height: 76, pad: 32, logo: 30, card: 30, tabX: 0, tabY: 0, timerInBar: true },
  mobile: { height: 60, pad: 16, logo: 22, card: 18, tabX: 8, tabY: 7, timerInBar: false },
};

/** GSAP's sine.inOut as a CSS easing, for animations the browser runs itself. */
const SINE_IN_OUT = "cubic-bezier(0.37, 0, 0.63, 1)";

/** Layout rect of an element with any GSAP transform taken off, so header targets stay correct after resize. */
function untransformed(el: HTMLElement) {
  const t = el.style.transform;
  el.style.transform = "none";
  const r = el.getBoundingClientRect();
  el.style.transform = t;
  return r;
}

export default function Hero({ play }: { play: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const countdown = useRef<CountdownHandle>(null);

  // Scroll: the logo and countdown live in a fixed layer and are scrubbed from their hero positions
  // into the sticky header while the hero scrolls away; the owl and captions fade out with the hero.
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const hero = q("[data-hero]")[0] as HTMLElement;
      const logo = q("[data-logo]")[0] as HTMLElement;
      const timer = q("[data-cd-wrap]")[0] as HTMLElement;
      const card = q("[data-card]")[0] as HTMLElement;
      const tab = q("[data-cd-tab]")[0] as HTMLElement;

      const mm = gsap.matchMedia();
      mm.add({ mobile: "(max-width: 760px)", desktop: "(min-width: 761px)" }, (ctx) => {
        const h = ctx.conditions?.mobile ? HEADER.mobile : HEADER.desktop;
        const viewportW = () => document.documentElement.clientWidth;
        const timerScale = () => h.card / card.offsetHeight;

        // On mobile the countdown sits in a tab under the header, sized to the shrunken timer.
        const sizeTab = () =>
          gsap.set(tab, {
            width: untransformed(timer).width * timerScale() + h.tabX * 2,
            height: h.card + h.tabY * 2,
            right: h.pad,
          });
        if (!h.timerInBar) {
          sizeTab();
          ScrollTrigger.addEventListener("refresh", sizeTab);
        }

        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: hero,
              start: "top top",
              end: () => `+=${Math.max(200, hero.offsetHeight - h.height)}`,
              scrub: 0.7,
              invalidateOnRefresh: true,
            },
          })
          .fromTo(
            logo,
            { x: 0, y: 0, scale: 1 },
            {
              x: () => h.pad - untransformed(logo).left,
              y: () => (h.height - h.logo) / 2 - untransformed(logo).top,
              scale: () => h.logo / logo.offsetHeight,
              ease: "power1.inOut",
            },
            0,
          )
          .fromTo(
            timer,
            { x: 0, y: 0, scale: 1 },
            {
              x: () => {
                const r = untransformed(timer);
                const w = r.width * timerScale();
                return (h.timerInBar ? (viewportW() - w) / 2 : viewportW() - h.pad - h.tabX - w) - r.left;
              },
              y: () => (h.timerInBar ? (h.height - h.card) / 2 : h.height + h.tabY) - untransformed(timer).top,
              scale: timerScale,
              ease: "power1.inOut",
            },
            0,
          )
          .fromTo(q("[data-fade]"), { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -48, duration: 0.45 }, 0)
          .fromTo(q("[data-cd-label]"), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3 }, 0.1)
          .fromTo(q("[data-bg]"), { yPercent: 0, opacity: 1 }, { yPercent: 22, opacity: 0.35 }, 0)
          .fromTo(q(h.timerInBar ? "[data-bar]" : "[data-bar], [data-cd-tab]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 0.75);

        return () => ScrollTrigger.removeEventListener("refresh", sizeTab);
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  // Intro once the page is ready: the logo switches on like a tube light catching, then the rest follows.
  useGSAP(
    () => {
      if (!play) return;
      const q = gsap.utils.selector(root);
      const logoInner = q("[data-logo-inner]");

      if (prefersReducedMotion()) {
        gsap.set(logoInner, { "--b": 1, "--g": 0.55 });
        gsap.set(q("[data-bg-inner]"), { opacity: 1, scale: 1 });
        gsap.set(q("[data-intro]"), { opacity: 1 });
        countdown.current?.start(false);
        return;
      }

      // Once lit, the logo keeps a faint hum: a browser animation of the glow's opacity, which the compositor
      // plays on its own thread, so it costs the page nothing per frame and never competes with scrolling.
      // (Driven by GSAP it restyled and repainted the blurred glow every frame for as long as the page was open.)
      let hum: Animation | null = null;
      const startHum = () => {
        const glow = q("[data-glow-img]")[0] as HTMLElement | undefined;
        gsap.set(logoInner, { "--g": 0.55 });
        (logoInner[0] as HTMLElement).dataset.lit = "";
        return glow?.animate([{ opacity: 0.55 }, { opacity: 0.8 }], { duration: 2600, iterations: Infinity, direction: "alternate", easing: SINE_IN_OUT }) ?? null;
      };

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.to(q("[data-bg-inner]"), { opacity: 1, scale: 1, duration: 2.6, ease: "power2.out" }, 0.2)
        .fromTo(logoInner, { scale: 0.965 }, { scale: 1, duration: 2.2, ease: "power2.out" }, 0.25)
        .to(
          logoInner,
          {
            keyframes: {
              "0%": { "--b": 0.04, "--g": 0 },
              "7%": { "--b": 0.85, "--g": 0.45 },
              "11%": { "--b": 0.06, "--g": 0 },
              "19%": { "--b": 0.55, "--g": 0.25 },
              "23%": { "--b": 0.05, "--g": 0 },
              "41%": { "--b": 0.08, "--g": 0.02 },
              "46%": { "--b": 1, "--g": 0.7 },
              "50%": { "--b": 0.3, "--g": 0.12 },
              "56%": { "--b": 1.15, "--g": 0.85 },
              "100%": { "--b": 1, "--g": 0.55 },
              easeEach: "none",
            },
            duration: 1.7,
          },
          0.25,
        )
        .fromTo(q("[data-owl] [data-intro]"), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.9 }, 1.2)
        .to(
          q("[data-lagos]"),
          {
            keyframes: { "0%": { opacity: 0 }, "20%": { opacity: 1 }, "30%": { opacity: 0.2 }, "45%": { opacity: 1 }, "55%": { opacity: 0.5 }, "100%": { opacity: 1 }, easeEach: "none" },
            duration: 0.7,
          },
          1.5,
        )
        .fromTo(q("[data-after]"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.9 }, 1.75)
        .fromTo(q("[data-cd-title] [data-intro]"), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8 }, 1.9)
        .set(q("[data-cd-pair]"), { opacity: 1 }, 2.0)
        .from(
          q("[data-card]"),
          // clearProps: once in, the cards carry no transform (a leftover perspective() would keep each on its own layer).
          { rotateX: -100, opacity: 0, transformPerspective: 400, transformOrigin: "50% 0%", duration: 0.9, stagger: 0.06, ease: "expo.out", clearProps: "transform,transformOrigin" },
          2.0,
        )
        .fromTo(q("[data-cd-label] [data-intro]"), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, 2.35)
        .call(() => countdown.current?.start(true), [], 2.45)
        .fromTo(q("[data-ticket]"), { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.8 }, 2.5)
        .call(() => (hum = startHum()), [], ">");

      return () => hum?.cancel();
    },
    { scope: root, dependencies: [play] },
  );

  const onLogo = (e: MouseEvent) => {
    e.preventDefault();
    scrollToTop();
  };

  const onTicket = (e: MouseEvent) => {
    e.preventDefault();
    scrollToEnter();
  };

  return (
    <div ref={root} className={s.root}>
      <div className={s.layer}>
        {/* The whole header bar is a back-to-top button. The timer sits on it without catching clicks, so
            tapping it lands here too; the logo is its own link to the same place. */}
        <button type="button" className={s.bar} data-bar onClick={scrollToTop} aria-label="Back to top" />
        <div className={s.cdTab} data-cd-tab aria-hidden="true" />
        <a href="#enter" className={s.ticket} data-ticket data-intro onClick={onTicket}>
          <span className={s.ticketMain}>Get Access</span>
          <span className={s.ticketStub} aria-hidden="true">
            <svg viewBox="0 0 16 16" width="16" height="16">
              <path d="M2 8h11M9 3.5 13.5 8 9 12.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </a>
        <div className={s.stage}>
          <div className={s.owl} data-owl data-fade>
            <div data-intro className={s.owlInner}>
              <Image src="/images/hero-owl.webp" alt="" fill sizes="(max-width: 760px) 112vw, 1000px" priority quality={85} />
              <Blink eyes={OWL_EYES.face} watch="[data-hero]" />
            </div>
          </div>

          <a href="#top" className={s.logo} data-logo onClick={onLogo} aria-label="NOCTVRNA, back to top">
            <span className={s.logoInner} data-logo-inner>
              <Image className={s.glow} data-glow-img src="/images/logo.png" alt="" fill sizes="(max-width: 760px) 92vw, 931px" priority />
              <Image className={s.logoImg} src="/images/logo.png" alt="NOCTVRNA" fill sizes="(max-width: 760px) 92vw, 931px" priority />
            </span>
          </a>

          <div className={s.caption} data-fade>
            <p className={s.lagos} data-lagos data-intro>
              THE LAGOS LIFE
            </p>
            <p className={s.after} data-after data-intro>
              OUR DAY BEGINS AFTER DARK
            </p>
          </div>

          <div className={s.cdTitle} data-cd-title data-fade>
            <p data-intro>Countdown to 12.12.26</p>
          </div>

          <div className={s.cdWrap} data-cd-wrap>
            <Countdown ref={countdown} />
          </div>
        </div>
      </div>

      <section className={s.hero} id="top" data-hero aria-labelledby="hero-title">
        <h1 id="hero-title" className="sr-only">
          NOCTVRNA: The Lagos Life. Our day begins after dark. 12 December 2026.
        </h1>
        <div className={s.bg} data-bg aria-hidden="true">
          <div className={s.bgInner} data-bg-inner>
            <Image className={s.bgImg} src="/images/hero-bg.png" alt="" fill priority sizes="100vw" quality={75} />
            <div className={s.bgShade} />
          </div>
        </div>
      </section>
    </div>
  );
}
