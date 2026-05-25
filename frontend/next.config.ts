import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.zapimoveis.com.br' },
      { protocol: 'https', hostname: '*.vivareal.com.br' },
      { protocol: 'https', hostname: '*.olx.com.br' },
      { protocol: 'https', hostname: '*.imovelweb.com.br' },
      { protocol: 'https', hostname: '*.zap.com.br' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
