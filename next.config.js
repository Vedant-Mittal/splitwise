/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'export',
  images: {
    unoptimized: true,
  },
  // GitHub Pages uses a subdirectory format
  basePath: process.env.NODE_ENV === 'production' ? '/splitwise' : '',
  // Disable server-side features when exporting
  trailingSlash: true,
  // Exclude API routes from the build
  distDir: 'out',
  // Exclude API routes from the build
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude API routes from the build
      config.externals = [...config.externals, 'api'];
    }
    return config;
  },
}

module.exports = nextConfig 