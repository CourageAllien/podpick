/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  // pdf-parse + puppeteer are server-only; keep them out of the client bundle
  serverExternalPackages: ['pdf-parse', 'puppeteer', 'postgres', 'pg'],
};

export default nextConfig;
