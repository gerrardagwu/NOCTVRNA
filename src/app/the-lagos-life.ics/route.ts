import { EVENT_TIME } from "@/lib/event";

/**
 * GET /the-lagos-life.ics: the night as a calendar event, for the confirmation email's "save the date"
 * link (Apple Calendar, Outlook and anything else that opens .ics files). An all-day event on the Lagos
 * date, since set times aren't announced yet. Static: built once from EVENT_TIME, like the countdown.
 */

const SITE_URL = process.env.SITE_URL?.trim() || "https://thisisnoctvrna.com";
const LAGOS_OFFSET_MS = 60 * 60 * 1000; // WAT, UTC+1

/** YYYYMMDD of the Lagos calendar date, `addDays` after the event's. */
function lagosDate(addDays = 0) {
  return new Date(EVENT_TIME + LAGOS_OFFSET_MS + addDays * 86_400_000).toISOString().slice(0, 10).replaceAll("-", "");
}

export function GET() {
  const site = SITE_URL.replace(/\/$/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//NOCTVRNA//The Lagos Life//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:the-lagos-life-${lagosDate()}@thisisnoctvrna.com`,
    `DTSTAMP:${lagosDate()}T000000Z`,
    `DTSTART;VALUE=DATE:${lagosDate()}`,
    `DTEND;VALUE=DATE:${lagosDate(1)}`,
    "SUMMARY:NOCTVRNA: The Lagos Life",
    "LOCATION:Lagos\\, Nigeria",
    `DESCRIPTION:Our day begins after dark. Tickets drop to the waitlist first: ${site}`,
    `URL:${site}`,
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'attachment; filename="noctvrna-the-lagos-life.ics"',
    },
  });
}
