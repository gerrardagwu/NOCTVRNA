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
| Hero | Full screen, straight away (there's no preloader). On phones the hero is as tall as the screen with the browser's toolbar tucked away, so the purple strip never peeks in at the bottom, while the logo, owl and countdown are laid out in the screen with the toolbar showing, so none of it sits behind the toolbar (`--hero-full` and `--hero-h` in `globals.css`). A phone turned sideways gets the desktop layout. As soon as the fonts are in, the NOCTVRNA logo switches on like a tube light catching (flicker, then a steady glow with a faint hum), and the city lights up behind it. | `src/components/Hero.tsx` |
| Countdown | Live split-flap countdown to 12 December 2026 (days, hours, minutes, seconds). The cards swing open, cascade through the digits like a calendar, then every tick lifts the bottom flap up and over. Each tick is scheduled for the moment the second changes and read fresh from the clock, which is corrected against the server's time (`/api/time`), so a phone set to the wrong time still counts down correctly. Coming back to a background tab jumps straight to the right time. | `src/components/FlipDigit.tsx`, `Countdown.tsx`, `src/lib/clock.ts` |
| Header | As the hero scrolls away, the logo shrinks into a sticky, translucent header on the left, with the Get Access ticket on the right (it scrolls to the sign-up). The countdown shrinks into the middle of the header on desktop, and into a small tab just below the header on mobile. The owl stays in the hero and fades with it. Clicking anywhere else in the header scrolls back to the top. | `src/components/Hero.tsx`, `src/lib/scrollTo.ts` |
| Blinking owl | The owl's own eyelid skin (cut from the teaser video's blink, `lid-left.png` / `lid-right.png`, served as the much lighter `.webp` copies) slides down over each eye every few seconds, sometimes twice: hero, flyer, values stickers and the sign-up ticket. Eye positions are in `OWL_EYES`. | `src/components/Blink.tsx` |
| Purple strip | Endless marquee. It always drifts, speeds up when you scroll and reverses when you scroll up. The words are Bunch Bold outlines exported from the Figma strip, so they match the design before the font is installed. | `src/components/Strip.tsx`, `stripWords.ts` |
| Beyond the ordinary | The heading stays put while the copy scrolls past; when the copy runs out they leave together. The lead paragraph lights up word by word. | `src/components/Manifesto.tsx` |
| Sound / People / Atmosphere | Full-screen scene. Scroll (or hover/tap a word) to change the photo: it fades up with a slow push-in and drifts gently against the cursor. | `src/components/Experience.tsx` |
| The city | Headline, a body-size line with the highlights, and event details (date, location, doors) on the left; the backlit event flyer (`flyer.jpg`, shown whole) on the right (stacked on mobile). The flyer leans toward the cursor. It holds once it reaches the top and the whole flyer is in view, while the values slide over it. | `src/components/Stack.tsx` |
| Our philosophy | Desktop: one full-screen stage that stays put while you scroll through Originality, Freedom of Expression and Intentional Curation. Inside it, each value's words lift out, its photo slides up and away as the next rises in from below, and the new words spring up; each value rests for a beat before the next swap, and the counter in the corner rolls 01, 02, 03. The stage keeps holding while the sign-up slides over it. Mobile: the three are a row of cards you swipe (snapping, the next card peeking in at the edge), with progress bars underneath that you can tap; each card plays its entrance when it comes into view. Letters hop under the cursor, the spinning owl sticker speeds up and drifts toward you, the photo drifts the other way. | `src/components/Values.tsx` |
| Sign-up | Slides over the last value; lines rise in, the glow breathes. The form (`src/components/Waitlist.tsx`) puts people on the Brevo waitlist; see below. Name and email are checked on submit: a problem turns that field's label and line red with the reason underneath, and clears as soon as it's fixed. A good submit opens a ticket (the guest's name, date, city, an ON THE LIST stamp) in a dialog; Esc, the backdrop or the buttons close it. | `src/components/Stack.tsx` |
| Footer | Scrolls in after the stage releases. | `src/components/Footer.tsx` |

After the manifesto (`src/components/Stack.tsx`): the Experience scene is pinned full-screen while scroll walks its
three photos (`EXP` at the top of that file sets where each beat falls); the city section is as tall as its content
and scrolls in normally after it, then holds while the values slide up over it. On desktop the values stage is pinned
while it swaps its contents (`VALUE_REST` sets how long each value rests); the sign-up then slides over it.

All motion respects `prefers-reduced-motion`.

## Performance (low-end phones)

Profiled as a budget Android phone (360×760 at 2x, CPU slowed 4x, real touch flicks). The rules the code follows:

- **Endless loops cost nothing per frame.** The logo's hum, the sign-up glow and the values rings are browser
  animations of transform or opacity, which the compositor plays on its own thread. Driven by GSAP they restyled,
  repainted (the glow repainted the whole 6,500px values-and-sign-up block) or re-laid out text (the rings' curved
  text) on every frame, for the life of the page.
- **Nothing animates off screen.** The strip, the rings, the glow and every blinking owl run only while visible
  (`whileInView` in `src/lib/inView.ts`); off screen their layers are released, and they resume where they left off.
- **Few GPU layers.** The countdown flips two faces in turn instead of building a 3D scene per card, and finished
  CSS animations don't hold their end state, which took the page from about 70 layers to about 20.
- **Adaptive quality** (`src/lib/perfTier.ts`). On a low-powered device (an Android phone with 2 GB of memory or
  less, 4 or fewer cores or Data Saver on, or any device whose frame rate measures poor during the intro or the
  first scroll) the header's and the sign-up ticket's frosted glass becomes a denser tint of the same colour (the
  blur is redrawn every frame while content moves under it, the costliest thing on the GPU here), and wheel
  scrolling is left to the browser. Every animation stays. Add `?perf=low` or `?perf=high` to the address to see
  either tier.
- Static effects (the large soft shadows, the ticket's drop shadow, the owl's feathered mask) measured free while
  scrolling: they're drawn once and reused, so they stay.

## Before launch

1. **Fonts.** The design's body face is **Bunch**, which isn't on Google Fonts. The site currently uses Bricolage
   Grotesque as a stand-in. To switch, put the font files in `src/fonts/` and replace that call in
   `src/app/layout.tsx` with `next/font/local`, keeping the same variable name:

   ```ts
   import localFont from "next/font/local";
   const bunch = localFont({
     src: [
       { path: "../fonts/Bunch-Regular.woff2", weight: "400" },
       { path: "../fonts/Bunch-Bold.woff2", weight: "700" },
     ],
     variable: "--font-bunch",
   });
   ```

2. **Waitlist.** Connected to Brevo; see [Waitlist and email (Brevo)](#waitlist-and-email-brevo) for the settings it
   needs.

3. **Countdown target** is 12 December 2026, 00:00 Lagos time (`EVENT_TIME` in `src/components/Countdown.tsx`).
   Change it there if doors have a set time.

4. **Hosting.** The countdown's clock check uses the `/api/time` route, so deploy somewhere that runs Next.js server
   routes (Vercel does by default). On a purely static host it falls back to the visitor's device clock.

5. Add `metadataBase` in `src/app/layout.tsx` once the domain is known, so social previews use absolute URLs.

## Waitlist and email (Brevo)

The "Notify Me!" form adds people to a Brevo contact list and sends them a branded confirmation email. Everything
after that (ticket drops, lineup news, reminders) is sent from Brevo, with no change to the site.

**How a sign-up works**

1. The form (`src/components/Waitlist.tsx`) checks the name, email and consent box in the browser, then posts them to
   `/api/waitlist`.
2. The route (`src/app/api/waitlist/route.ts`) runs on Vercel's servers. It checks everything again and then
   (`src/lib/brevo.ts`):
   - **New address:** creates the contact (`FIRSTNAME`, `LASTNAME`) in the waitlist list and sends the confirmation.
   - **Already in the list:** changes nothing and sends nothing; the visitor sees "Still on the list".
   - **Known to Brevo but not in the list:** adds them to the list (filling in a missing name) and sends the
     confirmation.
   - **Unsubscribed** (blocklisted, or unsubscribed from this list): changes nothing. Brevo's suppression stands, and
     the visitor is told to email the sender address if they want updates again.
3. The confirmation (`src/lib/waitlistEmail.ts`, images in `public/email/`) comes from `BREVO_SENDER_EMAIL`, with
   replies going to the same address. If it fails to send, the person is still on the list. It opens with the hero's
   logo and owl, then the same green ticket as the site's success dialog (their name, date, city, a CONFIRMED stamp),
   what to expect next, the days left to 12.12.26 in the countdown's flip tiles, and a save-the-date link (Google
   Calendar, or `/the-lagos-life.ics` for Apple and Outlook).

   It stays dark in every email app, dark mode included. Apps like Gmail on iPhone flip an email's colours in dark
   mode but leave images alone, so everything coloured is an image: the ticket is drawn per guest by
   `/api/ticket` (`src/app/api/ticket/route.tsx`), with their name, and the rest are files in `public/email/`.
   Backgrounds are painted so they aren't flipped, and the white and grey text is wrapped so a flip cancels out
   (details at the top of `src/lib/waitlistEmail.ts`). Ticket links are signed, so the route only draws names that
   came from the waitlist.

The API key is read only on the server (`server-only`); it never reaches the browser.

**Spam and abuse protection:** requests must come from the site itself (Origin check) and be small JSON. A hidden
honeypot field, and forms filled in faster than a person could, are silently dropped. Each IP gets 6 tries per
10 minutes. That limit is per server instance; for a hard limit across all instances, turn on Vercel's Firewall or
BotID for `/api/waitlist`. Names can't contain links or markup, because they appear in the email.

**Consent:** the form needs an unticked-by-default box: "Email me ticket drops, lineup news and event updates from
NOCTVRNA. Unsubscribe anytime." (`CONSENT_TEXT` in `src/lib/waitlist.ts`). Only people who tick it are added.

**Settings** (Vercel → Project → Settings → Environment Variables; names in `.env.example`):

| Variable | What it is |
| --- | --- |
| `BREVO_API_KEY` | A Brevo API key with access to **Contacts** and **Transactional emails** (SMTP & API → API keys) |
| `BREVO_LIST_ID` | The numeric ID of the waitlist list (Contacts → Lists) |
| `BREVO_SENDER_EMAIL` | A sender on `thisisnoctvrna.com` that Brevo has verified, with the domain authenticated (DKIM, SPF, DMARC) |
| `BREVO_SENDER_NAME` | Who the email is from, e.g. NOCTVRNA |
| `SITE_URL` | Optional. The site address used in the email. Defaults to `https://www.thisisnoctvrna.com` |
| `TICKET_IMAGE_SECRET` | Optional. Signs the ticket image links. Without it they're signed with a key derived from `BREVO_API_KEY`, so replacing that key breaks the ticket image in emails already sent; set this to any long random string to avoid that |

After changing a variable in Vercel, redeploy so the site picks it up. If any variable is missing, the form shows
"Sign-ups are paused for a moment" and the Vercel function log names what's missing.

**Sending campaigns from Brevo:** everyone who joins is in the waitlist list (Contacts → Lists). To announce tickets,
the lineup or reminders, create a campaign (Campaigns → Email), choose the waitlist list as recipients and send or
schedule it. Brevo adds the unsubscribe link and leaves out anyone who has unsubscribed, bounced or been blocklisted.
Use `{{ contact.FIRSTNAME }}` in a campaign to greet people by name. For a series (for example, reminders before the
night), Brevo Automations can start when a contact is added to the list.

## Assets

`public/email/` holds the confirmation email's images (PNG and JPG, since email apps don't show WebP or SVG). They're
made by `node scripts/email-assets.mjs` with `npm run dev` running: the event flyer (`flyer.jpg`, from
`public/images/flyer.jpg` with its edges faded into the email's background), and, from the site itself, the step numbers, the Save the date button, the tagline, the flip tiles `digit-0.png` to `digit-9.png`, and the badge,
stamp and stub that `/api/ticket` puts on each guest's ticket. `logo.png`, `owl.jpg`, `grain.png`, `poster.jpg` and `lagos-life.png`
are from earlier versions of the email; emails already sent still link to them, so keep them. The ticket's fonts (Anton and Bricolage
Grotesque, both under the SIL Open Font License) are in `assets/fonts/`.

Everything in `public/images` except the photos was exported from the Figma file: hero background, logo, owl badge,
strip owl, poster (no longer shown), and the six flip-card shapes (`flip-1.svg` to `flip-6.svg`). The event flyer,
`flyer.jpg`, is the flyer as supplied; it's in the city section, and `flyer-share.jpg` is a lighter copy for link
previews (`openGraph` in `src/app/layout.tsx`).

Photos: `exp-sound.jpg`, `exp-people.jpg`, `exp-atmosphere.jpg` (Experience stage), `value-originality.jpg` (the
bridge poster with its title, logo and carousel marks retouched out), `value-freedom.jpg` (app icons cropped off) and
`value-curation.jpg`. A value without a `photo` in `VALUES` (`src/components/Values.tsx`) falls back to a colour flood.

The photos were upscaled 2 to 4 times with Real-ESRGAN (`realesr-general-x4v3`), then blended with a share of the
original so grain and skin stay natural. `scripts/upscale.py` runs the model without PyTorch (ONNX Runtime), so new
photos can go through the same step:

```bash
pip install onnx onnxruntime pillow
curl -LO https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.5.0/realesr-general-x4v3.pth
python3 scripts/upscale.py realesr-general-x4v3.pth srvgg.onnx input.jpg public/images/output.jpg 2560
```

The photos are served at quality 85 (`images.qualities` in `next.config.ts`); everything else uses the default 75.
