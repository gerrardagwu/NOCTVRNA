"use client";

import { useId, type ReactNode } from "react";

/**
 * Flat sticker illustrations for the Experience stage: bold fills, dark inner lines and a thick white
 * die-cut edge, like a sticker sheet. Parts that react to taps carry data-part names.
 */

export const INK = "#170a26";
const PAPER = "#fbf8f1";
const PURPLE = "#8f4ff0";
const PURPLE_DK = "#5a23ad";
const LILAC = "#c38bef";
const GREEN = "#55ff00";
const CORAL = "#ff3e63";
const YELLOW = "#ffd43b";
const VINYL = "#140b1f";

/** Sticker wrapper: viewBox plus the die-cut outline filter (radius in viewBox units). */
function Sticker({ vb, cut, children }: { vb: string; cut: number; children: ReactNode }) {
  const id = `cut${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return (
    <svg viewBox={vb} xmlns="http://www.w3.org/2000/svg" overflow="visible">
      <defs>
        <filter id={id} x="-25%" y="-25%" width="150%" height="150%" colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius={cut} result="grow" />
          <feFlood floodColor={PAPER} />
          <feComposite in2="grow" operator="in" result="edge" />
          <feMerge>
            <feMergeNode in="edge" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <g filter={`url(#${id})`} stroke={INK} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round">
        {children}
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ sound */

export function Vinyl() {
  return (
    <Sticker vb="0 0 290 200" cut={6}>
      <g data-part="disc">
        <circle cx="200" cy="100" r="76" fill={VINYL} />
        <circle cx="200" cy="100" r="60" fill="none" stroke="#2f1f44" strokeWidth="3" />
        <circle cx="200" cy="100" r="46" fill="none" stroke="#2f1f44" strokeWidth="3" />
        <circle cx="200" cy="100" r="28" fill={LILAC} />
        <circle cx="200" cy="100" r="17" fill="none" stroke={PURPLE_DK} strokeWidth="3" />
        <circle cx="213" cy="88" r="5" fill={GREEN} stroke="none" />
        <circle cx="200" cy="100" r="5" fill={PAPER} />
      </g>
      <path d="M150 62a62 62 0 0 1 30-18" fill="none" stroke={PAPER} strokeOpacity="0.5" strokeWidth="5" />
      <rect x="18" y="18" width="164" height="164" rx="12" fill={CORAL} />
      <path d="M100 38 64 108h32L78 162l58-78h-34l22-46z" fill={LILAC} />
      <rect x="34" y="150" width="54" height="10" rx="5" fill={GREEN} />
      <circle cx="48" cy="46" r="10" fill={YELLOW} />
    </Sticker>
  );
}

export function Speaker() {
  return (
    <Sticker vb="0 0 190 210" cut={8}>
      <path data-part="ring" d="M146 112q14 22 0 44" fill="none" stroke={GREEN} strokeWidth="8" opacity="0" />
      <path data-part="ring" d="M160 98q26 36 0 72" fill="none" stroke={GREEN} strokeWidth="8" opacity="0" />
      <rect x="14" y="14" width="122" height="182" rx="20" fill={PURPLE} />
      <rect x="28" y="28" width="94" height="154" rx="14" fill={PURPLE_DK} />
      <circle cx="75" cy="64" r="22" fill={INK} />
      <circle data-part="cone" cx="75" cy="64" r="11" fill={LILAC} />
      <circle cx="75" cy="134" r="40" fill={INK} stroke={GREEN} strokeWidth="5" />
      <circle data-part="cone" cx="75" cy="134" r="22" fill={LILAC} />
      <circle cx="75" cy="134" r="7" fill={PAPER} />
    </Sticker>
  );
}

export function Note({ color = GREEN }: { color?: string }) {
  return (
    <Sticker vb="0 0 90 120" cut={7}>
      <path d="M48 18v68" stroke={INK} strokeWidth="9" />
      <path d="M48 16c18 2 30 12 28 34-6-12-14-16-28-16z" fill={color} />
      <ellipse cx="32" cy="88" rx="20" ry="15" transform="rotate(-22 32 88)" fill={color} />
    </Sticker>
  );
}

/* ----------------------------------------------------------------- people */

/** Purple hand throwing horns, coral sleeve. */
export function RockHand() {
  return (
    <Sticker vb="0 0 170 250" cut={6}>
      <rect x="42" y="18" width="28" height="108" rx="14" fill={PURPLE} />
      <rect x="108" y="40" width="26" height="86" rx="13" fill={PURPLE} />
      <rect x="38" y="98" width="98" height="104" rx="32" fill={PURPLE} />
      <rect x="68" y="92" width="22" height="38" rx="11" fill={PURPLE} />
      <rect x="88" y="92" width="22" height="38" rx="11" fill={PURPLE} />
      <rect x="50" y="126" width="68" height="24" rx="12" transform="rotate(-12 84 138)" fill={PURPLE} />
      <path d="M60 172c14 8 34 8 52 0" fill="none" stroke={PURPLE_DK} strokeWidth="4" />
      <rect x="44" y="194" width="86" height="48" rx="10" fill={CORAL} />
      <path d="M58 210h58" stroke={INK} strokeWidth="4" />
    </Sticker>
  );
}

/** Purple hand holding a phone up to film, flash ready. */
export function PhoneHand() {
  return (
    <Sticker vb="0 0 190 260" cut={6}>
      <g data-part="flash" opacity="0">
        <path d="M95 -6 102 14 122 8 108 24 124 38 104 36 100 56 92 38 72 44 84 28 68 14 88 16z" fill={YELLOW} />
      </g>
      <rect x="52" y="14" width="88" height="158" rx="18" fill={LILAC} />
      <circle cx="76" cy="40" r="11" fill={INK} />
      <circle data-part="flash-dot" cx="100" cy="40" r="7" fill={YELLOW} />
      <rect x="66" y="96" width="60" height="10" rx="5" fill={PURPLE_DK} stroke="none" />
      <rect x="44" y="124" width="104" height="92" rx="30" fill={PURPLE} />
      <rect x="30" y="128" width="38" height="24" rx="12" fill={PURPLE} />
      <rect x="28" y="152" width="40" height="24" rx="12" fill={PURPLE} />
      <rect x="32" y="176" width="36" height="22" rx="11" fill={PURPLE} />
      <rect x="128" y="112" width="26" height="54" rx="13" transform="rotate(14 141 139)" fill={PURPLE} />
      <rect x="58" y="208" width="80" height="46" rx="10" fill={GREEN} />
    </Sticker>
  );
}

/** Starburst badge. */
export function Burst({ label = "12.12", color = YELLOW }: { label?: string; color?: string }) {
  const pts = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? 58 : 76;
    return `${(80 + Math.cos(a) * r).toFixed(1)},${(80 + Math.sin(a) * r).toFixed(1)}`;
  }).join(" ");
  return (
    <Sticker vb="0 0 160 160" cut={7}>
      <polygon points={pts} fill={color} />
      <text
        x="80"
        y="92"
        textAnchor="middle"
        fontFamily="var(--font-anton), sans-serif"
        fontSize="34"
        fill={INK}
        stroke="none"
      >
        {label}
      </text>
    </Sticker>
  );
}

/* ------------------------------------------------------------- atmosphere */

const FACET_COLORS = ["#efd9fc", "#c38bef", "#a66ae8", "#d9b3f7", "#8f4ff0", "#f6e9ff"];

export function DiscoBall() {
  const id = `ball${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const cell = 18;
  const facets: ReactNode[] = [];
  // Twice as wide as the ball and periodic every 4 columns, so sliding it left loops seamlessly.
  for (let c = 0; c < 22; c++) {
    for (let r = 0; r < 10; r++) {
      const v = ((c % 4) * 7 + r * 3) % FACET_COLORS.length;
      facets.push(
        <rect key={`${c}-${r}`} x={14 + c * cell} y={50 + r * cell} width={cell - 3} height={cell - 3} rx="3" fill={FACET_COLORS[v]} stroke="none" />,
      );
    }
  }
  return (
    <Sticker vb="0 0 200 240" cut={6}>
      <defs>
        <clipPath id={id}>
          <circle cx="100" cy="140" r="80" />
        </clipPath>
      </defs>
      <rect x="96" y="-10" width="8" height="54" fill={INK} stroke="none" />
      <rect x="82" y="38" width="36" height="18" rx="5" fill={LILAC} />
      <circle cx="100" cy="140" r="80" fill={PURPLE_DK} />
      <g clipPath={`url(#${id})`}>
        <g data-part="facets">{facets}</g>
        <ellipse cx="72" cy="110" rx="22" ry="14" fill={PAPER} opacity="0.65" stroke="none" />
      </g>
      <circle cx="100" cy="140" r="80" fill="none" />
    </Sticker>
  );
}

export function Bolt({ color = GREEN }: { color?: string }) {
  return (
    <Sticker vb="0 0 110 190" cut={8}>
      <path d="M64 8 14 104h36L34 182l62-110H58L80 8z" fill={color} />
    </Sticker>
  );
}

export function Sparkle({ color = YELLOW }: { color?: string }) {
  return (
    <Sticker vb="0 0 60 60" cut={6}>
      <path d="M30 4Q33 27 56 30 33 33 30 56 27 33 4 30 27 27 30 4z" fill={color} strokeWidth="3" />
    </Sticker>
  );
}

export const COLORS = { PURPLE, LILAC, GREEN, CORAL, YELLOW, PAPER };
