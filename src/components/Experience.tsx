"use client";

import Image from "next/image";
import { useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type Ref } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import s from "./Experience.module.css";

/** Photo behind each scene; `focus` is the object-position that keeps the people in frame. */
const PHOTOS = [
  { src: "/images/exp-sound.jpg", focus: "50% 72%", alt: "A woman dancing with her arm up under blue club lights" },
  { src: "/images/exp-people.jpg", focus: "50% 40%", alt: "A packed crowd with hands in the air under pink and red lights" },
  { src: "/images/exp-atmosphere.jpg", focus: "50% 45%", alt: "Orange and blue stage lights over a crowd, one hand raised" },
];

const MODES = [
  {
    word: "Sound.",
    desc: "Carefully curated DJ sets and selected live performances, from emerging and established talent across electronic music and contemporary sounds.",
    color: "#c38bef",
  },
  {
    word: "People.",
    desc: "Music lovers, tastemakers and creatives. A room full of people who came for the same reason you did.",
    color: "#edc1fc",
  },
  {
    word: "Atmosphere.",
    desc: "Immersive production and a distinct visual identity for every edition. Nothing here is accidental.",
    color: "#55ff00",
  },
];

export type ExperienceHandle = {
  /** Switch scene (from scroll). */
  setMode: (index: number) => void;
};

/** Sound. People. Atmosphere. Pick a word (or keep scrolling) and the photo on the right changes. */
export default function Experience({ ref }: { ref?: Ref<ExperienceHandle> }) {
  const [mode, setMode] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const shown = useRef<number | null>(null);

  useImperativeHandle(ref, () => ({ setMode: (i) => setMode(i) }), []);

  // The photo drifts gently against the cursor, for depth.
  useEffect(() => {
    const stage = stageRef.current!;
    if (prefersReducedMotion()) return;
    const pan = stage.querySelector("[data-photo-pan]");
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(pan, { x: px * -14, y: py * -10, duration: 1.1, ease: "power3.out", overwrite: "auto" });
    };
    const onLeave = () => gsap.to(pan, { x: 0, y: 0, duration: 1, ease: "power3.out", overwrite: "auto" });
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // Scene change: the new photo fades up over the old one with a slow push-in.
  useEffect(() => {
    const photos = stageRef.current!.querySelectorAll<HTMLElement>("[data-photo]");
    const reduce = prefersReducedMotion();
    const first = shown.current === null;
    photos.forEach((photo, i) => {
      if (i === mode) {
        gsap.set(photo, { zIndex: 1 });
        if (first || reduce) gsap.set(photo, { autoAlpha: 1, scale: 1 });
        else gsap.fromTo(photo, { autoAlpha: 0, scale: 1.12 }, { autoAlpha: 1, scale: 1, duration: 1.1, ease: "expo.out", overwrite: true });
      } else {
        gsap.set(photo, { zIndex: 0 });
        gsap.to(photo, { autoAlpha: 0, duration: first || reduce ? 0 : 0.6, delay: first || reduce ? 0 : 0.5, overwrite: true });
      }
    });
    shown.current = mode;
  }, [mode]);

  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = (i + d + MODES.length) % MODES.length;
    setMode(next);
    document.getElementById(`exp-tab-${next}`)?.focus();
  };

  const current = MODES[mode];

  return (
    <div className={s.inner} data-inner style={{ ["--c" as string]: current.color }}>
      <div className={s.copy}>
        <p className={s.eyebrow}>The Experience</p>
        <h2 className="sr-only" id="experience-title">
          The experience: sound, people and atmosphere
        </h2>
        <div className={s.tabs} role="tablist" aria-labelledby="experience-title">
          {MODES.map((m, i) => (
            <button
              key={m.word}
              id={`exp-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={i === mode}
              aria-controls="exp-stage"
              tabIndex={i === mode ? 0 : -1}
              className={s.tab}
              data-exp-word
              onClick={() => setMode(i)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setMode(i)}
              onKeyDown={(e) => onKey(e, i)}
            >
              <span className={s.word}>
                <span className="sr-only">{m.word}</span>
                {[...m.word].map((ch, ci) => (
                  <span key={ci} className={s.ch} style={{ ["--i" as string]: ci }} aria-hidden="true">
                    {ch}
                  </span>
                ))}
              </span>
              <span className={s.eq} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
            </button>
          ))}
        </div>
        <p className={s.desc} key={current.word} aria-live="polite">
          {current.desc}
        </p>
        <p className={s.sub}>Every detail matters: the music, the environment, the production, the people and the moments in between.</p>
      </div>

      <div className={s.stageWrap} data-exp-stage>
        <div ref={stageRef} className={s.stage} id="exp-stage" role="tabpanel" aria-labelledby={`exp-tab-${mode}`}>
          <div className={s.photos} data-photo-pan>
            {PHOTOS.map((photo, i) => (
              <div key={photo.src} className={s.photo} data-photo>
                <Image
                  src={photo.src}
                  alt={i === mode ? photo.alt : ""}
                  fill
                  sizes="(max-width: 860px) 100vw, 46vw"
                  quality={85}
                  style={{ objectPosition: photo.focus }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
