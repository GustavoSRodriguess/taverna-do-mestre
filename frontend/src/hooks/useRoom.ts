import { useCallback, useEffect, useRef, useState } from 'react';
import roomService, { Room, SceneState } from '../services/roomService';
import { RoomChatMessage, RoomSocketEvent } from '../types/room';

const emptyScene: SceneState = {
    tokens: [],
};

export const useRoom = (roomId?: string, currentUserId?: number) => {
    const [room, setRoom] = useState<Room | null>(null);
    const [sceneState, setSceneState] = useState<SceneState>(emptyScene);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [chatMessages, setChatMessages] = useState<RoomChatMessage[]>([]);
    const [onlineMembers, setOnlineMembers] = useState<number[]>([]);
    const [socketConnected, setSocketConnected] = useState(false);
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimer = useRef<number | null>(null);
    const seenMessageKeys = useRef<Set<string>>(new Set());

    const addSeen = (key: string) => {
        seenMessageKeys.current.add(key);
    };

    const generateLocalId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    };

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
            const key =
                raw.metadata?.local_id ||
                `${raw.type}-${raw.sender_id || 'self'}-${raw.timestamp || ''}-${raw.message || ''}`;
            if (seenMessageKeys.current.has(key)) {
                return;
            }

            switch (raw.type) {
                case 'connection:ready':
                    addSeen(key);
                    setOnlineMembers(raw.members || []);
                    break;
                case 'error':
                    addSeen(key);
                    setError(raw.message || 'Erro no canal da sala');
                    break;
                case 'scene:state':
                case 'scene:update':
                    addSeen(key);
                    if (raw.scene_state) {
                        setSceneState(normalizeScene(raw.scene_state));
                        setRoom((prev) => (prev ? { ...prev, scene_state: raw.scene_state } : prev));
                    }
                    break;
                case 'presence:update':
                    addSeen(key);
                    setOnlineMembers(raw.members || []);
                    break;
                case 'chat:message': {
                    addSeen(key);
                    if (!raw.message) break;
                    const message: RoomChatMessage = {
                        id: key,
                        room_id: raw.room_id || roomId || '',
                        user_id: raw.sender_id || 0,
                        message: raw.message,
                        timestamp: raw.timestamp || Date.now(),
                    };
                    setChatMessages((prev) => [...prev.slice(-49), message]);
                    break;
                }
                case 'dice:roll': {
                    addSeen(key);
                    const dice = raw.dice || {};
                    const text = dice.label
                        ? `${dice.label}: ${dice.total ?? ''} (${dice.notation ?? ''})`
                        : `Rolagem: ${dice.total ?? ''} (${dice.notation ?? ''})`;
                    const message: RoomChatMessage = {
                        id: key,
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
        if (socketRef.current && [WebSocket.OPEN, WebSocket.CONNECTING].includes(socketRef.current.readyState)) {
            return;
        }
        const token = localStorage.getItem('authToken');
        if (!token) return;

        const wsUrl = buildWsUrl(roomId, token);
        const socket = new WebSocket(wsUrl);
        socketRef.current = socket;

        const cleanupTimer = () => {
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
                reconnectTimer.current = null;
            }
        };

        const scheduleReconnect = (delay = 3000) => {
            cleanupTimer();
            reconnectTimer.current = window.setTimeout(() => {
                connectSocket();
            }, delay);
        };

        socket.onopen = () => {
            setSocketConnected(true);
            setError(null);
            // pequeno ping inicial para confirmar presença
            sendSocketMessage({ type: 'presence:ping' });
        };
        socket.onclose = () => {
            setSocketConnected(false);
            socketRef.current = null;
            scheduleReconnect(4000);
        };
        socket.onerror = () => {
            setSocketConnected(false);
            setError('Conexão em tempo real indisponível');
            scheduleReconnect(8000);
        };
        socket.onmessage = (event) => {
            try {
                const raw = JSON.parse(event.data) as RoomSocketEvent;
                handleSocketMessage(raw);
            } catch (err) {
                console.error('Failed to parse room socket message', err);
            }
        };
    }, [roomId, handleSocketMessage, sendSocketMessage]);

    useEffect(() => {
        connectSocket();
        return () => {
            socketRef.current?.close();
            socketRef.current = null;
            if (reconnectTimer.current) {
                clearTimeout(reconnectTimer.current);
                reconnectTimer.current = null;
            }
        };
    }, [connectSocket]);

    useEffect(() => {
        loadRoom();
    }, [loadRoom]);

    // Heartbeat para manter e monitorar socket
    useEffect(() => {
        if (!socketConnected) return;
        const interval = window.setInterval(() => {
            sendSocketMessage({ type: 'presence:ping' });
        }, 15000);
        return () => clearInterval(interval);
    }, [socketConnected, sendSocketMessage]);

    // Fallback de polling quando socket estiver offline
    useEffect(() => {
        if (socketConnected) return;
        const interval = window.setInterval(() => {
            loadRoom();
        }, 5000);
        return () => clearInterval(interval);
    }, [socketConnected, loadRoom]);

    const sendChat = useCallback(
        (message: string) => {
            if (!message.trim()) return;
            const localId = generateLocalId();
            const payload: RoomSocketEvent = {
                type: 'chat:message',
                message: message.trim(),
                metadata: { local_id: localId },
            };

            const sent = sendSocketMessage(payload);
            if (!sent) {
                const messageObj: RoomChatMessage = {
                    id: localId,
                    room_id: roomId || '',
                    user_id: currentUserId || 0,
                    message: message.trim(),
                    timestamp: Date.now(),
                };
                addSeen(localId);
                setChatMessages((prev) => [...prev.slice(-49), messageObj]);
            }
        },
        [roomId, currentUserId, sendSocketMessage],
    );

    const broadcastDiceRoll = useCallback(
        (dice: any) => {
            const localId = generateLocalId();
            const payload: RoomSocketEvent = {
                type: 'dice:roll',
                dice,
                metadata: { local_id: localId },
            };
            const text = dice.label
                ? `${dice.label}: ${dice.total ?? ''} (${dice.notation ?? ''})`
                : `Rolagem: ${dice.total ?? ''} (${dice.notation ?? ''})`;
            const message: RoomChatMessage = {
                id: localId,
                room_id: roomId || '',
                user_id: currentUserId || 0,
                message: text.trim(),
                timestamp: dice.timestamp || Date.now(),
            };
            // otimista: mostra para quem rolou imediatamente
            addSeen(localId);
            setChatMessages((prev) => [...prev.slice(-49), message]);
            sendSocketMessage(payload);
        },
        [roomId, currentUserId, sendSocketMessage],
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
    return `${wsBase}/rooms/${roomId}/ws?token=${encodeURIComponent(token)}`;
};
