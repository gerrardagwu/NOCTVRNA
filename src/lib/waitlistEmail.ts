import "server-only";
import { EVENT_TIME } from "@/lib/event";
import { ticketImageUrl } from "@/lib/ticketImage";

/**
 * The waitlist confirmation email: the event flyer up top, the guest's green ticket, what to expect next,
 * and a countdown with a save-the-date link. Dark in every email app, including ones in dark mode.
 *
 * Why it's built the way it is: dark-mode email apps repaint an email's colours. Gmail on iPhone flips all
 * of them, turning a dark email light; images are left alone. So:
 *  - Everything coloured is an image: the flyer, the ticket (drawn per guest by /api/ticket), the step
 *    numbers, the countdown tiles, the button and the tagline (public/email/, made by
 *    scripts/email-assets.mjs).
 *  - Dark backgrounds are also painted as a one-colour gradient, which counts as an image, so they stay dark.
 *  - Live text is white or grey, wrapped in two blend layers (`keep`) that cancel Gmail's flip: in an app
 *    that flips colours they flip the text back; anywhere else they change nothing.
 * Table layout and inline styles throughout, one 600px column that narrows on phones. Names, dates and
 * every line of copy stay live text (the flyer's own words are in its alt text), so the email still reads
 * with images off.
 */

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

// Low-saturation text colours: a flip-and-flip-back keeps greys grey, where a strong tint could drift.
const C = {
  bg: "#050406",
  ink: "#f3f1ea",
  soft: "#b9b6bd",
  mute: "#8a888d",
  rule: "#1d1824",
};
const DISPLAY = "Anton, 'HelveticaNeue-CondensedBlack', 'Helvetica Neue Condensed Black', Impact, 'Roboto Condensed', sans-serif-condensed, 'Arial Narrow', sans-serif";
const BODY = "'Bricolage Grotesque', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONTS = "https://fonts.googleapis.com/css2?family=Anton&family=Bricolage+Grotesque:wght@400;600;700;800&display=swap";

/** A background that dark-mode apps leave alone: the colour, plus the same colour as a gradient "image". */
const solid = (c: string) => `background-color:${c};background-image:linear-gradient(${c},${c});`;

/** Wraps live text so a colour-flipping app shows it as written (screen + difference cancel the flip). */
const keep = (html: string) =>
  `<div style="background-color:${C.bg};mix-blend-mode:screen;"><div style="background-color:${C.bg};mix-blend-mode:difference;">${html}</div></div>`;

/** A 1px divider that stays dark-on-dark (a border colour would be flipped). */
const rule = () => `<tr><td style="padding:0;"><div style="height:1px;line-height:1px;font-size:0;${solid(C.rule)}">&nbsp;</div></td></tr>`;

const DAY_MS = 86_400_000;
const LAGOS_OFFSET_MS = 60 * 60 * 1000; // WAT, UTC+1

/** Whole days left until the night, the same count as the hero's countdown shows. */
function daysToGo(now: number) {
  return Math.floor((EVENT_TIME - now) / DAY_MS);
}

/** Google Calendar "add event" link: an all-day event on the Lagos date, set times aren't out yet. */
function googleCalendarUrl(site: string) {
  const day = (add: number) => new Date(EVENT_TIME + LAGOS_OFFSET_MS + add * DAY_MS).toISOString().slice(0, 10).replaceAll("-", "");
  const q = new URLSearchParams({
    action: "TEMPLATE",
    text: "NOCTVRNA: The Lagos Life",
    dates: `${day(0)}/${day(1)}`,
    location: "Lagos, Nigeria",
    details: `Our day begins after dark. Tickets drop to the waitlist first: ${site}`,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

export function confirmationEmail({
  firstName,
  siteUrl,
  senderEmail,
  now = Date.now(),
}: {
  firstName: string;
  siteUrl: string;
  senderEmail: string;
  now?: number;
}) {
  const name = esc(firstName);
  const site = siteUrl.replace(/\/$/, "");
  const domain = site.replace(/^https?:\/\/(www\.)?/, "");
  const img = (file: string) => `${site}/email/${file}`;
  const subject = `You're on the list, ${firstName}`;
  const days = daysToGo(now);
  const gcal = googleCalendarUrl(site);
  const ics = `${site}/the-lagos-life.ics`;
  const sender = esc(senderEmail);
  const ticket = ticketImageUrl(site, firstName);

  const steps = [
    ["Tickets drop", "You hear first, with the link to buy."],
    ["The lineup", "DJs and artists, announced here as they're confirmed."],
    ["The night", "Reminders and everything you need for 12.12."],
  ];

  const text = [
    `You're on the list, ${firstName}.`,
    "",
    `Welcome to NOCTVRNA, ${firstName}. Your email is on the waitlist for The Lagos Life, 12.12.26, Lagos. Ticket links land in this inbox first.`,
    "",
    "WHAT HAPPENS NEXT",
    ...steps.map(([title, body], i) => `0${i + 1}  ${title}: ${body}`),
    "",
    ...(days > 0 ? [`${days} ${days === 1 ? "day" : "days"} to go.`] : []),
    `Save the date (Google Calendar): ${gcal}`,
    `Apple or Outlook calendar: ${ics}`,
    "",
    `Don't miss the drop: add ${senderEmail} to your contacts so ticket emails land in your inbox, not spam.`,
    "",
    "NOCTVRNA: The Lagos Life. Our day begins after dark.",
    site,
    "",
    `You're getting this because you joined the waitlist at ${domain}. Every update we send has an unsubscribe link. Didn't sign up? Reply to this email and we'll take you off the list.`,
  ].join("\n");

  const p = (style: string, html: string) => `<p style="margin:0;font-family:${BODY};${style}">${html}</p>`;

  const ticketRow = `
        <tr>
          <td class="px" align="center" style="padding:40px 32px 0;">
            <img src="${esc(ticket)}" width="536" alt="You're on the list, ${name}. NOCTVRNA: The Lagos Life, 12.12.26, Lagos. Confirmed." style="display:block;width:100%;max-width:536px;height:auto;border:0;font-family:${DISPLAY};font-size:28px;line-height:36px;color:${C.ink};">
          </td>
        </tr>`;

  const countdown =
    days > 0
      ? `
        <tr>
          <td align="center" style="padding:0 24px;">
            ${keep(p(`font-size:18px;line-height:24px;font-weight:600;letter-spacing:-0.3px;text-align:center;color:${C.ink};`, "Countdown to 12.12.26"))}
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:14px auto 0;">
              <tr>
                ${[...String(days)]
                  .map(
                    (d) =>
                      `<td style="padding:0 3px;"><img src="${img(`digit-${d}.png`)}" width="60" height="70" alt="${d}" style="display:block;width:60px;height:70px;border:0;font-family:${DISPLAY};font-size:40px;line-height:70px;text-align:center;color:${C.ink};"></td>`,
                  )
                  .join("")}
              </tr>
            </table>
            <div style="padding-top:8px;">${keep(p(`font-size:14px;line-height:20px;text-align:center;color:${C.ink};`, `${days === 1 ? "Day" : "Days"} to go`))}</div>
          </td>
        </tr>`
      : "";

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" style="${solid(C.bg)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(subject)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<link href="${FONTS}" rel="stylesheet">
<style>
  :root { color-scheme: dark; supported-color-schemes: dark; }
  body { margin: 0; padding: 0; background: ${C.bg}; -webkit-text-size-adjust: 100%; }
  img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  table { mso-table-lspace: 0; mso-table-rspace: 0; }
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
  @media (max-width: 620px) {
    .px { padding-left: 20px !important; padding-right: 20px !important; }
  }
</style>
</head>
<body class="body" style="margin:0;padding:0;${solid(C.bg)}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;color:${C.bg};">Your spot on the NOCTVRNA waitlist is saved. Ticket links land here first.&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="${solid(C.bg)}">
  <tr>
    <td align="center" bgcolor="${C.bg}" style="padding:0;${solid(C.bg)}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

        <!-- The event flyer. Its own words (date, venue, reservations) are in the alt text for images-off. -->
        <tr>
          <td align="center" style="padding:12px 0 0;">
            <a href="${site}" style="text-decoration:none;"><img src="${img("flyer.jpg")}" width="600" alt="NOCTVRNA: The Lagos Life. Our day begins after dark. Date: Dec 12th. Venue: Loud Lagos. For table reservations: 0816 866 9798." style="display:block;width:100%;max-width:600px;height:auto;border:0;font-family:${DISPLAY};font-size:28px;line-height:40px;text-align:center;color:${C.ink};"></a>
          </td>
        </tr>

        <!-- The guest's ticket -->
        ${ticketRow}

        <!-- Welcome and what's next -->
        <tr>
          <td class="px" style="padding:40px 48px 0;">
            ${keep(p(`font-size:17px;line-height:26px;color:${C.ink};`, `<strong style="font-weight:700;color:${C.ink};">Welcome to NOCTVRNA, ${name}.</strong> Your email is on the waitlist for The Lagos Life, and we'll keep you close from here to the night.`))}
            <div style="padding-top:32px;">${keep(p(`font-size:12px;line-height:16px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:${C.ink};`, "What happens next"))}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
              ${steps
                .map(
                  ([title, body], i) => `${rule()}
              <tr>
                <td style="padding:0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="58" valign="top" style="width:58px;padding:16px 0;"><img src="${img(`step-${i + 1}.png`)}" width="48" height="32" alt="0${i + 1}" style="display:block;width:48px;height:32px;border:0;font-family:${DISPLAY};font-size:24px;line-height:32px;color:${C.ink};"></td>
                      <td valign="top" style="padding:16px 0;">
                        ${keep(`${p(`font-family:${DISPLAY};font-size:20px;line-height:24px;letter-spacing:0.4px;text-transform:uppercase;color:${C.ink};`, title)}${p(`margin-top:4px;font-size:15px;line-height:22px;color:${C.soft};`, body)}`)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`,
                )
                .join("")}
            </table>
          </td>
        </tr>

        <!-- Countdown and save the date -->
        <tr><td style="height:48px;line-height:48px;font-size:0;">&nbsp;</td></tr>
        ${countdown}
        <tr>
          <td align="center" style="padding:${days > 0 ? 26 : 0}px 24px 0;">
            <a href="${gcal}" style="display:inline-block;text-decoration:none;"><img src="${img("save-the-date.png")}" width="200" height="52" alt="Save the date" style="display:block;width:200px;height:52px;border:0;font-family:${DISPLAY};font-size:18px;line-height:52px;letter-spacing:1.4px;text-align:center;color:${C.ink};"></a>
            <div style="padding-top:14px;">${keep(p(`font-size:13px;line-height:19px;text-align:center;color:${C.soft};`, `On Apple or Outlook? <a href="${ics}" style="color:${C.ink};text-decoration:underline;">Add it to your calendar</a>.`))}</div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="px" style="padding:52px 48px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="padding-bottom:28px;">
                  ${keep(p(`font-size:14px;line-height:21px;color:${C.soft};`, `<strong style="font-weight:700;color:${C.ink};">Don't miss the drop.</strong> Add <a href="mailto:${sender}" style="color:${C.ink};text-decoration:underline;">${sender}</a> to your contacts so ticket emails land in your inbox, not spam.`))}
                </td>
              </tr>
              ${rule()}
              <tr>
                <td style="padding-top:22px;">
                  <img src="${img("tagline.png")}" width="320" height="20" alt="Beyond the ordinary. Into the night." style="display:block;width:320px;max-width:100%;height:auto;border:0;font-family:${DISPLAY};font-size:14px;line-height:20px;letter-spacing:2px;color:${C.ink};">
                </td>
              </tr>
              <tr>
                <td style="padding-top:10px;">
                  ${keep(`${p(`font-size:12px;line-height:19px;color:${C.mute};`, `You're getting this because you joined the waitlist at <a href="${site}" style="color:${C.mute};text-decoration:underline;">${esc(domain)}</a>. Every update we send has an unsubscribe link. Didn't sign up? Reply to this email and we'll take you off the list.`)}${p(`margin-top:10px;font-size:12px;line-height:19px;color:${C.mute};`, "&copy; 2026 NOCTVRNA. Lagos, Nigeria.")}`)}
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;

  return { subject, html, text };
}
