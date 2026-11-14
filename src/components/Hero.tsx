"use client";

import Image from "next/image";
import { useRef, type MouseEvent } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { scrollToTop } from "@/lib/lenis";
import Blink, { OWL_EYES } from "./Blink";
import Countdown, { type CountdownHandle } from "./Countdown";
import s from "./Hero.module.css";

/**
 * Header geometry the hero owl, logo and countdown shrink into. Desktop: logo left, owl centred,
 * timer right. Mobile: owl at the far left with the logo beside it, timer right.
 */
const HEADER = {
  desktop: { height: 76, pad: 32, owl: 50, gap: 12, logo: 30, card: 30, owlCentred: true },
  mobile: { height: 60, pad: 16, owl: 34, gap: 8, logo: 22, card: 20, owlCentred: false },
};

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
  // into a sticky header while the hero scrolls away.
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const hero = q("[data-hero]")[0] as HTMLElement;
      const owl = q("[data-owl]")[0] as HTMLElement;
      const logo = q("[data-logo]")[0] as HTMLElement;
      const timer = q("[data-cd-wrap]")[0] as HTMLElement;
      const card = q("[data-card]")[0] as HTMLElement;

      const mm = gsap.matchMedia();
      mm.add({ mobile: "(max-width: 760px)", desktop: "(min-width: 761px)" }, (ctx) => {
        const h = ctx.conditions?.mobile ? HEADER.mobile : HEADER.desktop;
        const viewportW = () => document.documentElement.clientWidth;
        const timerScale = () => h.card / card.offsetHeight;

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
            owl,
            { x: 0, y: 0, scale: 1 },
            {
              x: () => (h.owlCentred ? (viewportW() - h.owl) / 2 : h.pad) - untransformed(owl).left,
              y: () => (h.height - h.owl) / 2 - untransformed(owl).top,
              scale: () => h.owl / owl.offsetHeight,
              ease: "power1.inOut",
            },
            0,
          )
          .fromTo(
            logo,
            { x: 0, y: 0, scale: 1 },
            {
              x: () => (h.owlCentred ? h.pad : h.pad + h.owl + h.gap) - untransformed(logo).left,
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
                return viewportW() - h.pad - r.width * timerScale() - r.left;
              },
              y: () => (h.height - h.card) / 2 - untransformed(timer).top,
              scale: timerScale,
              ease: "power1.inOut",
            },
            0,
          )
          .fromTo(q("[data-fade]"), { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -48, duration: 0.45 }, 0)
          .fromTo(q("[data-cd-label]"), { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.3 }, 0.1)
          .fromTo(q("[data-bg]"), { yPercent: 0, opacity: 1 }, { yPercent: 22, opacity: 0.35 }, 0)
          .fromTo(q("[data-bar]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 0.75);
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  // Intro once the loader lifts: the logo switches on like a tube light catching, then the rest follows.
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
          { rotateX: -100, opacity: 0, transformPerspective: 400, transformOrigin: "50% 0%", duration: 0.9, stagger: 0.06, ease: "expo.out" },
          2.0,
        )
        .fromTo(q("[data-cd-label] [data-intro]"), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08 }, 2.35)
        .call(() => countdown.current?.start(true), [], 2.45)
        // Once lit, the tube keeps a faint hum.
        .to(logoInner, { "--g": 0.8, duration: 2.6, ease: "sine.inOut", repeat: -1, yoyo: true }, ">");
    },
    { scope: root, dependencies: [play] },
  );

  const onLogo = (e: MouseEvent) => {
    e.preventDefault();
    scrollToTop();
  };

  return (
    <div ref={root} className={s.root}>
      <div className={s.layer}>
        {/* The whole header bar is a back-to-top button. The owl and timer sit on it without catching
            clicks, so tapping them lands here too; the logo is its own link to the same place. */}
        <button type="button" className={s.bar} data-bar onClick={scrollToTop} aria-label="Back to top" />
        <div className={s.stage}>
          <div className={s.owl} data-owl>
            <div data-intro className={s.owlInner}>
              <Image src="/images/owl-badge.png" alt="" width={88} height={88} priority />
              <Blink eyes={OWL_EYES.badge} />
            </div>
          </div>

          <a href="#top" className={s.logo} data-logo onClick={onLogo} aria-label="NOCTVRNA, back to top">
            <span className={s.logoInner} data-logo-inner>
              <Image className={s.glow} src="/images/logo.png" alt="" fill sizes="(max-width: 760px) 92vw, 931px" priority />
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
            <p data-intro>{"Countdown to  12 - 12 - 26"}</p>
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
