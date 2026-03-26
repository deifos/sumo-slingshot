import { useCallback, useEffect, useRef, useState } from "react"
import PartySocket from "partysocket"
import type { MultiplayerState, PlayerNumber, RoomStatus } from "./multiplayer"

const PARTYKIT_HOST =
  import.meta.env.VITE_PARTYKIT_HOST ?? "sumo-slingshot.partykit.dev"

const STUN_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
}

const STATE_SEND_INTERVAL = 33 // ~30hz

export interface UseMultiplayerReturn {
  status: RoomStatus
  playerNumber: PlayerNumber
  remoteStream: MediaStream | null
  countdown: number
  opponentWantsRematch: boolean
  sendState: (state: MultiplayerState) => void
  sendReady: () => void
  sendRingOut: () => void
  sendRematchRequest: () => void
  disconnect: () => void
}

interface Options {
  roomCode: string
  localStream: MediaStream | null
  onGameStart: () => void
  onOpponentState: (state: MultiplayerState) => void
  onRingOutConfirmed: (iLost: boolean) => void
  onRematchConfirmed: () => void
}

export function useMultiplayer(options: Options): UseMultiplayerReturn {
  const {
    roomCode,
    localStream,
    onGameStart,
    onOpponentState,
    onRingOutConfirmed,
    onRematchConfirmed,
  } = options

  const [status, setStatus] = useState<RoomStatus>("connecting")
  const [playerNumber, setPlayerNumber] = useState<PlayerNumber>(1)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [countdown, setCountdown] = useState(0)
  const [opponentWantsRematch, setOpponentWantsRematch] = useState(false)

  const socketRef = useRef<PartySocket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const playerIdRef = useRef("")
  const lastSendTime = useRef(0)
  const pendingCandidates = useRef<RTCIceCandidateInit[]>([])

  // Stable refs for callbacks
  const onGameStartRef = useRef(onGameStart)
  const onOpponentStateRef = useRef(onOpponentState)
  const onRingOutConfirmedRef = useRef(onRingOutConfirmed)
  const onRematchConfirmedRef = useRef(onRematchConfirmed)
  useEffect(() => {
    onGameStartRef.current = onGameStart
    onOpponentStateRef.current = onOpponentState
    onRingOutConfirmedRef.current = onRingOutConfirmed
    onRematchConfirmedRef.current = onRematchConfirmed
  })

  // --- WebRTC setup helpers ---

  const setupDataChannel = useCallback((dc: RTCDataChannel) => {
    dcRef.current = dc
    dc.onmessage = (event) => {
      try {
        onOpponentStateRef.current(JSON.parse(event.data) as MultiplayerState)
      } catch {
        // ignore
      }
    }
  }, [])

  const createPeerConnection = useCallback(
    (socket: PartySocket, isHost: boolean) => {
      const pc = new RTCPeerConnection(STUN_SERVERS)
      pcRef.current = pc

      // Add local video tracks
      if (localStream) {
        for (const track of localStream.getTracks()) {
          pc.addTrack(track, localStream)
        }
      }

      // Receive remote video
      const remote = new MediaStream()
      setRemoteStream(remote)
      pc.ontrack = (event) => {
        for (const track of event.streams[0]?.getTracks() ?? []) {
          remote.addTrack(track)
        }
      }

      // ICE candidates -> relay through PartyKit
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.send(
            JSON.stringify({
              type: "signal",
              data: { type: "ice-candidate", candidate: event.candidate },
            }),
          )
        }
      }

      if (isHost) {
        // Host creates data channel + offer
        const dc = pc.createDataChannel("game", { ordered: false })
        setupDataChannel(dc)

        pc.createOffer().then((offer) => {
          pc.setLocalDescription(offer)
          socket.send(
            JSON.stringify({
              type: "signal",
              data: { type: "offer", sdp: offer },
            }),
          )
        })
      } else {
        // Guest receives data channel
        pc.ondatachannel = (event) => {
          setupDataChannel(event.channel)
        }
      }

      return pc
    },
    [localStream, setupDataChannel],
  )

  const handleSignal = useCallback(
    async (data: unknown) => {
      const pc = pcRef.current
      const socket = socketRef.current
      if (!pc || !socket) return

      const signal = data as
        | { type: "offer"; sdp: RTCSessionDescriptionInit }
        | { type: "answer"; sdp: RTCSessionDescriptionInit }
        | { type: "ice-candidate"; candidate: RTCIceCandidateInit }

      try {
        if (signal.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
          const answer = await pc.createAnswer()
          await pc.setLocalDescription(answer)
          socket.send(
            JSON.stringify({
              type: "signal",
              data: { type: "answer", sdp: answer },
            }),
          )
          // Flush any ICE candidates that arrived before the offer
          for (const candidate of pendingCandidates.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
          }
          pendingCandidates.current = []
        } else if (signal.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
          // Flush any ICE candidates that arrived before the answer
          for (const candidate of pendingCandidates.current) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate))
          }
          pendingCandidates.current = []
        } else if (signal.type === "ice-candidate") {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate))
          } else {
            // Buffer until remote description is set
            pendingCandidates.current.push(signal.candidate)
          }
        }
      } catch (err) {
        console.warn("WebRTC signal error:", err)
      }
    },
    [],
  )

  // --- Main connection effect ---

  useEffect(() => {
    if (!roomCode) return

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: roomCode.toUpperCase(),
    })
    socketRef.current = socket

    socket.addEventListener("message", (event) => {
      const msg = JSON.parse(event.data) as Record<string, unknown>

      switch (msg.type) {
        case "assigned":
          playerIdRef.current = msg.playerId as string
          setPlayerNumber(msg.playerNumber as PlayerNumber)
          setStatus("waiting")
          break

        case "player-joined": {
          if (msg.playerId !== playerIdRef.current) {
            setStatus("opponent-joined")
            // Player 1 (host) initiates WebRTC
            const isHost = (msg.playerNumber as number) === 2 // I'm host if the joiner is player 2
            createPeerConnection(socket, isHost)
          }
          break
        }

        case "player-left":
          setStatus("disconnected")
          pcRef.current?.close()
          pcRef.current = null
          dcRef.current = null
          pendingCandidates.current = []
          setRemoteStream(null)
          break

        case "room-full":
          setStatus("room-full")
          break

        case "signal":
          handleSignal(msg.data)
          break

        case "both-ready":
          setStatus("countdown")
          setCountdown(msg.countdown as number)
          break

        case "game-start":
          setStatus("playing")
          onGameStartRef.current()
          break

        case "ring-out-confirmed": {
          const iLost = (msg.loser as string) === playerIdRef.current
          onRingOutConfirmedRef.current(iLost)
          break
        }

        case "state":
          onOpponentStateRef.current(msg.data as MultiplayerState)
          break

        case "rematch-requested":
          setOpponentWantsRematch(true)
          break

        case "rematch-confirmed":
          setOpponentWantsRematch(false)
          onRematchConfirmedRef.current()
          break
      }
    })

    socket.addEventListener("close", () => {
      setStatus("disconnected")
    })

    return () => {
      socket.close()
      socketRef.current = null
      dcRef.current?.close()
      pcRef.current?.close()
      pcRef.current = null
      dcRef.current = null
    }
  }, [roomCode, createPeerConnection, handleSignal])

  // --- If I'm player 2 (joiner) and player 1 is already there ---
  // The "player-joined" message for player 1 arrives via "assigned" timing
  // We need to also handle the case where we join and the host is already there
  useEffect(() => {
    if (status === "waiting" && playerNumber === 2 && socketRef.current && !pcRef.current) {
      // I'm joining an existing room — host should already be there
      // Create peer connection as guest (not host)
      createPeerConnection(socketRef.current, false)
      setStatus("opponent-joined")
    }
  }, [status, playerNumber, createPeerConnection])

  // --- Public methods ---

  const sendState = useCallback((state: MultiplayerState) => {
    const now = performance.now()
    if (now - lastSendTime.current < STATE_SEND_INTERVAL) return
    lastSendTime.current = now

    const dc = dcRef.current
    if (dc?.readyState === "open") {
      dc.send(JSON.stringify(state))
    } else {
      // Fallback: relay through PartyKit when DataChannel isn't open yet
      socketRef.current?.send(JSON.stringify({ type: "state", data: state }))
    }
  }, [])

  const sendReady = useCallback(() => {
    socketRef.current?.send(JSON.stringify({ type: "ready" }))
  }, [])

  const sendRingOut = useCallback(() => {
    socketRef.current?.send(JSON.stringify({ type: "ring-out", loser: "self" }))
  }, [])

  const sendRematchRequest = useCallback(() => {
    socketRef.current?.send(JSON.stringify({ type: "rematch-request" }))
  }, [])

  const disconnect = useCallback(() => {
    dcRef.current?.close()
    pcRef.current?.close()
    socketRef.current?.close()
    dcRef.current = null
    pcRef.current = null
    socketRef.current = null
    setStatus("disconnected")
    setRemoteStream(null)
  }, [])

  return {
    status,
    playerNumber,
    remoteStream,
    countdown,
    opponentWantsRematch,
    sendState,
    sendReady,
    sendRingOut,
    sendRematchRequest,
    disconnect,
  }
}
