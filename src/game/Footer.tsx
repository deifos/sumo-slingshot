export function Footer() {
  const handleShare = () => {
    const url = window.location.href
    const text = "Play Sumo Slingshot — webcam sumo battle powered by hand tracking!"
    if (navigator.share) {
      navigator.share({ title: "Sumo Slingshot", url, text }).catch(() => null)
    } else {
      window.open(
        `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        "_blank",
      )
    }
  }

  return (
    <footer className="w-full border-t border-white/10 bg-black px-6 py-4">
      <div className="mx-auto flex flex-col items-center justify-between gap-3 sm:flex-row">
        {/* Built by */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-game text-[10px] tracking-widest text-white/30">
              BUILT BY
            </span>
            <a
              href="https://x.com/deifosv"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-opacity hover:opacity-80"
            >
              <img
                src="/vlad-pfp.jpg"
                alt="Vlad"
                width={20}
                height={20}
                className="rounded-full border border-white/20"
              />
              <span className="font-game text-[10px] tracking-widest text-white/60">
                VLAD
              </span>
            </a>
          </div>
          <span className="hidden text-white/20 sm:inline">•</span>
          <div className="flex items-center gap-1.5">
            <span className="font-game text-[10px] tracking-widest text-white/30">
              INSPIRED BY
            </span>
            <a
              href="https://x.com/measure_plan"
              target="_blank"
              rel="noopener noreferrer"
              className="font-game text-[10px] tracking-widest text-white/60 transition-opacity hover:opacity-80"
            >
              @MEASURE_PLAN
            </a>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* GitHub */}
          <a
            href="https://github.com/deifos/sumo-slingshot"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-white/30 transition-opacity hover:text-white/60"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span className="font-game text-[10px] tracking-widest">GITHUB</span>
          </a>
          <span className="text-white/20">•</span>
          {/* Share */}
          <button
            onClick={handleShare}
            className="font-game flex items-center gap-2 border border-white/20 px-4 py-1.5 text-[10px] tracking-widest text-white/50 transition-all hover:border-[#c2fe0b]/40 hover:text-[#c2fe0b]"
          >
            SHARE
          </button>
        </div>
      </div>
    </footer>
  )
}
