import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: '/scan', destination: '/join', permanent: false },
      { source: '/my-coupons', destination: '/account', permanent: false },
    ]
  },
};

export default nextConfig;
