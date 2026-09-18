import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";

export const downloadHistory = pgTable("download_history", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull(),
  title: text("title").notNull(),
  channelTitle: text("channel_title").notNull(),
  thumbnail: text("thumbnail").notNull(),
  duration: text("duration"),
  quality: text("quality").notNull().default("best"),
  format: text("format").notNull().default("mp4"),
  downloadedAt: timestamp("downloaded_at").defaultNow().notNull(),
  fileSize: integer("file_size"),
  license: text("license").notNull().default("creativeCommon"),
});
