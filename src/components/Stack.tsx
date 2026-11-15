"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type InputHTMLAttributes } from "react";
import { gsap, SplitText, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { getLenis } from "@/lib/lenis";
import { useFontsReady } from "@/lib/useFontsReady";
import Blink, { OWL_EYES } from "./Blink";
import Experience, { type ExperienceHandle } from "./Experience";
import Values, { revealValue, settleValue } from "./Values";
import s from "./Stack.module.css";

/** Experience stage, in timeline seconds: scroll walks the three scenes, then the stage lets go. */
const EXP = { people: 0.55, atmos: 1.1, end: 1.65 };
/**
 * Everything after the manifesto, in four parts:
 *  1. Experience: a pinned full-screen scene; scrolling walks Sound, People, Atmosphere.
 *  2. The city: an ordinary section as tall as its content that scrolls in after the Experience scene,
 *     then holds while the values slide up over it.
 *  3. Values: on desktop, three full screens in the normal scroll, each carried fully out as the next comes
 *     in; the last holds while the sign-up slides over it. On mobile, a row of cards you swipe (Values).
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

        // 3. Values (desktop). Each value is a screen of its own in the normal scroll: its photo settles and its
        // words arrive as it comes up, and the last one holds while the sign-up slides over it. On mobile the
        // values are a swipe row instead; Values plays each card's entrance as it comes into view.
        if (desktop) {
          layers.forEach((layer) => {
            gsap
              .timeline({ scrollTrigger: { trigger: layer, start: "top bottom", end: "top top", scrub: 0.6 } })
              .add(settleValue(layer), 0)
              .add(revealValue(layer), 0.45);
          });
          const last = layers[layers.length - 1];
          gsap
            .timeline({
              scrollTrigger: {
                trigger: last,
                start: "top top",
                end: () => `+=${vh()}`,
                pin: true,
                pinSpacing: false,
                scrub: true,
                invalidateOnRefresh: true,
              },
            })
            .to(last.querySelector("[data-vinner]"), { scale: 0.92, opacity: 0.25, ease: "none" });
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
                  <dt>City</dt>
                  <dd>Lagos</dd>
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
                    src="/images/poster.jpg"
                    alt="NOCTVRNA: The Lagos Life poster. An owl whose green eyes reflect the Lekki-Ikoyi bridge at night."
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
              <NotifyForm />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

type FieldName = "name" | "email";
type Errors = Partial<Record<FieldName, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(field: FieldName, value: string) {
  const v = value.trim();
  if (field === "name") return v ? undefined : "Add your name so we know who's coming.";
  if (!v) return "Add an email address the drop can reach.";
  return EMAIL.test(v) ? undefined : "That email doesn't look right. Try name@example.com.";
}

/**
 * The waitlist form. Problems show on the field itself (red line, red label, the reason underneath) and clear
 * as soon as they're fixed; a good submit hands the guest their ticket in a dialog.
 */
function NotifyForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [guest, setGuest] = useState<string | null>(null);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const value = (k: FieldName) => (form.elements.namedItem(k) as HTMLInputElement).value;
    const next: Errors = { name: validate("name", value("name")), email: validate("email", value("email")) };
    setErrors(next);

    const bad = (["name", "email"] as FieldName[]).filter((k) => next[k]);
    if (bad.length) {
      (form.elements.namedItem(bad[0]) as HTMLInputElement).focus();
      if (!prefersReducedMotion()) {
        gsap.fromTo(
          bad.map((k) => form.querySelector(`[data-field=${k}]`)),
          { x: 0 },
          { keyframes: { x: [0, -7, 6, -4, 2, 0] }, duration: 0.45, ease: "power2.out" },
        );
      }
      return;
    }

    // TODO: send { name, email } to the mailing list or ticketing provider before launch.
    setGuest(value("name").trim());
    form.reset();
  };

  // Once a field has been flagged, re-check it as they type so the red clears the moment it's right.
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const k = e.target.name as FieldName;
    if (errors[k]) setErrors((prev) => ({ ...prev, [k]: validate(k, e.target.value) }));
  };

  return (
    <div className={s.formWrap}>
      <form className={s.form} onSubmit={onSubmit} noValidate>
        <div className={s.fields}>
          <Field name="name" label="Name" error={errors.name} onChange={onChange} autoComplete="name" placeholder="What we call you" />
          <Field
            name="email"
            label="Email"
            error={errors.email}
            onChange={onChange}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Where the drop lands"
          />
        </div>
        <button className={s.button} type="submit">
          Notify Me!
        </button>
      </form>
      <TicketDialog guest={guest} onClosed={() => setGuest(null)} />
    </div>
  );
}

function Field({ name, label, error, ...input }: { name: FieldName; label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  const id = `notify-${name}`;
  return (
    <div className={s.field} data-field={name} data-invalid={error ? "" : undefined}>
      <label htmlFor={id}>{label}</label>
      <input id={id} name={name} aria-invalid={error ? true : undefined} aria-describedby={`${id}-error`} {...input} />
      <p id={`${id}-error`} className={s.error}>
        {error && (
          <>
            <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
              <circle cx="8" cy="8" r="7.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 4.2v4.6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="8" cy="11.4" r="1" fill="currentColor" />
            </svg>
            {error}
          </>
        )}
      </p>
    </div>
  );
}

/**
 * The confirmation: an admission ticket with the guest's name on it rises out of the dark and gets stamped
 * ON THE LIST. Esc, the backdrop, the close button or "Back to the night" put it away.
 */
function TicketDialog({ guest, onClosed }: { guest: string | null; onClosed: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closing = useRef(false);

  useEffect(() => {
    const d = dialog.current;
    if (!d || !guest || d.open) return;
    d.showModal();
    getLenis()?.stop();
    if (prefersReducedMotion()) return;

    const q = gsap.utils.selector(d);
    const tl = gsap
      .timeline()
      .fromTo(q("[data-scrim]"), { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out" })
      .fromTo(q("[data-ticket]"), { y: 110, rotate: -6, scale: 0.9, opacity: 0 }, { y: 0, rotate: 0, scale: 1, opacity: 1, duration: 1, ease: "expo.out" }, 0.05)
      .fromTo(q("[data-t-line]"), { y: 18, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: 0.6, ease: "power3.out" }, 0.3)
      // The stamp comes down hard, the ticket gives under it, a ring of ink spreads.
      .fromTo(q("[data-stamp]"), { scale: 2.6, rotate: -32, opacity: 0 }, { scale: 1, rotate: -12, opacity: 1, duration: 0.34, ease: "power4.in" }, 0.85)
      .fromTo(q("[data-ticket]"), { y: 0 }, { keyframes: { y: [0, 5, 0] }, duration: 0.32, ease: "power2.out" }, 1.19)
      .fromTo(q("[data-burst]"), { scale: 0.6, opacity: 0.55 }, { scale: 1.9, opacity: 0, duration: 0.6, ease: "expo.out" }, 1.19)
      .fromTo(q("[data-t-after]"), { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, 1.05);
    return () => {
      tl.kill();
    };
  }, [guest]);

  const close = () => {
    const d = dialog.current;
    if (!d?.open || closing.current) return;
    closing.current = true;
    const q = gsap.utils.selector(d);
    const done = () => {
      d.close();
      getLenis()?.start();
      gsap.set(q("[data-scrim], [data-ticket], [data-t-line], [data-stamp], [data-burst], [data-t-after]"), { clearProps: "all" });
      closing.current = false;
    };
    if (prefersReducedMotion()) return done();
    gsap
      .timeline({ onComplete: done })
      .to(q("[data-t-after]"), { opacity: 0, duration: 0.2, ease: "power2.in" }, 0)
      .to(q("[data-ticket]"), { y: 50, scale: 0.95, opacity: 0, duration: 0.34, ease: "power2.in" }, 0)
      .to(q("[data-scrim]"), { opacity: 0, duration: 0.34, ease: "power2.in" }, 0.08);
  };

  return (
    <dialog
      ref={dialog}
      className={s.dialog}
      aria-labelledby="ticket-title"
      aria-describedby="ticket-msg"
      data-lenis-prevent
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClose={() => {
        getLenis()?.start();
        onClosed();
      }}
    >
      <div className={s.dialogScrim} data-scrim onClick={close} aria-hidden="true" />
      <div className={s.dialogBody}>
        <div className={s.pass} data-ticket>
          <div className={s.passMain}>
            <div className={s.passHead} data-t-line>
              <span className={s.passOwl}>
                <Image src="/images/owl-badge.png" alt="" width={88} height={88} />
                <Blink eyes={OWL_EYES.badge} />
              </span>
              <span className={s.passBrand}>
                NOCTVRNA
                <small>The Lagos Life</small>
              </span>
            </div>
            <h2 id="ticket-title" className={s.passTitle} data-t-line>
              Noted, <span className={s.passName}>{guest}</span>.
            </h2>
            <p id="ticket-msg" className={s.passMsg} data-t-line>
              Watch your inbox when tickets drop.
            </p>
            <dl className={s.passFacts} data-t-line>
              <div>
                <dt>Date</dt>
                <dd>12.12.26</dd>
              </div>
              <div>
                <dt>City</dt>
                <dd>Lagos</dd>
              </div>
            </dl>
            <div className={s.stamp} aria-hidden="true">
              <span className={s.burst} data-burst />
              <span className={s.stampIn} data-stamp>
                On the list
              </span>
            </div>
          </div>
          <div className={s.passStub} aria-hidden="true">
            <span className={s.passAdmit}>Admit one</span>
            <span className={s.passCode} />
            <span className={s.passDate}>12.12.26</span>
          </div>
        </div>
        <button type="button" className={s.passDone} data-t-after onClick={close} autoFocus>
          Back to the night
          <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
            <path d="M1 6h15M11 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <button type="button" className={s.passClose} data-t-after onClick={close} aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </dialog>
  );
}
