import { useCallback, useEffect, useRef, useState } from 'react';
import roomService, { Room, SceneState } from '../services/roomService';
import { RoomChatMessage, RoomSocketEvent } from '../types/room';

const emptyScene: SceneState = {
    tokens: [],
};

export const useRoom = (roomId?: string) => {
    const [room, setRoom] = useState<Room | null>(null);
    const [sceneState, setSceneState] = useState<SceneState>(emptyScene);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<RoomChatMessage[]>([]);
    const [onlineMembers, setOnlineMembers] = useState<number[]>([]);
    const [socketConnected, setSocketConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);

    const loadRoom = useCallback(async () => {
        if (!roomId) return;
        try {
            setLoading(true);
            setError(null);
            const data = await roomService.getRoom(roomId);
            setRoom(data);
            setSceneState(normalizeScene(data.scene_state));
            if (data.members?.length) {
                setOnlineMembers(data.members.map((m) => m.user_id));
            }
        } catch (err) {
            console.error('Failed to load room', err);
            setError('Falha ao carregar a sala');
        } finally {
            setLoading(false);
        }
    }, [roomId]);

    const joinRoom = useCallback(async () => {
        if (!roomId) return;
        try {
            const joined = await roomService.joinRoom(roomId);
            // keep room reference up to date
            setRoom(joined.room);
            return joined;
        } catch (err) {
            console.error('Failed to join room', err);
            setError('Falha ao entrar na sala');
            throw err;
        }
    }, [roomId]);

    const sendSocketMessage = useCallback(
        (payload: RoomSocketEvent) => {
            const socket = socketRef.current;
            if (socket && socket.readyState === WebSocket.OPEN) {
                socket.send(JSON.stringify(payload));
                return true;
            }
            return false;
        },
        [],
    );

    const saveScene = useCallback(
        async (nextScene: SceneState, metadata?: Record<string, any>) => {
            if (!roomId) return;
            // Prefer websocket; fallback para API.
            const wsSent = sendSocketMessage({
                type: 'scene:update',
                scene_state: nextScene,
                metadata,
            });

            if (wsSent) {
                setSceneState(normalizeScene(nextScene));
                setRoom((prev) => (prev ? { ...prev, scene_state: nextScene } as Room : prev));
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const updated = await roomService.updateScene(roomId, nextScene, metadata);
                setRoom(updated);
                setSceneState(normalizeScene(updated.scene_state));
                return updated;
            } catch (err) {
                console.error('Failed to update scene', err);
                setError('Falha ao salvar cena');
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [roomId, sendSocketMessage],
    );

    const handleSocketMessage = useCallback(
        (raw: RoomSocketEvent) => {
            switch (raw.type) {
                case 'scene:state':
                    if (raw.scene_state) {
                        setSceneState(normalizeScene(raw.scene_state));
                        setRoom((prev) => (prev ? { ...prev, scene_state: raw.scene_state } : prev));
                    }
                    break;
                case 'presence:update':
                    setOnlineMembers(raw.members || []);
                    break;
                case 'chat:message': {
                    if (!raw.message) break;
                    const message: RoomChatMessage = {
                        id: `${raw.timestamp || Date.now()}-${Math.random().toString(16).slice(2)}`,
                        room_id: raw.room_id || roomId || '',
                        user_id: raw.sender_id || 0,
                        message: raw.message,
                        timestamp: raw.timestamp || Date.now(),
                    };
                    setChatMessages((prev) => [...prev.slice(-49), message]);
                    break;
                }
                case 'dice:roll': {
                    const dice = raw.dice || {};
                    const text = dice.label
                        ? `${dice.label}: ${dice.total ?? ''} (${dice.notation ?? ''})`
                        : `Rolagem: ${dice.total ?? ''} (${dice.notation ?? ''})`;
                    const message: RoomChatMessage = {
                        id: `${raw.timestamp || Date.now()}-${Math.random().toString(16).slice(2)}`,
                        room_id: raw.room_id || roomId || '',
                        user_id: raw.sender_id || 0,
                        message: text.trim(),
                        timestamp: raw.timestamp || Date.now(),
                    };
                    setChatMessages((prev) => [...prev.slice(-49), message]);
                    break;
                }
                default:
                    break;
            }
        },
        [roomId],
    );

    const connectSocket = useCallback(() => {
        if (!roomId) return;
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const wsUrl = buildWsUrl(roomId, token);
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        socket.onopen = () => {
            setSocketConnected(true);
            setError(null);
        };
        socket.onclose = () => {
            setSocketConnected(false);
            socketRef.current = null;
        };
        socket.onerror = () => {
            setSocketConnected(false);
            setError('Conexão em tempo real indisponível');
        };
        socket.onmessage = (event) => {
            try {
                const raw = JSON.parse(event.data) as RoomSocketEvent;
                handleSocketMessage(raw);
            } catch (err) {
                console.error('Failed to parse room socket message', err);
            }
        };
    }, [roomId, handleSocketMessage]);

    useEffect(() => {
        connectSocket();
        return () => {
            socketRef.current?.close();
            socketRef.current = null;
        };
    }, [connectSocket]);

    useEffect(() => {
        loadRoom();
    }, [loadRoom]);

    const sendChat = useCallback(
        (message: string) => {
            if (!message.trim()) return;
            const sent = sendSocketMessage({ type: 'chat:message', message: message.trim() });
            if (!sent) {
                setChatMessages((prev) => [
                    ...prev,
                    {
                        id: `${Date.now()}`,
                        room_id: roomId || '',
                        user_id: 0,
                        message,
                        timestamp: Date.now(),
                    },
                ]);
            }
        },
        [roomId, sendSocketMessage],
    );

    const broadcastDiceRoll = useCallback(
        (dice: any) => {
            sendSocketMessage({ type: 'dice:roll', dice });
        },
        [sendSocketMessage],
    );

    return {
        room,
        sceneState,
        loading,
        error,
        setSceneState,
        loadRoom,
        joinRoom,
        saveScene,
        chatMessages,
        onlineMembers,
        socketConnected,
        sendChat,
        broadcastDiceRoll,
    };
};

const normalizeScene = (scene: SceneState | undefined): SceneState => {
    const resolved = unwrapScene(scene);
    if (!resolved) return { ...emptyScene };
    if (!resolved.tokens) {
        return { ...resolved, tokens: [] };
    }
    return resolved;
};

const unwrapScene = (scene: any): SceneState | null => {
    if (!scene) return null;
    // JSONBFlexible pode vir como {Data: {...}}
    if (scene.Data) {
        return scene.Data as SceneState;
    }
    if (!scene.tokens) {
        return { ...scene, tokens: [] };
    }
    return scene as SceneState;
};

const buildWsUrl = (roomId: string, token: string) => {
    const apiBase =
        import.meta.env.VITE_API_URL ||
        (import.meta.env.DEV ? 'http://localhost:8080/api' : '/api');
    const base =
        apiBase.startsWith('http') || apiBase.startsWith('ws')
            ? apiBase
            : `${window.location.origin}${apiBase}`;
    const wsBase = base.replace(/^http/, 'ws');
    return `${wsBase}/rooms/${roomId}/ws?token=${token}`;
};
