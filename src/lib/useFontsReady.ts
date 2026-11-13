"use client";

import { useEffect, useState } from "react";

/** True once web fonts have loaded, so text can be split into words without measuring a fallback face. */
export function useFontsReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const done = () => alive && setReady(true);
    const timeout = window.setTimeout(done, 3000);
    document.fonts.ready.then(done);
    return () => {
      alive = false;
      window.clearTimeout(timeout);
    };
  }, []);

  return ready;
}
