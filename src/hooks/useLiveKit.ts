import { useState, useRef, useCallback, useEffect } from "react";
import {
  Room,
  RoomEvent,
  Track,
  type Participant,
} from "livekit-client";
import type { User, ChatMessage, Stats, Keybind, HostSettings, ScreenShareUser, WhiteboardStroke, FontSettings, ThemeName } from "../types";
import { sounds } from "../utils/sounds";
import { getUserColor } from "../utils/colors";
import type { ScreenShareSettings } from "../utils/screenShare";
import { parseResolution, DEFAULT_SCREENSHARE_SETTINGS } from "../utils/screenShare";

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
  disableScreenShare: false,
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
    handRaised: participant.isSpeaking,
    audioLevel: Math.round((participant.audioLevel ?? 0) * 100),
    volume: 80,
    localVideoDisabled: false,
    localScreenshareDisabled: false,
    isHost: participant.identity === hostIdentity,
    color: getUserColor(participant.identity),
    connectionQuality: 0, // Will be updated later
    isDeafened: false, // Default false, will be updated
    isMutedLocally: false,
    isSharing: participant.isScreenShareEnabled ?? false,
    isSpeaking: participant.isSpeaking ?? false,
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
    "disconnected" | "connecting" | "connected" | "reconnecting" | "signalReconnecting"
  >("disconnected");
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(false);
  const isMicOnRef = useRef(isMicOn);
  isMicOnRef.current = isMicOn;
  const [isCamOn, setIsCamOn] = useState(false);
  const isCamOnRef = useRef(isCamOn);
  isCamOnRef.current = isCamOn;
  const [isSharing, setIsSharing] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isRaisedHand, setIsRaisedHand] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [keybinds, setKeybinds] = useState<Keybind[]>(DEFAULT_KEYBINDS);
  const [hostSettings, setHostSettings] = useState<HostSettings>(DEFAULT_HOST_SETTINGS);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [micGain, setMicGainState] = useState(100);
  const [soundVolume, setSoundVolumeState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('soundVolume')
      return saved ? parseFloat(saved) : 1.0
    }
    return 1.0
  });
  const [screenShares, setScreenShares] = useState<ScreenShareUser[]>([]);
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null);
  const pinnedParticipantIdRef = useRef(pinnedParticipantId);
  pinnedParticipantIdRef.current = pinnedParticipantId;
  const [fontSettings, setFontSettings] = useState<FontSettings>({
    fontFamily: 'system',
    fontSize: 'medium',
    highContrast: false,
  });
  const fontSettingsRef = useRef(fontSettings);
  fontSettingsRef.current = fontSettings;
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-gray');
    if (fontSettings.highContrast) root.classList.add('theme-high-contrast');
    else root.classList.remove('theme-high-contrast');
    const sizeMap: Record<string, string> = { small: '0.8125rem', medium: '0.9375rem', large: '1.0625rem', xlarge: '1.1875rem' };
    root.style.setProperty('--font-size-base', sizeMap[fontSettings.fontSize] || '0.9375rem');
    const familyMap: Record<string, string> = {
      system: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      inter: "'Inter', sans-serif",
      roboto: "'Roboto', sans-serif",
      opensans: "'Open Sans', sans-serif",
      monospace: "'JetBrains Mono', 'Fira Code', monospace",
    };
    root.style.setProperty('--font-family-base', familyMap[fontSettings.fontFamily] || familyMap.system);
  }, [fontSettings]);
  const [theme, setThemeState] = useState<ThemeName>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'gray' || saved === 'dark') return saved;
    }
    return 'dark';
  });
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-gray');
    if (theme === 'light') root.classList.add('theme-light');
    else if (theme === 'gray') root.classList.add('theme-gray');
    if (typeof window !== 'undefined') localStorage.setItem('theme', theme);
  }, [theme]);
  const setTheme = useCallback((t: ThemeName) => setThemeState(t), []);
  const [screenShareSettings, setScreenShareSettingsState] = useState<ScreenShareSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('screenShareSettings');
      if (saved) {
        try { return { ...DEFAULT_SCREENSHARE_SETTINGS, ...JSON.parse(saved) }; } catch { /* ignore */ }
      }
    }
    return DEFAULT_SCREENSHARE_SETTINGS;
  });
  const setScreenShareSettings = useCallback((s: ScreenShareSettings) => {
    setScreenShareSettingsState(s);
    if (typeof window !== 'undefined') localStorage.setItem('screenShareSettings', JSON.stringify(s));
  }, []);
  const screenShareSettingsRef = useRef(screenShareSettings);
  screenShareSettingsRef.current = screenShareSettings;
  const micGainRef = useRef(micGain);
  micGainRef.current = micGain;
  const usernameRef = useRef(username);
  usernameRef.current = username;
  
  // Whiteboard callbacks
  const whiteboardCallbacks = useRef<((stroke: WhiteboardStroke) => void)[]>([]);
  const whiteboardClearCallbacks = useRef<(() => void)[]>([]);
  
  const subscribeWhiteboard = useCallback((onStroke: (stroke: WhiteboardStroke) => void, onClear: () => void) => {
    whiteboardCallbacks.current.push(onStroke);
    whiteboardClearCallbacks.current.push(onClear);
    return () => {
      whiteboardCallbacks.current = whiteboardCallbacks.current.filter(cb => cb !== onStroke);
      whiteboardClearCallbacks.current = whiteboardClearCallbacks.current.filter(cb => cb !== onClear);
    };
  }, []);
  
  // Mic gain Web Audio nodes kept in refs so we can update gain without rebuilding the graph
  const micGainNodeRef = useRef<GainNode | null>(null);
  const micAudioCtxRef = useRef<AudioContext | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Mic gain setter for UI - applies gain using Web Audio API on the microphone track
  const setMicGain = useCallback(async (gain: number) => {
    const clamped = Math.max(0, Math.min(100, gain));
    setMicGainState(clamped);
    micGainRef.current = clamped;

    // Update existing gain node immediately if we already built the graph
    if (micGainNodeRef.current) {
      micGainNodeRef.current.gain.value = clamped / 100;
      return;
    }

    const room = roomRef.current;
    if (!room) return;

    const micPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
    const micTrack = micPub?.track as any;
    const mediaStreamTrack = micTrack?.mediaStreamTrack;
    if (!mediaStreamTrack) return;

    try {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(new MediaStream([mediaStreamTrack]));
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = clamped / 100;
      source.connect(gainNode);
      // Don't connect to destination - we don't want to hear ourselves.
      // The gain is applied for visualization purposes (useAudioLevel reads from this graph).
      micAudioCtxRef.current = audioCtx;
      micSourceRef.current = source;
      micGainNodeRef.current = gainNode;
    } catch (e) {
      console.warn('Could not apply mic gain:', e);
    }
  }, []);
  const setSoundVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setSoundVolumeState(clamped);
    if (typeof window !== 'undefined') {
      localStorage.setItem('soundVolume', clamped.toString());
    }
    sounds.setSoundVolume(clamped);
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
      // Enumerate devices directly - no need to request dummy stream first
      const devices = await navigator.mediaDevices.enumerateDevices()
      setAudioDevices(devices.filter((d) => d.kind === "audioinput"))
      setVideoDevices(devices.filter((d) => d.kind === "videoinput"))
    } catch (error) {
      console.warn('Could not enumerate media devices:', error);
      setAudioDevices([])
      setVideoDevices([])
    }
  }, [])

  // Request permissions early to get device labels
  const requestMediaPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      stream.getTracks().forEach(t => t.stop())
      // Now enumerate devices again to get labels
      await refreshDevices()
    } catch (error) {
      console.warn('Could not request media permissions:', error)
    }
  }, [refreshDevices])

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
            // Check for @mention of current user
            const localIdentity = usernameRef.current;
            if (localIdentity && message.message && message.message.includes(`@${localIdentity}`)) {
              sounds.mention();
            }
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
          if (message.action.startsWith("deafenParticipant:")) {
            const targetId = message.action.split(":")[1];
            if (targetId === local.identity) {
              setIsDeafened(true);
              setUsers((prev) => prev.map((u) => (u.id === targetId ? { ...u, isDeafened: true } : u)));
              sounds.deafen();
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
          if (message.action.startsWith("pinParticipant:")) {
            const targetId = message.action.split(":")[1];
            setPinnedParticipantId(targetId);
          }
          if (message.action.startsWith("unpinParticipant:")) {
            setPinnedParticipantId(null);
          }
          if (message.action === "toggleWhiteboard") {
            window.dispatchEvent(new CustomEvent('whiteboardToggle', { detail: { open: true } }));
          }
          if (message.action === "closeWhiteboard") {
            window.dispatchEvent(new CustomEvent('whiteboardToggle', { detail: { open: false } }));
          }
        }

        if (message.type === "userColor" && message.color && message.identity) {
          setUsers((prev) =>
            prev.map((u) =>
              u.id === message.identity ? { ...u, color: message.color } : u
            )
          );
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
            // Add system message for participant join
            setMessages((prev) => [
              ...prev,
              {
                id: `system-join-${p.identity}-${Date.now()}`,
                sender: 'System',
                content: `${p.name || p.identity} joined the meeting`,
                timestamp: Date.now(),
              },
            ]);
          }
          void announceHost();
        });
        room.on(RoomEvent.ParticipantDisconnected, (p) => {
          removeUser(p.identity);
          // Add system message for participant leave
          setMessages((prev) => [
            ...prev,
            {
              id: `system-leave-${p.identity}-${Date.now()}`,
              sender: 'System',
              content: `${p.name || p.identity} left the meeting`,
              timestamp: Date.now(),
            },
          ]);
        });

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
            // Auto-pin the screen share presenter
            if (participant.identity !== room.localParticipant.identity) {
              pinParticipant(participant.identity);
            }
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
            // Unpin when screen share stops
            if (pinnedParticipantIdRef.current === participant.identity) {
              unpinParticipant(participant.identity);
            }
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
          // Handle all possible connection states - LiveKit returns strings that match the enum values
          const validStates = ["connected", "connecting", "reconnecting", "signalReconnecting", "disconnected"];
          if (validStates.includes(state)) {
            setConnectionState(state);
          } else {
            console.warn("Unknown connection state:", state);
            // Default to disconnected for unknown states
            setConnectionState("disconnected");
          }
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

        // Refresh devices after mic/cam are enabled to get proper labels
        await refreshDevices();
        
        // Also request media permissions to ensure device labels are populated
        await requestMediaPermissions();
        
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
    const next = !isMicOnRef.current;
    await room.localParticipant.setMicrophoneEnabled(next);
    setIsMicOn(next);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === room.localParticipant.identity ? { ...u, micOn: next } : u
      )
    );
    next ? sounds.unmute() : sounds.mute();
  }, []);

  const toggleCam = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !isCamOnRef.current;
    await room.localParticipant.setCameraEnabled(next);
    setIsCamOn(next);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === room.localParticipant.identity ? { ...u, camOn: next } : u
      )
    );
  }, []);

  const startScreenShare = useCallback(async (settings?: ScreenShareSettings) => {
    const room = roomRef.current;
    if (!room) return;

    const resolved = settings ?? screenShareSettingsRef.current;
    const { width, height } = parseResolution(resolved.resolution);
    const frameRate = resolved.frameRate ?? 30;
    const includeAudio = resolved.includeAudio ?? true;

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

  const broadcastHostAction = useCallback(
    async (action: string) => {
      await publishData({ type: "hostAction", action });
    },
    [publishData]
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

  const setUserColor = useCallback((color: string) => {
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('userColor', color)
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === username ? { ...u, color } : u
      )
    );
    // Broadcast color change to other participants
    publishData({ type: "userColor", color, identity: username });
  }, [username, publishData]);

  // Host control functions
  const muteAllParticipants = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    await publishData({ type: "hostAction", action: "muteAll" });
  }, [publishData]);

  const removeParticipant = useCallback(async (identity: string) => {
    const room = roomRef.current;
    if (!room) return;
    await publishData({ type: "hostAction", action: `removeParticipant:${identity}` });
  }, [publishData]);

  const pinParticipant = useCallback(async (identity: string) => {
    await publishData({ type: "hostAction", action: `pinParticipant:${identity}` });
  }, [publishData]);

  const unpinParticipant = useCallback(async (identity: string) => {
    await publishData({ type: "hostAction", action: `unpinParticipant:${identity}` });
  }, [publishData]);

  const muteParticipant = useCallback(async (identity: string) => {
    await publishData({ type: "hostAction", action: `muteParticipant:${identity}` });
  }, [publishData]);

  const deafenParticipant = useCallback(async (identity: string) => {
    await publishData({ type: "hostAction", action: `deafenParticipant:${identity}` });
  }, [publishData]);

  const disableVideo = useCallback(async (identity: string) => {
    await publishData({ type: "hostAction", action: `disableVideo:${identity}` });
  }, [publishData]);

  const toggleWhiteboard = useCallback(async () => {
    await publishData({ type: "hostAction", action: "toggleWhiteboard" });
  }, [publishData]);

  const closeWhiteboard = useCallback(async () => {
    await publishData({ type: "hostAction", action: "closeWhiteboard" });
  }, [publishData]);

  const toggleScreenSharePermission = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const current = hostSettings.disableScreenShare ?? false;
    await updateHostSettings({ ...hostSettings, disableScreenShare: !current });
  }, [hostSettings, updateHostSettings]);

  const toggleCameraPermission = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const current = hostSettings.disableCameras ?? false;
    await updateHostSettings({ ...hostSettings, disableCameras: !current });
  }, [hostSettings, updateHostSettings]);

  const toggleMicrophonePermission = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    const current = hostSettings.muteEveryone ?? false;
    await updateHostSettings({ ...hostSettings, muteEveryone: !current });
  }, [hostSettings, updateHostSettings]);

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
    requestMediaPermissions,
    setUserColor,
    // Sound volume
    soundVolume,
    setSoundVolume,
    // Host control functions
    muteAllParticipants,
    removeParticipant,
    pinParticipant,
    unpinParticipant,
    muteParticipant,
    deafenParticipant,
    disableVideo,
    pinnedParticipantId,
    toggleWhiteboard,
    closeWhiteboard,
    toggleScreenSharePermission,
    toggleCameraPermission,
    toggleMicrophonePermission,
      fontSettings,
      setFontSettings,
      // Theme + screenshare settings persistence
      theme,
      setTheme,
      screenShareSettings,
      setScreenShareSettings,
    };
}
