import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Redireciona URLs antigas /<locale>/<slug> para os novos subsites /<código-país>.
  async redirects() {
    return [
      { source: "/pt/seguidores-brasileiros", destination: "/br", permanent: true },
      { source: "/en/american-followers", destination: "/us", permanent: true },
      { source: "/es/seguidores-reales", destination: "/es", permanent: true },
      { source: "/fr/abonnes-instagram", destination: "/fr", permanent: true },
      { source: "/de/instagram-follower-kaufen", destination: "/de", permanent: true },
      { source: "/it/follower-instagram", destination: "/it", permanent: true },
    ];
  },
};

export default nextConfig;
