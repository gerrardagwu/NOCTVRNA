import "server-only";

/**
 * The few Brevo API calls the waitlist needs. Server-only: the API key never leaves the server.
 * Configuration comes from environment variables (set in Vercel → Project → Settings → Environment Variables):
 *   BREVO_API_KEY       the API key (Brevo → SMTP & API → API keys)
 *   BREVO_LIST_ID       the numeric id of the waitlist contact list
 *   BREVO_SENDER_EMAIL  a sender address verified in Brevo, on the thisisnoctvrna.com domain
 *   BREVO_SENDER_NAME   the name the confirmation comes from, e.g. NOCTVRNA
 */

const API = "https://api.brevo.com/v3";
const TIMEOUT_MS = 8000;

export type BrevoConfig = { apiKey: string; listId: number; senderEmail: string; senderName: string };

/** Reads the configuration, reporting which variables are missing (names only, never values). */
export function readBrevoConfig(): { config: BrevoConfig | null; missing: string[] } {
  const env = {
    BREVO_API_KEY: process.env.BREVO_API_KEY?.trim(),
    BREVO_LIST_ID: process.env.BREVO_LIST_ID?.trim(),
    BREVO_SENDER_EMAIL: process.env.BREVO_SENDER_EMAIL?.trim(),
    BREVO_SENDER_NAME: process.env.BREVO_SENDER_NAME?.trim(),
  };
  const missing = Object.entries(env)
    .filter(([, v]) => !v)
    .map(([k]) => k);
  const listId = Number(env.BREVO_LIST_ID);
  if (env.BREVO_LIST_ID && !(Number.isInteger(listId) && listId > 0)) missing.push("BREVO_LIST_ID (must be a number)");
  if (missing.length) return { config: null, missing };
  return {
    config: { apiKey: env.BREVO_API_KEY!, listId, senderEmail: env.BREVO_SENDER_EMAIL!, senderName: env.BREVO_SENDER_NAME! },
    missing,
  };
}

export class BrevoError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "BrevoError";
  }
}

async function call<T>(config: BrevoConfig, method: string, path: string, body?: unknown): Promise<{ status: number; data: T | null }> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "api-key": config.apiKey,
      accept: "application/json",
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (res.ok || res.status === 404) return { status: res.status, data: data as T | null };
  const err = (data ?? {}) as { code?: string; message?: string };
  throw new BrevoError(res.status, err.code ?? "unknown", err.message ?? res.statusText);
}

type Contact = {
  email: string;
  emailBlacklisted?: boolean;
  listIds?: number[];
  listUnsubscribed?: number[];
  attributes?: Record<string, unknown>;
};

export type Registration = "joined" | "already" | "suppressed";

/**
 * Puts someone on the waitlist list.
 *  - New address: created with their name, straight into the list.
 *  - Already in the list: left as is ("already"), so nobody gets a second confirmation.
 *  - Known address not yet in the list: added to it; their name is filled in if Brevo didn't have one.
 *  - Unsubscribed (blocklisted, or unsubscribed from this list): nothing is changed ("suppressed"). Brevo's
 *    suppression stands; only the contact can lift it, from an unsubscribe/preferences link.
 */
export async function registerContact(
  config: BrevoConfig,
  person: { email: string; firstName: string; lastName: string },
): Promise<Registration> {
  const path = `/contacts/${encodeURIComponent(person.email)}`;
  const names = { FIRSTNAME: person.firstName, ...(person.lastName ? { LASTNAME: person.lastName } : {}) };

  for (let attempt = 0; attempt < 2; attempt++) {
    const found = await call<Contact>(config, "GET", path);

    if (found.status === 404) {
      try {
        await call(config, "POST", "/contacts", {
          email: person.email,
          attributes: names,
          listIds: [config.listId],
          updateEnabled: false,
        });
        return "joined";
      } catch (e) {
        // Created by a parallel request in the meantime: look again and treat it as an existing contact.
        if (e instanceof BrevoError && e.code === "duplicate_parameter" && attempt === 0) continue;
        throw e;
      }
    }

    const contact = found.data!;
    if (contact.emailBlacklisted || contact.listUnsubscribed?.includes(config.listId)) return "suppressed";
    if (contact.listIds?.includes(config.listId)) return "already";

    const hasName = typeof contact.attributes?.FIRSTNAME === "string" && contact.attributes.FIRSTNAME.trim() !== "";
    await call(config, "PUT", path, { listIds: [config.listId], ...(hasName ? {} : { attributes: names }) });
    return "joined";
  }
  throw new BrevoError(409, "conflict", "Contact kept changing while registering");
}

/** Sends a transactional email from the configured sender. Brevo's own blocklists still apply. */
export async function sendEmail(
  config: BrevoConfig,
  message: { to: { email: string; name?: string }; subject: string; html: string; text: string; tags?: string[] },
) {
  await call(config, "POST", "/smtp/email", {
    sender: { email: config.senderEmail, name: config.senderName },
    replyTo: { email: config.senderEmail, name: config.senderName },
    to: [message.to],
    subject: message.subject,
    htmlContent: message.html,
    textContent: message.text,
    tags: message.tags,
  });
}
