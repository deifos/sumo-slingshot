# Slingshot Wars Multiplayer - Build Plan

Sumo-style multiplayer game: two players slingshot their webcam boxes at each other.
First to knock the other out of the arena wins.

Reference: `concept_game.html` (single-player slingshot prototype)

---

## Phase 1: Single-Player Game in React

Port the existing concept into the React/shadcn app as a playable solo experience.

### Task 1.1 — Game Arena Component
- Create `src/game/Arena.tsx` — full-screen canvas-based game stage
- Port physics engine from concept: friction, wall bounce, AABB collision
- Render the webcam box as a physics body inside the arena
- Draw the sumo ring boundary (circular or square arena with out-of-bounds zone)

### Task 1.2 — Hand Tracking Integration
- Integrate MediaPipe Hands into React (load via CDN or npm)
- Port pinch detection + smoothing logic from concept
- Slingshot mechanic: pinch to grab, drag to aim, release to fire
- Draw overlay (aiming line, pull-back circle) on a canvas layer

### Task 1.3 — Game UI Shell
- Landing screen with game title + "Create Room" / "Join Room" buttons (shadcn Button, Input)
- Game HUD: player indicators, round status
- Results overlay: winner/loser + rematch option (shadcn Dialog)
- Use Syne Mono font from concept for brand continuity
- Dark theme, minimal, clean — matches the concept aesthetic

### Task 1.4 — Solo Play Loop
- Add a bot/dummy opponent cam box with basic AI (random slingshots)
- Implement ring-out detection (if your box leaves bounds, you lose)
- Countdown before round starts (3.. 2.. 1.. FIGHT)
- Win/lose state + restart

---

## Phase 2: Multiplayer Networking

### Task 2.1 — PartyKit Signaling Server
- Set up `party/` directory with PartyKit server
- Room creation: generate 4-letter room codes
- Room joining: validate code, cap at 2 players per room
- Relay WebRTC signaling (SDP offers/answers, ICE candidates)
- Sync game coordination: both-ready, countdown, round-start

### Task 2.2 — WebRTC Peer Connection
- Establish peer connection between two players via PartyKit signaling
- Stream webcam video to opponent via RTCPeerConnection
- Open DataChannel for game state (position, velocity, pinch state)
- Handle connection failures gracefully (reconnect, timeout)
- STUN config (Google public STUN servers)

### Task 2.3 — Multiplayer Game State Sync
- Each player owns their own physics (authoritative over own cam box)
- Broadcast own state at ~30hz over DataChannel: { pos, vel, isPinching }
- Render opponent's cam box locally using received state (interpolation)
- Both clients independently detect ring-out
- Player who goes out of bounds sends "i lost" message; opponent confirms

### Task 2.4 — Lobby + Room Flow
- Create room -> show room code (big, copyable)
- Join room -> enter code -> connect
- Lobby: both players see their webcam preview, waiting for opponent
- When both connected: countdown -> game starts
- Post-game: rematch (both must agree) or leave

---

## Phase 3: Polish + Juice

### Task 3.1 — Visual Effects
- Screen shake on collision
- Particle burst on ring-out
- Cam border glow/flash on hit (from concept)
- Arena boundary pulse when a player is near the edge
- Smooth camera transitions between screens

### Task 3.2 — Audio
- Impact sounds on collision
- Slingshot stretch/release sounds
- Crowd roar or ring-out fanfare
- Keep it optional (mute by default, toggle on)

### Task 3.3 — Mobile + Touch Support
- Touch-based slingshot (drag to aim instead of hand tracking)
- Responsive arena sizing
- Fallback when no webcam available (avatar/color block)

---

## Phase 4: Future (if it picks up)

- Matchmaking queue (random opponent)
- Leaderboard / win streaks
- Custom arenas / skins
- Spectator mode
- Tournament brackets

---

## Stack

| Layer       | Tech                          |
|-------------|-------------------------------|
| Frontend    | Vite + React + Tailwind + shadcn |
| Hand Track  | MediaPipe Hands               |
| Signaling   | PartyKit (Cloudflare edge)    |
| P2P         | WebRTC (video + DataChannel)  |
| STUN        | Google public STUN servers    |
| TURN        | Cloudflare/Twilio free tier (if needed) |
| Hosting     | Vercel or Cloudflare Pages (free) |
| Cost        | $0                            |
