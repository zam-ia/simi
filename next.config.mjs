/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/menu/demo-:slug",
        destination: "/menu/:slug",
        permanent: true
      },
      {
        source: "/reservar/demo-:slug",
        destination: "/reservar/:slug",
        permanent: true
      }
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co"
      }
    ]
  }
};

export default nextConfig;
