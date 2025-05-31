
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn01.manhwa18.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'cdn01.manhwa18.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn02.manhwa18.cc',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'cdn02.manhwa18.cc',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
