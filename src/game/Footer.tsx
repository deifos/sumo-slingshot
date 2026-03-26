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
            className="font-game text-[10px] tracking-widest text-white/30 transition-opacity hover:text-white/60"
          >
            GITHUB
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
