import { useState, useRef, useCallback, useEffect } from "react";
import {
  Room,
  RoomEvent,
  Track,
  type Participant,
} from "livekit-client";
import type { User, ChatMessage, Stats, Keybind, HostSettings, ScreenShareUser, WhiteboardStroke } from "../types";
import { sounds } from "../utils/sounds";
import { getUserColor } from "../utils/colors";
import type { ScreenShareSettings } from "../utils/screenShare";
import { parseResolution } from "../utils/screenShare";

const TOKEN_URL = import.meta.env.VITE_TOKEN_URL || "https://connect-token.kadvabh.workers.dev";

const DEFAULT_KEYBINDS: Keybind[] = [
  { id: "toggle-mic", label: "Toggle Mic", keys: "Ctrl+Shift+M" },
  { id: "toggle-cam", label: "Toggle Cam", keys: "Ctrl+Shift+C" },
  { id: "toggle-deafen", label: "Toggle Deafen", keys: "Ctrl+Shift+D" },
];

const DEFAULT_HOST_SETTINGS: HostSettings = {
  disableChat: false,
  muteEveryone: false,
  disableCameras: false,
  chatSlowdown: false,
  disableWhiteboard: false,
  disableWhiteboardDrawing: false,
  deafenEveryone: false,
}

interface UseLiveKitOptions {
  username: string;
  roomName: string;
  isHostCreator?: boolean;
}

function participantToUser(participant: Participant, hostIdentity: string): User {
  return {
    id: participant.identity,
    name: participant.name || participant.identity,
    micOn: participant.isMicrophoneEnabled,
    camOn: participant.isCameraEnabled,
    handRaising: participant.isSpeaking,
    audioLevel: Math.round((participant.audioLevel ?? 0) * 100),
    volume: 80,
    localVideoDisabled: false,
    localScreenshareDisabled: false,
    isHost: participant.identity === hostIdentity,
    color: getUserColor(participant.identity),
    connectionQuality: 0, // Will be updated later
    isDeafened: false, // Default false, will be updated
    isMutedLocally: false,
  };
}

function syncUserFromParticipant(prev: User[], participant: Participant, hostIdentity: string, localConnectionQuality: number): User[] {
  const identity = participant.identity;
  const existing = prev.find((u) => u.id === identity);
  // Use local connection quality for local participant, otherwise keep existing or default to good
  const isLocal = participant.isLocal || false;
  const connectionQuality = isLocal ? localConnectionQuality : (existing?.connectionQuality ?? 5);
  const updated = {
    ...(existing ?? participantToUser(participant, hostIdentity)),
    micOn: participant.isMicrophoneEnabled,
    camOn: participant.isCameraEnabled,
    isSharing: participant.isScreenShareEnabled,
    handRaised: existing?.handRaised ?? false,
    isSpeaking: participant.isSpeaking,
    audioLevel: Math.round((participant.audioLevel ?? 0) * 100),
    isHost: identity === hostIdentity,
    connectionQuality,
    color: existing?.color ?? getUserColor(participant.identity), // Preserve or generate color
    isDeafened: existing?.isDeafened ?? false,
    isMutedLocally: existing?.isMutedLocally ?? false,
  };
  if (!existing) return [...prev, updated];
  return prev.map((u) => (u.id === identity ? updated : u));
}

export function useLiveKit({ username, roomName, isHostCreator = false }: UseLiveKitOptions) {
  const roomRef = useRef<Room | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [hostIdentity, setHostIdentity] = useState<string>(isHostCreator ? username : "");
  const isHostCreatorRef = useRef(isHostCreator);
  isHostCreatorRef.current = isHostCreator;
  const [connectionState, setConnectionState] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isRaisedHand, setIsRaisedHand] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [keybinds, setKeybinds] = useState<Keybind[]>(DEFAULT_KEYBINDS);
  const [hostSettings, setHostSettings] = useState<HostSettings>(DEFAULT_HOST_SETTINGS);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [micGain, setMicGainState] = useState(100);
  const [screenShares, setScreenShares] = useState<ScreenShareUser[]>([]);
  const micGainRef = useRef(micGain);
  micGainRef.current = micGain;
  
  // Whiteboard callbacks
  const whiteboardCallbacks = useRef<((type: 'stroke', stroke: WhiteboardStroke) => void)[]>([]);
  const whiteboardClearCallbacks = useRef<(() => void)[]>([]);
  
  const subscribeWhiteboard = useCallback((onStroke: (stroke: WhiteboardStroke) => void, onClear: () => void) => {
    whiteboardCallbacks.current.push(onStroke);
    whiteboardClearCallbacks.current.push(onClear);
    return () => {
      whiteboardCallbacks.current = whiteboardCallbacks.current.filter(cb => cb !== onStroke);
      whiteboardClearCallbacks.current = whiteboardClearCallbacks.current.filter(cb => cb !== onClear);
    };
  }, []);
  
  // Mic gain setter for UI - actual gain applied via track processors in LiveKit
  const setMicGain = useCallback((gain: number) => {
    const clamped = Math.max(0, Math.min(200, gain));
    setMicGainState(clamped);
    micGainRef.current = clamped;
    // Note: Actual gain application requires LiveKit track processors
    // This is a placeholder for the UI state
  }, []);
  const sentMessageIds = useRef<Set<string>>(new Set());
  const hostIdentityRef = useRef(hostIdentity);
  hostIdentityRef.current = hostIdentity;
  const connectionQualityRef = useRef(5);

  const publishData = useCallback(async (payload: object) => {
    const room = roomRef.current;
    if (!room) return;
    const data = new TextEncoder().encode(JSON.stringify(payload));
    await room.localParticipant.publishData(data, { reliable: true });
  }, []);

  const announceHost = useCallback(async () => {
    if (!isHostCreatorRef.current || !hostIdentityRef.current) return;
    await publishData({ type: "hostIdentity", identity: hostIdentityRef.current });
  }, [publishData]);

  const refreshDevices = useCallback(async () => {
    try {
      // Try to get current state of mic/cam without prompting if possible
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: false
      }).catch(() => null);

      // Get tracks to see what we have access to
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Now enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices()
      setAudioDevices(devices.filter((d) => d.kind === "audioinput"))
      setVideoDevices(devices.filter((d) => d.kind === "videoinput"))
    } catch (error) {
      console.warn('Could not enumerate media devices:', error);
      // Try alternate approach - just enumerate without attempting access first
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        setAudioDevices(devices.filter((d) => d.kind === "audioinput"))
        setVideoDevices(devices.filter((d) => d.kind === "videoinput"))
      } catch (enumError) {
        console.error('Failed to enumerate devices even with fallback:', enumError);
        // Set empty arrays but don't fail silently
        setAudioDevices([])
        setVideoDevices([])
      }
    }
  }, [])

  // Also refresh devices on mount
  useEffect(() => {
    refreshDevices()
    // Listen for device changes
    navigator.mediaDevices.addEventListener?.('devicechange', refreshDevices)
    return () => {
      navigator.mediaDevices.removeEventListener?.('devicechange', refreshDevices)
    }
  }, [refreshDevices])

  const addOrUpdateUser = useCallback((participant: Participant) => {
    setUsers((prev) => syncUserFromParticipant(prev, participant, hostIdentityRef.current, connectionQualityRef.current));
  }, []);

  const removeUser = useCallback((identity: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== identity));
    sounds.participantLeave();
  }, []);

  const handleDataMessage = useCallback(
    async (data: Uint8Array, participant?: Participant) => {
      try {
        const message = JSON.parse(new TextDecoder().decode(data));
        const sender = participant
          ? participant.name || participant.identity
          : "Unknown";

        if (message.type === "chat") {
          if (sentMessageIds.current.has(message.id)) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === message.id)) return prev;
            return [
              ...prev,
              {
                id: message.id || Date.now().toString(),
                sender,
                content: message.message,
                timestamp: message.timestamp || Date.now(),
                isImage: message.isImage,
                imageData: message.imageData,
              },
            ];
          });
          if (participant?.identity !== roomRef.current?.localParticipant.identity) {
            sounds.message();
          }
        }

        if (message.type === "handRaise") {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === message.identity
                ? { ...u, handRaised: message.value }
                : u
            )
          );
          if (participant?.identity !== roomRef.current?.localParticipant.identity) {
            message.value ? sounds.handRaise() : sounds.handLower();
          }
        }

        if (message.type === "deafen") {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === message.identity
                ? { ...u, isDeafened: message.value }
                : u
            )
          );
          if (participant?.identity !== roomRef.current?.localParticipant.identity) {
            message.value ? sounds.deafen() : sounds.undeafen();
          }
        }

        if (message.type === "hostIdentity" && message.identity) {
          setHostIdentity((prev) => prev || message.identity);
          setUsers((prev) =>
            prev.map((u) => ({ ...u, isHost: u.id === message.identity }))
          );
        }

        if (message.type === "hostSettings") {
          setHostSettings(message.settings);
        }

        if (message.type === "hostAction") {
          const room = roomRef.current;
          if (!room || participant?.identity === room.localParticipant.identity) return;
          const local = room.localParticipant;
          if (message.action === "muteAll") {
            local.setMicrophoneEnabled(false);
            setIsMicOn(false);
            sounds.mute();
          }
          if (message.action === "disableCameras") {
            local.setCameraEnabled(false);
            setIsCamOn(false);
          }
          if (message.action.startsWith("lowerHand:")) {
            const targetId = message.action.split(":")[1];
            if (targetId === local.identity) {
              setIsRaisedHand(false);
              setUsers((prev) => prev.map((u) => (u.id === targetId ? { ...u, handRaised: false } : u)));
              sounds.handLower();
            }
          }
          if (message.action.startsWith("muteParticipant:")) {
            const targetId = message.action.split(":")[1];
            if (targetId === local.identity) {
              local.setMicrophoneEnabled(false);
              setIsMicOn(false);
              sounds.mute();
            }
          }
          if (message.action.startsWith("disableVideo:")) {
            const targetId = message.action.split(":")[1];
            if (targetId === local.identity) {
              local.setCameraEnabled(false);
              setIsCamOn(false);
            }
          }
          if (message.action === "deafenEveryone") {
            // Set all users except self to deafened
            setUsers((prev) =>
              prev.map((u) =>
                u.id === roomRef.current?.localParticipant.identity
                  ? { ...u, isDeafened: false } // Self is never deafened by this command
                  : { ...u, isDeafened: true }
              )
            );
            // Update local state to reflect that others are deafened (but we can still hear ourselves)
            // Actually, this is tricky - when a host deafens everyone, it typically means
            // they can't hear anyone, including themselves in some implementations
            // For simplicity, we'll just update the UI to show the deafened state
            setIsDeafened(true);
            sounds.deafen();
          }
          if (message.action === "undeafenEveryone") {
            // Undo the deafening effect for everyone
            setUsers((prev) =>
              prev.map((u) => ({ ...u, isDeafened: false }))
            );
            // Update local state
            setIsDeafened(false);
            sounds.undeafen();
          }
          if (message.type === "userColor" && message.color && message.identity) {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === message.identity ? { ...u, color: message.color } : u
              )
            );
          }

          if (message.type === "deafen" && message.identity !== undefined) {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === message.identity
                  ? { ...u, isDeafened: message.value }
                  : u
              )
            );
          }

            // Play sound for self if we're the one being deafened/undeafened
            if (participant?.identity === roomRef.current?.localParticipant.identity) {
              message.value ? sounds.deafen() : sounds.undeafen();
            }
          }

        if (message.type === "whiteboardStroke" && message.stroke) {
          whiteboardCallbacks.current.forEach(cb => cb(message.stroke!));
        }

        if (message.type === "whiteboardClear") {
          whiteboardClearCallbacks.current.forEach(cb => cb());
        }
      } catch (e) {
        console.error("Failed to parse data message", e);
      }
    },
    []
  );

  const connect = useCallback(
    async (enableMic = true, enableCam = true) => {
      setConnectionState("connecting");
      setError(null);
      setMessages([]);
      setUsers([]);
      sentMessageIds.current.clear();

      try {
        const res = await fetch(TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomName, participantName: username }),
        });

        if (!res.ok) throw new Error("Failed to get token");

        const { token, url } = await res.json();

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });

        room.on(RoomEvent.ParticipantConnected, (p) => {
          addOrUpdateUser(p);
          if (p.identity !== room.localParticipant.identity) {
            sounds.participantJoin();
          }
          void announceHost();
        });
        room.on(RoomEvent.ParticipantDisconnected, (p) => removeUser(p.identity));

        room.on(RoomEvent.TrackMuted, (_pub, participant) => addOrUpdateUser(participant));
        room.on(RoomEvent.TrackUnmuted, (_pub, participant) => addOrUpdateUser(participant));

        room.on(RoomEvent.TrackPublished, (pub, participant) => {
          addOrUpdateUser(participant);
          if (pub.source === Track.Source.ScreenShare) {
            const ssUser: ScreenShareUser = {
              id: `${participant.identity}-screenshare`,
              presenterId: participant.identity,
              presenterName: participant.name || participant.identity,
              presenterColor: getUserColor(participant.identity),
              isSpeaking: participant.isSpeaking,
              audioLevel: Math.round((participant.audioLevel ?? 0) * 100),
              isLocal: participant.isLocal,
            };
            setScreenShares(prev => [...prev.filter(s => s.id !== ssUser.id), ssUser]);
            if (participant.identity === room.localParticipant.identity) setIsSharing(true);
            else sounds.screenShareStart();
          }
        });

        room.on(RoomEvent.TrackUnpublished, (pub, participant) => {
          addOrUpdateUser(participant);
          if (pub.source === Track.Source.ScreenShare) {
            setScreenShares(prev => prev.filter(s => s.id !== `${participant.identity}-screenshare`));
            setUsers((prev) =>
              prev.map((u) =>
                u.id === participant.identity ? { ...u, isSharing: false } : u
              )
            );
            if (participant.identity === room.localParticipant.identity) setIsSharing(false);
            else sounds.screenShareStop();
          }
        });

        room.on(RoomEvent.LocalTrackPublished, () => {
          const local = room.localParticipant;
          setIsMicOn(local.isMicrophoneEnabled);
          setIsCamOn(local.isCameraEnabled);
          setIsSharing(local.isScreenShareEnabled);
          addOrUpdateUser(local);
        });

        room.on(RoomEvent.LocalTrackUnpublished, () => {
          const local = room.localParticipant;
          setIsMicOn(local.isMicrophoneEnabled);
          setIsCamOn(local.isCameraEnabled);
          setIsSharing(local.isScreenShareEnabled);
          addOrUpdateUser(local);
        });

        let levelInterval: ReturnType<typeof setInterval> | undefined;
        let statsInterval: ReturnType<typeof setInterval> | undefined;

        room.on(RoomEvent.Disconnected, () => {
          if (levelInterval) clearInterval(levelInterval);
          if (statsInterval) clearInterval(statsInterval);
          setConnectionState("disconnected");
          setUsers([]);
          setScreenShares([]);
          setStats(null);
          roomRef.current = null;
          setRoom(null);
        });

        room.on(RoomEvent.ConnectionStateChanged, (state) => {
          setConnectionState(state === "connected" ? "connected" : "connecting");
        });

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          const speakerIds = new Set(speakers.map((s) => s.identity));
          setUsers((prev) =>
            prev.map((u) => ({
              ...u,
              isSpeaking: speakerIds.has(u.id),
              audioLevel: (() => {
                const p =
                  u.id === room.localParticipant.identity
                    ? room.localParticipant
                    : room.remoteParticipants.get(u.id);
                return p ? Math.round((p.audioLevel ?? 0) * 100) : u.audioLevel;
              })(),
            }))
          );
          // Also update screen shares
          setScreenShares((prev) =>
            prev.map((ss) => {
              const p = ss.presenterId === room.localParticipant.identity
                ? room.localParticipant
                : room.remoteParticipants.get(ss.presenterId);
              if (!p) return ss;
              return {
                ...ss,
                isSpeaking: speakerIds.has(ss.presenterId),
                audioLevel: Math.round((p.audioLevel ?? 0) * 100),
              };
            })
          );
        });

        levelInterval = setInterval(() => {
          const all: Participant[] = [
            room.localParticipant,
            ...Array.from(room.remoteParticipants.values()),
          ];
          setUsers((prev) =>
            prev.map((u) => {
              const p = all.find((x) => x.identity === u.id);
              if (!p) return u;
              return {
                ...u,
                isSpeaking: p.isSpeaking,
                audioLevel: Math.round((p.audioLevel ?? 0) * 100),
              };
            })
          );
          // Also update screen shares
          setScreenShares((prev) =>
            prev.map((ss) => {
              const p = all.find((x) => x.identity === ss.presenterId);
              if (!p) return ss;
              return {
                ...ss,
                isSpeaking: p.isSpeaking,
                audioLevel: Math.round((p.audioLevel ?? 0) * 100),
              };
            })
          );
        }, 150);

        statsInterval = setInterval(async () => {
          try {
            const local = room.localParticipant;
            const micPub = local.getTrackPublication(Track.Source.Microphone);
            const camPub = local.getTrackPublication(Track.Source.Camera);
            const ssPub = local.getTrackPublication(Track.Source.ScreenShare);

            const camSettings = camPub?.track?.mediaStreamTrack?.getSettings();
            const ssSettings = ssPub?.track?.mediaStreamTrack?.getSettings();

            let audioPacketLoss = 0;
            let audioJitter = 0;
            let audioLatency = 0;
            let videoPacketLoss = 0;
            let videoJitter = 0;

            const micTrack = micPub?.track;
            if (micTrack && "getRTCStatsReport" in micTrack) {
              const report = await (micTrack as { getRTCStatsReport: () => Promise<RTCStatsReport> }).getRTCStatsReport();
              report.forEach((stat) => {
                if (stat.type === "inbound-rtp" && stat.kind === "audio") {
                  audioPacketLoss = Math.round((stat.packetsLost ?? 0) / Math.max(1, (stat.packetsReceived ?? 0) + (stat.packetsLost ?? 0)) * 1000) / 10;
                  audioJitter = Math.round((stat.jitter ?? 0) * 1000);
                }
                if (stat.type === "candidate-pair" && stat.state === "succeeded") {
                  audioLatency = Math.round(stat.currentRoundTripTime ? stat.currentRoundTripTime * 1000 : 0);
                }
              });
            }

            // Get connection quality from room (0-5, higher is better)
            let connectionQuality = 5;
            try {
              // @ts-ignore - connectionQuality might not be typed
              const cq = room.connectionQuality;
              connectionQuality = typeof cq === 'number' ? Math.max(0, Math.min(5, cq)) : 5;
            } catch {
              connectionQuality = 5;
            }

            setStats({
              audio: {
                inputLevel: Math.round((local.audioLevel ?? 0) * 100),
                outputLevel: Math.round((local.audioLevel ?? 0) * 100),
                packetLoss: audioPacketLoss,
                jitter: audioJitter,
                latency: audioLatency,
              },
              video: {
                width: camSettings?.width ?? 0,
                height: camSettings?.height ?? 0,
                frameRate: camSettings?.frameRate ?? 0,
                packetLoss: videoPacketLoss,
                jitter: videoJitter,
              },
              screenShare: {
                width: ssSettings?.width ?? 0,
                height: ssSettings?.height ?? 0,
                frameRate: ssSettings?.frameRate ?? 0,
                packetLoss: 0,
                jitter: 0,
              },
              connectionQuality,
            });
            connectionQualityRef.current = connectionQuality;
          } catch {
            // Stats collection is best-effort
          }
        }, 2000);

        room.on(RoomEvent.DataReceived, handleDataMessage);

        await room.connect(url, token);
        roomRef.current = room;
        setRoom(room);

        if (enableMic) await room.localParticipant.setMicrophoneEnabled(true);
        if (enableCam) await room.localParticipant.setCameraEnabled(true);

        setIsMicOn(room.localParticipant.isMicrophoneEnabled);
        setIsCamOn(room.localParticipant.isCameraEnabled);

        addOrUpdateUser(room.localParticipant);
        room.remoteParticipants.forEach((p) => addOrUpdateUser(p));

        if (isHostCreator) {
          setHostIdentity(username);
          await announceHost();
        }

        await refreshDevices();
        sounds.join();
        setConnectionState("connected");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connection failed");
        setConnectionState("disconnected");
      }
    },
    [roomName, username, isHostCreator, addOrUpdateUser, removeUser, handleDataMessage, refreshDevices, announceHost]
  );

  const disconnect = useCallback(() => {
    sounds.leave();
    roomRef.current?.disconnect();
    roomRef.current = null;
    setRoom(null);
    setConnectionState("disconnected");
    setIsMicOn(false);
    setIsCamOn(false);
    setIsSharing(false);
    setIsRaisedHand(false);
    setMessages([]);
    setStats(null);
    setHostSettings(DEFAULT_HOST_SETTINGS);
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      const room = roomRef.current;
      if (!room || connectionState !== "connected") return;
      if (hostSettings.disableChat) return;

      try {
        // Check if message contains an image
        const imageMatch = message.match(/\[img:([^\]]+)\]/)
        const isImage = !!imageMatch
        const imageData = imageMatch ? imageMatch[1] : undefined
        const cleanMessage = isImage ? message.replace(/\[img:[^\]]+\]/, '').trim() : message

        const chatMessage = {
          type: "chat",
          message: cleanMessage || (isImage ? '[Image]' : ''),
          imageData,
          isImage,
          timestamp: Date.now(),
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        };

        sentMessageIds.current.add(chatMessage.id);

        await publishData(chatMessage);

        setMessages((prev) => [
          ...prev,
          {
            id: chatMessage.id,
            sender: username,
            content: cleanMessage || (isImage ? '' : message),
            timestamp: chatMessage.timestamp,
            isImage,
            imageData,
          },
        ]);
      } catch (err) {
        console.error("Failed to send message", err);
      }
    },
    [connectionState, publishData, username, hostSettings.disableChat]
  );

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !isMicOn;
    await room.localParticipant.setMicrophoneEnabled(next);
    setIsMicOn(next);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === room.localParticipant.identity ? { ...u, micOn: next } : u
      )
    );
    next ? sounds.unmute() : sounds.mute();
  }, [isMicOn]);

  const toggleCam = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !isCamOn;
    await room.localParticipant.setCameraEnabled(next);
    setIsCamOn(next);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === room.localParticipant.identity ? { ...u, camOn: next } : u
      )
    );
  }, [isCamOn]);

  const startScreenShare = useCallback(async (settings?: ScreenShareSettings) => {
    const room = roomRef.current;
    if (!room) return;

    const { width, height } = settings
      ? parseResolution(settings.resolution)
      : { width: 1920, height: 1080 };
    const frameRate = settings?.frameRate ?? 30;
    const includeAudio = settings?.includeAudio ?? true;

    await room.localParticipant.setScreenShareEnabled(true, {
      audio: includeAudio,
      systemAudio: includeAudio ? "include" : "exclude",
      surfaceSwitching: "include",
      selfBrowserSurface: "exclude",
      resolution: { width, height, frameRate },
      contentHint: "motion",
    });
    setIsSharing(true);
    sounds.screenShareStart();
  }, []);

  const stopScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setScreenShareEnabled(false);
    setIsSharing(false);
    sounds.screenShareStop();
  }, []);

  const toggleHandRaise = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !isRaisedHand;
    setIsRaisedHand(next);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === room.localParticipant.identity ? { ...u, handRaised: next } : u
      )
    );
    await publishData({
      type: "handRaise",
      identity: room.localParticipant.identity,
      value: next,
    });
    next ? sounds.handRaise() : sounds.handLower();
  }, [isRaisedHand, publishData]);

  const toggleDeafen = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !isDeafened;
    // Note: Deafening in LiveKit is typically done by setting the subscriber's volume to 0
    // For now we'll track the state locally and potentially implement the actual deafening later
    setIsDeafened(next);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === room.localParticipant.identity ? { ...u, isDeafened: next } : u
      )
    );
    await publishData({
      type: "deafen",
      identity: room.localParticipant.identity,
      value: next,
    });
    next ? sounds.deafen() : sounds.undeafen();
  }, [isDeafened, publishData]);

  const switchAudioDevice = useCallback(async (deviceId: string) => {
    const room = roomRef.current;
    if (!room) return;
    await room.switchActiveDevice("audioinput", deviceId);
    await refreshDevices();
  }, [refreshDevices]);

  const switchVideoDevice = useCallback(async (deviceId: string) => {
    const room = roomRef.current;
    if (!room) return;
    await room.switchActiveDevice("videoinput", deviceId);
    await refreshDevices();
  }, [refreshDevices]);

  const updateHostSettings = useCallback(
    async (settings: HostSettings) => {
      if (!isHostCreatorRef.current && hostIdentityRef.current !== username) return;
      setHostSettings(settings);
      await publishData({ type: "hostSettings", settings });
    },
    [publishData, username]
  );

  // Handle deafEveryone changes specifically
  useEffect(() => {
    if (!isHostCreatorRef.current) return;

    // When deafEveryone is turned on, deafen everyone
    if (hostSettings.deafenEveryone) {
      broadcastHostAction("deafenEveryone");
    }
    // When deafEveryone is turned off, undeafen everyone
    else if (!hostSettings.deafenEveryone && !hostSettings.muteEveryone) {
      // Only undeafen if not also muting (muting takes precedence for audio)
      broadcastHostAction("undeafenEveryone");
    }
  }, [hostSettings.deafenEveryone, hostSettings.muteEveryone, broadcastHostAction, isHostCreatorRef.current]);

  const broadcastHostAction = useCallback(
    async (action: string) => {
      await publishData({ type: "hostAction", action });
    },
    [publishData]
  );

  const setUserColor = useCallback((color: string) => {
    setUserColor(color);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === username ? { ...u, color } : u
      )
    );
    // Broadcast color change to other participants
    publishData({ type: "userColor", color, identity: username });
  }, [username, publishData]);

  return {
    room,
    roomRef,
    users,
    messages,
    connectionState,
    error,
    isMicOn,
    isCamOn,
    isSharing,
    isDeafened,
    isRaisedHand,
    stats,
    keybinds,
    hostSettings,
    hostIdentity,
    isLocalHost: hostIdentity === username,
    audioDevices,
    videoDevices,
    micGain,
    setMicGain,
    screenShares,
    subscribeWhiteboard,
    publishData,
    setKeybinds,
    setIsDeafened,
    connect,
    disconnect,
    toggleMic,
    toggleCam,
    startScreenShare,
    stopScreenShare,
    sendMessage,
    toggleHandRaise,
    toggleDeafen,
    switchAudioDevice,
    switchVideoDevice,
    updateHostSettings,
    broadcastHostAction,
    refreshDevices,
    setUserColor,
  };
}
