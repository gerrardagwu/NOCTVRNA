import { connection } from "next/server";

/** The server's clock, so the countdown can correct a visitor's device that's set to the wrong time. */
export async function GET() {
  await connection(); // always answer at request time, never from a prerendered copy
  return Response.json({ now: Date.now() }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
