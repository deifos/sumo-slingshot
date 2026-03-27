# Changelog

All notable changes to Sumo Slingshot will be documented in this file.

## [0.5.0] - 2026-03-26

### Added
- Shareable room link in Lobby: `?join=CODE` URL shown below room code with one-click copy
- Opening a `?join=CODE` link pre-fills the join code on the landing screen so players can pick their avatar before joining
- OpenGraph / Twitter card meta tags with a branded 1200×630 OG image (`og.svg`)

### Fixed
- Emoji mode: slingshot pull-back indicator (dotted arc + aim line) now visible alongside hand skeleton
- Emoji mode: center green aim square always rendered on top
- Multiplayer collision: removed opponent network velocity from impulse calculation — bodies no longer fly away on contact; opponent is treated as a solid wall

## [0.4.0] - 2026-03-26

### Added
- Avatar picker on landing screen: choose between webcam or one of 6 emojis (🐼 🦊 🤖 👾 🐸 🦁)
- Emoji avatars sync to opponent in multiplayer via game state — opponent sees your chosen avatar in their box
- In emoji mode, hand skeleton drawn on the player box overlay (all 21 landmarks + connections, thumb/index tips highlighted) — full privacy maintained, no camera visible

### Fixed
- Multiplayer: remote opponent video now plays reliably — explicit `.play()` call after `srcObject` set, plus re-trigger on `addtrack` event (stream is often empty at attach time)
- Ghost launches: pinch release now requires 3 consecutive non-pinch frames before firing; single-frame hand-tracking dropouts no longer cause unintended launches (affects both solo and multiplayer)
- Ghost launch debounce counter bug: counter was resetting every other frame due to `wasPinching` going false after the first release frame — fixed by continuing to count while `releaseFrames > 0`
- Multiplayer: game no longer gets stuck after ring-out — each client only detects and reports their own ring-out; server-authoritative confirmation ends the game for both players

### Changed
- Player box size reduced (0.22 → 0.16 of arena width) for more open ring feel
- Physics tuned for heavier, less pinball-like feel: RESTITUTION 0.8 → 0.3, PLAYER_MASS 4 → 7, FRICTION 0.94 → 0.92

## [0.3.2] - 2026-03-26

### Added
- Footer with builder credit (Vlad → @deifosv on X), inspired-by credit (@measure_plan), GitHub repo link, and share button (Web Share API with X fallback)
- Custom favicon (sumo ring SVG)

### Fixed
- Multiplayer: opponent positions now sync correctly — state relays through PartyKit when WebRTC DataChannel isn't open yet, with automatic upgrade to direct P2P once connected
- Multiplayer: ICE candidates buffered when they arrive before remote description is set, then flushed — fixes connection failures in race-condition timing
- Multiplayer: lobby deadlock resolved — arena always mounts during lobby so camera/MediaPipe can initialize, `sendReady` now gated on camera being fully ready
- Multiplayer: MediaPipe BindingError on cleanup fixed by guarding `onFrame` callback after cancellation
- Solo: game no longer starts until MediaPipe camera is fully loaded ("LOADING CAMERA..." overlay shown)

## [0.3.1] - 2026-03-25

### Fixed
- Multiplayer: positions now sent as normalized ratios (0-1) instead of raw pixels, fixing cross-resolution play
- Multiplayer: collision only applies to your own body (one-sided), opponent is network-authoritative — prevents flying-off-screen feedback loop
- Multiplayer: camera gracefully handles non-HTTPS contexts (LAN play)

## [0.3.0] - 2026-03-24

### Added
- Phase 2: Multiplayer networking
- PartyKit signaling server with room codes (4-letter codes, 2 players per room)
- WebRTC peer connection for video streaming + DataChannel for game state
- Multiplayer arena with opponent webcam feed
- Game state sync at ~30hz with interpolation
- Ring-out detection with server confirmation
- Lobby screen: create room (shows copyable code) or join with code
- Rematch flow: both players must agree
- Landing screen updated with Create Room / Join Room buttons
- `npm run dev:party` and `npm run dev:all` scripts

### Changed
- CHANGELOG.md and version footer added to all screens

## [0.2.0] - 2026-03-24

### Changed
- Collisions now work while player is aiming (pinching) — player acts as immovable wall
- Both boxes flash red on collision (not just player)
- Bot retreats toward center when near ring edge instead of overshooting
- Bot force scales with distance (softer shots when close)
- Reduced bot launch force (0.05 -> 0.03)
- Increased friction (0.96 -> 0.94) for weightier feel
- Increased player mass (3 -> 4)
- Reduced restitution (0.85 -> 0.8) for less bouncy collisions
- Reduced camera resolution (1200 -> 640) for better performance
- Lighter hand tracking model (complexity 0, single hand)
- Bigger sumo ring (0.44 -> 0.48 radius ratio)

## [0.1.0] - 2026-03-24

### Added
- Phase 1: Single-player game in React
- Canvas-based game arena with circular sumo ring boundary
- Physics engine: friction, AABB collision, ring-out detection
- MediaPipe hand tracking with pinch-to-slingshot mechanic
- Mouse/touch fallback for slingshot input
- Bot opponent with timer-based AI
- Landing screen with Syne Mono branding
- Game flow: countdown (3..2..1..FIGHT) -> playing -> results
- HUD with score display
- Results screen with rematch/menu options
- Collision flash visual feedback
- Ring danger indicator when near edge
