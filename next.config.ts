
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
      // Add other CDNs if manhwa18.cc uses more
      {
        protocol: 'http', // Some CDNs might use http
        hostname: 'cdn01.manhwa18.cc',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
