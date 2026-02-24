/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    '@ai-office/api',
    '@ai-office/db',
    '@ai-office/shared',
    '@ai-office/realtime',
  ],
};

export default nextConfig;
