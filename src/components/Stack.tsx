"use client";

import Image from "next/image";
import { useRef, useState, type FormEvent } from "react";
import { gsap, SplitText, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { useFontsReady } from "@/lib/useFontsReady";
import s from "./Stack.module.css";

const VALUES = [
  {
    title: "Originality.",
    body: "We are not interested in repeating what has already been done. We are interested in creating something distinctive, evolving with every edition and building a community around a shared appreciation for culture and experience.",
  },
  {
    title: "Freedom of Expression.",
    body: "Everyone should have the freedom to express themselves without boundaries or expectations. A space where individuality is celebrated, differences bring us together and everyone is free to experience the moment in their own way. Come as you are, be unapologetically yourself and leave with something that stays with you.",
  },
  {
    title: "Intentional Curation.",
    body: "Every element is considered, from the atmosphere and lighting to the smallest details that shape the experience. Nothing is accidental. We believe the difference lies in the intention behind every choice and the feeling it creates.",
  },
];

/**
 * Everything after the manifesto is one pinned, full-screen stage. Each scene fills the view; scrolling
 * slides the next scene up over the last while the one underneath sinks back. Inside the values scene,
 * Originality gives way to Freedom of Expression, then to Intentional Curation.
 */
export default function Stack() {
  const root = useRef<HTMLDivElement>(null);
  const fontsReady = useFontsReady();

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      // Park the covering scenes below the stage straight away, before the scroll timeline exists.
      gsap.set(q("[data-panel=values], [data-panel=enter]"), { yPercent: 100 });
      if (!fontsReady) return;
      const reduce = prefersReducedMotion();
      const vh = () => window.innerHeight;

      const headline = SplitText.create(q("[data-city-headline]"), { type: "words" });
      const values = q("[data-value]").map((el) => SplitText.create(el, { type: "words" }).words);
      const glow = gsap.to(q("[data-glow]"), { scale: 1.12, opacity: 0.75, duration: 3.2, ease: "sine.inOut", repeat: -1, yoyo: true });

      // The city scene rises into view while the manifesto sinks away behind it.
      const enter = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: { trigger: root.current, start: "top bottom", end: "top top", scrub: 0.6 },
      });
      enter
        .fromTo(document.querySelector("[data-manifesto-inner]"), { scale: 1, opacity: 1 }, { scale: 0.92, opacity: 0.25 }, 0)
        .fromTo(headline.words, { opacity: 0.08, yPercent: 40 }, { opacity: 1, yPercent: 0, stagger: 0.02, duration: 0.5 }, 0.15)
        .fromTo(q("[data-poster]"), { yPercent: 28, scale: 0.82, rotateX: 18 }, { yPercent: 0, scale: 1, rotateX: 0, duration: 0.85, ease: "power2.out" }, 0.15);

      const mm = gsap.matchMedia();
      mm.add({ mobile: "(max-width: 760px)", desktop: "(min-width: 761px)" }, (ctx) => {
        const mobile = ctx.conditions?.mobile;
        const [v1, v2, v3] = values;
        const wordsOut = { yPercent: -60, opacity: 0, filter: "blur(6px)", stagger: 0.004, duration: 0.45, ease: "power2.in" };
        const wordsIn = { yPercent: 0, opacity: 1, filter: "blur(0px)", stagger: 0.005, duration: 0.55, ease: "power3.out" };
        const wordsFrom = { yPercent: 70, opacity: 0, filter: "blur(6px)" };

        gsap.set([...v2, ...v3], wordsFrom);

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: () => `+=${vh() * 5.4}`,
            pin: true,
            scrub: reduce ? true : 0.8,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        });

        // 1. THE NIGHT / IS CALLING slide out from behind the poster.
        tl.fromTo(
          q("[data-night]"),
          mobile ? { y: 30, autoAlpha: 0 } : { xPercent: 60, autoAlpha: 0 },
          { xPercent: 0, y: 0, autoAlpha: 1, duration: 0.7, ease: "power2.out" },
          0,
        )
          .fromTo(
            q("[data-calling]"),
            mobile ? { y: -30, autoAlpha: 0 } : { xPercent: -60, autoAlpha: 0 },
            { xPercent: 0, y: 0, autoAlpha: 1, duration: 0.7, ease: "power2.out" },
            0,
          )
          .to(q("[data-poster]"), { scale: 1.04, duration: 0.9 }, 0)

          // 2. Values covers the city.
          .fromTo(q("[data-panel=values]"), { yPercent: 100 }, { yPercent: 0, duration: 1, ease: "power2.inOut" }, 1)
          .to(q("[data-panel=city] [data-inner]"), { scale: 0.88, opacity: 0.2, duration: 1, ease: "power2.inOut" }, 1)
          .from(v1, { ...wordsFrom, stagger: 0.005, duration: 0.55, ease: "power3.out" }, 1.45)

          // 3. Originality -> Freedom of Expression.
          .to(v1, wordsOut, 2.3)
          .to(v2, wordsIn, 2.65)

          // 4. Freedom of Expression -> Intentional Curation.
          .to(v2, wordsOut, 3.45)
          .to(v3, wordsIn, 3.8)

          // 5. The sign-up scene covers the values.
          .fromTo(q("[data-panel=enter]"), { yPercent: 100 }, { yPercent: 0, duration: 1, ease: "power2.inOut" }, 4.6)
          .to(q("[data-panel=values] [data-inner]"), { scale: 0.88, opacity: 0.2, duration: 1, ease: "power2.inOut" }, 4.6)
          .from(q("[data-line]"), { yPercent: 105, duration: 0.6, stagger: 0.09, ease: "power3.out" }, 5.05)
          .from(q("[data-enter-rest] > *"), { y: 30, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out" }, 5.35)
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
      <section className={`${s.panel} ${s.city}`} data-panel="city" aria-labelledby="city-title">
        <div className={s.cityInner} data-inner>
          <h2 id="city-title" className={s.headline} data-city-headline>
            The city never really sleeps, so neither do we. One night built around the{" "}
            <span className={s.hl}>sound</span>, the <span className={s.hl}>people</span> and the{" "}
            <span className={s.hl}>glow of Lagos after dark</span>
          </h2>
          <div className={s.posterArea}>
            <p className={`${s.night} ${s.nightLeft}`}>
              <span data-night>THE NIGHT</span>
            </p>
            <div className={s.poster} data-poster>
              <Image
                src="/images/poster.jpg"
                alt="NOCTVRNA: The Lagos Life poster. An owl whose green eyes reflect the Lekki-Ikoyi bridge at night."
                fill
                sizes="(max-width: 760px) 62vw, 458px"
              />
            </div>
            <p className={`${s.night} ${s.nightRight}`}>
              <span data-calling>IS CALLING</span>
            </p>
          </div>
        </div>
      </section>

      <section className={`${s.panel} ${s.values}`} data-panel="values" aria-label="Our philosophy">
        <div className={s.valuesInner} data-inner>
          {VALUES.map((v) => (
            <p className={s.value} data-value key={v.title}>
              <span className={s.valueTitle}>{v.title}</span> {v.body}
            </p>
          ))}
        </div>
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
