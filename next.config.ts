import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The ticket image route reads its fonts and artwork from disk; make sure they ship with it.
  outputFileTracingIncludes: {
    "/api/ticket": ["./assets/fonts/*.ttf", "./public/email/{badge,stamp,stub}.png"],
  },
  images: {
    // 75 for the artwork; 85 for the photography, so the upscaled detail isn't compressed away again.
    qualities: [75, 85],
  },
};

export default nextConfig;
