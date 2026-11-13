import type { Metadata, Viewport } from "next";
import { Anton, Bricolage_Grotesque, DM_Sans, Metal_Mania } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm", display: "swap" });

// The design uses Bunch (body) and NEUVORTE (the "THE NIGHT IS CALLING" lettering). Neither is on
// Google Fonts, so these are stand-ins. To use the real faces, drop the files into src/fonts and
// swap these two calls for next/font/local with the same `variable` names. See README.
const bunch = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bunch", display: "swap" });
const neuvorte = Metal_Mania({ weight: "400", subsets: ["latin"], variable: "--font-neuvorte", display: "swap" });

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
    <html lang="en" className={`${anton.variable} ${dmSans.variable} ${bunch.variable} ${neuvorte.variable}`}>
      <body>
        <noscript>
          <style>{`[data-intro]{opacity:1!important}[data-loader]{display:none!important}`}</style>
        </noscript>
        {children}
      </body>
    </html>
  );
}
