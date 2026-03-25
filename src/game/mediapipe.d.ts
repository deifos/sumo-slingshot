// Type declarations for MediaPipe CDN globals

interface HandLandmark {
  x: number
  y: number
  z: number
}

interface HandResults {
  multiHandLandmarks?: HandLandmark[][]
}

declare class Hands {
  constructor(config: { locateFile: (file: string) => string })
  setOptions(options: {
    maxNumHands: number
    modelComplexity: number
    minDetectionConfidence: number
    minTrackingConfidence: number
  }): void
  onResults(callback: (results: HandResults) => void): void
  send(input: { image: HTMLVideoElement }): Promise<void>
  close(): void
}

declare class Camera {
  constructor(
    video: HTMLVideoElement,
    config: {
      onFrame: () => Promise<void>
      width: number
      height: number
    },
  )
  start(): Promise<void>
  stop(): void
}
