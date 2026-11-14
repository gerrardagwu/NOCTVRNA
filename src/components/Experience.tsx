"use client";

import Image from "next/image";
import { useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type ReactNode, type Ref } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { Bolt, Burst, COLORS, DiscoBall, Note, PhoneHand, RockHand, Sparkle, Speaker, Vinyl } from "./Stickers";
import s from "./Experience.module.css";

type Kind = "vinyl" | "speaker" | "note" | "rock" | "phone" | "burst" | "ball" | "bolt" | "sparkle";

/** A sticker on the stage: centre (x, y) and max width/height in % of the stage, its art's aspect ratio, tilt and parallax depth. */
type Slot = { kind: Kind; x: number; y: number; w: number; h: number; ar: number; rot: number; depth: number; art: ReactNode };

/** Photo behind each scene; `focus` is the object-position that keeps the people in frame. */
const PHOTOS = [
  { src: "/images/exp-sound.jpg", focus: "50% 72%", alt: "A woman dancing with her arm up under blue club lights" },
  { src: "/images/exp-people.jpg", focus: "50% 40%", alt: "A packed crowd with hands in the air under pink and red lights" },
  { src: "/images/exp-atmosphere.jpg", focus: "50% 45%", alt: "Orange and blue stage lights over a crowd, one hand raised" },
];

/* Stickers sit round the edges of each photo so the people stay the centre of it. */
const SCENES: Slot[][] = [
  // Sound: a record sliding out of its sleeve, a speaker, notes in the air.
  [
    { kind: "vinyl", x: 24, y: 81, w: 38, h: 34, ar: 1.45, rot: -8, depth: 1, art: <Vinyl /> },
    { kind: "speaker", x: 86, y: 76, w: 17, h: 34, ar: 0.905, rot: 9, depth: 1.6, art: <Speaker /> },
    { kind: "note", x: 84, y: 17, w: 9, h: 16, ar: 0.75, rot: 12, depth: 2.4, art: <Note /> },
    { kind: "note", x: 13, y: 20, w: 8, h: 15, ar: 0.75, rot: -14, depth: 2.2, art: <Note color={COLORS.LILAC} /> },
    { kind: "sparkle", x: 71, y: 10, w: 6, h: 8, ar: 1, rot: 0, depth: 3, art: <Sparkle /> },
  ],
  // People: hands up, phones out.
  [
    { kind: "rock", x: 14, y: 76, w: 21, h: 44, ar: 0.68, rot: -12, depth: 1.2, art: <RockHand /> },
    { kind: "phone", x: 86, y: 74, w: 21, h: 44, ar: 0.73, rot: 10, depth: 1.5, art: <PhoneHand /> },
    { kind: "burst", x: 84, y: 16, w: 16, h: 20, ar: 1, rot: -8, depth: 2.4, art: <Burst /> },
    { kind: "sparkle", x: 12, y: 16, w: 6, h: 8, ar: 1, rot: 0, depth: 3, art: <Sparkle color={COLORS.PAPER} /> },
    { kind: "sparkle", x: 66, y: 90, w: 6, h: 8, ar: 1, rot: 0, depth: 2.8, art: <Sparkle color={COLORS.GREEN} /> },
  ],
  // Atmosphere: a mirror ball, lightning, glints.
  [
    { kind: "ball", x: 83, y: 23, w: 21, h: 38, ar: 0.833, rot: 6, depth: 1, art: <DiscoBall /> },
    { kind: "bolt", x: 12, y: 70, w: 10, h: 26, ar: 0.579, rot: -16, depth: 2, art: <Bolt /> },
    { kind: "bolt", x: 89, y: 80, w: 9, h: 24, ar: 0.579, rot: 18, depth: 2.2, art: <Bolt color={COLORS.CORAL} /> },
    { kind: "sparkle", x: 15, y: 18, w: 6, h: 8, ar: 1, rot: 0, depth: 3, art: <Sparkle /> },
    { kind: "sparkle", x: 62, y: 12, w: 5, h: 7, ar: 1, rot: 0, depth: 2.6, art: <Sparkle color={COLORS.PAPER} /> },
    { kind: "sparkle", x: 40, y: 90, w: 5, h: 7, ar: 1, rot: 0, depth: 2.4, art: <Sparkle color={COLORS.LILAC} /> },
  ],
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

const BEAT = 60 / 124; // seconds per beat at 124 bpm

export type ExperienceHandle = {
  /** Switch scene (from scroll). */
  setMode: (index: number) => void;
  /** Pause the idle motion while another scene covers this one. */
  setActive: (active: boolean) => void;
};

/** What each sticker does when you tap it. `pop` is the sticker's own wrapper; parts are inside its SVG. */
function react(kind: Kind, pop: HTMLElement, idle: Map<string, gsap.core.Tween>) {
  const part = (name: string) => pop.querySelectorAll(`[data-part="${name}"]`);
  gsap.fromTo(pop, { scaleX: 1.14, scaleY: 0.86 }, { scaleX: 1, scaleY: 1, duration: 0.6, ease: "expo.out" });

  switch (kind) {
    case "vinyl": {
      const spin = idle.get("disc");
      if (spin) gsap.fromTo(spin, { timeScale: 9 }, { timeScale: 1, duration: 1.6, ease: "power2.out" });
      gsap.fromTo(part("disc"), { x: 0 }, { keyframes: [{ x: 24, duration: 0.25 }, { x: 0, duration: 0.6 }], ease: "power2.out" });
      break;
    }
    case "speaker":
      gsap.fromTo(part("cone"), { scale: 1.35 }, { scale: 1, duration: 0.14, repeat: 4, ease: "power1.out", transformOrigin: "50% 50%" });
      gsap.fromTo(part("ring"), { opacity: 1 }, { opacity: 0, duration: 0.7, stagger: 0.12, ease: "power2.out" });
      break;
    case "note":
      gsap.fromTo(pop, { y: 0, rotation: 0 }, { keyframes: [{ y: "-35%", rotation: 200, duration: 0.3, ease: "power2.out" }, { y: 0, rotation: 360, duration: 0.45, ease: "power2.in" }] });
      break;
    case "rock":
      gsap.to(pop, { keyframes: { rotation: [0, -16, 13, -9, 5, 0] }, duration: 0.7, ease: "power2.out" });
      break;
    case "phone":
      gsap.fromTo(part("flash"), { opacity: 1, scale: 0.6, transformOrigin: "50% 50%" }, { opacity: 0, scale: 1.25, duration: 0.55, ease: "power2.out" });
      gsap.fromTo(part("flash-dot"), { fill: "#fbf8f1" }, { fill: "#ffd43b", duration: 0.6 });
      break;
    case "burst":
    case "sparkle":
      gsap.fromTo(pop, { rotation: 0 }, { rotation: 180, duration: 0.8, ease: "expo.out" });
      break;
    case "ball": {
      const slide = idle.get("facets");
      if (slide) gsap.fromTo(slide, { timeScale: 7 }, { timeScale: 1, duration: 1.8, ease: "power2.out" });
      break;
    }
    case "bolt":
      gsap.fromTo(pop, { opacity: 0.2 }, { keyframes: { opacity: [0.2, 1, 0.3, 1] }, duration: 0.45, ease: "none" });
      break;
  }
}

/** Sound. People. Atmosphere. Pick a word (or keep scrolling) and the photo and stickers on the right change; poke the stickers to play. */
export default function Experience({ ref }: { ref?: Ref<ExperienceHandle> }) {
  const [mode, setMode] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const idle = useRef(new Map<string, gsap.core.Tween>());
  const shown = useRef<number | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      setMode: (i) => setMode(i),
      setActive: (on) => {
        stageRef.current?.toggleAttribute("data-paused", !on);
        idle.current.forEach((t) => (on ? t.resume() : t.pause()));
      },
    }),
    [],
  );

  // Idle motion, parallax and taps.
  useEffect(() => {
    const stage = stageRef.current!;
    const reduce = prefersReducedMotion();
    const tweens = idle.current;
    const q = gsap.utils.selector(stage);

    if (!reduce) {
      tweens.set("disc", gsap.to(q('[data-part="disc"]'), { rotation: 360, transformOrigin: "50% 50%", duration: 2.4, ease: "none", repeat: -1 }));
      tweens.set("facets", gsap.to(q('[data-part="facets"]'), { x: -72, duration: 1.8, ease: "none", repeat: -1 }));
      tweens.set(
        "cones",
        gsap.to(q('[data-part="cone"]'), { scale: 1.14, transformOrigin: "50% 50%", duration: 0.12, ease: "power1.out", yoyo: true, repeat: -1, repeatDelay: BEAT - 0.24 }),
      );
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || reduce) return;
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      (q("[data-drift]") as HTMLElement[]).forEach((el) => {
        const d = Number(el.dataset.drift);
        gsap.to(el, { x: px * d * 18, y: py * d * 14, duration: 0.9, ease: "power3.out", overwrite: "auto" });
      });
      // The photo leans the other way, a little, for depth.
      gsap.to(q("[data-photo-pan]"), { x: px * -14, y: py * -10, duration: 1.1, ease: "power3.out", overwrite: "auto" });
    };
    const onLeave = () => gsap.to(q("[data-drift], [data-photo-pan]"), { x: 0, y: 0, duration: 1, ease: "power3.out", overwrite: "auto" });
    const onDown = (e: PointerEvent) => {
      const pop = (e.target as Element).closest<HTMLElement>("[data-pop]");
      if (!pop || reduce) return;
      react(pop.dataset.kind as Kind, pop, tweens);
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("pointerdown", onDown);
    return () => {
      tweens.forEach((t) => t.kill());
      tweens.clear();
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("pointerdown", onDown);
    };
  }, []);

  // Scene change: the new photo fades up over the old one with a slow push-in; the old stickers peel
  // away and the new ones slap on one after another.
  useEffect(() => {
    const scenes = stageRef.current!.querySelectorAll<HTMLElement>("[data-scene]");
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
    scenes.forEach((scene, i) => {
      const pops = scene.querySelectorAll("[data-pop]");
      if (i === mode) {
        gsap.set(scene, { autoAlpha: 1 });
        if (first || reduce) gsap.set(pops, { scale: 1, rotation: 0, opacity: 1 });
        else
          gsap.fromTo(
            pops,
            { scale: 0, rotation: -30, opacity: 0 },
            { scale: 1, rotation: 0, opacity: 1, duration: 0.75, stagger: 0.07, ease: "expo.out", overwrite: true },
          );
      } else if (i === shown.current && !reduce) {
        gsap.to(pops, {
          scale: 0.4,
          rotation: 20,
          opacity: 0,
          duration: 0.25,
          stagger: 0.02,
          ease: "power2.in",
          overwrite: true,
          onComplete: () => gsap.set(scene, { autoAlpha: 0 }),
        });
      } else {
        gsap.set(scene, { autoAlpha: 0 });
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
                  style={{ objectPosition: photo.focus }}
                />
              </div>
            ))}
          </div>
          <div className={s.shade} aria-hidden="true" />
          {SCENES.map((scene, si) => (
            <div key={si} className={s.scene} data-scene aria-hidden="true">
              {scene.map((slot, i) => (
                <div
                  key={i}
                  className={s.slot}
                  style={{
                    left: `${slot.x}%`,
                    top: `${slot.y}%`,
                    width: `min(${slot.w}cqw, ${(slot.h * slot.ar).toFixed(1)}cqh)`,
                    ["--rot" as string]: `${slot.rot}deg`,
                    ["--delay" as string]: `${(-i * 0.37).toFixed(2)}s`,
                  }}
                >
                  <div className={s.drift} data-drift={slot.depth}>
                    <div className={s.pop} data-pop data-kind={slot.kind}>
                      <div className={s.lift}>
                        <div className={s.bob}>{slot.art}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
