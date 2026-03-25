interface CountdownProps {
  count: number
}

export function Countdown({ count }: CountdownProps) {
  const text = count > 0 ? count.toString() : "FIGHT!"

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <span
        key={text}
        className="font-game animate-in zoom-in-50 fade-in text-[clamp(3rem,18vmin,10rem)] leading-none font-bold tracking-tight text-white duration-300"
      >
        {text}
      </span>
    </div>
  )
}
