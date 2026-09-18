import { NextRequest, NextResponse } from "next/server";
import { getYtdlpBaseArgs, spawnYtdlp } from "@/lib/ytdlp";

// This route streams from the standalone yt-dlp binary, which only works in
// the Node.js runtime (not Edge).
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const quality = searchParams.get("quality") || "best";
  const format = searchParams.get("format") || "mp4";
  const title = searchParams.get("title") || "video";

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const safeTitle = title.replace(/[^a-zA-Z0-9\-_\s]/g, "").trim().substring(0, 80) || "video";
  const filename = `${safeTitle}.${format}`;

  // Map quality to yt-dlp format string
  let formatStr: string;
  if (format === "mp3") {
    formatStr = "bestaudio[ext=m4a]/bestaudio/best";
  } else {
    switch (quality) {
      case "2160p":
        formatStr = "bestvideo[height<=2160][ext=mp4]+bestaudio[ext=m4a]/best[height<=2160][ext=mp4]/best";
        break;
      case "1080p":
        formatStr = "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best";
        break;
      case "720p":
        formatStr = "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best";
        break;
      case "480p":
        formatStr = "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best";
        break;
      case "360p":
        formatStr = "bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]/best";
        break;
      default:
        formatStr = "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best";
    }
  }

  // Build yt-dlp args for streaming to stdout
  const args = [
    ...getYtdlpBaseArgs(),
    "-f", formatStr,
    "--merge-output-format", format === "mp3" ? "m4a" : "mp4",
    "-o", "-",  // output to stdout
    url,
  ];

  const contentType = format === "mp3" ? "audio/mp4" : "video/mp4";
  const ext = format === "mp3" ? "m4a" : "mp4";
  const dlFilename = `${safeTitle}.${ext}`;

  // Create a ReadableStream from the yt-dlp process stdout
  const stream = new ReadableStream({
    start(controller) {
      const proc = spawnYtdlp(args);

      proc.stdout.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });

      proc.stderr.on("data", (data: Buffer) => {
        // Log progress but don't fail
        const msg = data.toString();
        if (msg.includes("ERROR") || msg.includes("error")) {
          console.error("[yt-dlp]", msg.trim());
        }
      });

      proc.on("close", (code) => {
        if (code === 0) {
          controller.close();
        } else {
          controller.error(new Error(`yt-dlp exited with code ${code}`));
        }
      });

      proc.on("error", (err) => {
        controller.error(err);
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${dlFilename}"; filename*=UTF-8''${encodeURIComponent(dlFilename)}`,
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
      // Safari-specific headers
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-cache, no-store",
    },
  });
}
