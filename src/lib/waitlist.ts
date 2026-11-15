/**
 * The waitlist's rules and messages, shared by the form (instant feedback) and the /api/waitlist route
 * (the check that counts). Nothing secret lives here.
 */

export const NAME_MAX = 60;
export const EMAIL_MAX = 254;

/** Shown next to the consent checkbox, and the reason we may email the contact from Brevo afterwards. */
export const CONSENT_TEXT = "Email me ticket drops, lineup news and event updates from NOCTVRNA. Unsubscribe anytime.";

// Something@something.tld, no spaces, a real-looking ending. Deliverability is Brevo's job; this catches typos.
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[a-z]{2,}$/i;

export type FieldName = "name" | "email" | "consent";
export type FieldErrors = Partial<Record<FieldName, string>>;

/** Trim, drop control characters and squeeze runs of spaces. */
export function cleanName(value: string) {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").replace(/\s+/g, " ").trim();
}

export function cleanEmail(value: string) {
  return value.trim().toLowerCase();
}

export function validateName(value: string) {
  const v = cleanName(value);
  if (!v) return "Add your name so we know who's coming.";
  if (v.length > NAME_MAX) return `Keep it under ${NAME_MAX} characters.`;
  // The name goes into the confirmation email, so it can't carry links or markup.
  if (/[<>]|:\/\/|www\.|@/i.test(v)) return "Just your name, no links or symbols.";
  return undefined;
}

export function validateEmail(value: string) {
  const v = cleanEmail(value);
  if (!v) return "Add an email address the drop can reach.";
  if (v.length > EMAIL_MAX || !EMAIL_RE.test(v)) return "That email doesn't look right. Try name@example.com.";
  return undefined;
}

export function validateConsent(value: boolean) {
  return value ? undefined : "Tick the box so we can email you when tickets drop.";
}

/** First word for greetings ("Noted, Ada."), the rest for Brevo's LASTNAME. */
export function splitName(name: string) {
  const [first, ...rest] = cleanName(name).split(" ");
  return { firstName: first, lastName: rest.join(" ") };
}

/** What POST /api/waitlist answers. */
export type WaitlistResponse =
  | { status: "joined"; firstName: string; emailSent: boolean }
  | { status: "already"; firstName: string }
  | { status: "suppressed"; message: string }
  | { status: "invalid"; errors: FieldErrors }
  | { status: "error"; message: string };
