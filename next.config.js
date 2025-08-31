/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['s.gravatar.com', 'cdn.auth0.com', 'img.theopenshift.com'],
  },
  // ...other config options
};

module.exports = withPWA(nextConfig);