/** @type {import('next').NextConfig} */
const nextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co'
      },
      {
        protocol: 'https',
        hostname: '**.giphy.com'
      }
    ]
  }
};

export default nextConfig;
