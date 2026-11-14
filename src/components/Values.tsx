"use client";

import Image from "next/image";
import { useRef } from "react";
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
    // No photo yet: falls back to a lilac flood until one is added.
    title: "Intentional Curation.",
    tag: "Nothing is accidental.",
    body: "Every element is considered, from the atmosphere and lighting to the smallest details that shape the experience. Nothing is accidental. We believe the difference lies in the intention behind every choice and the feeling it creates.",
  },
];

const RING_TEXT = "NOCTVRNA • THE LAGOS LIFE • 12.12.26 • ";

/**
 * Our philosophy, one value per screen. Each value floods the stage in its own colour; the Stack
 * timeline wipes the next one in from the sticker. This component owns the hover play: letters hop
 * under the cursor, the sticker spins faster and leans toward you, the tag wiggles.
 */
export default function Values() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const q = gsap.utils.selector(root);
      const cleanups: (() => void)[] = [];

      (q("[data-vlayer]") as HTMLElement[]).forEach((layer) => {
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

      return () => cleanups.forEach((fn) => fn());
    },
    { scope: root },
  );

  return (
    <div ref={root} className={s.layers} data-vlayers>
      {VALUES.map((v, i) => (
        <article
          key={v.title}
          className={`${s.layer} ${s[`v${i + 1}`]} ${v.photo ? s.hasPhoto : ""}`}
          data-vlayer
          aria-labelledby={`value-${i}`}
        >
          {v.photo && (
            <>
              <div className={s.photo} data-vpan>
                <div className={s.photoZoom} data-vphoto>
                  <Image src={v.photo.src} alt={v.photo.alt} fill sizes="100vw" style={{ objectPosition: v.photo.focus }} />
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
        </article>
      ))}
    </div>
  );
}
