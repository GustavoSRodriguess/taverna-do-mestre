import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert } from '../../ui';
import { useAuth } from '../../context/AuthContext';
import { useRoom } from '../../hooks/useRoom';
import { SceneToken } from '../../types/room';
import { useDice } from '../../context/DiceContext';
import { RoomSidebar } from './RoomSidebar';
import { RoomTopBar } from './RoomTopBar';
import { TokenMarker } from './TokenMarker';
import { TokenModal } from './TokenModal';
import { InitiativeBar } from './InitiativeBar';
import { FullCharacter } from '../../types/game';
import { pcService } from '../../services/pcService';

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

const tokenColors = ['#f59e0b', '#38bdf8', '#c084fc', '#22c55e', '#f97316'];

const RoomPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addRollListener } = useDice();
    const {
        room,
        sceneState,
        setSceneState,
        loading,
        error,
        joinRoom,
        saveScene,
        loadRoom,
        chatMessages,
        onlineMembers,
        socketConnected,
        sendChat,
        broadcastDiceRoll,
    } = useRoom(id, user?.id);
    const [chatInput, setChatInput] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
    const [selectedCharacter, setSelectedCharacter] = useState<FullCharacter | null>(null);
    const [currentTurnTokenId, setCurrentTurnTokenId] = useState<string | null>(null);
    const [currentRound, setCurrentRound] = useState(1);
    const boardRef = useRef<HTMLDivElement | null>(null);
    const [dragging, setDragging] = useState<string | null>(null);
    const lastBroadcast = useRef<number>(0);
    const sceneRef = useRef(sceneState);

    const isMember = useMemo(
        () => !!room?.members?.some((member) => member.user_id === user?.id),
        [room?.members, user?.id],
    );

    useEffect(() => {
        if (room && user && !isMember) {
            joinRoom().catch(() => {
                /* handled via error state */
            });
        }
    }, [room, user, isMember, joinRoom]);

    useEffect(() => {
        const unsub = addRollListener((roll) => {
            broadcastDiceRoll({
                ...roll,
                timestamp: roll.timestamp instanceof Date ? roll.timestamp.getTime() : Date.now(),
            });
        });
        return () => {
            unsub?.();
        };
    }, [addRollListener, broadcastDiceRoll]);

    useEffect(() => {
        sceneRef.current = sceneState;
    }, [sceneState]);

    if (!id) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <Alert message="ID da sala nao informado" variant="error" />
            </div>
        );
    }

    const snapToGrid = (value: number) => Math.round(value / 5) * 5;

    const handleAddToken = () => {
        const tokens = sceneRef.current.tokens || [];
        const nextToken: SceneToken = {
            id: `token-${Date.now()}`,
            name: `Token ${tokens.length + 1}`,
            x: 40,
            y: 40,
            color: tokenColors[tokens.length % tokenColors.length],
        };
        const nextScene = { ...sceneRef.current, tokens: [...tokens, nextToken] };
        setSceneState(nextScene);
        saveScene(nextScene, { action: 'add_token' });
    };

    const handleTokenChange = (tokenId: string, updates: Partial<SceneToken>) => {
        const nextUpdates: Partial<SceneToken> = { ...updates };
        if (nextUpdates.x !== undefined) {
            nextUpdates.x = snapToGrid(clampPercent(nextUpdates.x));
        }
        if (nextUpdates.y !== undefined) {
            nextUpdates.y = snapToGrid(clampPercent(nextUpdates.y));
        }
        setSceneState((prev) => {
            const tokens = prev.tokens || [];
            const updated = tokens.map((token) => (token.id === tokenId ? { ...token, ...nextUpdates } : token));
            return { ...prev, tokens: updated };
        });
    };

    const handleRemoveToken = (tokenId: string) => {
        const tokens = sceneRef.current.tokens || [];
        const nextScene = { ...sceneRef.current, tokens: tokens.filter((token) => token.id !== tokenId) };
        setSceneState(nextScene);
        saveScene(nextScene, { action: 'remove_token' });
    };

    const handleSaveScene = async (e: React.FormEvent) => {
        e.preventDefault();
        await saveScene(sceneState);
    };

    const handleChatSubmit = (e: React.FormEvent | React.KeyboardEvent) => {
        if ('key' in e && e.key !== 'Enter') return;
        e.preventDefault();
        if (!chatInput.trim()) return;
        sendChat(chatInput.trim());
        setChatInput('');
    };

    const handleTokenMouseDown = (tokenId: string) => (e: React.MouseEvent) => {
        e.preventDefault();
        setDragging(tokenId);
    };

    const handleTokenClick = async (tokenId: string) => {
        setSelectedTokenId(tokenId);
        const token = sceneState.tokens?.find((t) => t.id === tokenId);

        if (token?.character_id) {
            try {
                const char = await pcService.getPC(token.character_id);
                setSelectedCharacter(char);
            } catch (error) {
                console.error('Erro ao buscar personagem:', error);
                setSelectedCharacter(null);
            }
        } else {
            setSelectedCharacter(null);
        }
    };

    const handleUpdateCharacter = async (characterId: number, updates: Partial<FullCharacter>) => {
        try {
            await pcService.updatePC(characterId, updates);
            // Recarregar personagem atualizado
            const updatedChar = await pcService.getPC(characterId);
            setSelectedCharacter(updatedChar);
        } catch (error) {
            console.error('Erro ao atualizar personagem:', error);
        }
    };

    const handleNextTurn = () => {
        const tokensWithInitiative = sceneState.tokens
            ?.filter((t) => t.initiative !== undefined && t.initiative !== null)
            .sort((a, b) => (b.initiative || 0) - (a.initiative || 0));

        if (!tokensWithInitiative || tokensWithInitiative.length === 0) return;

        if (!currentTurnTokenId) {
            setCurrentTurnTokenId(tokensWithInitiative[0].id);
        } else {
            const currentIndex = tokensWithInitiative.findIndex((t) => t.id === currentTurnTokenId);
            const nextIndex = (currentIndex + 1) % tokensWithInitiative.length;

            // Se voltou para o primeiro token, incrementa o round
            if (nextIndex === 0) {
                setCurrentRound((prev) => prev + 1);
            }

            setCurrentTurnTokenId(tokensWithInitiative[nextIndex].id);
        }
    };

    const handleEndCombat = () => {
        // Limpar iniciativa de todos os tokens
        const updatedTokens = sceneState.tokens?.map((token) => ({
            ...token,
            initiative: undefined,
        }));

        const nextScene = { ...sceneState, tokens: updatedTokens };
        setSceneState(nextScene);
        saveScene(nextScene, { action: 'end_combat' });

        // Resetar estados de combate
        setCurrentTurnTokenId(null);
        setCurrentRound(1);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragging || !boardRef.current) return;
            const rect = boardRef.current.getBoundingClientRect();
            const percentX = ((e.clientX - rect.left) / rect.width) * 100;
            const percentY = ((e.clientY - rect.top) / rect.height) * 100;
            const snappedX = snapToGrid(clampPercent(percentX));
            const snappedY = snapToGrid(clampPercent(percentY));

            setSceneState((prev) => {
                const tokens = prev.tokens || [];
                const updated = tokens.map((token) =>
                    token.id === dragging ? { ...token, x: snappedX, y: snappedY } : token,
                );
                return { ...prev, tokens: updated };
            });
        };

        const handleMouseUp = () => {
            if (dragging) {
                setDragging(null);
                const now = Date.now();
                if (now - lastBroadcast.current > 200) {
                    lastBroadcast.current = now;
                    saveScene(sceneRef.current, { action: 'drag_token' });
                }
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragging, saveScene]);

    return (
        <div className="h-screen w-screen overflow-hidden bg-slate-950">
            {/* Top Bar */}
            <RoomTopBar
                roomId={id}
                roomName={room?.name}
                campaignId={room?.campaign_id}
                socketConnected={socketConnected}
                loading={loading}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
                onSaveScene={handleSaveScene}
                onReload={loadRoom}
            />

            {/* Main Board Area - Fullscreen */}
            <div className="h-full w-full pt-16">
                {error && (
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 max-w-md">
                        <Alert message={error} variant="error" onClose={() => loadRoom()} />
                    </div>
                )}

                <div
                    className="relative w-full h-full overflow-hidden"
                    ref={boardRef}
                >
                    {/* Background Image */}
                    {sceneState.backgroundUrl ? (
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${sceneState.backgroundUrl})` }}
                        />
                    ) : (
                        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
                            <div className="text-center text-slate-400 space-y-2">
                                <p className="text-lg">Nenhuma cena carregada</p>
                                <p className="text-sm">Abra o painel lateral para configurar a cena</p>
                            </div>
                        </div>
                    )}

                    {/* Grid Overlay */}
                    <div
                        className="absolute inset-0 pointer-events-none opacity-30"
                        style={{
                            backgroundImage:
                                'linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)',
                            backgroundSize: '5% 5%',
                        }}
                    />

                    {/* Tokens */}
                    <div className="absolute inset-0">
                        {sceneState.tokens?.map((token) => (
                            <TokenMarker
                                key={token.id}
                                token={token}
                                onMouseDown={handleTokenMouseDown(token.id)}
                                onClick={() => handleTokenClick(token.id)}
                                isCurrentTurn={token.id === currentTurnTokenId}
                            />
                        ))}
                    </div>

                    {/* Scene Notes Overlay (bottom center) */}
                    {sceneState.notes && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 max-w-2xl">
                            <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg px-4 py-2 shadow-xl">
                                <p className="text-sm text-slate-200">{sceneState.notes}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <RoomSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                room={room}
                onlineMembers={onlineMembers}
                sceneState={sceneState}
                setSceneState={setSceneState}
                onAddToken={handleAddToken}
                onTokenChange={handleTokenChange}
                onRemoveToken={handleRemoveToken}
                chatMessages={chatMessages}
                chatInput={chatInput}
                setChatInput={setChatInput}
                onChatSubmit={handleChatSubmit}
                socketConnected={socketConnected}
                currentTurnTokenId={currentTurnTokenId}
                onSelectToken={handleTokenClick}
                onNextTurn={handleNextTurn}
            />

            {/* Token Modal */}
            {selectedTokenId && (
                <TokenModal
                    token={sceneState.tokens?.find((t) => t.id === selectedTokenId)!}
                    character={selectedCharacter}
                    isOpen={!!selectedTokenId}
                    onClose={() => {
                        setSelectedTokenId(null);
                        setSelectedCharacter(null);
                    }}
                    onUpdateToken={(updates) => handleTokenChange(selectedTokenId, updates)}
                    onUpdateCharacter={handleUpdateCharacter}
                />
            )}

            {/* Initiative Bar - Fixed Top */}
            <InitiativeBar
                tokens={sceneState.tokens || []}
                currentTurnTokenId={currentTurnTokenId}
                currentRound={currentRound}
                onSelectToken={handleTokenClick}
                onNextTurn={handleNextTurn}
            />
        </div>
    );
};

export default RoomPage;
