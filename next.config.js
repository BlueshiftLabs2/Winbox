/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['software.download.prss.microsoft.com', 'us.download.nvidia.com'],
  },
}

module.exports = nextConfig