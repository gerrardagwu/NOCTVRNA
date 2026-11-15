import { BrevoError, readBrevoConfig, registerContact, sendEmail } from "@/lib/brevo";
import { confirmationEmail } from "@/lib/waitlistEmail";
import {
  cleanEmail,
  cleanName,
  splitName,
  validateConsent,
  validateEmail,
  validateName,
  type FieldErrors,
  type WaitlistResponse,
} from "@/lib/waitlist";

/**
 * POST /api/waitlist: puts a visitor on the Brevo waitlist and sends them a confirmation email.
 * Body (JSON): { name, email, consent: true, company: "" (honeypot), elapsed: ms since the form appeared }.
 * Runs on the server only; the Brevo API key never reaches the browser.
 */

const SITE_URL = process.env.SITE_URL?.trim() || "https://thisisnoctvrna.com";
const MAX_BODY = 2048;
const MIN_FILL_MS = 2500; // a person can't scroll to the form and fill it in faster than this

const MSG = {
  unavailable: "Sign-ups are paused for a moment. Please try again shortly.",
  failed: "We couldn't save your spot just now. Please try again in a minute.",
  busy: "Too many tries from here. Give it a few minutes and try again.",
  forbidden: "This sign-up has to come from the NOCTVRNA site.",
};

const reply = (body: WaitlistResponse, status = 200, headers?: HeadersInit) =>
  Response.json(body, { status, headers: { "cache-control": "no-store", ...headers } });

/* ---------- abuse protection ---------- */

// Per-IP limit. In memory, so it's per server instance (Vercel runs several); it stops a single client
// hammering the form, and the honeypot, timing check and origin check catch scripted traffic.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 6;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string) {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > MAX_PER_WINDOW;
}

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

// Browsers always send Origin on a POST; it has to be this site.
function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/* ---------- handler ---------- */

export async function POST(request: Request) {
  const { config, missing } = readBrevoConfig();
  if (!config) {
    console.error(`[waitlist] Not configured. Missing environment variables: ${missing.join(", ")}`);
    return reply({ status: "error", message: MSG.unavailable }, 503);
  }

  if (!sameOrigin(request)) return reply({ status: "error", message: MSG.forbidden }, 403);
  if (rateLimited(clientIp(request))) return reply({ status: "error", message: MSG.busy }, 429, { "retry-after": "600" });
  if (!request.headers.get("content-type")?.includes("application/json")) return reply({ status: "error", message: MSG.failed }, 415);

  const raw = await request.text();
  if (raw.length > MAX_BODY) return reply({ status: "error", message: MSG.failed }, 413);
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
    if (!body || typeof body !== "object") throw new Error("not an object");
  } catch {
    return reply({ status: "error", message: MSG.failed }, 400);
  }

  const name = typeof body.name === "string" ? body.name : "";
  const email = typeof body.email === "string" ? body.email : "";
  const consent = body.consent === true;

  // Bots: something typed into the hidden field, or the form filled in impossibly fast. Answer as if it
  // worked so they move on, and touch nothing.
  const company = typeof body.company === "string" ? body.company : "";
  const elapsed = typeof body.elapsed === "number" ? body.elapsed : 0;
  if (company.trim() || elapsed < MIN_FILL_MS) {
    console.warn(`[waitlist] Dropped a likely bot submission (${company.trim() ? "honeypot" : `filled in ${elapsed}ms`})`);
    return reply({ status: "joined", firstName: splitName(name).firstName || "friend", emailSent: true });
  }

  const errors: FieldErrors = { name: validateName(name), email: validateEmail(email), consent: validateConsent(consent) };
  if (errors.name || errors.email || errors.consent) return reply({ status: "invalid", errors }, 400);

  const address = cleanEmail(email);
  const { firstName, lastName } = splitName(cleanName(name));

  let outcome;
  try {
    outcome = await registerContact(config, { email: address, firstName, lastName });
  } catch (e) {
    logBrevoError("register contact", e);
    // Brevo rejecting the address itself (e.g. a domain that can't receive mail) is the visitor's to fix.
    if (e instanceof BrevoError && e.status === 400 && /email/i.test(e.message)) {
      return reply({ status: "invalid", errors: { email: "That email can't receive mail. Check it and try again." } }, 400);
    }
    const busy = e instanceof BrevoError && e.status === 429;
    return reply({ status: "error", message: busy ? MSG.busy : MSG.failed }, busy ? 503 : 502);
  }

  if (outcome === "already") return reply({ status: "already", firstName });
  if (outcome === "suppressed") {
    return reply({
      status: "suppressed",
      message: `This address has unsubscribed from NOCTVRNA emails, so we've left it that way. Want ticket news after all? Email ${config.senderEmail} and we'll switch it back on.`,
    });
  }

  // On the list. The confirmation is a bonus: if it fails, they're still registered.
  let emailSent = false;
  try {
    const mail = confirmationEmail({ firstName, siteUrl: SITE_URL, senderEmail: config.senderEmail });
    await sendEmail(config, {
      to: { email: address, name: cleanName(name) },
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tags: ["waitlist-confirmation"],
    });
    emailSent = true;
  } catch (e) {
    logBrevoError("send confirmation", e);
  }

  return reply({ status: "joined", firstName, emailSent });
}

// Status and Brevo's error code only: never the API key, never the visitor's details.
function logBrevoError(step: string, e: unknown) {
  if (e instanceof BrevoError) console.error(`[waitlist] Brevo ${step} failed: ${e.status} ${e.code}: ${e.message}`);
  else console.error(`[waitlist] Brevo ${step} failed:`, e instanceof Error ? `${e.name}: ${e.message}` : e);
}
