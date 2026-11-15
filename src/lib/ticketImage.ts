import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed links to a guest's ticket image (GET /api/ticket), used in the confirmation email. The signature
 * means the route only draws names it was given by the waitlist, so nobody can make NOCTVRNA tickets for
 * any name they like. The key is TICKET_IMAGE_SECRET if set, otherwise derived from BREVO_API_KEY (so
 * nothing extra to configure; changing that key breaks the ticket image in emails sent before the change).
 */

function key() {
  const secret = process.env.TICKET_IMAGE_SECRET?.trim() || process.env.BREVO_API_KEY?.trim();
  return secret ? createHmac("sha256", "noctvrna-ticket-image").update(secret).digest() : null;
}

function sign(name: string, k: Buffer) {
  return createHmac("sha256", k).update(name).digest("base64url").slice(0, 22);
}

/** The image URL for this first name; the unnamed ticket when there's no key to sign with. */
export function ticketImageUrl(siteUrl: string, firstName: string) {
  const base = `${siteUrl.replace(/\/$/, "")}/api/ticket`;
  const k = key();
  return k ? `${base}?${new URLSearchParams({ n: firstName, s: sign(firstName, k) })}` : base;
}

export function verifyTicketName(name: string, signature: string) {
  const k = key();
  if (!k) return false;
  const expected = Buffer.from(sign(name, k));
  const given = Buffer.from(signature);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
