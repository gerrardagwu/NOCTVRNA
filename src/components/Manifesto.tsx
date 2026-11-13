"use client";

import { useRef } from "react";
import { gsap, SplitText, prefersReducedMotion, useGSAP } from "@/lib/gsap";
import { useFontsReady } from "@/lib/useFontsReady";
import s from "./Manifesto.module.css";

/**
 * "Beyond the ordinary. Into the night." The heading is sticky in its column while the copy on the
 * right scrolls past; when the copy runs out the sticky releases and both leave the frame together.
 * The lead paragraph lights up word by word as you read down.
 */
export default function Manifesto() {
  const root = useRef<HTMLElement>(null);
  const fontsReady = useFontsReady();

  useGSAP(
    () => {
      if (!fontsReady || prefersReducedMotion()) return;
      const q = gsap.utils.selector(root);

      const heading = SplitText.create(q("[data-heading]"), { type: "words" });
      gsap.from(heading.words, {
        yPercent: 60,
        opacity: 0,
        rotate: 3,
        duration: 1,
        stagger: 0.06,
        ease: "power3.out",
        scrollTrigger: { trigger: root.current, start: "top 75%" },
      });

      // Each word ends on the colour the design gives it; it starts on the deep purple of unread text.
      const lead = SplitText.create(q("[data-lead]"), { type: "words" });
      gsap.from(lead.words, {
        color: "#2a0a45",
        stagger: 0.1,
        ease: "none",
        scrollTrigger: { trigger: q("[data-lead]")[0], start: "top 78%", end: "bottom 42%", scrub: 0.6 },
      });

      gsap.from(q("[data-body] p"), {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: { trigger: q("[data-body]")[0], start: "top 85%" },
      });

      return () => {
        heading.revert();
        lead.revert();
      };
    },
    { scope: root, dependencies: [fontsReady] },
  );

  return (
    <section ref={root} className={s.section} aria-labelledby="manifesto-title">
      <div className={s.inner} data-manifesto-inner>
        <h2 id="manifesto-title" className={s.heading} data-heading>
          Beyond the ordinary. Into the night.
        </h2>
        <div className={s.copy}>
          <p className={s.lead} data-lead>
            NOCTVRNA is a nightlife and culture experience built around{" "}
            <span className={s.hl}>music, creative expression</span> and the{" "}
            <span className={s.hl}>energy of the night.</span> Created for those who seek more than the conventional
            night out, it brings together music lovers, tastemakers, creatives and anyone who{" "}
            <span className={s.hl}>wants a night that leaves a lasting impression.</span>
          </p>
          <div className={s.body} data-body>
            <p>
              Rooted in the spirit of electronic music, contemporary nightlife and underground culture, NOCTVRNA lives
              where sound, atmosphere, people and creative expression meet.
            </p>
            <p>
              We believe nightlife should be more than a place to go. It should be something to feel, discover and
              remember. This is not just another party. It is a culture in motion.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
