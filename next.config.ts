import type { NextConfig } from 'next';

function supabaseImagePattern() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!rawUrl) {
    return [];
  }

  try {
    const url = new URL(rawUrl);

    return [
      {
        protocol: url.protocol === 'http:' ? ('http' as const) : ('https' as const),
        hostname: url.hostname,
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: url.protocol === 'http:' ? ('http' as const) : ('https' as const),
        hostname: url.hostname,
        pathname: '/storage/v1/render/image/public/**',
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: supabaseImagePattern(),
  },
};

export default nextConfig;
