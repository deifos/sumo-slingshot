import { useEffect, useRef } from "react"

export function useGameLoop(callback: () => void): void {
  const cbRef = useRef(callback)
  useEffect(() => {
    cbRef.current = callback
  })

  useEffect(() => {
    let id: number

    function loop() {
      cbRef.current()
      id = requestAnimationFrame(loop)
    }

    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])
}
