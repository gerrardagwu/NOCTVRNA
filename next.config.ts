import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // 75 for the artwork; 85 for the photography, so the upscaled detail isn't compressed away again.
    qualities: [75, 85],
  },
};

export default nextConfig;
