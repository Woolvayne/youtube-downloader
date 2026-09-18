"use client";

import { useState, useCallback, useEffect } from "react";
import SearchBar from "@/components/SearchBar";
import VideoGrid from "@/components/VideoGrid";
import DownloadModal from "@/components/DownloadModal";
import HistoryPanel from "@/components/HistoryPanel";
import SetupGuide from "@/components/SetupGuide";
import type { YouTubeVideo } from "@/app/api/search/route";

export default function HomePage() {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "trending">("search");
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/config-check")
      .then((r) => r.json())
      .then((d) => setHasApiKey(d.hasApiKey))
      .catch(() => setHasApiKey(false));
  }, []);

  const search = useCallback(
    async (query: string, append = false) => {
      setLoading(true);
      setError(null);
      if (!append) {
        setVideos([]);
        setNextPageToken(null);
      }
      setCurrentQuery(query);

      try {
        const params = new URLSearchParams({ q: query, maxResults: "20" });
        if (append && nextPageToken) params.set("pageToken", nextPageToken);

        const res = await fetch(`/api/search?${params}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || "Suche fehlgeschlagen");

        setVideos((prev) => (append ? [...prev, ...data.videos] : data.videos));
        setNextPageToken(data.nextPageToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Ein Fehler ist aufgetreten");
      } finally {
        setLoading(false);
      }
    },
    [nextPageToken]
  );

  const loadTrending = useCallback(async () => {
    setActiveTab("trending");
    await search("creative commons nature documentary music travel");
  }, [search]);

  // Show loading state while checking API key
  if (hasApiKey === null) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Show setup guide if no API key
  if (!hasApiKey) {
    return <SetupGuide />;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {/* Hero Header */}
      <header
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1a0000 0%, #0f0f0f 50%, #1a0000 100%)",
        }}
      >
        {/* Background Image */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url(/images/hero-bg.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0f0f0f]" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-12">
          {/* Nav */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl btn-primary flex items-center justify-center shadow-lg shadow-red-900/50">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">FreeTube</h1>
                <p className="text-xs text-red-400">Copyright-Free Downloader</p>
              </div>
            </div>

            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm text-gray-300 hover:text-white transition-all"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Verlauf
            </button>
          </div>

          {/* Hero Text */}
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-black mb-3">
              <span className="gradient-text">Copyright-freie</span>
              <br />
              <span className="text-white">YouTube Videos herunterladen</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Nur Creative Commons lizenzierte Videos · Sicher & Legal · Safari-optimiert
            </p>
          </div>

          {/* License Badge */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full glass border border-green-500/30 text-green-400 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              Alle Videos unter Creative Commons Lizenz
            </div>
          </div>

          {/* Search Bar */}
          <SearchBar
            onSearch={(q: string) => {
              setActiveTab("search");
              search(q);
            }}
            loading={loading}
          />

          {/* Quick Tags */}
          <div className="flex justify-center gap-3 mt-6 flex-wrap">
            {["Natur", "Musik", "Reise", "Technologie", "Kochen", "Sport", "Tiere", "Geschichte"].map(
              (tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setActiveTab("search");
                    search(tag);
                  }}
                  className="px-3 py-1.5 rounded-full text-sm glass text-gray-300 hover:text-white hover:border-red-500/50 transition-all"
                >
                  {tag}
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex items-center gap-6 mb-6 border-b border-white/5 pb-0">
          <button
            onClick={() => setActiveTab("search")}
            className={`text-sm font-semibold pb-3 border-b-2 transition-all ${
              activeTab === "search"
                ? "text-white border-red-500"
                : "text-gray-500 border-transparent hover:text-gray-300"
            }`}
          >
            Suchergebnisse
            {videos.length > 0 && (
              <span className="ml-2 text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full">
                {videos.length}
              </span>
            )}
          </button>
          <button
            onClick={loadTrending}
            className={`text-sm font-semibold pb-3 border-b-2 transition-all ${
              activeTab === "trending"
                ? "text-white border-red-500"
                : "text-gray-500 border-transparent hover:text-gray-300"
            }`}
          >
            🔥 Empfohlen
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-400 flex items-start gap-3">
            <svg
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <div>
              <p className="font-semibold">Fehler</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!error && videos.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-900/20 border border-red-500/20 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-500"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Bereit zum Suchen</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Gib einen Suchbegriff ein oder entdecke empfohlene Creative Commons Videos.
            </p>
            <button
              onClick={loadTrending}
              className="btn-primary px-8 py-3 rounded-xl font-semibold text-white shadow-lg shadow-red-900/30"
            >
              🔥 Empfohlene Videos laden
            </button>
          </div>
        )}

        {/* Video Grid */}
        <VideoGrid videos={videos} loading={loading} onVideoSelect={setSelectedVideo} />

        {/* Load More */}
        {nextPageToken && !loading && videos.length > 0 && (
          <div className="text-center mt-10">
            <button
              onClick={() => search(currentQuery, true)}
              className="btn-primary px-10 py-3 rounded-xl font-semibold text-white"
            >
              Weitere Videos laden
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16 py-8 text-center">
        <p className="text-gray-600 text-sm">
          FreeTube lädt ausschließlich{" "}
          <span className="text-green-500">Creative Commons</span> lizenzierte Videos herunter.
          Powered by YouTube Data API v3 & yt-dlp.
        </p>
      </footer>

      {/* Download Modal */}
      {selectedVideo && (
        <DownloadModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}

      {/* History Panel */}
      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
    </div>
  );
}
