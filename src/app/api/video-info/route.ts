import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface VideoFormat {
  formatId: string;
  ext: string;
  quality: string;
  resolution: string;
  filesize: number | null;
  vcodec: string;
  acodec: string;
  label: string;
  type: "video" | "audio";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  if (!videoId) {
    return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
  }

  const url = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    const { stdout } = await execFileAsync("yt-dlp", [
      "--dump-json",
      "--no-playlist",
      "--no-warnings",
      url,
    ], { maxBuffer: 10 * 1024 * 1024 });

    const info = JSON.parse(stdout);

    // Build a clean list of available qualities
    const qualityOptions = [
      { quality: "2160p", label: "4K Ultra HD (2160p)", resolution: "3840×2160" },
      { quality: "1440p", label: "2K QHD (1440p)", resolution: "2560×1440" },
      { quality: "1080p", label: "Full HD (1080p)", resolution: "1920×1080" },
      { quality: "720p", label: "HD (720p)", resolution: "1280×720" },
      { quality: "480p", label: "SD (480p)", resolution: "854×480" },
      { quality: "360p", label: "Low (360p)", resolution: "640×360" },
    ];

    const availableHeights = new Set<number>();
    const formats: { height?: number; vcodec?: string; acodec?: string }[] = info.formats || [];
    for (const f of formats) {
      if (f.height && f.vcodec !== "none") {
        availableHeights.add(f.height);
      }
    }

    const videoFormats: VideoFormat[] = [];

    for (const opt of qualityOptions) {
      const height = parseInt(opt.quality);
      // Check if any format is within range of this quality
      const hasQuality = [...availableHeights].some(
        (h) => h >= height - 50 && h <= height + 100
      );
      if (hasQuality || height <= 720) {
        // Always include up to 720p if video exists
        videoFormats.push({
          formatId: opt.quality,
          ext: "mp4",
          quality: opt.quality,
          resolution: opt.resolution,
          filesize: null,
          vcodec: "h264",
          acodec: "aac",
          label: opt.label,
          type: "video",
        });
      }
    }

    // Always add MP3 option
    const hasAudio = formats.some((f) => f.acodec && f.acodec !== "none");
    if (hasAudio) {
      videoFormats.push({
        formatId: "mp3",
        ext: "mp3",
        quality: "best",
        resolution: "audio only",
        filesize: null,
        vcodec: "none",
        acodec: "aac",
        label: "MP3 Audio",
        type: "audio",
      });
    }

    return NextResponse.json({
      title: info.title,
      duration: info.duration,
      thumbnail: info.thumbnail,
      uploader: info.uploader,
      viewCount: info.view_count,
      license: info.license,
      formats: videoFormats,
    });
  } catch (error) {
    console.error("video-info error:", error);
    return NextResponse.json({ error: "Konnte Video-Informationen nicht laden" }, { status: 500 });
  }
}
