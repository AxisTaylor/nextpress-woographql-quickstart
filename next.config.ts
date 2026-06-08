import type { NextConfig } from "next";
import { withWCR } from "@axistaylor/nextpress/withWCR";

const wpDomain = "woographqldemo.wpengine.com";
const wpProtocol = "https";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: wpDomain },
    ],
    minimumCacheTTL: 60,
  },
  env: {
    GRAPHQL_ENDPOINT: `${wpProtocol}://${wpDomain}/graphql`,
  },
};

export default withWCR(
  nextConfig,
  {
    wpDomain,
    wpProtocol,
    wpHomeUrl: `${wpProtocol}://${wpDomain}`,
    wpSiteUrl: `${wpProtocol}://${wpDomain}`,
  },
  {
    frontendDomain: "localhost:3000",
    frontendProtocol: "http",
  },
);
