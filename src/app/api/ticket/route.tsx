/* eslint-disable @next/next/no-img-element -- an ImageResponse is drawn by Satori, which takes plain <img>; next/image has no part here. */
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { NextRequest } from "next/server";
import { verifyTicketName } from "@/lib/ticketImage";
import { cleanName, validateName } from "@/lib/waitlist";

/**
 * GET /api/ticket?n=<first name>&s=<signature>: the guest's green ticket as a PNG, for the confirmation
 * email. As an image it looks the same in every email app: dark-mode apps (Gmail on iPhone above all)
 * repaint an email's colours but leave images alone. Drawn at 2x for sharp screens; shown 536px wide.
 * Only signed names are drawn (see src/lib/ticketImage.ts); a bad signature is a 404. With no name at all it
 * draws the unnamed ticket ("YOU'RE ON THE LIST."), the fallback when there's no key to sign with.
 */

const W = 1072; // 2 × 536
const H = 640;
const STUB = 160;
const BITE = 28; // the notch radius where the stub tears off

const C = { green: "#55ff00", ink: "#0a0a06", deep: "#340857", ink70: "#215404", ink60: "#286c04", ink55: "#2c7803", ink35: "#3aa902", bg: "#050406" };

const file = (...p: string[]) => readFile(join(process.cwd(), ...p));
const dataUri = async (p: string) => `data:image/png;base64,${(await file("public", "email", p)).toString("base64")}`;

// Read once per server instance, not per request.
const assets = Promise.all([
  file("assets", "fonts", "Anton-Regular.ttf"),
  file("assets", "fonts", "BricolageGrotesque-SemiBold.ttf"),
  file("assets", "fonts", "BricolageGrotesque-Bold.ttf"),
  dataUri("badge.png"),
  dataUri("stamp.png"),
  dataUri("stub.png"),
]);

// Anton's advance widths per 100px, for fitting the name on its line.
const ANTON: Record<string, number> = {
  A: 49, B: 48, C: 47, D: 49, E: 41, F: 40, G: 48, H: 50, I: 23, J: 47, K: 47, L: 40, M: 75,
  N: 50, O: 49, P: 47, Q: 49, R: 48, S: 46, T: 40, U: 47, V: 47, W: 71, X: 48, Y: 45, Z: 41,
  ".": 20, " ": 22, "-": 30, "'": 18,
};
const TITLE = 100;
const TITLE_ROOM = W - STUB - 60 - 52 - 10;

function nameSize(text: string) {
  const width = [...text].reduce((sum, ch) => sum + (ANTON[ch] ?? 50), 0);
  return Math.max(44, Math.min(TITLE, Math.floor((TITLE * TITLE_ROOM) / width)));
}

// Anton covers Latin scripts (Yoruba, Igbo and Hausa letters included). Anything else would draw as empty
// boxes, so those tickets leave the name off; the email still greets the guest by name in its text.
const LATIN = /^[\p{Script=Latin}\p{M}\s'’.-]+$/u;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const name = cleanName(params.get("n") ?? "");
  if ((params.has("n") || params.has("s")) && (!name || validateName(name) || !verifyTicketName(name, params.get("s") ?? ""))) {
    return new Response("Not found", { status: 404 });
  }

  const [anton, semibold, bold, badge, stamp, stub] = await assets;
  const shown = name && LATIN.test(name) ? `${name.toLocaleUpperCase("en")}.` : "";
  // Flat green: the site's paper grain is lost at email size and would triple the file (noise doesn't compress).
  const paper = { backgroundColor: C.green } as const;
  const label = { fontFamily: "Bricolage", fontWeight: 700, fontSize: 20, letterSpacing: 3.6, color: C.ink60 } as const;
  const fact = { fontFamily: "Anton", fontSize: 40, lineHeight: 1.2, letterSpacing: 0.8, color: C.ink, marginTop: 6 } as const;

  return new ImageResponse(
    (
      <div style={{ width: W, height: H, display: "flex", position: "relative", color: C.ink }}>
        <div
          style={{
            ...paper,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "52px 52px 46px 60px",
            borderRadius: "32px 0 0 32px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <img src={badge} width={96} height={96} alt="" />
              <div style={{ display: "flex", flexDirection: "column", marginLeft: 24 }}>
                <div style={{ fontFamily: "Anton", fontSize: 36, lineHeight: 1, letterSpacing: 2.8 }}>NOCTVRNA</div>
                <div style={{ ...label, fontSize: 22, letterSpacing: 3.2, color: C.ink70, marginTop: 8 }}>THE LAGOS LIFE</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: 40, fontFamily: "Anton", lineHeight: 0.94, letterSpacing: -0.6 }}>
              <div style={{ fontSize: TITLE }}>{shown ? "YOU'RE ON THE LIST," : "YOU'RE ON"}</div>
              <div style={{ fontSize: shown ? nameSize(shown) : TITLE, color: shown ? C.deep : C.ink }}>{shown || "THE LIST."}</div>
            </div>
            <div style={{ fontFamily: "Bricolage", fontWeight: 600, fontSize: 34, lineHeight: 1.3, letterSpacing: -0.6, marginTop: 26 }}>
              Ticket links land in this inbox first.
            </div>
          </div>
          <div style={{ display: "flex", borderTop: `4px dashed ${C.ink35}`, paddingTop: 26 }}>
            <div style={{ display: "flex", flexDirection: "column", marginRight: 56 }}>
              <div style={label}>DATE</div>
              <div style={fact}>12.12.26</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={label}>CITY</div>
              <div style={fact}>Lagos</div>
            </div>
          </div>
          <img src={stamp} width={300} height={165} alt="" style={{ position: "absolute", right: 30, bottom: 22 }} />
        </div>
        <div
          style={{
            ...paper,
            width: STUB,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderLeft: `4px dashed ${C.ink55}`,
            borderRadius: "0 32px 32px 0",
          }}
        >
          <img src={stub} width={104} height={406} alt="" />
        </div>
        {/* Notches where the stub tears off, in the email's background colour. */}
        <div style={{ position: "absolute", left: W - STUB - BITE, top: -BITE, width: BITE * 2, height: BITE * 2, borderRadius: BITE, backgroundColor: C.bg }} />
        <div style={{ position: "absolute", left: W - STUB - BITE, bottom: -BITE, width: BITE * 2, height: BITE * 2, borderRadius: BITE, backgroundColor: C.bg }} />
      </div>
    ),
    {
      width: W,
      height: H,
      fonts: [
        { name: "Anton", data: anton, weight: 400, style: "normal" },
        { name: "Bricolage", data: semibold, weight: 600, style: "normal" },
        { name: "Bricolage", data: bold, weight: 700, style: "normal" },
      ],
      headers: { "cache-control": "public, max-age=31536000, immutable" },
    },
  );
}
