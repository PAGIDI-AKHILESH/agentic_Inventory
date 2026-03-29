import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'whatwg-fetch': false,
      'node-fetch': false,
      'isomorphic-fetch': false,
      'cross-fetch': false,
      'node-fetch-native': false,
      'node-fetch-native/polyfill': false,
      'unfetch': false,
      'isomorphic-unfetch': false,
      'web-streams-polyfill': false,
      'web-streams-polyfill/polyfill': false,
      'abortcontroller-polyfill': false,
      'abortcontroller-polyfill/dist/abortcontroller-polyfill-only': false,
    };
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
