import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep ytdlp-nodejs out of the server bundle. The API routes must load the
  // real package at runtime so it can resolve the standalone yt-dlp binary
  // that lives inside node_modules.
  serverExternalPackages: ["ytdlp-nodejs"],
  // File tracing only picks up files that are statically reachable, but the
  // yt-dlp binary inside ytdlp-nodejs is located at runtime. Make sure it is
  // copied into the Vercel functions that spawn it.
  outputFileTracingIncludes: {
    "/api/video-info": ["./node_modules/ytdlp-nodejs/bin/**/*"],
    "/api/download": ["./node_modules/ytdlp-nodejs/bin/**/*"],
  },
};

export default nextConfig;
