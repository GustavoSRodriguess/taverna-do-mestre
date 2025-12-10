import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
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
import { campaignService } from '../../services/campaignService';
import {
    clampPercent,
    snapToGrid,
    generateTokenId,
    getNextTokenColor,
} from '../../utils/tokenUtils';
import {
    getNextTurnToken,
    clearAllInitiatives,
    hasAnyInitiative,
} from '../../utils/combatUtils';

const RoomPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
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
    } = useRoom(id, user ? { id: user.id, username: user.username } : undefined);
    const [chatInput, setChatInput] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
    const [selectedCharacter, setSelectedCharacter] = useState<FullCharacter | null>(null);
    const [currentTurnTokenId, setCurrentTurnTokenId] = useState<string | null>(null);
    const [currentRound, setCurrentRound] = useState(1);
    const [inCombat, setInCombat] = useState(false);
    const boardRef = useRef<HTMLDivElement | null>(null);
    const [dragging, setDragging] = useState<string | null>(null);
    const lastBroadcast = useRef<number>(0);
    const sceneRef = useRef(sceneState);
    const dragStartPos = useRef<{ x: number; y: number } | null>(null);
    const hasDragged = useRef(false);
    const isGM = useMemo(
        () => room?.members?.some((member) => member.user_id === user?.id && member.role === 'gm') ?? false,
        [room?.members, user?.id],
    );

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

        // Detectar automaticamente se está em combate baseado nas iniciativas
        if (hasAnyInitiative(sceneState.tokens || []) && !inCombat) {
            setInCombat(true);
        }
    }, [sceneState, inCombat]);

    if (!id) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <Alert message="ID da sala nao informado" variant="error" />
            </div>
        );
    }

    const handleAddToken = useCallback(() => {
        const tokens = sceneRef.current.tokens || [];
        const nextToken: SceneToken = {
            id: generateTokenId(),
            name: `Token ${tokens.length + 1}`,
            x: 40,
            y: 40,
            color: getNextTokenColor(tokens.length),
        };
        const nextScene = { ...sceneRef.current, tokens: [...tokens, nextToken] };
        setSceneState(nextScene);
        saveScene(nextScene, { action: 'add_token' });
    }, [saveScene, setSceneState]);

    const handleTokenChange = (tokenId: string, updates: Partial<SceneToken>) => {
        const nextUpdates: Partial<SceneToken> = { ...updates };
        if (nextUpdates.x !== undefined) {
            nextUpdates.x = snapToGrid(clampPercent(nextUpdates.x));
        }
        if (nextUpdates.y !== undefined) {
            nextUpdates.y = snapToGrid(clampPercent(nextUpdates.y));
        }

        const tokens = sceneRef.current.tokens || [];
        const updated = tokens.map((token) => (token.id === tokenId ? { ...token, ...nextUpdates } : token));
        const nextScene = { ...sceneRef.current, tokens: updated };

        setSceneState(nextScene);

        // Salvar mudanças importantes (iniciativa, HP, etc.) no backend
        if (nextUpdates.initiative !== undefined || nextUpdates.current_hp !== undefined) {
            saveScene(nextScene, { action: 'update_token', tokenId, updates: nextUpdates });
        }
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
        dragStartPos.current = { x: e.clientX, y: e.clientY };
        hasDragged.current = false;
    };

    const handleTokenDoubleClick = async (tokenId: string) => {
        // Só abre o modal se não houve drag
        if (hasDragged.current) {
            return;
        }

        setSelectedTokenId(tokenId);
        const token = sceneState.tokens?.find((t) => t.id === tokenId);

        if (token?.character_id) {
            try {
                const char = room?.campaign_id
                    ? await campaignService.getCampaignCharacter(room.campaign_id, token.character_id)
                    : await pcService.getPC(token.character_id);
                setSelectedCharacter(char as FullCharacter);
            } catch (error) {
                setSelectedCharacter(null);
            }
        } else {
            setSelectedCharacter(null);
        }
    };

    const handleUpdateCharacter = async (characterId: number, updates: Partial<FullCharacter>) => {
        try {
            if (room?.campaign_id) {
                await campaignService.updateCampaignCharacterFull(room.campaign_id, characterId, updates);
                const updatedChar = await campaignService.getCampaignCharacter(room.campaign_id, characterId);
                setSelectedCharacter(updatedChar as FullCharacter);
            } else {
                await pcService.updatePC(characterId, updates);
                const updatedChar = await pcService.getPC(characterId);
                setSelectedCharacter(updatedChar);
            }
        } catch (error) {
            // Erro ao atualizar personagem
        }
    };

    const handleNextTurn = useCallback(() => {
        const result = getNextTurnToken(sceneState.tokens || [], currentTurnTokenId);

        if (!result) return;

        setCurrentTurnTokenId(result.nextTokenId);

        if (result.shouldIncrementRound) {
            setCurrentRound((prev) => prev + 1);
        }
    }, [sceneState.tokens, currentTurnTokenId]);

    const handleEndCombat = useCallback(() => {
        const updatedTokens = clearAllInitiatives(sceneState.tokens || []);
        const nextScene = { ...sceneState, tokens: updatedTokens };

        setSceneState(nextScene);
        saveScene(nextScene, { action: 'end_combat' });

        // Resetar estados de combate
        setCurrentTurnTokenId(null);
        setCurrentRound(1);
        setInCombat(false);
    }, [sceneState, saveScene, setSceneState]);

    const handleStartCombat = useCallback(() => {
        setInCombat(true);
        setCurrentRound(1);
    }, []);

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
                                onClick={() => handleTokenDoubleClick(token.id)}
                                isCurrentTurn={token.id === currentTurnTokenId}
                                currentUserId={user?.id}
                                isGM={isGM}
                                campaignId={room?.campaign_id}
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
                onSelectToken={handleTokenDoubleClick}
                onNextTurn={handleNextTurn}
                onStartCombat={handleStartCombat}
            />

            {/* Token Modal */}
            {selectedTokenId && (
                <TokenModal
                    token={sceneState.tokens?.find((t) => t.id === selectedTokenId)!}
                    character={selectedCharacter}
                    isOpen={!!selectedTokenId}
                    campaignId={room?.campaign_id}
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
                onSelectToken={handleTokenDoubleClick}
                onNextTurn={handleNextTurn}
                onEndCombat={handleEndCombat}
                inCombat={inCombat}
            />
        </div>
    );
};

export default RoomPage;
