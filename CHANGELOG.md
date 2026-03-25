# Changelog

All notable changes to Sumo Slingshot will be documented in this file.

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
