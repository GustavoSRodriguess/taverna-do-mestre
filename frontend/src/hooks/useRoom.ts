import { useCallback, useEffect, useState } from 'react';
import roomService, { Room, SceneState } from '../services/roomService';

const emptyScene: SceneState = {
    tokens: [],
};

export const useRoom = (roomId?: string) => {
    const [room, setRoom] = useState<Room | null>(null);
    const [sceneState, setSceneState] = useState<SceneState>(emptyScene);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadRoom = useCallback(async () => {
        if (!roomId) return;
        try {
            setLoading(true);
            setError(null);
            const data = await roomService.getRoom(roomId);
            setRoom(data);
            setSceneState(normalizeScene(data.scene_state));
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

    const saveScene = useCallback(
        async (nextScene: SceneState, metadata?: Record<string, any>) => {
            if (!roomId) return;
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
        [roomId],
    );

    useEffect(() => {
        loadRoom();
    }, [loadRoom]);

    return {
        room,
        sceneState,
        loading,
        error,
        setSceneState,
        loadRoom,
        joinRoom,
        saveScene,
    };
};

const normalizeScene = (scene: SceneState | undefined): SceneState => {
    if (!scene) return { ...emptyScene };
    if (!scene.tokens) {
        return { ...scene, tokens: [] };
    }
    return scene;
};
