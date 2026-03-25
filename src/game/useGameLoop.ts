import { useEffect, useRef } from "react"

export function useGameLoop(callback: () => void): void {
  const cb = useRef(callback)
  cb.current = callback

  useEffect(() => {
    let id: number

    function loop() {
      cb.current()
      id = requestAnimationFrame(loop)
    }

    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])
}
