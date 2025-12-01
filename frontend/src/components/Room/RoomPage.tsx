import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Badge, Button, CardBorder, Page, Section } from '../../ui';
import { useAuth } from '../../context/AuthContext';
import { useRoom } from '../../hooks/useRoom';
import { RoomChatMessage, SceneToken } from '../../types/room';
import { Plus, RefreshCw, Save, Users, Image as ImageIcon, Send, MessageSquare } from 'lucide-react';
import { useDice } from '../../context/DiceContext';

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
    } = useRoom(id);
    const [chatInput, setChatInput] = useState('');
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
            <Page>
                <Section title="Sala de jogo">
                    <Alert message="ID da sala nao informado" variant="error" />
                </Section>
            </Page>
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

    const memberCount = room?.members?.length || 0;

    return (
        <Page>
            <Section title="Sala de jogo (MVP)" className="pt-10">
                <div className="max-w-7xl mx-auto space-y-6">
                    {error && (
                        <Alert message={error} variant="error" onClose={() => loadRoom()} />
                    )}

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <p className="text-sm text-indigo-200 uppercase tracking-wide">
                                Sala #{id}
                            </p>
                            <h1 className="text-3xl font-bold text-white">
                                {room?.name || 'Carregando sala...'}
                            </h1>
                            <div className="flex items-center gap-2 text-sm text-indigo-200">
                                <span className="inline-flex items-center gap-2">
                                    <span
                                        className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-red-400'}`}
                                        aria-label="status"
                                    />
                                    Tempo real {socketConnected ? 'ativo' : 'offline'}
                                </span>
                                {room?.campaign_id && (
                                    <button
                                        className="text-blue-200 underline hover:text-blue-100"
                                        onClick={() => navigate(`/campaigns/${room.campaign_id}`)}
                                    >
                                        Voltar para campanha
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                buttonLabel={
                                    <div className="flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4" />
                                        <span>Recarregar</span>
                                    </div>
                                }
                                onClick={(e) => {
                                    e.preventDefault();
                                    loadRoom();
                                }}
                                classname="bg-slate-700 hover:bg-slate-600"
                            />
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-6">
                        <CardBorder className="lg:col-span-2 bg-slate-900/50">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <ImageIcon className="w-5 h-5 text-indigo-300" />
                                    <h3 className="text-xl font-semibold text-white">Cena</h3>
                                </div>
                                <Button
                                    buttonLabel={
                                        <div className="flex items-center gap-2">
                                            <Save className="w-4 h-4" />
                                            <span>Salvar cena</span>
                                        </div>
                                    }
                                    onClick={handleSaveScene}
                                    classname="bg-green-700 hover:bg-green-600"
                                    disabled={loading}
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="block text-sm text-indigo-200">
                                        URL da imagem de fundo
                                    </label>
                                    <input
                                        type="text"
                                        value={sceneState.backgroundUrl || ''}
                                        onChange={(e) =>
                                            setSceneState((prev) => ({
                                                ...prev,
                                                backgroundUrl: e.target.value,
                                            }))
                                        }
                                        className="w-full px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="https://..."
                                    />

                                    <label className="block text-sm text-indigo-200">
                                        Notas da cena (opcional)
                                    </label>
                                    <textarea
                                        value={sceneState.notes || ''}
                                        onChange={(e) =>
                                            setSceneState((prev) => ({
                                                ...prev,
                                                notes: e.target.value,
                                            }))
                                        }
                                        className="w-full h-28 px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Notas rapidas ou legendas para os jogadores"
                                    />
                                </div>

                                <div>
                                    <div
                                        className="relative bg-slate-800 border border-slate-700 rounded-lg h-80 overflow-hidden"
                                        ref={boardRef}
                                    >
                                        {sceneState.backgroundUrl ? (
                                            <div
                                                className="absolute inset-0 bg-cover bg-center opacity-90"
                                                style={{ backgroundImage: `url(${sceneState.backgroundUrl})` }}
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                                                <p>Adicione uma imagem para iniciar</p>
                                            </div>
                                        )}
                                        <div
                                            className="absolute inset-0 pointer-events-none"
                                            style={{
                                                backgroundImage:
                                                    'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
                                                backgroundSize: '5% 5%',
                                            }}
                                        />
                                        <div className="absolute inset-0">
                                            {sceneState.tokens?.map((token) => (
                                                <div
                                                    key={token.id}
                                                    className="absolute flex items-center justify-center w-10 h-10 rounded-full border border-white/40 text-xs font-semibold shadow-lg cursor-grab active:cursor-grabbing select-none"
                                                    style={{
                                                        left: `${clampPercent(token.x)}%`,
                                                        top: `${clampPercent(token.y)}%`,
                                                        transform: 'translate(-50%, -50%)',
                                                        backgroundColor: token.color || '#6366f1',
                                                    }}
                                                    title={token.name}
                                                    onMouseDown={handleTokenMouseDown(token.id)}
                                                >
                                                    {token.name.slice(0, 3)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-300 mt-2">
                                        Arraste os tokens para mover (snap de 5%). Ao soltar, a posição é sincronizada com todos.
                                    </p>
                                </div>
                            </div>
                        </CardBorder>

                        <div className="space-y-4">
                            <CardBorder className="bg-slate-900/50">
                                <div className="flex items-center gap-2 mb-4">
                                    <Users className="w-5 h-5 text-indigo-300" />
                                    <h3 className="text-lg font-semibold text-white">Participantes</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm text-slate-200">
                                        <span>Online</span>
                                        <Badge
                                            text={`${onlineMembers.length}/${memberCount}`}
                                            variant={onlineMembers.length > 0 ? 'success' : 'danger'}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-slate-200">
                                        <span>Dono</span>
                                        <Badge text={`User ${room?.owner_id ?? '-'}`} variant="info" />
                                    </div>
                                    <div className="text-sm text-slate-300">
                                        <p className="mb-2">
                                            Membros ({memberCount})
                                        </p>
                                        <div className="space-y-2">
                                            {room?.members?.map((member) => (
                                                <div
                                                    key={`${member.room_id}-${member.user_id}`}
                                                    className="flex items-center justify-between bg-slate-800/60 px-3 py-2 rounded border border-slate-700 gap-2"
                                                >
                                                    <span className="text-slate-100">User {member.user_id}</span>
                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            text={member.role === 'gm' ? 'GM' : 'Player'}
                                                            variant={member.role === 'gm' ? 'warning' : 'primary'}
                                                        />
                                                        {onlineMembers.includes(member.user_id) ? (
                                                            <span className="text-emerald-400 text-xs">online</span>
                                                        ) : (
                                                            <span className="text-slate-500 text-xs">offline</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {!room?.members?.length && (
                                                <p className="text-slate-400 text-sm">Nenhum membro ainda.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardBorder>

                            <CardBorder className="bg-slate-900/50">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white">Tokens</h3>
                                    <Button
                                        buttonLabel={
                                            <div className="flex items-center gap-2">
                                                <Plus className="w-4 h-4" />
                                                <span>Novo token</span>
                                            </div>
                                        }
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleAddToken();
                                        }}
                                        classname="bg-emerald-700 hover:bg-emerald-600 text-sm"
                                    />
                                </div>
                                <div className="space-y-3">
                                    {sceneState.tokens?.map((token) => (
                                        <div
                                            key={token.id}
                                            className="p-3 bg-slate-800/60 rounded border border-slate-700 space-y-2"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <input
                                                    type="text"
                                                    value={token.name}
                                                    onChange={(e) =>
                                                        handleTokenChange(token.id, { name: e.target.value })
                                                    }
                                                    className="flex-1 px-2 py-1 bg-slate-900 text-white rounded border border-slate-700"
                                                />
                                                <Button
                                                    buttonLabel="Remover"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handleRemoveToken(token.id);
                                                    }}
                                                    classname="bg-red-700 hover:bg-red-600 text-xs px-3 py-1"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm text-slate-200">
                                                <label className="flex flex-col gap-1">
                                                    X (%)
                                                    <input
                                                        type="number"
                                                        value={token.x}
                                                        onChange={(e) =>
                                                            handleTokenChange(token.id, {
                                                                x: clampPercent(parseFloat(e.target.value) || 0),
                                                            })
                                                        }
                                                        min={0}
                                                        max={100}
                                                        className="px-2 py-1 bg-slate-900 text-white rounded border border-slate-700"
                                                    />
                                                </label>
                                                <label className="flex flex-col gap-1">
                                                    Y (%)
                                                    <input
                                                        type="number"
                                                        value={token.y}
                                                        onChange={(e) =>
                                                            handleTokenChange(token.id, {
                                                                y: clampPercent(parseFloat(e.target.value) || 0),
                                                            })
                                                        }
                                                        min={0}
                                                        max={100}
                                                        className="px-2 py-1 bg-slate-900 text-white rounded border border-slate-700"
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    ))}
                                    {!sceneState.tokens?.length && (
                                        <p className="text-sm text-slate-400">
                                            Nenhum token. Adicione um para iniciar.
                                        </p>
                                    )}
                                </div>
                            </CardBorder>

                            <CardBorder className="bg-slate-900/50">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="w-5 h-5 text-indigo-300" />
                                        <h3 className="text-lg font-semibold text-white">Chat da sala</h3>
                                    </div>
                                    <Badge
                                        text={socketConnected ? 'Ao vivo' : 'Offline'}
                                        variant={socketConnected ? 'success' : 'danger'}
                                    />
                                </div>
                                <div className="bg-slate-950/40 border border-slate-800 rounded p-3 h-48 overflow-y-auto space-y-2">
                                    {chatMessages.length === 0 && (
                                        <p className="text-sm text-slate-400">Nenhuma mensagem ainda.</p>
                                    )}
                                    {chatMessages.map((msg: RoomChatMessage) => (
                                        <div key={msg.id} className="text-sm text-slate-200">
                                            <span className="text-slate-400 mr-2 text-xs">
                                                {new Date(msg.timestamp).toLocaleTimeString()}
                                            </span>
                                            <span className="font-semibold text-indigo-100">
                                                User {msg.user_id}:
                                            </span>{' '}
                                            <span className="text-slate-100">{msg.message}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={handleChatSubmit}
                                        className="flex-1 px-3 py-2 bg-slate-800 text-white rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="Digite uma mensagem"
                                    />
                                    <Button
                                        buttonLabel={
                                            <div className="flex items-center gap-2">
                                                <Send className="w-4 h-4" />
                                                <span>Enviar</span>
                                            </div>
                                        }
                                        onClick={handleChatSubmit}
                                        classname="bg-blue-700 hover:bg-blue-600"
                                        disabled={!chatInput.trim()}
                                    />
                                </div>
                            </CardBorder>
                        </div>
                    </div>
                </div>
            </Section>
        </Page>
    );
};

export default RoomPage;
