"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { gsap, SplitText, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { useFontsReady } from "@/lib/useFontsReady";
import Blink, { OWL_EYES } from "./Blink";
import Experience, { type ExperienceHandle } from "./Experience";
import Values from "./Values";
import s from "./Stack.module.css";

/** Experience stage, in timeline seconds: scroll walks the three scenes, then the stage lets go. */
const EXP = { people: 0.55, atmos: 1.1, end: 1.65 };
/** Values stage, in timeline seconds after Originality has arrived. */
const VAL = { freedom: 0.3, curation: 1.8, enter: 3.3 };
const WIPE_FROM = "circle(0% at 84% 30%)";
const WIPE_TO = "circle(150% at 84% 30%)";

/**
 * Everything after the manifesto, in three parts:
 *  1. Experience: a pinned full-screen scene; scrolling walks Sound, People, Atmosphere.
 *  2. The city: an ordinary section as tall as its content that scrolls in after the Experience scene,
 *     then holds while the values slide up over it.
 *  3. Values and sign-up: a pinned full-screen stage; each value wipes in over the last, then the
 *     sign-up covers them.
 */
export default function Stack() {
  const root = useRef<HTMLDivElement>(null);
  const experience = useRef<ExperienceHandle>(null);
  const fontsReady = useFontsReady();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      // Park the sign-up scene below its stage straight away, before the scroll timeline exists.
      gsap.set(q("[data-panel=enter]"), { yPercent: 100 });
      if (!fontsReady) return;
      const reduce = prefersReducedMotion();
      const scrub = reduce ? true : 0.8;
      const vh = () => window.innerHeight;
      const expStage = q("[data-stage=experience]")[0] as HTMLElement;
      const city = q("[data-city]")[0] as HTMLElement;
      const valStage = q("[data-stage=values]")[0] as HTMLElement;

      const headline = SplitText.create(q("[data-city-headline]"), { type: "words" });
      const layers = q("[data-vlayer]");
      const glow = gsap.to(q("[data-glow]"), { scale: 1.12, opacity: 0.75, duration: 3.2, ease: "sine.inOut", repeat: -1, yoyo: true });

      // The Experience scene rises into view while the manifesto sinks away behind it.
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: expStage, start: "top bottom", end: "top top", scrub: 0.6 },
        })
        .fromTo(document.querySelector("[data-manifesto-inner]"), { scale: 1, opacity: 1 }, { scale: 0.92, opacity: 0.25 }, 0)
        .from(q("[data-exp-word]"), { yPercent: 60, opacity: 0, stagger: 0.08, duration: 0.5, ease: "power2.out" }, 0.25)
        .from(q("[data-exp-stage]"), { scale: 0.86, yPercent: 12, opacity: 0.2, duration: 0.7, ease: "power2.out" }, 0.2);

      // One value's entrance: letters spring up, the tag slaps on, the sticker spins in, the copy follows.
      const reveal = (layer: Element) =>
        gsap
          .timeline()
          .from(layer.querySelectorAll("[data-vchar]"), { yPercent: 110, rotate: 12, opacity: 0, stagger: 0.02, duration: 0.55, ease: "expo.out" })
          .from(layer.querySelector("[data-vsticker]"), { scale: 0.3, rotate: -140, opacity: 0, duration: 0.7, ease: "expo.out" }, 0.05)
          .from(layer.querySelector("[data-vtag]"), { scale: 0, rotate: -35, duration: 0.5, ease: "expo.out" }, 0.3)
          .from(layer.querySelector("[data-vbody]"), { y: 30, opacity: 0, duration: 0.5, ease: "power2.out" }, 0.35);

      // Each value's photo settles from a slow push-in while its scene arrives.
      const settle = (layer: Element) => {
        const photo = layer.querySelector("[data-vphoto]");
        return photo ? gsap.fromTo(photo, { scale: 1.18 }, { scale: 1, duration: 1.6, ease: "power2.out" }) : gsap.timeline();
      };

      const mm = gsap.matchMedia();
      mm.add({ mobile: "(max-width: 760px)", desktop: "(min-width: 761px)" }, (ctx) => {
        const mobile = ctx.conditions?.mobile;

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

        // 2. The city: words and poster arrive as it scrolls in; the two words slide out over the poster.
        gsap
          .timeline({ scrollTrigger: { trigger: city, start: "top bottom", end: "top 10%", scrub: 0.6 } })
          .fromTo(headline.words, { opacity: 0.08, yPercent: 40 }, { opacity: 1, yPercent: 0, stagger: 0.02, duration: 0.6, ease: "none" });
        gsap.fromTo(
          q("[data-poster]"),
          { yPercent: 14, scale: 0.88, rotateX: 14 },
          { yPercent: 0, scale: 1, rotateX: 0, ease: "power2.out", scrollTrigger: { trigger: q("[data-poster-area]")[0], start: "top bottom", end: "top 35%", scrub: 0.6 } },
        );
        gsap
          .timeline({ scrollTrigger: { trigger: q("[data-poster-area]")[0], start: "top 70%", end: "center 55%", scrub: 0.6 } })
          .fromTo(q("[data-night]"), mobile ? { y: 30, autoAlpha: 0 } : { xPercent: 45, autoAlpha: 0 }, { xPercent: 0, y: 0, autoAlpha: 1, ease: "power2.out" }, 0)
          .fromTo(q("[data-calling]"), mobile ? { y: -30, autoAlpha: 0 } : { xPercent: -45, autoAlpha: 0 }, { xPercent: 0, y: 0, autoAlpha: 1, ease: "power2.out" }, 0);

        // ...then it holds (once its bottom reaches the bottom of the screen) while the values slide over it.
        gsap
          .timeline({
            scrollTrigger: {
              trigger: city,
              start: () => (city.offsetHeight > vh() ? "bottom bottom" : "top top"),
              end: () => `+=${vh()}`,
              pin: true,
              pinSpacing: false,
              scrub: true,
              invalidateOnRefresh: true,
            },
          })
          .to(q("[data-city-inner]"), { scale: 0.92, opacity: 0.25, ease: "none" });

        // 3. Values: Originality arrives as the stage slides up over the city...
        gsap
          .timeline({ scrollTrigger: { trigger: valStage, start: "top bottom", end: "top top", scrub: 0.6 } })
          .add(settle(layers[0]), 0)
          .add(reveal(layers[0]), 0.45);

        // ...then the stage pins: Freedom of Expression and Intentional Curation wipe in, the sign-up covers them.
        gsap
          .timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: valStage,
              start: "top top",
              end: () => `+=${vh() * 4.2}`,
              pin: true,
              scrub,
              invalidateOnRefresh: true,
              anticipatePin: 1,
            },
          })
          .to({}, { duration: VAL.freedom })
          .fromTo(layers[1], { clipPath: WIPE_FROM }, { clipPath: WIPE_TO, duration: 1, ease: "power2.inOut" }, VAL.freedom)
          .add(settle(layers[1]), VAL.freedom)
          .add(reveal(layers[1]), VAL.freedom + 0.35)
          .fromTo(layers[2], { clipPath: WIPE_FROM }, { clipPath: WIPE_TO, duration: 1, ease: "power2.inOut" }, VAL.curation)
          .add(settle(layers[2]), VAL.curation)
          .add(reveal(layers[2]), VAL.curation + 0.35)
          .fromTo(q("[data-panel=enter]"), { yPercent: 100 }, { yPercent: 0, duration: 1, ease: "power2.inOut" }, VAL.enter)
          .to(q("[data-vlayers]"), { scale: 0.9, opacity: 0.25, duration: 1, ease: "power2.inOut" }, VAL.enter)
          .from(q("[data-line]"), { yPercent: 105, duration: 0.6, stagger: 0.09, ease: "power3.out" }, VAL.enter + 0.45)
          .from(q("[data-enter-rest] > *"), { y: 30, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }, VAL.enter + 0.75)
          .to({}, { duration: 0.35 });
      });

      return () => {
        mm.revert();
        glow.kill();
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
            <h2 id="city-title" className={s.headline} data-city-headline>
              The city never really sleeps, so neither do we. One night built around the{" "}
              <span className={s.hl}>sound</span>, the <span className={s.hl}>people</span> and the{" "}
              <span className={s.hl}>glow of Lagos after dark</span>
            </h2>
            <div className={s.posterArea} data-poster-area>
              <div className={s.poster} data-poster>
                <div className={s.posterArt}>
                  <Image
                    src="/images/poster.jpg"
                    alt="NOCTVRNA: The Lagos Life poster. An owl whose green eyes reflect the Lekki-Ikoyi bridge at night."
                    fill
                    sizes="(max-width: 760px) 80vw, 600px"
                    quality={85}
                  />
                  <Blink eyes={OWL_EYES.poster} />
                </div>
              </div>
              <p className={`${s.night} ${s.nightLeft}`}>
                <span data-night>THE NIGHT</span>
              </p>
              <p className={`${s.night} ${s.nightRight}`}>
                <span data-calling>IS CALLING</span>
              </p>
            </div>
          </div>
        </section>
      </div>

      <div className={`${s.stage} ${s.valStage}`} data-stage="values">
        <section className={`${s.panel} ${s.values}`} data-panel="values" aria-label="Our philosophy">
          <Values />
        </section>

        <section className={`${s.panel} ${s.enter}`} data-panel="enter" id="enter" aria-labelledby="enter-title">
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
              <NotifyForm />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function NotifyForm() {
  const [message, setMessage] = useState("");

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    if (!name) return setMessage("Add your name so we know who's coming.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMessage("Add an email address the drop can reach.");
    // TODO: send { name, email } to the mailing list or ticketing provider before launch.
    setMessage(`Noted, ${name}. Watch your inbox when tickets drop.`);
    form.reset();
  };

  return (
    <>
      <form className={s.form} onSubmit={onSubmit} noValidate>
        <div className={s.fields}>
          <label className={s.field}>
            <span>Name</span>
            <input id="notify-name" name="name" autoComplete="name" placeholder="What we call you" />
          </label>
          <label className={s.field}>
            <span>Email</span>
            <input id="notify-email" name="email" type="email" autoComplete="email" placeholder="Where the drop lands" />
          </label>
        </div>
        <button className={s.button} type="submit">
          Notify Me!
        </button>
      </form>
      <p className={s.formMsg} role="status">
        {message}
      </p>
    </>
  );
}
