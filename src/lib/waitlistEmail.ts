import "server-only";
import { EVENT_TIME } from "@/lib/event";

/**
 * The waitlist confirmation email: the site's poster up top, then the same green "on the list" ticket the
 * guest just saw on the site, what to expect next, and a countdown with a save-the-date link.
 *
 * Built for email apps, not browsers: table layout, inline styles, one 600px column that narrows on phones.
 * Anything a reader needs is live text, so it still reads with images off; images (public/email/, made by
 * scripts/email-assets.mjs) only carry what email CSS can't draw: the poster, stamp, stub, grain and the
 * countdown's flip tiles. Fonts: Anton and Bricolage Grotesque where the app loads web fonts (Apple Mail,
 * iOS), close system faces elsewhere (Gmail).
 */

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const C = {
  bg: "#050406",
  ink: "#f5f1e5",
  soft: "#bdb6c9",
  mute: "#8b8693",
  rule: "#1d1824",
  brand: "#c38bef",
  deep: "#340857",
  green: "#55ff00",
  // Ticket ink (#0a0a06) and its tints over the green, as solid colours: email apps don't all do opacity.
  tInk: "#0a0a06",
  tInk70: "#215404",
  tInk60: "#286c04",
  tInk55: "#2c7803",
  tInk35: "#3aa902",
};
const DISPLAY = "Anton, 'HelveticaNeue-CondensedBlack', 'Helvetica Neue Condensed Black', Impact, 'Roboto Condensed', sans-serif-condensed, 'Arial Narrow', sans-serif";
const BODY = "'Bricolage Grotesque', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const FONTS = "https://fonts.googleapis.com/css2?family=Anton&family=Bricolage+Grotesque:wght@400;600;700;800&display=swap";

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

  const steps = [
    ["01", "Tickets drop", "You hear first, with the link to buy."],
    ["02", "The lineup", "DJs and artists, announced here as they're confirmed."],
    ["03", "The night", "Reminders and everything you need for 12.12."],
  ];

  const text = [
    `You're on the list, ${firstName}.`,
    "",
    "Welcome to NOCTVRNA. Your email is on the waitlist for The Lagos Life, 12.12.26, Lagos. Ticket links land in this inbox first.",
    "",
    "WHAT HAPPENS NEXT",
    ...steps.map(([n, title, body]) => `${n}  ${title}: ${body}`),
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

  const countdown =
    days > 0
      ? `
        <tr>
          <td align="center" style="padding:0 24px;">
            <p style="margin:0;font-family:${BODY};font-size:18px;line-height:24px;font-weight:600;letter-spacing:-0.3px;color:${C.ink};">Countdown to 12.12.26</p>
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:14px auto 0;">
              <tr>
                ${[...String(days)]
                  .map(
                    (d) =>
                      `<td style="padding:0 3px;"><img src="${img(`digit-${d}.png`)}" width="60" height="70" alt="${d}" style="display:block;width:60px;height:70px;border:0;font-family:${DISPLAY};font-size:40px;line-height:70px;text-align:center;color:${C.brand};"></td>`,
                  )
                  .join("")}
              </tr>
            </table>
            <p style="margin:8px 0 0;font-family:${BODY};font-size:14px;line-height:20px;color:${C.ink};">${days === 1 ? "Day" : "Days"} to go</p>
          </td>
        </tr>`
      : "";

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
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
  body { margin: 0; padding: 0; background: ${C.bg}; -webkit-text-size-adjust: 100%; }
  img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
  table { mso-table-lspace: 0; mso-table-rspace: 0; }
  a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; }
  @media (max-width: 620px) {
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .tmain { padding: 22px 18px 20px 20px !important; }
    .ttitle { font-size: 36px !important; line-height: 36px !important; }
    .tstub { width: 56px !important; }
    .tstub img { width: 40px !important; height: 156px !important; }
    .tfacts td.tstamp { display: block !important; width: 100% !important; text-align: left !important; padding-top: 4px !important; }
    .tstamp img { width: 124px !important; height: 68px !important; }
    .cap { font-size: 30px !important; line-height: 34px !important; }
  }
</style>
</head>
<body class="body" style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;color:${C.bg};">Your spot on the NOCTVRNA waitlist is saved. Ticket links land here first.&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.bg}" style="background:${C.bg};">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

        <!-- The poster: logo over the owl, as on the site -->
        <tr>
          <td align="center" style="padding:12px 0 0;">
            <a href="${site}" style="text-decoration:none;"><img src="${img("poster.jpg")}" width="600" alt="NOCTVRNA" style="display:block;width:100%;max-width:600px;height:auto;border:0;font-family:${DISPLAY};font-size:56px;line-height:80px;text-align:center;color:${C.brand};"></a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 24px;">
            <p class="cap" style="margin:0;font-family:${DISPLAY};font-weight:400;font-size:34px;line-height:38px;text-transform:uppercase;color:${C.green};">The Lagos Life</p>
            <p style="margin:6px 0 0;font-family:${BODY};font-size:14px;line-height:20px;letter-spacing:1.6px;text-transform:uppercase;color:${C.ink};">Our day begins after dark</p>
          </td>
        </tr>

        <!-- The ticket -->
        <tr>
          <td class="px" style="padding:44px 32px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;border-radius:16px;">
              <tr>
                <td class="tmain" valign="top" bgcolor="${C.green}" style="padding:26px 28px 24px 30px;background-color:${C.green};background-image:url('${img("grain.png")}');border-radius:16px 0 0 16px;font-family:${BODY};color:${C.tInk};">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="48" valign="middle" style="width:48px;"><img src="${img("badge.png")}" width="48" height="48" alt="" style="display:block;width:48px;height:48px;border:0;"></td>
                      <td valign="middle" style="padding-left:12px;">
                        <p style="margin:0;font-family:${DISPLAY};font-size:18px;line-height:18px;letter-spacing:1.4px;color:${C.tInk};">NOCTVRNA</p>
                        <p style="margin:4px 0 0;font-family:${BODY};font-size:11px;line-height:13px;font-weight:700;letter-spacing:1.6px;text-transform:uppercase;color:${C.tInk70};">The Lagos Life</p>
                      </td>
                    </tr>
                  </table>
                  <h1 class="ttitle" style="margin:22px 0 0;font-family:${DISPLAY};font-weight:400;font-size:48px;line-height:46px;letter-spacing:-0.3px;text-transform:uppercase;color:${C.tInk};word-break:break-word;">You're on the list, <span style="color:${C.deep};">${name}</span>.</h1>
                  <p style="margin:14px 0 0;font-family:${BODY};font-size:17px;line-height:23px;font-weight:600;letter-spacing:-0.3px;color:${C.tInk};">Ticket links land in this inbox first.</p>
                  <table class="tfacts" role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;border-top:2px dashed ${C.tInk35};">
                    <tr>
                      <td valign="bottom" style="padding-top:14px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td valign="top" style="padding-right:28px;">
                              <p style="margin:0;font-family:${BODY};font-size:10px;line-height:12px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:${C.tInk60};">Date</p>
                              <p style="margin:3px 0 0;font-family:${DISPLAY};font-size:20px;line-height:24px;letter-spacing:0.4px;color:${C.tInk};">12.12.26</p>
                            </td>
                            <td valign="top">
                              <p style="margin:0;font-family:${BODY};font-size:10px;line-height:12px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:${C.tInk60};">City</p>
                              <p style="margin:3px 0 0;font-family:${DISPLAY};font-size:20px;line-height:24px;letter-spacing:0.4px;color:${C.tInk};">Lagos</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                      <td class="tstamp" align="right" valign="bottom" style="padding-top:8px;">
                        <img src="${img("stamp.png")}" width="146" height="80" alt="Confirmed" style="display:inline-block;width:146px;height:80px;border:0;font-family:${DISPLAY};font-size:18px;letter-spacing:1.4px;color:${C.deep};">
                      </td>
                    </tr>
                  </table>
                </td>
                <td class="tstub" width="80" align="center" valign="middle" bgcolor="${C.green}" style="width:80px;padding:18px 0;background-color:${C.green};background-image:url('${img("grain.png")}');border-left:2px dashed ${C.tInk55};border-radius:0 16px 16px 0;">
                  <img src="${img("stub.png")}" width="52" height="203" alt="Admit one" style="display:block;margin:0 auto;width:52px;height:203px;border:0;font-family:${DISPLAY};font-size:14px;letter-spacing:1.4px;color:${C.tInk};">
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Welcome and what's next -->
        <tr>
          <td class="px" style="padding:40px 48px 0;font-family:${BODY};">
            <p style="margin:0;font-size:17px;line-height:26px;color:${C.ink};">Welcome to NOCTVRNA. Your email is on the waitlist for <strong style="font-weight:700;color:${C.ink};">The Lagos Life</strong>, and we'll keep you close from here to the night.</p>
            <p style="margin:32px 0 0;font-size:12px;line-height:16px;font-weight:700;letter-spacing:2.4px;text-transform:uppercase;color:${C.brand};">What happens next</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:12px;">
              ${steps
                .map(
                  ([n, title, body]) => `<tr>
                <td width="58" valign="top" style="width:58px;padding:16px 0;border-top:1px solid ${C.rule};font-family:${DISPLAY};font-size:28px;line-height:28px;color:${C.green};">${n}</td>
                <td valign="top" style="padding:16px 0;border-top:1px solid ${C.rule};">
                  <p style="margin:0;font-family:${DISPLAY};font-size:20px;line-height:24px;letter-spacing:0.4px;text-transform:uppercase;color:${C.ink};">${title}</p>
                  <p style="margin:4px 0 0;font-family:${BODY};font-size:15px;line-height:22px;color:${C.soft};">${body}</p>
                </td>
              </tr>`,
                )
                .join("\n              ")}
            </table>
          </td>
        </tr>

        <!-- Countdown and save the date -->
        <tr><td style="height:48px;line-height:48px;font-size:0;">&nbsp;</td></tr>
        ${countdown}
        <tr>
          <td align="center" style="padding:${days > 0 ? 26 : 0}px 24px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto;">
              <tr>
                <td bgcolor="${C.green}" style="border-radius:6px;background:${C.green};">
                  <a href="${gcal}" style="display:inline-block;padding:16px 30px;font-family:${DISPLAY};font-size:18px;line-height:20px;letter-spacing:1.4px;text-transform:uppercase;text-decoration:none;color:${C.tInk};border-radius:6px;">Save the date</a>
                </td>
              </tr>
            </table>
            <p style="margin:14px 0 0;font-family:${BODY};font-size:13px;line-height:19px;color:${C.soft};">On Apple or Outlook? <a href="${ics}" style="color:${C.brand};text-decoration:underline;">Add it to your calendar</a>.</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td class="px" style="padding:52px 48px 40px;font-family:${BODY};">
            <p style="margin:0;font-size:14px;line-height:21px;color:${C.soft};"><strong style="font-weight:700;color:${C.ink};">Don't miss the drop.</strong> Add <a href="mailto:${sender}" style="color:${C.brand};text-decoration:none;">${sender}</a> to your contacts so ticket emails land in your inbox, not spam.</p>
            <div style="margin-top:28px;height:1px;line-height:1px;font-size:0;background:${C.rule};">&nbsp;</div>
            <p style="margin:22px 0 0;font-family:${DISPLAY};font-size:14px;line-height:18px;letter-spacing:2px;text-transform:uppercase;color:${C.brand};">Beyond the ordinary. Into the night.</p>
            <p style="margin:10px 0 0;font-size:12px;line-height:19px;color:${C.mute};">You're getting this because you joined the waitlist at <a href="${site}" style="color:${C.mute};text-decoration:underline;">${esc(domain)}</a>. Every update we send has an unsubscribe link. Didn't sign up? Reply to this email and we'll take you off the list.</p>
            <p style="margin:10px 0 0;font-size:12px;line-height:19px;color:${C.mute};">&copy; 2026 NOCTVRNA. Lagos, Nigeria.</p>
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
