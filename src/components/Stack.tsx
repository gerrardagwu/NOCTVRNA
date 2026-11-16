"use client";

import Image from "next/image";
import { useRef } from "react";
import { gsap, ScrollTrigger, SplitText, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { whileInView } from "@/lib/inView";
import { useFontsReady } from "@/lib/useFontsReady";
import Blink, { OWL_EYES } from "./Blink";
import Experience, { type ExperienceHandle } from "./Experience";
import Values, { hideValue, revealValue, settleValue, swapValues } from "./Values";
import Waitlist from "./Waitlist";
import s from "./Stack.module.css";

/** Experience stage, in timeline seconds: scroll walks the three scenes, then the stage lets go. */
const EXP = { people: 0.55, atmos: 1.1, end: 1.65 };
/** Values stage: how long each value rests (timeline seconds) before the next swaps in. */
const VALUE_REST = 0.35;
/**
 * Everything after the manifesto, in four parts:
 *  1. Experience: a pinned full-screen scene; scrolling walks Sound, People, Atmosphere.
 *  2. The city: an ordinary section as tall as its content that scrolls in after the Experience scene,
 *     then holds while the values slide up over it.
 *  3. Values: on desktop, a full-screen stage that stays put while scrolling swaps the values inside it,
 *     then holds while the sign-up slides over it. On mobile, a row of cards you swipe (Values).
 *  4. Sign-up: a full screen whose lines rise in as it arrives.
 */
export default function Stack() {
  const root = useRef<HTMLDivElement>(null);
  const experience = useRef<ExperienceHandle>(null);
  const fontsReady = useFontsReady();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      if (!fontsReady) return;
      const reduce = prefersReducedMotion();
      const scrub = reduce ? true : 0.8;
      const vh = () => window.innerHeight;
      const expStage = q("[data-stage=experience]")[0] as HTMLElement;
      const city = q("[data-city]")[0] as HTMLElement;
      const enter = q("[data-enter]")[0] as HTMLElement;

      const headline = SplitText.create(q("[data-city-headline]"), { type: "words" });
      const layers = q("[data-vlayer]");
      // The sign-up's glow breathes (a CSS animation) only while the section is on screen.
      const glowEl = q("[data-glow]")[0] as HTMLElement;
      const stopGlow = whileInView(enter, (visible) => glowEl.toggleAttribute("data-live", visible));

      // The Experience scene rises into view while the manifesto sinks away behind it.
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: expStage, start: "top bottom", end: "top top", scrub: 0.6 },
        })
        .fromTo(document.querySelector("[data-manifesto-inner]"), { scale: 1, opacity: 1 }, { scale: 0.92, opacity: 0.25 }, 0)
        .from(q("[data-exp-word]"), { yPercent: 60, opacity: 0, stagger: 0.08, duration: 0.5, ease: "power2.out" }, 0.25)
        .from(q("[data-exp-stage]"), { scale: 0.86, yPercent: 12, opacity: 0.2, duration: 0.7, ease: "power2.out" }, 0.2);

      // The poster leans toward the cursor.
      const posterArea = q("[data-poster-area]")[0] as HTMLElement;
      const px = gsap.quickTo(posterArea, "x", { duration: 1, ease: "power3.out" });
      const py = gsap.quickTo(posterArea, "y", { duration: 1, ease: "power3.out" });
      const onCityMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse" || reduce) return;
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        px(nx * 18);
        py(ny * 14);
      };
      const onCityLeave = () => {
        px(0);
        py(0);
      };
      city.addEventListener("pointermove", onCityMove);
      city.addEventListener("pointerleave", onCityLeave);

      const mm = gsap.matchMedia();
      mm.add({ mobile: "(max-width: 760px)", desktop: "(min-width: 761px)" }, (ctx) => {
        const { desktop } = ctx.conditions as { desktop: boolean };
        // 1. Experience: pinned while scroll walks the three scenes.
        let expMode = 0;
        const exp = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: expStage,
            start: "top top",
            end: () => `+=${vh() * EXP.end}`,
            pin: true,
            scrub,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate: (self) => {
              // Scroll walks the scenes; tapping a word still works in between.
              const time = self.progress * exp.duration();
              const mode = time < EXP.people ? 0 : time < EXP.atmos ? 1 : 2;
              if (mode !== expMode) {
                expMode = mode;
                experience.current?.setMode(mode);
              }
            },
          },
        });
        exp.to({}, { duration: EXP.end });

        // 2. The city: words, details and poster arrive as it scrolls in.
        gsap
          .timeline({ scrollTrigger: { trigger: city, start: "top bottom", end: "top 10%", scrub: 0.6 } })
          .fromTo(headline.words, { opacity: 0.08, yPercent: 40 }, { opacity: 1, yPercent: 0, stagger: 0.03, duration: 0.6, ease: "none" })
          .fromTo(q("[data-city-lede]"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 0.35)
          .fromTo(q("[data-city-facts] > div"), { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.08, duration: 0.4, ease: "power2.out" }, 0.5);
        gsap.fromTo(
          q("[data-poster]"),
          { yPercent: 14, scale: 0.88, rotateX: 14 },
          { yPercent: 0, scale: 1, rotateX: 0, ease: "power2.out", scrollTrigger: { trigger: q("[data-poster-area]")[0], start: "top bottom", end: "top 35%", scrub: 0.6 } },
        );
        // ...then it holds while the values slide over it. It only holds once the section has reached the top of
        // the screen, and where the poster runs past the bottom (mobile) it scrolls on until the whole poster is
        // in view, so nothing is covered while it's still on its way up.
        // Layout offset from the top of the city section (offsets ignore the scroll transforms).
        const fromCityTop = (el: HTMLElement) => {
          let y = 0;
          for (let n: HTMLElement | null = el; n && n !== city; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
          return y;
        };
        const holdOffset = () => Math.max(0, fromCityTop(posterArea) + posterArea.offsetHeight + 16 - vh());
        gsap
          .timeline({
            scrollTrigger: {
              trigger: city,
              start: () => `top+=${holdOffset()} top`,
              end: () => `+=${vh()}`,
              pin: true,
              pinSpacing: false,
              scrub: true,
              invalidateOnRefresh: true,
            },
          })
          .to(q("[data-city-inner]"), { scale: 0.92, opacity: 0.25, ease: "none" });

        // 3. Values (desktop). Originality arrives as the stage slides up over the city; then the stage stays put
        // (pinned) while scrolling swaps the values inside it, and keeps holding while the sign-up slides over.
        // The values block is taller than the stage by exactly the scroll the swaps get. On mobile the values
        // are a swipe row instead; Values plays each card's entrance as it comes into view.
        if (desktop) {
          const values = q("[data-values]")[0] as HTMLElement;
          const run = () => values.offsetHeight - vh();
          layers.forEach(hideValue);

          gsap
            .timeline({ scrollTrigger: { trigger: values, start: "top bottom", end: "top top", scrub: 0.6 } })
            .add(settleValue(layers[0]), 0)
            .add(revealValue(layers[0]), 0.45);

          ScrollTrigger.create({
            trigger: q("[data-vstage]")[0],
            start: "top top",
            end: () => `+=${run() + vh()}`,
            pin: true,
            pinSpacing: false,
            invalidateOnRefresh: true,
          });

          const swaps = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: { trigger: values, start: "top top", end: () => `+=${run()}`, scrub, invalidateOnRefresh: true },
          });
          const digits = q("[data-vdigits]")[0];
          let at = VALUE_REST;
          for (let i = 1; i < layers.length; i++) {
            swaps.to(digits, { yPercent: (-100 * i) / layers.length, duration: 0.4, ease: "power3.inOut" }, at + 0.4);
            at = swapValues(swaps, layers[i - 1], layers[i], at) + VALUE_REST;
          }
          swaps.to({}, { duration: 0 }, at);

          gsap
            .timeline({ scrollTrigger: { trigger: values, start: () => `top+=${run()} top`, end: () => `+=${vh()}`, scrub: true, invalidateOnRefresh: true } })
            .to(q("[data-vstage-in]"), { scale: 0.92, opacity: 0.25, ease: "none" });
        }

        // 4. Sign-up: the lines rise in and the form follows as it arrives.
        gsap
          .timeline({ scrollTrigger: { trigger: enter, start: "top bottom", end: "top top", scrub: 0.6 } })
          .from(q("[data-line]"), { yPercent: 105, duration: 0.6, stagger: 0.09, ease: "power3.out" }, 0.45)
          .from(q("[data-enter-rest] > *"), { y: 30, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }, 0.75);
      });

      return () => {
        city.removeEventListener("pointermove", onCityMove);
        city.removeEventListener("pointerleave", onCityLeave);
        mm.revert();
        stopGlow();
        glowEl.removeAttribute("data-live");
        headline.revert();
      };
    },
    { scope: root, dependencies: [fontsReady] },
  );

  return (
    <div ref={root}>
      <div className={`${s.stage} ${s.expStage}`} data-stage="experience">
        <section className={`${s.panel} ${s.experience}`} data-panel="experience" aria-labelledby="experience-title">
          <Experience ref={experience} />
        </section>
      </div>

      <div className={s.cityWrap}>
        <section className={s.city} data-city aria-labelledby="city-title">
          <div className={s.cityInner} data-city-inner>
            <div className={s.cityCopy}>
              <h2 id="city-title" className={s.headline} data-city-headline>
                The city never really sleeps, so neither do we.
              </h2>
              <p className={s.lede} data-city-lede>
                One night built around the <span className={s.hl}>sound</span>, the{" "}
                <span className={s.hl}>people</span> and the <span className={s.hl}>glow of Lagos after dark</span>.
              </p>
              <dl className={s.facts} data-city-facts>
                <div>
                  <dt>Date</dt>
                  <dd>12.12.26</dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>Loud Lagos</dd>
                </div>
                <div>
                  <dt>Doors</dt>
                  <dd>After dark</dd>
                </div>
              </dl>
            </div>
            <div className={s.posterArea} data-poster-area>
              <div className={s.posterGlow} aria-hidden="true" />
              <div className={s.poster} data-poster>
                <div className={s.posterArt}>
                  <Image
                    src="/images/flyer.jpg"
                    alt="NOCTVRNA: The Lagos Life flyer. An owl whose green eyes reflect the Lekki-Ikoyi bridge at night. Date: Dec 12th. Venue: Loud Lagos. For table reservations: 0816 866 9798."
                    fill
                    sizes="(max-width: 760px) 80vw, 600px"
                    quality={85}
                  />
                  <Blink eyes={OWL_EYES.poster} />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className={s.valStage} data-stage="values">
        <section className={s.values} aria-label="Our philosophy">
          <Values />
        </section>

        <section className={s.enter} id="enter" data-enter aria-labelledby="enter-title">
          <div className={s.glow} data-glow aria-hidden="true" />
          <div className={s.enterInner} data-inner>
            <h2 id="enter-title" className={s.enterTitle}>
              <span className={s.lineMask}>
                <span className={s.line} data-line>
                  ENTER A
                </span>
              </span>
              <span className={s.lineMask}>
                <span className={`${s.line} ${s.lineBrand}`} data-line>
                  DIFFERENT
                </span>
              </span>
              <span className={s.lineMask}>
                <span className={s.line} data-line>
                  STATE OF NIGHT.
                </span>
              </span>
            </h2>
            <div className={s.enterRest} data-enter-rest>
              <p className={s.enterCopy}>
                Tickets and the guest list open soon. Leave your details and you&apos;ll be the first to know when they
                drop.
              </p>
              <Waitlist />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
