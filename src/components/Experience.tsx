"use client";

import { useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type Ref } from "react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import { PartyStage, type StageMode } from "@/lib/partyStage";
import s from "./Experience.module.css";

const MODES: { key: StageMode; word: string; desc: string; hint: string; color: string }[] = [
  {
    key: "sound",
    word: "Sound.",
    desc: "Carefully curated DJ sets and selected live performances, from emerging and established talent across electronic music and contemporary sounds.",
    hint: "Tap the deck to drop the bass",
    color: "#c38bef",
  },
  {
    key: "people",
    word: "People.",
    desc: "Music lovers, tastemakers and creatives. A room full of people who came for the same reason you did.",
    hint: "Tap to get the crowd jumping",
    color: "#edc1fc",
  },
  {
    key: "atmos",
    word: "Atmosphere.",
    desc: "Immersive production and a distinct visual identity for every edition. Nothing here is accidental.",
    hint: "Tap for strobe",
    color: "#55ff00",
  },
];

export type ExperienceHandle = {
  /** Switch scene (from scroll). */
  setMode: (index: number) => void;
  /** Pause drawing while another scene covers this one. */
  setActive: (active: boolean) => void;
};

/** Sound. People. Atmosphere. Pick a word (or keep scrolling) and the stage changes scene; tap the stage to play. */
export default function Experience({ ref }: { ref?: Ref<ExperienceHandle> }) {
  const [mode, setMode] = useState(0);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderer = useRef<PartyStage | null>(null);
  const active = useRef(true);

  useImperativeHandle(
    ref,
    () => ({
      setMode: (i) => setMode(i),
      setActive: (on) => {
        active.current = on;
      },
    }),
    [],
  );

  // Renderer lifecycle: draw on GSAP's ticker only while the stage is on screen and uncovered.
  useEffect(() => {
    const stage = stageRef.current!;
    const stageRenderer = new PartyStage(canvasRef.current!, "/images/owl-badge.png");
    renderer.current = stageRenderer;
    const reduce = prefersReducedMotion();
    let visible = false;

    const ro = new ResizeObserver(([entry]) => {
      stageRenderer.resize(entry.contentRect.width, entry.contentRect.height);
      if (reduce) stageRenderer.draw(performance.now());
    });
    ro.observe(stage);
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(stage);

    const tick = () => {
      if (visible && active.current && !reduce) stageRenderer.draw(performance.now());
    };
    gsap.ticker.add(tick);

    // Micro-interaction: the stage drifts toward the cursor and a spotlight follows it across the surface.
    const lean = (x: number, y: number) => gsap.to(stage, { x, y, duration: 0.9, ease: "power3.out", overwrite: "auto" });
    const local = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
    };
    const onMove = (e: PointerEvent) => {
      const p = local(e);
      stageRenderer.move(p.x, p.y);
      stage.style.setProperty("--mx", `${p.x}px`);
      stage.style.setProperty("--my", `${p.y}px`);
      if (e.pointerType === "mouse" && !reduce) lean((p.x / p.w - 0.5) * 16, (p.y / p.h - 0.5) * 12);
    };
    const onLeave = () => {
      stageRenderer.leave();
      if (!reduce) lean(0, 0);
    };
    const onDown = (e: PointerEvent) => {
      const p = local(e);
      stageRenderer.tap(p.x, p.y);
      if (reduce) stageRenderer.draw(performance.now());
      else gsap.fromTo(stage, { scale: 0.975 }, { scale: 1, duration: 0.6, ease: "expo.out" });
    };
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    stage.addEventListener("pointerdown", onDown);

    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      io.disconnect();
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
      stage.removeEventListener("pointerdown", onDown);
    };
  }, []);

  useEffect(() => {
    renderer.current?.setMode(MODES[mode].key);
    if (prefersReducedMotion()) renderer.current?.draw(performance.now() + 1000);
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
      <div className={s.spot} aria-hidden="true" />
      <div className={s.copy}>
        <p className={s.eyebrow}>The Experience</p>
        <h2 className="sr-only" id="experience-title">
          The experience: sound, people and atmosphere
        </h2>
        <div className={s.tabs} role="tablist" aria-labelledby="experience-title">
          {MODES.map((m, i) => (
            <button
              key={m.key}
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
        <p className={s.desc} key={current.key} aria-live="polite">
          {current.desc}
        </p>
        <p className={s.sub}>Every detail matters: the music, the environment, the production, the people and the moments in between.</p>
      </div>

      <div className={s.stageWrap} data-exp-stage>
        <div ref={stageRef} className={s.stage} id="exp-stage" role="tabpanel" aria-labelledby={`exp-tab-${mode}`}>
          <canvas ref={canvasRef} className={s.canvas} aria-hidden="true" />
          <span className={s.spotlight} aria-hidden="true" />
          <span className={s.live}>
            <i aria-hidden="true" />
            Live from Lagos
          </span>
          <span className={s.hint} key={current.hint}>
            <i aria-hidden="true" />
            {current.hint}
          </span>
        </div>
      </div>
    </div>
  );
}
