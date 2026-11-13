"use client";

import Image from "next/image";
import { scrollToTop } from "@/lib/lenis";
import s from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={s.footer}>
      <a
        href="#top"
        className={s.logo}
        aria-label="NOCTVRNA, back to top"
        onClick={(e) => {
          e.preventDefault();
          scrollToTop();
        }}
      >
        <Image src="/images/logo.png" alt="NOCTVRNA" width={87} height={32} />
      </a>
      <p className={s.tagline}>
        Beyond the ordinary. <span>Into the Night.</span>
      </p>
      <p className={s.copy}>© 2026 NOCTVRNA. ALL RIGHTS RESERVED.</p>
    </footer>
  );
}
