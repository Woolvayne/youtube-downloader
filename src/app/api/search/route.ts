import { NextRequest, NextResponse } from "next/server";

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
  duration?: string;
  viewCount?: string;
  license: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const pageToken = searchParams.get("pageToken") || "";
  const maxResults = parseInt(searchParams.get("maxResults") || "20");

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "YouTube API key not configured. Please add YOUTUBE_API_KEY to your .env file." },
      { status: 500 }
    );
  }

  try {
    // Search for Creative Commons videos
    const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", query || "nature documentary");
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("videoLicense", "creativeCommon");
    searchUrl.searchParams.set("maxResults", String(maxResults));
    searchUrl.searchParams.set("safeSearch", "moderate");
    searchUrl.searchParams.set("key", apiKey);
    if (pageToken) searchUrl.searchParams.set("pageToken", pageToken);

    const searchResp = await fetch(searchUrl.toString(), { next: { revalidate: 60 } });
    if (!searchResp.ok) {
      const err = await searchResp.json();
      return NextResponse.json(
        { error: err.error?.message || "YouTube API error" },
        { status: searchResp.status }
      );
    }

    const searchData = await searchResp.json();
    const videoIds: string[] = searchData.items
      ?.map((item: { id: { videoId: string } }) => item.id.videoId)
      .filter(Boolean) || [];

    if (videoIds.length === 0) {
      return NextResponse.json({ videos: [], nextPageToken: null });
    }

    // Get video details (duration, views, license confirmation)
    const detailsUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
    detailsUrl.searchParams.set("part", "snippet,contentDetails,statistics,status");
    detailsUrl.searchParams.set("id", videoIds.join(","));
    detailsUrl.searchParams.set("key", apiKey);

    const detailsResp = await fetch(detailsUrl.toString(), { next: { revalidate: 60 } });
    const detailsData = await detailsResp.json();

    const videos: YouTubeVideo[] = (detailsData.items || [])
      // Only include confirmed Creative Commons videos
      .filter((item: { status?: { license?: string } }) => item.status?.license === "creativeCommon")
      .map((item: {
        id: string;
        snippet: {
          title: string;
          description: string;
          channelTitle: string;
          thumbnails: { maxres?: { url: string }; high?: { url: string }; medium?: { url: string } };
          publishedAt: string;
        };
        contentDetails: { duration: string };
        statistics?: { viewCount?: string };
        status: { license: string };
      }) => ({
        id: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        thumbnail:
          item.snippet.thumbnails.maxres?.url ||
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url ||
          "",
        publishedAt: item.snippet.publishedAt,
        duration: formatDuration(item.contentDetails.duration),
        viewCount: item.statistics?.viewCount
          ? formatViewCount(item.statistics.viewCount)
          : "N/A",
        license: item.status.license,
      }));

    return NextResponse.json({
      videos,
      nextPageToken: searchData.nextPageToken || null,
      totalResults: searchData.pageInfo?.totalResults || 0,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatDuration(iso: string): string {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "0:00";
  const h = parseInt(match[1] || "0");
  const m = parseInt(match[2] || "0");
  const s = parseInt(match[3] || "0");
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatViewCount(count: string): string {
  const n = parseInt(count);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
