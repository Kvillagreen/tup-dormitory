/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config: any) => {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      canvas: false,
    };

    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      path: false,
    };

    return config;
  },
};

module.exports = nextConfig;
