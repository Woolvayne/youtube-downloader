"use client";

import { useState, useEffect } from "react";

interface HistoryEntry {
  id: number;
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string | null;
  quality: string;
  format: string;
  downloadedAt: string;
}

interface HistoryPanelProps {
  onClose: () => void;
}

export default function HistoryPanel({ onClose }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setHistory(data.history || []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    setClearing(true);
    try {
      await fetch("/api/history", { method: "DELETE" });
      setHistory([]);
    } finally {
      setClearing(false);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative glass-dark rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-white/5">
          <div>
            <h3 className="text-white font-bold text-xl">Download-Verlauf</h3>
            <p className="text-gray-500 text-sm mt-0.5">{history.length} Downloads gespeichert</p>
          </div>
          <div className="flex items-center gap-3">
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                disabled={clearing}
                className="text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-900/20"
              >
                {clearing ? "Lösche..." : "Verlauf löschen"}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {loading && (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            </div>
          )}

          {!loading && history.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-gray-500">Noch keine Downloads</p>
            </div>
          )}

          {!loading && history.length > 0 && (
            <div className="space-y-3">
              {history.map((entry) => (
                <div key={entry.id} className="glass rounded-2xl p-4 flex items-center gap-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden bg-black">
                    {entry.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={entry.thumbnail}
                        alt={entry.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                        <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold line-clamp-1">{entry.title}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{entry.channelTitle}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-md uppercase">
                        {entry.format}
                      </span>
                      <span className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-md">
                        {entry.quality}
                      </span>
                      <span className="text-xs text-gray-600">{formatDate(entry.downloadedAt)}</span>
                    </div>
                  </div>

                  {/* Re-download */}
                  <a
                    href={`/api/download?videoId=${entry.videoId}&quality=${entry.quality}&format=${entry.format}&title=${encodeURIComponent(entry.title)}`}
                    className="flex-shrink-0 p-2 rounded-lg hover:bg-red-900/20 text-gray-500 hover:text-red-400 transition-all"
                    title="Erneut herunterladen"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
