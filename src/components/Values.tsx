"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import Blink, { OWL_EYES } from "./Blink";
import s from "./Values.module.css";

type Photo = { src: string; focus: string; alt: string };

export const VALUES: { title: string; tag: string; body: string; photo?: Photo }[] = [
  {
    title: "Originality.",
    tag: "No reruns.",
    photo: { src: "/images/value-originality.jpg", focus: "50% 52%", alt: "The Lekki-Ikoyi Link Bridge lit green over the water at night" },
    body: "We are not interested in repeating what has already been done. We are interested in creating something distinctive, evolving with every edition and building a community around a shared appreciation for culture and experience.",
  },
  {
    title: "Freedom of Expression.",
    tag: "Come as you are.",
    photo: { src: "/images/value-freedom.jpg", focus: "50% 35%", alt: "Friends laughing and taking a selfie together on a crowded dance floor" },
    body: "Everyone should have the freedom to express themselves without boundaries or expectations. A space where individuality is celebrated, differences bring us together and everyone is free to experience the moment in their own way. Come as you are, be unapologetically yourself and leave with something that stays with you.",
  },
  {
    title: "Intentional Curation.",
    tag: "Nothing is accidental.",
    photo: { src: "/images/value-curation.jpg", focus: "45% 40%", alt: "Mirror balls throwing red beams across a dark club" },
    body: "Every element is considered, from the atmosphere and lighting to the smallest details that shape the experience. Nothing is accidental. We believe the difference lies in the intention behind every choice and the feeling it creates.",
  },
];

const RING_TEXT = "NOCTVRNA • THE LAGOS LIFE • 12.12.26 • ";

/** Where a value's words, tag, sticker and copy start before its entrance. */
const HIDDEN = {
  chars: { yPercent: 110, rotate: 12, opacity: 0 },
  sticker: { scale: 0.3, rotate: -140, opacity: 0 },
  tag: { scale: 0 },
  body: { y: 30, opacity: 0 },
};

const parts = (layer: Element) => ({
  chars: layer.querySelectorAll("[data-vchar]"),
  sticker: layer.querySelector("[data-vsticker]"),
  tag: layer.querySelector("[data-vtag]"),
  body: layer.querySelector("[data-vbody]"),
});

/**
 * Put a value in its pre-entrance state. Set up front rather than left to the entrance's from-values: a
 * staggered tween only applies its start state to the first letter until the playhead reaches the rest.
 */
export function hideValue(layer: Element) {
  const p = parts(layer);
  gsap.set(p.chars, HIDDEN.chars);
  gsap.set(p.sticker, HIDDEN.sticker);
  gsap.set(p.tag, HIDDEN.tag);
  gsap.set(p.body, HIDDEN.body);
}

/** One value's entrance (from hideValue's state): letters spring up, the sticker spins in, the tag slaps on, the copy follows. */
export function revealValue(layer: Element) {
  const p = parts(layer);
  const at = { immediateRender: false };
  return gsap
    .timeline()
    .fromTo(p.chars, HIDDEN.chars, { ...at, yPercent: 0, rotate: 0, opacity: 1, stagger: 0.02, duration: 0.55, ease: "expo.out" })
    .fromTo(p.sticker, HIDDEN.sticker, { ...at, scale: 1, rotate: 0, opacity: 1, duration: 0.7, ease: "expo.out" }, 0.05)
    .fromTo(p.tag, HIDDEN.tag, { ...at, scale: 1, duration: 0.5, ease: "expo.out" }, 0.3)
    .fromTo(p.body, HIDDEN.body, { ...at, y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }, 0.35);
}

/**
 * Desktop: swap one value for the next inside the still stage, starting at `at` on a scrubbed timeline.
 * The words lift out first, then the photo slides up and away as the next one rises in from below, and the
 * new words spring up once it's there. Returns the time the swap finishes.
 */
export function swapValues(tl: gsap.core.Timeline, from: Element, to: Element, at: number) {
  const rest = (layer: Element) => [layer.querySelector("[data-vsticker]"), layer.querySelector("[data-vtag]"), layer.querySelector("[data-vbody]")];
  const photo = to.querySelector("[data-vphoto]");
  tl.to(from.querySelectorAll("[data-vchar]"), { yPercent: -110, opacity: 0, stagger: 0.012, duration: 0.35, ease: "power2.in" }, at)
    .to(rest(from), { y: -50, opacity: 0, stagger: 0.04, duration: 0.35, ease: "power2.in" }, at + 0.04)
    .to(from, { yPercent: -100, duration: 0.8, ease: "power3.inOut" }, at + 0.12)
    .fromTo(to, { yPercent: 100 }, { yPercent: 0, duration: 0.8, ease: "power3.inOut", immediateRender: true }, at + 0.12);
  if (photo) tl.fromTo(photo, { scale: 1.15 }, { scale: 1, duration: 1, ease: "power2.out" }, at + 0.12);
  tl.add(revealValue(to), at + 0.62);
  return at + 1.47;
}

/** The value's photo settling from a slow push-in. */
export function settleValue(layer: Element) {
  const photo = layer.querySelector("[data-vphoto]");
  return photo ? gsap.fromTo(photo, { scale: 1.18 }, { scale: 1, duration: 1.6, ease: "power2.out" }) : gsap.timeline();
}

/**
 * Our philosophy. On desktop it's one full-screen stage that stays put while scrolling swaps the values
 * inside it (the scroll timeline lives in Stack, built from swapValues). On mobile the values become a row
 * of cards you swipe through, the next one peeking in from the side. This component owns the hover play (letters hop under the cursor, the
 * sticker spins faster and leans toward you), the card entrances on mobile and the swipe progress.
 */
export default function Values() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const layers = q("[data-vlayer]") as HTMLElement[];
      if (prefersReducedMotion()) return;
      const cleanups: (() => void)[] = [];

      layers.forEach((layer) => {
        const sticker = layer.querySelector<HTMLElement>("[data-sticker]")!;
        const pan = layer.querySelector<HTMLElement>("[data-vpan]");
        const px = pan && gsap.quickTo(pan, "x", { duration: 1.2, ease: "power3.out" });
        const py = pan && gsap.quickTo(pan, "y", { duration: 1.2, ease: "power3.out" });
        const ring = layer.querySelector<HTMLElement>("[data-ring]")!;
        const spin = gsap.to(ring, { rotation: 360, duration: 16, ease: "none", repeat: -1 });
        const mx = gsap.quickTo(sticker, "x", { duration: 0.9, ease: "power3.out" });
        const my = gsap.quickTo(sticker, "y", { duration: 0.9, ease: "power3.out" });

        // The sticker drifts toward the cursor anywhere on the layer.
        const onMove = (e: PointerEvent) => {
          if (e.pointerType !== "mouse") return;
          const r = sticker.getBoundingClientRect();
          mx(gsap.utils.clamp(-28, 28, (e.clientX - (r.left + r.width / 2)) * 0.06));
          my(gsap.utils.clamp(-28, 28, (e.clientY - (r.top + r.height / 2)) * 0.06));
          // The photo drifts the other way, just slightly.
          px?.((e.clientX / window.innerWidth - 0.5) * -24);
          py?.((e.clientY / window.innerHeight - 0.5) * -16);
        };
        const onLeave = () => {
          mx(0);
          my(0);
          px?.(0);
          py?.(0);
        };
        const faster = () => gsap.to(spin, { timeScale: 5, duration: 0.6, ease: "power2.out" });
        const slower = () => gsap.to(spin, { timeScale: 1, duration: 1.2, ease: "power2.out" });

        layer.addEventListener("pointermove", onMove);
        layer.addEventListener("pointerleave", onLeave);
        sticker.addEventListener("pointerenter", faster);
        sticker.addEventListener("pointerleave", slower);
        cleanups.push(() => {
          layer.removeEventListener("pointermove", onMove);
          layer.removeEventListener("pointerleave", onLeave);
          sticker.removeEventListener("pointerenter", faster);
          sticker.removeEventListener("pointerleave", slower);
        });
      });

      // Mobile: each card plays its entrance the first time most of it is on screen, whether that's from
      // scrolling down to the row or swiping to the card. (The viewport observer sees the row's clipping.)
      const mm = gsap.matchMedia();
      mm.add("(max-width: 760px)", () => {
        layers.forEach(hideValue);
        const entrances = layers.map((layer) => gsap.timeline({ paused: true }).add(settleValue(layer), 0).add(revealValue(layer), 0.1));
        const io = new IntersectionObserver(
          (entries) =>
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              entrances[layers.indexOf(entry.target as HTMLElement)]?.play();
              io.unobserve(entry.target);
            }),
          { threshold: 0.6 },
        );
        layers.forEach((layer) => io.observe(layer));
        return () => io.disconnect();
      });

      return () => {
        cleanups.forEach((fn) => fn());
        mm.revert();
      };
    },
    { scope: root },
  );

  // Which card the row has settled on, for the progress bars.
  const onTrackScroll = () => {
    const row = track.current;
    if (!row) return;
    const cards = [...row.children] as HTMLElement[];
    const pad = parseFloat(getComputedStyle(row).scrollPaddingLeft) || 0;
    let nearest = 0;
    cards.forEach((card, i) => {
      if (Math.abs(card.offsetLeft - pad - row.scrollLeft) < Math.abs(cards[nearest].offsetLeft - pad - row.scrollLeft)) nearest = i;
    });
    setActive(nearest);
  };

  const goTo = (i: number) => {
    const row = track.current;
    const card = row?.children[i] as HTMLElement | undefined;
    if (!row || !card) return;
    const pad = parseFloat(getComputedStyle(row).scrollPaddingLeft) || 0;
    row.scrollTo({ left: card.offsetLeft - pad, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  return (
    <div ref={root} className={s.values} data-values>
      <div className={s.stage} data-vstage>
        <div className={s.stageIn} data-vstage-in>
          <div ref={track} className={s.layers} data-vlayers onScroll={onTrackScroll}>
            {VALUES.map((v, i) => (
              <article
                key={v.title}
                className={`${s.layer} ${s[`v${i + 1}`]} ${v.photo ? s.hasPhoto : ""}`}
                data-vlayer
                aria-labelledby={`value-${i}`}
              >
                <div className={s.layerIn} data-vinner>
                  {v.photo && (
                    <>
                      <div className={s.photo} data-vpan>
                        <div className={s.photoZoom} data-vphoto>
                          <Image
                            src={v.photo.src}
                            alt={v.photo.alt}
                            fill
                            sizes="(max-width: 760px) 90vw, 100vw"
                            quality={85}
                            style={{ objectPosition: v.photo.focus }}
                          />
                        </div>
                      </div>
                      <div className={s.scrim} aria-hidden="true" />
                    </>
                  )}
                  <div className={s.grid}>
                    <div className={s.top}>
                      <span className={s.count} aria-label={`Value ${i + 1} of ${VALUES.length}`}>
                        {String(i + 1).padStart(2, "0")}
                        <span aria-hidden="true"> / 03</span>
                      </span>
                    </div>

                    <h3 id={`value-${i}`} className={s.title} data-vtitle>
                      <span className="sr-only">{v.title}</span>
                      {v.title.split(" ").map((word, wi) => (
                        <span key={wi} className={s.wordWrap} aria-hidden="true">
                          {[...word].map((ch, ci) => (
                            <span key={ci} className={s.chWrap} data-vchar>
                              <span className={s.ch}>{ch}</span>
                            </span>
                          ))}
                        </span>
                      ))}
                    </h3>

                    <div className={s.bottom}>
                      <span className={s.tagWrap} data-vtag>
                        <span className={s.tag}>{v.tag}</span>
                      </span>
                      <p className={s.body} data-vbody>
                        {v.body}
                      </p>
                    </div>
                  </div>

                  <div className={s.sticker} data-sticker aria-hidden="true">
                    <div className={s.stickerIn} data-vsticker>
                      <svg className={s.ring} data-ring viewBox="0 0 200 200">
                        <defs>
                          <path id={`ring-${i}`} d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
                        </defs>
                        <text>
                          <textPath href={`#ring-${i}`} textLength="489">
                            {RING_TEXT}
                          </textPath>
                        </text>
                      </svg>
                      <span className={s.owl}>
                        <Image src="/images/owl-badge.png" alt="" width={88} height={88} />
                        <Blink eyes={OWL_EYES.badge} />
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Desktop only: stays in place and rolls to the next number as each value arrives. */}
          <span className={s.counter} aria-hidden="true">
            0
            <span className={s.digits}>
              <span data-vdigits>
                {VALUES.map((v, i) => (
                  <span key={v.title}>{i + 1}</span>
                ))}
              </span>
            </span>
            <span className={s.of}>/ 0{VALUES.length}</span>
          </span>
        </div>
      </div>

      {/* Mobile only: where you are in the row; tap a bar to jump to that card. */}
      <div className={s.progress} role="group" aria-label="Values">
        {VALUES.map((v, i) => (
          <button
            key={v.title}
            type="button"
            className={s.bar}
            data-active={i === active || undefined}
            aria-label={`Show ${v.title.replace(/\.$/, "")}`}
            aria-current={i === active || undefined}
            onClick={() => goTo(i)}
          >
            <span />
          </button>
        ))}
      </div>
    </div>
  );
}
