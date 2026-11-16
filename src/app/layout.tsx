import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Anton, Bricolage_Grotesque, DM_Sans } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import { LOW_TIER_SCRIPT } from "@/lib/perfTierScript";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm", display: "swap" });

// The design's body face is Bunch, which isn't on Google Fonts, so this is a stand-in. To use the real
// face, drop the files into src/fonts and swap this call for next/font/local with the same `variable`
// name. See README.
const bunch = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bunch", display: "swap" });

export const metadata: Metadata = {
  title: "NOCTVRNA | The Lagos Life",
  description:
    "NOCTVRNA is a nightlife and culture experience built around music, creative expression and the energy of the night. The Lagos Life, 12.12.26.",
  openGraph: {
    title: "NOCTVRNA | The Lagos Life",
    description: "Our day begins after dark. 12.12.26, Lagos.",
    images: ["/images/poster.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: the perf-tier script may add data-perf to <html> before React hydrates.
    <html lang="en" className={`${anton.variable} ${dmSans.variable} ${bunch.variable}`} suppressHydrationWarning>
      <body>
        <Script id="perf-tier" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: LOW_TIER_SCRIPT }} />
        <noscript>
          <style>{`[data-intro]{opacity:1!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
