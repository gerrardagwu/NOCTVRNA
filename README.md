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
| Hero | Full screen. The NOCTVRNA logo switches on like a tube light catching (flicker, then a steady glow with a faint hum), and the city lights up behind it. | `src/components/Hero.tsx` |
| Countdown | Live split-flap countdown to 12 December 2026 (days, hours, minutes, seconds). The cards swing open, cascade through the digits like a calendar, then every tick lifts the bottom flap up and over. Each tick is scheduled for the moment the second changes and read fresh from the clock, which is corrected against the server's time (`/api/time`), so a phone set to the wrong time still counts down correctly. Coming back to a background tab jumps straight to the right time. | `src/components/FlipDigit.tsx`, `Countdown.tsx`, `src/lib/clock.ts` |
| Header | As the hero scrolls away, the owl, the logo and the countdown shrink into a sticky header. Desktop: logo left, owl centred, countdown right. Mobile: owl far left with the logo beside it, countdown right. Clicking anywhere in the header scrolls back to the top. | `src/components/Hero.tsx` |
| Blinking owl | Eyelids drawn over the owl artwork blink every few seconds, sometimes twice: hero/header badge, poster, values sticker and loader. Eye positions are in `OWL_EYES`. | `src/components/Blink.tsx` |
| Purple strip | Endless marquee. It always drifts, speeds up when you scroll and reverses when you scroll up. | `src/components/Strip.tsx` |
| Beyond the ordinary | The heading stays put while the copy scrolls past; when the copy runs out they leave together. The lead paragraph lights up word by word. | `src/components/Manifesto.tsx` |
| Sound / People / Atmosphere | Full-screen scene. Scroll (or hover/tap a word) to swap the sticker sheet: a record sliding out of its sleeve and a speaker, hands up with a phone out, a mirror ball and lightning. Stickers nod to the beat, drift with the cursor, lift on hover and each does its own thing when tapped. | `src/components/Experience.tsx`, `src/components/Stickers.tsx` |
| The city | THE NIGHT / IS CALLING slide out over the poster's edges and break up into grain where they cross the artwork. | `src/components/Stack.tsx` |
| Our philosophy | Originality, Freedom of Expression and Intentional Curation each flood the screen in a brand colour (deep purple, green, lilac), wiping in from a spinning owl sticker. Letters hop under the cursor, the sticker speeds up and drifts toward you, the tags wiggle. | `src/components/Values.tsx` |
| Sign-up | Covers the values; lines rise in, the glow breathes. | `src/components/Stack.tsx` |
| Footer | Scrolls in after the stage releases. | `src/components/Footer.tsx` |

Everything from Sound / People / Atmosphere to the sign-up is one pinned stage (`src/components/Stack.tsx`); the `T`
table at the top of that file sets where each scene starts on the scroll.

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

4. **Hosting.** The countdown's clock check uses the `/api/time` route, so deploy somewhere that runs Next.js server
   routes (Vercel does by default). On a purely static host it falls back to the visitor's device clock.

5. Add `metadataBase` in `src/app/layout.tsx` once the domain is known, so social previews use absolute URLs.

## Assets

Everything in `public/images` was exported from the Figma file: hero background, logo, owl badge, strip owl,
loader owl, poster, and the six flip-card shapes (`flip-1.svg` to `flip-6.svg`).
