import { useState, useRef, useCallback } from "react";
import {
  Room,
  RoomEvent,
  Track,
  type Participant,
} from "livekit-client";
import type { User, ChatMessage, Stats, Keybind, HostSettings } from "../types";
import { sounds } from "../utils/sounds";

const TOKEN_URL = "https://connect-token.kadvabh.workers.dev";

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
};

interface UseLiveKitOptions {
  username: string;
  roomName: string;
}

function participantToUser(participant: Participant, hostUsername: string): User {
  return {
    id: participant.identity,
    name: participant.name || participant.identity,
    micOn: participant.isMicrophoneEnabled,
    camOn: participant.isCameraEnabled,
    handRaised: false,
    isSharing: participant.isScreenShareEnabled,
    isSpeaking: false,
    volume: 80,
    localVideoDisabled: false,
    localScreenshareDisabled: false,
    isHost: participant.identity === hostUsername,
  };
}

function syncUserFromParticipant(prev: User[], participant: Participant, hostUsername: string): User[] {
  const identity = participant.identity;
  const existing = prev.find((u) => u.id === identity);
  const updated = {
    ...(existing ?? participantToUser(participant, hostUsername)),
    micOn: participant.isMicrophoneEnabled,
    camOn: participant.isCameraEnabled,
    isSharing: participant.isScreenShareEnabled,
    handRaised: existing?.handRaised ?? false,
  };
  if (!existing) return [...prev, updated];
  return prev.map((u) => (u.id === identity ? updated : u));
}

export function useLiveKit({ username, roomName }: UseLiveKitOptions) {
  const roomRef = useRef<Room | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
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
  const sentMessageIds = useRef<Set<string>>(new Set());

  const publishData = useCallback(async (payload: object) => {
    const room = roomRef.current;
    if (!room) return;
    const data = new TextEncoder().encode(JSON.stringify(payload));
    await room.localParticipant.publishData(data, { reliable: true });
  }, []);

  const refreshDevices = useCallback(async () => {
    try {
      const devices = await Room.getLocalDevices();
      setAudioDevices(devices.filter((d) => d.kind === "audioinput"));
      setVideoDevices(devices.filter((d) => d.kind === "videoinput"));
    } catch {
      // Permissions may not be granted yet
    }
  }, []);

  const addOrUpdateUser = useCallback((participant: Participant) => {
    setUsers((prev) => syncUserFromParticipant(prev, participant, username));
  }, [username]);

  const removeUser = useCallback((identity: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== identity));
    sounds.participantLeave();
  }, []);

  const handleDataMessage = useCallback(
    (data: Uint8Array, participant?: Participant) => {
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
        });
        room.on(RoomEvent.ParticipantDisconnected, (p) => removeUser(p.identity));

        room.on(RoomEvent.TrackMuted, (_pub, participant) => addOrUpdateUser(participant));
        room.on(RoomEvent.TrackUnmuted, (_pub, participant) => addOrUpdateUser(participant));

        room.on(RoomEvent.TrackPublished, (pub, participant) => {
          addOrUpdateUser(participant);
          if (pub.source === Track.Source.ScreenShare) {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === participant.identity ? { ...u, isSharing: true } : u
              )
            );
            if (participant.identity === room.localParticipant.identity) setIsSharing(true);
          }
        });

        room.on(RoomEvent.TrackUnpublished, (pub, participant) => {
          addOrUpdateUser(participant);
          if (pub.source === Track.Source.ScreenShare) {
            setUsers((prev) =>
              prev.map((u) =>
                u.id === participant.identity ? { ...u, isSharing: false } : u
              )
            );
            if (participant.identity === room.localParticipant.identity) setIsSharing(false);
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

        room.on(RoomEvent.Disconnected, () => {
          setConnectionState("disconnected");
          setUsers([]);
          setStats(null);
          roomRef.current = null;
          setRoom(null);
        });

        room.on(RoomEvent.ConnectionStateChanged, (state) => {
          setConnectionState(state === "connected" ? "connected" : "connecting");
        });

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          setUsers((prev) =>
            prev.map((u) => ({
              ...u,
              isSpeaking: speakers.some((s) => s.identity === u.id),
            }))
          );
        });

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

        await refreshDevices();
        sounds.join();
        setConnectionState("connected");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Connection failed");
        setConnectionState("disconnected");
      }
    },
    [roomName, username, addOrUpdateUser, removeUser, handleDataMessage, refreshDevices]
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
        const chatMessage = {
          type: "chat",
          message,
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
            content: message,
            timestamp: chatMessage.timestamp,
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

  const startScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setScreenShareEnabled(true, {
      audio: true,
    });
    setIsSharing(true);
  }, []);

  const stopScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setScreenShareEnabled(false);
    setIsSharing(false);
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
      setHostSettings(settings);
      await publishData({ type: "hostSettings", settings });
    },
    [publishData]
  );

  const broadcastHostAction = useCallback(
    async (action: string) => {
      await publishData({ type: "hostAction", action });
    },
    [publishData]
  );

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
    audioDevices,
    videoDevices,
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
    switchAudioDevice,
    switchVideoDevice,
    updateHostSettings,
    broadcastHostAction,
    refreshDevices,
  };
}
