"use client";

export default function SetupGuide() {
  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-xl shadow-red-900/50">
            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">FreeTube</h1>
            <p className="text-red-400 text-sm">Copyright-Free Downloader</p>
          </div>
        </div>

        {/* Setup Card */}
        <div className="glass-dark rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-500/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L1 21h22L12 2zm0 3.5L20.5 19h-17L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" />
              </svg>
            </div>
            <h2 className="text-white font-bold text-xl">YouTube API Key benötigt</h2>
          </div>

          <p className="text-gray-400 mb-6 leading-relaxed">
            Um Videos zu suchen, benötigst du einen kostenlosen YouTube Data API v3 Schlüssel.
            Du kannst diesen in wenigen Minuten bei Google einrichten.
          </p>

          {/* Steps */}
          <div className="space-y-4 mb-8">
            {[
              {
                step: "1",
                title: "Google Cloud Console öffnen",
                desc: "Gehe zu console.developers.google.com und melde dich an.",
                link: "https://console.developers.google.com/",
                linkText: "console.developers.google.com →",
              },
              {
                step: "2",
                title: "Neues Projekt erstellen",
                desc: 'Klicke auf "Projekt auswählen" → "Neues Projekt" und gib einen Namen ein.',
              },
              {
                step: "3",
                title: "YouTube Data API v3 aktivieren",
                desc: 'Gehe zu "APIs & Dienste" → "Bibliothek" → suche "YouTube Data API v3" → aktivieren.',
              },
              {
                step: "4",
                title: "API Key generieren",
                desc: 'Gehe zu "APIs & Dienste" → "Anmeldedaten" → "Anmeldedaten erstellen" → "API-Schlüssel".',
              },
              {
                step: "5",
                title: "Key in .env eintragen",
                desc: "Öffne die .env Datei und füge deinen Schlüssel ein:",
                code: "YOUTUBE_API_KEY=dein_schluessel_hier",
              },
            ].map((s) => (
              <div key={s.step} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center">
                  <span className="text-red-400 text-sm font-bold">{s.step}</span>
                </div>
                <div className="flex-1 pt-0.5">
                  <p className="text-white font-semibold text-sm">{s.title}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{s.desc}</p>
                  {s.code && (
                    <code className="block mt-2 text-xs bg-black/50 border border-white/10 px-3 py-2 rounded-lg text-green-400 font-mono">
                      {s.code}
                    </code>
                  )}
                  {s.link && (
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red-400 text-xs mt-1 inline-block hover:text-red-300"
                    >
                      {s.linkText}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-green-900/10 border border-green-500/20">
            <p className="text-green-400 text-sm font-semibold mb-1">✓ Kostenlos & Unbegrenzt</p>
            <p className="text-gray-500 text-xs">
              Das kostenlose Kontingent der YouTube Data API v3 beinhaltet 10.000 Einheiten/Tag –
              mehr als genug für normale Nutzung.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
