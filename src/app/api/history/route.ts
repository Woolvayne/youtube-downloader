import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { downloadHistory } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const history = await db
      .select()
      .from(downloadHistory)
      .orderBy(desc(downloadHistory.downloadedAt))
      .limit(50);
    return NextResponse.json({ history });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json({ history: [] });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoId, title, channelTitle, thumbnail, duration, quality, format } = body;

    if (!videoId || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [entry] = await db
      .insert(downloadHistory)
      .values({
        videoId,
        title,
        channelTitle: channelTitle || "Unknown",
        thumbnail: thumbnail || "",
        duration: duration || null,
        quality: quality || "best",
        format: format || "mp4",
        license: "creativeCommon",
      })
      .returning();

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("History insert error:", error);
    return NextResponse.json({ error: "Failed to save history" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await db.delete(downloadHistory);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("History delete error:", error);
    return NextResponse.json({ error: "Failed to clear history" }, { status: 500 });
  }
}
