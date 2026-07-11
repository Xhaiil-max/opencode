import { useState, useRef, useCallback } from "react";
import { Room, RoomEvent, type Participant } from "livekit-client";
import type { User } from "../types";

const TOKEN_URL = "https://connect-token.xhail.workers.dev";

interface UseLiveKitOptions {
  username: string;
  roomName: string;
}

export function useLiveKit({ username, roomName }: UseLiveKitOptions) {
  const roomRef = useRef<Room | null>(null);
  const [connectionState, setConnectionState] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCamOn, setIsCamOn] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isRaisedHand, setIsRaisedHand] = useState(false);

  const addOrUpdateUser = useCallback((participant: Participant, local = false) => {
    const identity = participant.identity;
    const existing = users.find(u => u.id === identity);
    const name = participant.name || identity;

    if (existing) return;

    setUsers(prev => {
      if (prev.find(u => u.id === identity)) return prev;
      return [...prev, {
        id: identity,
        name,
        micOn: participant.isMicrophoneEnabled,
        camOn: participant.isCameraEnabled,
        handRaised: false,
        isSharing: participant.isScreenShareEnabled,
        isSpeaking: false,
        volume: 80,
        localVideoDisabled: false,
        localScreenshareDisabled: false,
        isHost: local || identity === username,
      }];
    });
  }, [users, username]);

  const removeUser = useCallback((identity: string) => {
    setUsers(prev => prev.filter(u => u.id !== identity));
  }, []);

  const connect = useCallback(async () => {
    setConnectionState("connecting");
    setError(null);

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

      room.on(RoomEvent.ParticipantConnected, (p) => addOrUpdateUser(p));
      room.on(RoomEvent.ParticipantDisconnected, (p) => removeUser(p.identity));
      room.on(RoomEvent.TrackSubscribed, () => {});
      room.on(RoomEvent.Disconnected, () => {
        setConnectionState("disconnected");
        setUsers([]);
      });

      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state === "connected" ? "connected" : "connecting");
      });

      room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        setUsers(prev => prev.map(u => ({ ...u, isSpeaking: speakers.some(s => s.identity === u.id) })));
      });

      room.on(RoomEvent.TrackUnpublished, (pub, participant) => {
        if (pub.source === "screen_share") {
          setUsers(prev => prev.map(u => u.id === participant.identity ? { ...u, isSharing: false } : u));
        }
      });

      room.on(RoomEvent.TrackPublished, (pub, participant) => {
        if (pub.source === "screen_share") {
          setUsers(prev => prev.map(u => u.id === participant.identity ? { ...u, isSharing: true } : u));
        }
      });

      await room.connect(url, token);
      roomRef.current = room;

      // add self as local user
      addOrUpdateUser(room.localParticipant, true);

      // add already connected participants
      room.remoteParticipants.forEach(p => addOrUpdateUser(p));

      setConnectionState("connected");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setConnectionState("disconnected");
    }
  }, [roomName, username, addOrUpdateUser, removeUser]);

  const disconnect = useCallback(() => {
    roomRef.current?.disconnect();
    roomRef.current = null;
    setConnectionState("disconnected");
    setIsMicOn(false);
    setIsCamOn(false);
  }, []);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    if (isMicOn) {
      await room.localParticipant.setMicrophoneEnabled(false);
      setIsMicOn(false);
    } else {
      await room.localParticipant.setMicrophoneEnabled(true);
      setIsMicOn(true);
    }
  }, [isMicOn]);

  const toggleCam = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    if (isCamOn) {
      await room.localParticipant.setCameraEnabled(false);
      setIsCamOn(false);
    } else {
      await room.localParticipant.setCameraEnabled(true);
      setIsCamOn(true);
    }
  }, [isCamOn]);

  const startScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setScreenShareEnabled(true);
  }, []);

  const stopScreenShare = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.localParticipant.setScreenShareEnabled(false);
  }, []);

  return {
    room: roomRef,
    users,
    connectionState,
    error,
    isMicOn,
    isCamOn,
    isDeafened,
    isRaisedHand,
    connect,
    disconnect,
    toggleMic,
    toggleCam,
    startScreenShare,
    stopScreenShare,
    setIsRaisedHand,
    setIsDeafened,
  };
}
