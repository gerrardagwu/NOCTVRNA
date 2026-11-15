/**
 * Builds the images the waitlist confirmation email uses (public/email/), from the site itself so they
 * match it exactly. Email apps can't run the site's CSS (masks, rotation, vertical text, blend modes),
 * so those pieces are baked into images; everything a reader needs to read stays live text in the email.
 *
 *   poster.jpg  the hero's logo over the owl, faded into the email background
 *   badge.png   the round owl badge from the ticket's corner
 *   stamp.png   the worn, tilted CONFIRMED stamp (transparent, sits on the green ticket)
 *   stub.png    the stub: ADMIT ONE, barcode and date (transparent)
 *   grain.png   the ticket's paper grain, tiled behind it
 *   digit-0..9.png  the countdown's flip tiles, one per digit, for the "days to go" count
 *
 * usage: start the site (npm run dev), then: node scripts/email-assets.mjs [http://localhost:3000]
 * Already-sent emails link to logo.png and owl.jpg in the same folder, so keep those files.
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

/* ---------- poster: the hero stage without the header, caption or countdown ---------- */
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 }, deviceScaleFactor: 1.25 });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForTimeout(5000); // the hero's intro animation
  await page.addStyleTag({
    content: `
      [data-bar], [data-cd-tab], [data-ticket], [data-cd-title], [data-cd-wrap], [data-lagos], [data-after],
      [class*="Blink"], nextjs-portal { display: none !important; }
      html, body { background: ${BG} !important; }
      #poster-fade { position: fixed; inset: 0; z-index: 2147483647; pointer-events: none;
        background:
          linear-gradient(to bottom, ${BG} 2%, transparent 9%, transparent 58%, ${BG} 76%),
          linear-gradient(to right, ${BG} 8%, transparent 24%, transparent 76%, ${BG} 92%); }`,
  });
  await page.evaluate(() => {
    const d = document.createElement("div");
    d.id = "poster-fade";
    document.body.append(d);
  });
  await page.waitForTimeout(300);
  // Logo top ≈ 60, owl fading out by ≈ 730 on the 1440×960 stage; the margins leave the logo's spikes room.
  const shot = await page.screenshot({ clip: { x: 130, y: 20, width: 1180, height: 730 } });
  // Nothing darker than the email's background, so the image has no visible edge against it.
  const flat = await sharp(shot).resize(1200).removeAlpha().toBuffer({ resolveWithObject: true });
  await sharp(flat.data)
    .composite([{ input: { create: { width: flat.info.width, height: flat.info.height, channels: 3, background: BG } }, blend: "lighten" }])
    .jpeg({ quality: 80, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(path.join(out, "poster.jpg"));
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

/* ---------- grain: the ticket's noise, as a small tile ---------- */
{
  const page = await browser.newPage({ viewport: { width: 120, height: 120 }, deviceScaleFactor: 1 });
  await page.setContent(
    `<style>html,body{margin:0;background:transparent}</style>
     <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.26 0"/></filter><rect width="100%" height="100%" filter="url(#g)"/></svg>`,
  );
  const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: 120, height: 120 } });
  await sharp(png).png({ palette: true, colours: 16, effort: 10 }).toFile(path.join(out, "grain.png"));
  await page.close();
}

await browser.close();
console.log("Wrote poster.jpg, badge.png, stamp.png, stub.png, grain.png and digit-0..9.png to public/email/");
