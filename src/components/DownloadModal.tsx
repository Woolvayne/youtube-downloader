"use client";

import { useState, useEffect } from "react";
import type { YouTubeVideo } from "@/app/api/search/route";
import type { VideoFormat } from "@/app/api/video-info/route";

interface DownloadModalProps {
  video: YouTubeVideo;
  onClose: () => void;
}

type DownloadState = "idle" | "fetching-info" | "ready" | "downloading" | "done" | "error";

export default function DownloadModal({ video, onClose }: DownloadModalProps) {
  const [state, setState] = useState<DownloadState>("fetching-info");
  const [formats, setFormats] = useState<VideoFormat[]>([]);
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    async function fetchInfo() {
      try {
        const res = await fetch(`/api/video-info?videoId=${video.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Info-Fehler");
        setFormats(data.formats || []);
        setSelectedFormat(data.formats?.[0] || null);
        setState("ready");
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Fehler beim Laden");
        setState("error");
      }
    }
    fetchInfo();
  }, [video.id]);

  const handleDownload = async () => {
    if (!selectedFormat) return;
    setState("downloading");
    setProgress(0);

    const isAudio = selectedFormat.type === "audio";

    // Save to history
    try {
      await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId: video.id,
          title: video.title,
          channelTitle: video.channelTitle,
          thumbnail: video.thumbnail,
          duration: video.duration,
          quality: selectedFormat.quality,
          format: isAudio ? "mp3" : "mp4",
        }),
      });
    } catch {
      // Non-fatal
    }

    // Simulate progress while downloading
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + Math.random() * 8;
      });
    }, 600);

    try {
      const params = new URLSearchParams({
        videoId: video.id,
        quality: selectedFormat.quality,
        format: isAudio ? "mp3" : "mp4",
        title: video.title,
      });

      const res = await fetch(`/api/download?${params}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Download fehlgeschlagen" }));
        throw new Error(err.error || "Download fehlgeschlagen");
      }

      // Stream download via blob
      const blob = await res.blob();
      clearInterval(interval);
      setProgress(100);

      const ext = isAudio ? "m4a" : "mp4";
      const safeName = video.title.replace(/[^a-zA-Z0-9\-_\s]/g, "").trim().substring(0, 60) || "video";
      const filename = `${safeName}.${ext}`;

      // Safari-compatible download trigger
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      setState("done");
    } catch (err) {
      clearInterval(interval);
      setErrorMsg(err instanceof Error ? err.message : "Download fehlgeschlagen");
      setState("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative glass-dark rounded-3xl max-w-lg w-full shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex gap-4 flex-1 min-w-0">
              {/* Thumbnail */}
              {video.thumbnail && (
                <div className="flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0">
                <h3 className="text-white font-bold text-sm leading-tight line-clamp-2 mb-1">
                  {video.title}
                </h3>
                <p className="text-gray-500 text-xs">{video.channelTitle}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-xs bg-green-600/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full">
                    ✓ Creative Commons
                  </span>
                  {video.duration && (
                    <span className="text-xs text-gray-600">{video.duration}</span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Loading Info */}
          {state === "fetching-info" && (
            <div className="flex flex-col items-center py-8 gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
              <p className="text-gray-400 text-sm">Lade verfügbare Qualitäten...</p>
            </div>
          )}

          {/* Error */}
          {state === "error" && (
            <div className="py-6 text-center">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-900/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
              </div>
              <p className="text-red-400 font-semibold mb-1">Fehler</p>
              <p className="text-gray-500 text-sm">{errorMsg}</p>
              <button
                onClick={onClose}
                className="mt-4 px-6 py-2 rounded-xl glass text-gray-300 text-sm hover:text-white transition-all"
              >
                Schließen
              </button>
            </div>
          )}

          {/* Ready – Format Selection */}
          {state === "ready" && (
            <div>
              <p className="text-gray-400 text-sm font-medium mb-3">Format & Qualität wählen:</p>

              {/* Video Formats */}
              <div className="space-y-2">
                {formats
                  .filter((f) => f.type === "video")
                  .map((fmt) => (
                    <label key={fmt.formatId} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="format"
                        checked={selectedFormat?.formatId === fmt.formatId}
                        onChange={() => setSelectedFormat(fmt)}
                        className="w-4 h-4 accent-red-500"
                      />
                      <div
                        className={`flex-1 flex items-center justify-between p-3 rounded-xl border transition-all ${
                          selectedFormat?.formatId === fmt.formatId
                            ? "border-red-500/60 bg-red-900/20"
                            : "border-white/5 bg-white/5 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-red-400">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                            </svg>
                          </span>
                          <div>
                            <p className="text-white text-sm font-semibold">{fmt.label}</p>
                            <p className="text-gray-500 text-xs">{fmt.resolution} · MP4</p>
                          </div>
                        </div>
                        {fmt.quality === "1080p" && (
                          <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                            Empfohlen
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
              </div>

              {/* Audio Formats */}
              {formats.filter((f) => f.type === "audio").length > 0 && (
                <>
                  <p className="text-gray-600 text-xs font-medium mt-4 mb-2">NUR AUDIO</p>
                  <div className="space-y-2">
                    {formats
                      .filter((f) => f.type === "audio")
                      .map((fmt) => (
                        <label key={fmt.formatId} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="format"
                            checked={selectedFormat?.formatId === fmt.formatId}
                            onChange={() => setSelectedFormat(fmt)}
                            className="w-4 h-4 accent-red-500"
                          />
                          <div
                            className={`flex-1 flex items-center gap-3 p-3 rounded-xl border transition-all ${
                              selectedFormat?.formatId === fmt.formatId
                                ? "border-red-500/60 bg-red-900/20"
                                : "border-white/5 bg-white/5 hover:border-white/20"
                            }`}
                          >
                            <span className="text-orange-400">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                              </svg>
                            </span>
                            <div>
                              <p className="text-white text-sm font-semibold">{fmt.label}</p>
                              <p className="text-gray-500 text-xs">M4A · Beste Qualität</p>
                            </div>
                          </div>
                        </label>
                      ))}
                  </div>
                </>
              )}

              {/* Download Button */}
              <button
                onClick={handleDownload}
                disabled={!selectedFormat}
                className="w-full mt-6 btn-primary py-3.5 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Herunterladen
              </button>
            </div>
          )}

          {/* Downloading */}
          {state === "downloading" && (
            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-white font-semibold text-sm">Download läuft...</p>
                <p className="text-gray-400 text-sm">{Math.round(Math.min(progress, 99))}%</p>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 progress-bar rounded-full"
                  style={{ width: `${Math.min(progress, 99)}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs mt-3 text-center">
                Bitte warte – das Video wird verarbeitet und heruntergeladen.
              </p>
              <p className="text-gray-600 text-xs text-center mt-1">
                Größere Dateien können einige Minuten dauern.
              </p>
            </div>
          )}

          {/* Done */}
          {state === "done" && (
            <div className="py-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-900/20 border border-green-500/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
              <h4 className="text-white font-bold text-lg mb-1">Download abgeschlossen!</h4>
              <p className="text-gray-400 text-sm mb-6">
                Die Datei wurde in deinen Downloads-Ordner gespeichert.
              </p>
              <button
                onClick={onClose}
                className="btn-primary px-8 py-2.5 rounded-xl text-white font-semibold"
              >
                Fertig
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
