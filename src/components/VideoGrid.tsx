"use client";

import type { YouTubeVideo } from "@/app/api/search/route";

interface VideoGridProps {
  videos: YouTubeVideo[];
  loading: boolean;
  onVideoSelect: (video: YouTubeVideo) => void;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl glass overflow-hidden animate-pulse">
      <div className="aspect-video bg-white/5" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-white/5 rounded w-4/5" />
        <div className="h-3 bg-white/5 rounded w-2/5" />
        <div className="h-3 bg-white/5 rounded w-3/5" />
        <div className="h-9 bg-white/5 rounded-xl mt-4" />
      </div>
    </div>
  );
}

export default function VideoGrid({ videos, loading, onVideoSelect }: VideoGridProps) {
  return (
    <>
      {loading && videos.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} onSelect={onVideoSelect} />
          ))}
          {loading &&
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`skel-${i}`} />)}
        </div>
      )}
    </>
  );
}

function VideoCard({
  video,
  onSelect,
}: {
  video: YouTubeVideo;
  onSelect: (v: YouTubeVideo) => void;
}) {
  return (
    <div className="glass rounded-2xl overflow-hidden card-hover group">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-black">
        {video.thumbnail ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <svg className="w-12 h-12 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </div>
        )}

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded-md font-mono">
            {video.duration}
          </div>
        )}

        {/* CC Badge */}
        <div className="absolute top-2 left-2 bg-green-600/90 text-white text-xs px-2 py-0.5 rounded-md font-bold">
          CC
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-xl">
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3
          className="text-white font-semibold text-sm leading-tight line-clamp-2 mb-1.5"
          title={video.title}
        >
          {video.title}
        </h3>
        <p className="text-gray-500 text-xs mb-1">{video.channelTitle}</p>
        {video.viewCount && (
          <p className="text-gray-600 text-xs mb-3">{video.viewCount} Aufrufe</p>
        )}

        <button
          onClick={() => onSelect(video)}
          className="w-full btn-primary py-2 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Herunterladen
        </button>
      </div>
    </div>
  );
}
