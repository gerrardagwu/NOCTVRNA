import "server-only";

/**
 * The waitlist confirmation email. Table layout and inline styles so it holds up in Gmail, Outlook and
 * Apple Mail; one column that narrows on phones. Images are served from the live site (public/email/).
 */

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const C = {
  bg: "#050406",
  panel: "#0c0910",
  ink: "#f5f1e5",
  soft: "#bdb6c9",
  mute: "#77736d",
  brand: "#c38bef",
  deep: "#340857",
  green: "#55ff00",
  night: "#0a0a06",
};
const DISPLAY = "'Anton', Impact, 'Arial Narrow Bold', 'Helvetica Neue', Arial, sans-serif";
const BODY = "'DM Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif";

export function confirmationEmail({ firstName, siteUrl }: { firstName: string; siteUrl: string }) {
  const name = esc(firstName);
  const site = siteUrl.replace(/\/$/, "");
  const domain = site.replace(/^https?:\/\//, "");
  const subject = `You're on the list, ${firstName}`;

  const text = [
    `You're on the list, ${firstName}.`,
    "",
    "Welcome to NOCTVRNA. Your email has been added to the waitlist for The Lagos Life, 12.12.26.",
    "",
    "When tickets drop, you'll be the first to know. We'll also send the lineup as it's announced, ticket links and everything you need for the night.",
    "",
    "NOCTVRNA: The Lagos Life",
    "12.12.26, Lagos",
    "",
    site,
    "",
    `You're getting this because you joined the waitlist at ${domain}. Every update we send has an unsubscribe link. Didn't sign up? Reply to this email and we'll take you off the list.`,
  ].join("\n");

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${esc(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  body { margin: 0; padding: 0; background: ${C.bg}; }
  a { color: ${C.brand}; }
  @media (max-width: 620px) {
    .wrap { padding: 0 !important; }
    .pad { padding-left: 24px !important; padding-right: 24px !important; }
    .h1 { font-size: 40px !important; line-height: 44px !important; }
    .lead { font-size: 17px !important; }
    .stub { display: none !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.bg};">You're on the NOCTVRNA waitlist. Ticket news lands here first.&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.bg};">
  <tr>
    <td class="wrap" align="center" style="padding:32px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${C.bg};">
        <tr>
          <td align="center" style="padding:24px 24px 0;">
            <a href="${site}" style="text-decoration:none;"><img src="${site}/email/logo.png" width="280" alt="NOCTVRNA" style="display:block;width:280px;max-width:80%;height:auto;border:0;color:${C.brand};font-family:${DISPLAY};font-size:40px;"></a>
          </td>
        </tr>
        <tr>
          <td style="padding:0;">
            <img src="${site}/email/owl.jpg" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;">
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:8px 48px 0;font-family:${BODY};">
            <h1 class="h1" style="margin:0;font-family:${DISPLAY};font-weight:400;font-size:52px;line-height:56px;letter-spacing:-0.5px;text-transform:uppercase;color:${C.ink};">You're on the list, <span style="color:${C.brand};">${name}</span>.</h1>
            <p class="lead" style="margin:20px 0 0;font-size:19px;line-height:28px;color:${C.ink};">Welcome to NOCTVRNA. Your email has been added to the waitlist for <strong style="color:${C.ink};">The Lagos Life, 12.12.26</strong>.</p>
            <p style="margin:14px 0 0;font-size:16px;line-height:25px;color:${C.soft};">When tickets drop, you'll be the first to know. We'll also send the lineup as it's announced, ticket links and everything you need for the night.</p>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:32px 48px 0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.green};border-radius:12px;">
              <tr>
                <td style="padding:20px 24px;font-family:${BODY};color:${C.night};">
                  <div style="font-family:${DISPLAY};font-size:15px;letter-spacing:2px;text-transform:uppercase;">NOCTVRNA &middot; The Lagos Life</div>
                  <div style="margin-top:8px;font-family:${DISPLAY};font-size:30px;line-height:34px;text-transform:uppercase;">Guest: <span style="color:${C.deep};">${name}</span></div>
                  <div style="margin-top:10px;font-size:13px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;opacity:0.75;">12.12.26 &middot; Lagos &middot; On the list</div>
                </td>
                <td class="stub" width="110" align="center" style="width:110px;padding:20px 12px;border-left:2px dashed rgba(10,10,6,0.45);font-family:${DISPLAY};font-size:20px;line-height:24px;letter-spacing:2px;text-transform:uppercase;color:${C.night};">Admit<br>one</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad" align="left" style="padding:32px 48px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="border-radius:999px;background:${C.brand};">
                  <a href="${site}" style="display:inline-block;padding:15px 28px;font-family:${BODY};font-size:15px;font-weight:700;letter-spacing:1px;text-transform:uppercase;text-decoration:none;color:${C.deep};border-radius:999px;">Visit ${esc(domain)}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:40px 48px 8px;font-family:${BODY};">
            <div style="height:1px;line-height:1px;background:#1d1824;">&nbsp;</div>
            <p style="margin:20px 0 0;font-family:${DISPLAY};font-size:14px;letter-spacing:2px;text-transform:uppercase;color:${C.brand};">Beyond the ordinary. Into the night.</p>
            <p style="margin:12px 0 0;font-size:12px;line-height:19px;color:${C.mute};">You're getting this because you joined the waitlist at <a href="${site}" style="color:${C.mute};">${esc(domain)}</a>. Every update we send has an unsubscribe link. Didn't sign up? Reply to this email and we'll take you off the list.</p>
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
