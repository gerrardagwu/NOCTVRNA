"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { gsap, SplitText, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { useFontsReady } from "@/lib/useFontsReady";
import Blink, { OWL_EYES } from "./Blink";
import Experience, { type ExperienceHandle } from "./Experience";
import Values from "./Values";
import s from "./Stack.module.css";

/** Where each beat sits on the stage timeline (in timeline seconds; the whole thing is scrubbed by scroll). */
const T = {
  people: 0.55, // experience switches to People
  atmos: 1.1, // ...then Atmosphere
  city: 1.65, // city scene slides up over the experience
  night: 2.75, // THE NIGHT / IS CALLING slide out
  values: 3.8, // Originality floods in
  freedom: 5.2, // Freedom of Expression wipes in
  curation: 6.7, // Intentional Curation wipes in
  enter: 8.2, // sign-up scene covers everything
};
const WIPE_FROM = "circle(0% at 84% 30%)";
const WIPE_TO = "circle(150% at 84% 30%)";

/**
 * Everything after the manifesto is one pinned, full-screen stage. Each scene fills the view and the
 * next slides or wipes in over it: Experience, the city, the three values, then the sign-up.
 */
export default function Stack() {
  const root = useRef<HTMLDivElement>(null);
  const experience = useRef<ExperienceHandle>(null);
  const fontsReady = useFontsReady();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      // Park the covering scenes below the stage straight away, before the scroll timeline exists.
      gsap.set(q("[data-panel=city], [data-panel=values], [data-panel=enter]"), { yPercent: 100 });
      if (!fontsReady) return;
      const reduce = prefersReducedMotion();
      const vh = () => window.innerHeight;

      const headline = SplitText.create(q("[data-city-headline]"), { type: "words" });
      const layers = q("[data-vlayer]");
      const glow = gsap.to(q("[data-glow]"), { scale: 1.12, opacity: 0.75, duration: 3.2, ease: "sine.inOut", repeat: -1, yoyo: true });

      // The stage rises into view while the manifesto sinks away behind it.
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "top top", scrub: 0.6 },
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

      const mm = gsap.matchMedia();
      mm.add({ mobile: "(max-width: 760px)", desktop: "(min-width: 761px)" }, (ctx) => {
        const mobile = ctx.conditions?.mobile;
        let expMode = 0;
        let expActive = true;

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${vh() * 8.6}`,
            pin: true,
            scrub: reduce ? true : 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate: (self) => {
              // Scroll walks the experience through its three scenes; tapping a word still works in between.
              const time = self.progress * tl.duration();
              const mode = time < T.people ? 0 : time < T.atmos ? 1 : 2;
              if (mode !== expMode) {
                expMode = mode;
                experience.current?.setMode(mode);
              }
              const active = time < T.city + 1;
              if (active !== expActive) {
                expActive = active;
                experience.current?.setActive(active);
              }
            },
          },
        });

        tl.to({}, { duration: T.city }, 0)

          // City covers the experience.
          .fromTo(q("[data-panel=city]"), { yPercent: 100 }, { yPercent: 0, duration: 1, ease: "power2.inOut" }, T.city)
          .to(q("[data-panel=experience] [data-inner]"), { scale: 0.88, opacity: 0.2, duration: 1, ease: "power2.inOut" }, T.city)
          .fromTo(headline.words, { opacity: 0.08, yPercent: 40 }, { opacity: 1, yPercent: 0, stagger: 0.015, duration: 0.5 }, T.city + 0.35)
          .fromTo(q("[data-poster]"), { yPercent: 28, scale: 0.82, rotateX: 18 }, { yPercent: 0, scale: 1, rotateX: 0, duration: 0.8, ease: "power2.out" }, T.city + 0.3)

          // THE NIGHT / IS CALLING slide out across the poster's edges.
          .fromTo(
            q("[data-night]"),
            mobile ? { y: 30, autoAlpha: 0 } : { xPercent: 45, autoAlpha: 0 },
            { xPercent: 0, y: 0, autoAlpha: 1, duration: 0.7, ease: "power2.out" },
            T.night,
          )
          .fromTo(
            q("[data-calling]"),
            mobile ? { y: -30, autoAlpha: 0 } : { xPercent: -45, autoAlpha: 0 },
            { xPercent: 0, y: 0, autoAlpha: 1, duration: 0.7, ease: "power2.out" },
            T.night,
          )
          .to(q("[data-poster]"), { scale: 1.04, duration: 0.9 }, T.night)

          // Values: Originality floods up over the city...
          .fromTo(q("[data-panel=values]"), { yPercent: 100 }, { yPercent: 0, duration: 1, ease: "power2.inOut" }, T.values)
          .to(q("[data-panel=city] [data-inner]"), { scale: 0.88, opacity: 0.2, duration: 1, ease: "power2.inOut" }, T.values)
          .add(reveal(layers[0]), T.values + 0.45)

          // ...Freedom of Expression wipes out of the sticker...
          .fromTo(layers[1], { clipPath: WIPE_FROM }, { clipPath: WIPE_TO, duration: 1, ease: "power2.inOut" }, T.freedom)
          .add(reveal(layers[1]), T.freedom + 0.35)

          // ...then Intentional Curation.
          .fromTo(layers[2], { clipPath: WIPE_FROM }, { clipPath: WIPE_TO, duration: 1, ease: "power2.inOut" }, T.curation)
          .add(reveal(layers[2]), T.curation + 0.35)

          // The sign-up scene covers the values.
          .fromTo(q("[data-panel=enter]"), { yPercent: 100 }, { yPercent: 0, duration: 1, ease: "power2.inOut" }, T.enter)
          .to(q("[data-vlayers]"), { scale: 0.9, opacity: 0.25, duration: 1, ease: "power2.inOut" }, T.enter)
          .from(q("[data-line]"), { yPercent: 105, duration: 0.6, stagger: 0.09, ease: "power3.out" }, T.enter + 0.45)
          .from(q("[data-enter-rest] > *"), { y: 30, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }, T.enter + 0.75)
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
    <div ref={root} className={s.stack}>
      <section className={`${s.panel} ${s.experience}`} data-panel="experience" aria-labelledby="experience-title">
        <Experience ref={experience} />
      </section>

      <section className={`${s.panel} ${s.city}`} data-panel="city" aria-labelledby="city-title">
        <div className={s.cityInner} data-inner>
          <h2 id="city-title" className={s.headline} data-city-headline>
            The city never really sleeps, so neither do we. One night built around the{" "}
            <span className={s.hl}>sound</span>, the <span className={s.hl}>people</span> and the{" "}
            <span className={s.hl}>glow of Lagos after dark</span>
          </h2>
          <div className={s.posterArea}>
            <div className={s.poster} data-poster>
              <div className={s.posterArt}>
                <Image
                  src="/images/poster.jpg"
                  alt="NOCTVRNA: The Lagos Life poster. An owl whose green eyes reflect the Lekki-Ikoyi bridge at night."
                  fill
                  sizes="(max-width: 760px) 62vw, 458px"
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
