# NOCTVRNA

Landing page for NOCTVRNA: The Lagos Life (12.12.26), built from the "Landing Page" frame in the Figma file.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Stack

- **Next.js 16** (App Router, TypeScript, CSS Modules)
- **GSAP 3.15** with **ScrollTrigger** (scroll-linked and pinned animation) and **SplitText** (word reveals)
- **Lenis** for smooth scrolling, driven from GSAP's ticker so ScrollTrigger stays in sync

## What moves, and where it lives

| Section | Behaviour | File |
| --- | --- | --- |
| Loader | The owl from the Figma "Loader" frame fades up, its eyes glow, and it lifts once fonts and images are in. | `src/components/Loader.tsx` |
| Hero | The NOCTVRNA logo switches on like a tube light catching (flicker, then a steady glow with a faint hum), and the city lights up behind it. | `src/components/Hero.tsx` |
| Countdown | Split-flap cards. They swing open, cascade through the digits like a calendar, and on every change the bottom flap lifts up and over. | `src/components/FlipDigit.tsx`, `Countdown.tsx` |
| Header | As the hero scrolls away, the big logo and the countdown shrink into a sticky header (logo left, countdown right). Scroll back up and they grow back. | `src/components/Hero.tsx` |
| Purple strip | Endless marquee. It always drifts, speeds up when you scroll and reverses when you scroll up. | `src/components/Strip.tsx` |
| Beyond the ordinary | The heading stays put while the copy scrolls past; when the copy runs out they leave together. The lead paragraph lights up word by word. | `src/components/Manifesto.tsx` |
| City / Values / Enter | One pinned, full-screen stage. Each scene fills the view and the next slides up over it. THE NIGHT / IS CALLING slide out from behind the poster; Originality gives way to Freedom of Expression, then Intentional Curation; then the sign-up scene covers it. | `src/components/Stack.tsx` |
| Footer | Scrolls in after the stage releases. | `src/components/Footer.tsx` |

All motion respects `prefers-reduced-motion`.

## Before launch

1. **Fonts.** The design uses **Bunch** and **NEUVORTE**, which aren't on Google Fonts. The site currently uses
   Bricolage Grotesque and Metal Mania as stand-ins. To switch, put the font files in `src/fonts/` and replace the two
   calls in `src/app/layout.tsx` with `next/font/local`, keeping the same variable names:

   ```ts
   import localFont from "next/font/local";
   const bunch = localFont({
     src: [
       { path: "../fonts/Bunch-Regular.woff2", weight: "400" },
       { path: "../fonts/Bunch-Bold.woff2", weight: "700" },
     ],
     variable: "--font-bunch",
   });
   const neuvorte = localFont({ src: "../fonts/Neuvorte-Regular.woff2", variable: "--font-neuvorte" });
   ```

2. **Sign-up form.** "Notify Me!" checks the fields and shows a confirmation, but doesn't send anything yet. Connect it
   to the mailing list or ticketing provider at the `TODO` in `src/components/Stack.tsx`.

3. **Countdown target** is 12 December 2026, 00:00 Lagos time (`EVENT_TIME` in `src/components/Countdown.tsx`).
   Change it there if doors have a set time.

4. Add `metadataBase` in `src/app/layout.tsx` once the domain is known, so social previews use absolute URLs.

## Assets

Everything in `public/images` was exported from the Figma file: hero background, logo, owl badge, strip owl,
loader owl, poster, and the six flip-card shapes (`flip-1.svg` to `flip-6.svg`).
