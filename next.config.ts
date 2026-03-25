import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    // Keep build worker count low for constrained hosting environments (e.g., Plesk/shared hosting).
    cpus: 1,
  },
};

export default nextConfig;
