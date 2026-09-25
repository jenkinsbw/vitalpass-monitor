import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev server is opened at the LAN address, not localhost.
  allowedDevOrigins: ["192.168.1.99"],
};

export default nextConfig;
