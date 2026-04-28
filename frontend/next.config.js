/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "display-capture=(self)",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
