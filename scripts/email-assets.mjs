/**
 * Builds the images the waitlist confirmation email uses (public/email/), from the site itself so they
 * match it exactly. Email apps can't run the site's CSS, and dark-mode apps (Gmail on iPhone above all)
 * repaint an email's colours but leave images alone. So everything coloured is an image, and the live
 * text is white or grey, which survives the repaint (see src/lib/waitlistEmail.ts).
 *
 *   flyer.jpg         the event flyer, its edges faded into the email background
 *   step-1..3.png     the green 01, 02, 03 of "What happens next"
 *   save-the-date.png the green button
 *   tagline.png       BEYOND THE ORDINARY. INTO THE NIGHT.
 *   digit-0..9.png    the countdown's flip tiles, one per digit, for the "days to go" count
 *   badge.png, stamp.png, stub.png  pieces of the guest's ticket, drawn per guest by /api/ticket
 *
 * usage: start the site (npm run dev), then: node scripts/email-assets.mjs [http://localhost:3000]
 * Emails already sent link to earlier images in the same folder (logo.png, owl.jpg, grain.png, poster.jpg,
 * lagos-life.png), so keep those files.
 */
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const sharp = require("sharp");

const base = process.argv[2] || "http://localhost:3000";
const out = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public", "email");
const BG = "#050406";

const browser = await chromium.launch();

/* ---------- flyer: the event flyer (public/images/flyer.jpg), its edges melted into the background ---------- */
{
  const W = 1200; // shown 600 wide: sharp on 2x screens
  const H = 1500;
  // Fade the edges into the email's background (the city photo along the bottom is lighter than it), clear of
  // the reservations line, which ends about 88% of the way down.
  const fade = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0.9" stop-color="${BG}" stop-opacity="0"/><stop offset="1" stop-color="${BG}"/></linearGradient>
      <linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BG}"/><stop offset="0.02" stop-color="${BG}" stop-opacity="0"/></linearGradient>
      <linearGradient id="s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${BG}"/><stop offset="0.04" stop-color="${BG}" stop-opacity="0"/><stop offset="0.96" stop-color="${BG}" stop-opacity="0"/><stop offset="1" stop-color="${BG}"/></linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#b)"/><rect width="100%" height="100%" fill="url(#t)"/><rect width="100%" height="100%" fill="url(#s)"/>
  </svg>`);
  const faded = await sharp(path.join(out, "..", "images", "flyer.jpg")).resize(W, H).composite([{ input: fade }]).removeAlpha().toBuffer();
  // Nothing darker than the email's background, so the image has no visible edge against it.
  await sharp(faded)
    .composite([{ input: { create: { width: W, height: H, channels: 3, background: BG } }, blend: "lighten" }])
    .jpeg({ quality: 78, mozjpeg: true })
    .toFile(path.join(out, "flyer.jpg"));
}

/* ---------- type: step numbers, the button and the tagline, in the site's Anton ---------- */
{
  const page = await browser.newPage({ viewport: { width: 800, height: 300 }, deviceScaleFactor: 2 });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const draw = async (name, html, opaque = false) => {
    await page.evaluate((html) => {
      document.documentElement.style.background = "transparent";
      document.body.style.background = "transparent";
      document.body.innerHTML = `<div style="position:fixed;left:0;top:0;z-index:2147483647;display:inline-flex;font-family:var(--font-anton),sans-serif;font-weight:400"><div id="t">${html}</div></div>`;
    }, html);
    await page.waitForTimeout(100);
    const png = await page.locator("#t").screenshot({ omitBackground: !opaque });
    await sharp(png).png({ palette: true, quality: 95, effort: 10 }).toFile(path.join(out, name));
  };
  for (const n of [1, 2, 3]) {
    await draw(`step-${n}.png`, `<div style="width:48px;height:32px;font-size:28px;line-height:32px;color:#55ff00">0${n}</div>`);
  }
  await draw(
    "save-the-date.png",
    `<div style="width:200px;height:52px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:#55ff00;color:#0a0a06;font-size:18px;letter-spacing:.08em">SAVE THE DATE</div>`,
  );
  await draw(
    "tagline.png",
    `<div style="width:320px;height:20px;font-size:14px;line-height:20px;letter-spacing:2px;color:#c38bef;white-space:nowrap">BEYOND THE ORDINARY. INTO THE NIGHT.</div>`,
  );
  await page.close();
}

/* ---------- ticket pieces, drawn with the site's fonts on a transparent page ---------- */
{
  const page = await browser.newPage({ viewport: { width: 600, height: 600 }, deviceScaleFactor: 2 });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    const worn =
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='w'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -3 2.3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23w)'/%3E%3C/svg%3E\")";
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    document.body.innerHTML = `
      <div style="position:fixed;inset:0;background:transparent;z-index:2147483647;font-family:var(--font-anton),sans-serif;color:#0a0a06">
        <div id="stamp" style="position:absolute;left:0;top:0;width:200px;height:110px;display:grid;place-items:center">
          <span id="stamp-in" style="display:block;padding:8px 14px 7px;border:3px solid #340857;border-radius:8px;outline:1.5px solid #340857;outline-offset:3px;font-size:24px;line-height:1;letter-spacing:.08em;color:#340857;rotate:-12deg">CONFIRMED</span>
        </div>
        <div id="stub" style="position:absolute;left:240px;top:0;width:64px;height:250px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:4px 0">
          <span style="writing-mode:vertical-rl;rotate:180deg;font-size:24px;letter-spacing:.14em">ADMIT ONE</span>
          <span style="width:40px;height:52px;opacity:.85;background:repeating-linear-gradient(90deg,#0a0a06 0 2px,transparent 2px 4px,#0a0a06 4px 5px,transparent 5px 8px,#0a0a06 8px 11px,transparent 11px 12px,#0a0a06 12px 13px,transparent 13px 15px)"></span>
          <span style="font-size:14px;letter-spacing:.08em">12.12.26</span>
        </div>
        <div id="badge" style="position:absolute;left:340px;top:0;width:48px;height:48px;padding:2px">
          <img src="/images/owl-badge.png" alt="" style="display:block;width:44px;height:44px;border-radius:50%;box-shadow:0 0 0 2px #0a0a06">
        </div>
      </div>`;
    // Set from script: the mask's data URL is full of quotes an inline style attribute can't hold.
    const stamp = document.getElementById("stamp-in");
    stamp.style.maskImage = worn;
    stamp.style.webkitMaskImage = worn;
  });
  await page.waitForFunction(() => [...document.images].every((i) => i.complete));
  for (const id of ["stamp", "stub", "badge"]) {
    const png = await page.locator(`#${id}`).screenshot({ omitBackground: true });
    await sharp(png).png({ palette: true, quality: 90, effort: 10 }).toFile(path.join(out, `${id}.png`));
  }
  await page.close();
}

/* ---------- flip tiles: the hero countdown's card with each digit ---------- */
{
  const page = await browser.newPage({ viewport: { width: 400, height: 200 }, deviceScaleFactor: 2 });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    document.documentElement.style.background = "transparent";
    document.body.style.background = "transparent";
    document.body.innerHTML = `<div id="tile" style="position:fixed;left:0;top:0;z-index:2147483647;width:60px;height:70px;display:grid;place-items:center;background:url(/images/flip-1.svg) center/100% 100% no-repeat;font-family:var(--font-anton),sans-serif;font-size:40px;line-height:1;letter-spacing:-.05em;color:#c38bef"><span id="d">0</span></div>`;
  });
  await page.waitForTimeout(300);
  for (let d = 0; d <= 9; d++) {
    await page.evaluate((d) => (document.getElementById("d").textContent = String(d)), d);
    const png = await page.locator("#tile").screenshot({ omitBackground: true });
    await sharp(png).png({ palette: true, quality: 90, effort: 10 }).toFile(path.join(out, `digit-${d}.png`));
  }
  await page.close();
}

await browser.close();
console.log("Wrote flyer.jpg, step-1..3.png, save-the-date.png, tagline.png, badge.png, stamp.png, stub.png and digit-0..9.png to public/email/");
