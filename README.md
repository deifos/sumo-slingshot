# Sumo Slingshot

A webcam-powered sumo battle game. Pinch to grab your webcam box, drag to aim, release to slingshot it at your opponent. Knock them out of the ring to win.

Play solo against a bot or create a room and battle a friend in real-time multiplayer.

## How It Works

Your webcam feed is rendered as a physics body inside a sumo ring. Using hand tracking (MediaPipe Hands), you pinch your fingers together to grab your box, pull back to aim, and release to launch. First player knocked out of the ring loses.

## Tech Stack

- **React 19** + **TypeScript** — UI and game shell
- **Vite** — dev server and build tooling
- **Tailwind CSS v4** — styling
- **shadcn/ui** — UI components
- **MediaPipe Hands** — real-time hand tracking via webcam
- **PartyKit** — multiplayer signaling server (room creation, game coordination)
- **WebRTC** — peer-to-peer video streaming and game state sync

## Getting Started

### Prerequisites

- Node.js (v18+)
- A webcam
- HTTPS is required for webcam access (Vite is configured with `basicSsl` for local dev)

### Install

```bash
npm install
```

### Run (Solo Play)

```bash
npm run dev
```

Opens the game at `https://localhost:5173`. Allow camera access when prompted.

### Run (Multiplayer)

Start both the Vite dev server and the PartyKit server:

```bash
npm run dev:all
```

Or run them separately in two terminals:

```bash
npm run dev          # Vite frontend
npm run dev:party    # PartyKit server
```

### Build

```bash
npm run build
```

### Lint & Format

```bash
npm run lint
npm run format
npm run typecheck
```

## Game Controls

1. Show your hand to the webcam
2. Pinch your thumb and index finger together to grab your box
3. Drag to aim (pull back like a slingshot)
4. Release the pinch to launch
5. Knock your opponent out of the ring to win

## Multiplayer

- **Create Room** — generates a 4-letter room code to share
- **Join Room** — enter a friend's room code to connect
- Video and game state are synced peer-to-peer via WebRTC

## Credits

Original concept by [@measure_plan](https://x.com/measure_plan) on X.

## License

MIT
