import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    optimizePackageImports: ['recharts', 'lucide-react', 'motion', 'motion/react'],
  },
};

export default nextConfig;
