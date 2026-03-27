import { useEffect, useRef, type MutableRefObject, type RefObject } from "react"
import type { Vec2 } from "./types"
import { PINCH_THRESHOLD, PINCH_SMOOTH } from "./constants"

export interface PinchState {
  active: boolean
  pos: Vec2 | null
}

export interface HandTrackingResult {
  pinch: MutableRefObject<PinchState>
  landmarks: MutableRefObject<HandLandmark[][] | null>
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement("script")
    script.src = src
    script.crossOrigin = "anonymous"
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(script)
  })
}

async function loadMediaPipe(): Promise<void> {
  await loadScript(
    "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
  )
  await loadScript(
    "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js",
  )
}

export function useHandTracking(
  videoRef: RefObject<HTMLVideoElement | null>,
  onReady?: () => void,
): HandTrackingResult {
  const pinch = useRef<PinchState>({ active: false, pos: null })
  const landmarks = useRef<HandLandmark[][] | null>(null)
  const onReadyRef = useRef(onReady)
  useEffect(() => {
    onReadyRef.current = onReady
  })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let cancelled = false
    let handsInstance: Hands | null = null
    let cameraInstance: Camera | null = null

    async function init() {
      try {
        await loadMediaPipe()
      } catch {
        console.warn("MediaPipe failed to load — hand tracking disabled")
        // Fallback: just start webcam without hand tracking
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 640, facingMode: "user" },
          })
          if (!cancelled && video) {
            video.srcObject = stream
          }
        } catch {
          console.warn("Camera access denied")
        }
        return
      }

      if (cancelled) return

      // Set up MediaPipe Hands
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const HandsCtor = (window as any).Hands as typeof Hands
      const CameraCtor = (window as any).Camera as typeof Camera
      /* eslint-enable @typescript-eslint/no-explicit-any */

      handsInstance = new HandsCtor({
        locateFile: (f: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}`,
      })

      handsInstance.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.4,
      })

      let smoothed: Vec2 | null = null

      handsInstance.onResults((results: HandResults) => {
        if (
          !results.multiHandLandmarks ||
          results.multiHandLandmarks.length === 0
        ) {
          landmarks.current = null
          if (pinch.current.active) {
            // Released — keep last position for launch calculation
            pinch.current = { active: false, pos: pinch.current.pos }
          }
          return
        }
        landmarks.current = results.multiHandLandmarks

        // Find a pinching hand
        let activePinch: Vec2 | null = null
        for (const lm of results.multiHandLandmarks) {
          const thumb = lm[4]
          const index = lm[8]
          const mid: Vec2 = {
            x: (thumb.x + index.x) / 2,
            y: (thumb.y + index.y) / 2,
          }
          const dist = Math.hypot(thumb.x - index.x, thumb.y - index.y)
          if (dist < PINCH_THRESHOLD) {
            activePinch = mid
            break
          }
        }

        if (activePinch) {
          if (!pinch.current.active) {
            smoothed = activePinch
          } else {
            smoothed = {
              x:
                PINCH_SMOOTH * activePinch.x +
                (1 - PINCH_SMOOTH) * (smoothed?.x ?? activePinch.x),
              y:
                PINCH_SMOOTH * activePinch.y +
                (1 - PINCH_SMOOTH) * (smoothed?.y ?? activePinch.y),
            }
          }
          pinch.current = { active: true, pos: { ...smoothed } }
        } else if (pinch.current.active) {
          // Released — keep last position
          pinch.current = { active: false, pos: pinch.current.pos }
        }
      })

      cameraInstance = new CameraCtor(video!, {
        onFrame: async () => {
          if (cancelled || !handsInstance) return
          await handsInstance.send({ image: video! })
        },
        width: 640,
        height: 640,
      })

      try {
        await cameraInstance.start()
        onReadyRef.current?.()
      } catch {
        console.warn("Camera start failed")
      }
    }

    init()

    return () => {
      cancelled = true
      try {
        cameraInstance?.stop()
        handsInstance?.close()
      } catch {
        // Ignore cleanup errors
      }
      // Stop any direct streams
      if (video.srcObject instanceof MediaStream) {
        video.srcObject.getTracks().forEach((t) => t.stop())
      }
    }
  }, [videoRef])

  return { pinch, landmarks }
}
