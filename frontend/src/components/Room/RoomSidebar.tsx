import React, { useEffect, useState } from 'react';
import { X, Users, MessageSquare, Image as ImageIcon, Plus, Swords } from 'lucide-react';
import { Badge, Button, CardBorder } from '../../ui';
import { RoomChatMessage, SceneToken, Room } from '../../types/room';
import { FullCharacter } from '../../types/game';
import { pcService } from '../../services/pcService';
import { InitiativeTracker } from './InitiativeTracker';

interface RoomSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    room: Room | null;
    onlineMembers: number[];
    sceneState: {
        backgroundUrl?: string;
        tokens: SceneToken[];
        notes?: string;
    };
    setSceneState: React.Dispatch<React.SetStateAction<any>>;
    onAddToken: () => void;
    onTokenChange: (tokenId: string, updates: Partial<SceneToken>) => void;
    onRemoveToken: (tokenId: string) => void;
    chatMessages: RoomChatMessage[];
    chatInput: string;
    setChatInput: (value: string) => void;
    onChatSubmit: (e: React.FormEvent | React.KeyboardEvent) => void;
    socketConnected: boolean;
    currentTurnTokenId: string | null;
    onSelectToken: (tokenId: string) => void;
    onNextTurn: () => void;
}

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));

export const RoomSidebar: React.FC<RoomSidebarProps> = ({
    isOpen,
    onClose,
    room,
    onlineMembers,
    sceneState,
    setSceneState,
    onAddToken,
    onTokenChange,
    onRemoveToken,
    chatMessages,
    chatInput,
    setChatInput,
    onChatSubmit,
    socketConnected,
    currentTurnTokenId,
    onSelectToken,
    onNextTurn,
}) => {
    const memberCount = room?.members?.length || 0;
    const [characters, setCharacters] = useState<FullCharacter[]>([]);
    const [loadingCharacters, setLoadingCharacters] = useState(false);

    // Buscar personagens disponíveis
    useEffect(() => {
        const fetchCharacters = async () => {
            try {
                setLoadingCharacters(true);
                const response = await pcService.getPCs(100, 0);
                setCharacters(response.pcs || []);
            } catch (error) {
                console.error('Erro ao buscar personagens:', error);
            } finally {
                setLoadingCharacters(false);
            }
        };

        if (isOpen) {
            fetchCharacters();
        }
    }, [isOpen]);

    return (
        <>
            {/* Overlay escuro quando sidebar está aberta */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 h-screen w-full md:w-96 bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header da Sidebar */}
                <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Painel de Controle</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Conteúdo da Sidebar */}
                <div className="p-4 space-y-4">
                    {/* Seção de Participantes */}
                    <CardBorder className="bg-slate-800/50">
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
                                <p className="mb-2">Membros ({memberCount})</p>
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

                    {/* Seção de Configurações da Cena */}
                    <CardBorder className="bg-slate-800/50">
                        <div className="flex items-center gap-2 mb-4">
                            <ImageIcon className="w-5 h-5 text-indigo-300" />
                            <h3 className="text-lg font-semibold text-white">Configurações da Cena</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-indigo-200 mb-2">
                                    URL da imagem de fundo
                                </label>
                                <input
                                    type="text"
                                    value={sceneState.backgroundUrl || ''}
                                    onChange={(e) =>
                                        setSceneState((prev: any) => ({
                                            ...prev,
                                            backgroundUrl: e.target.value,
                                        }))
                                    }
                                    className="w-full px-3 py-2 bg-slate-900 text-white rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="https://..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-indigo-200 mb-2">
                                    Notas da cena (opcional)
                                </label>
                                <textarea
                                    value={sceneState.notes || ''}
                                    onChange={(e) =>
                                        setSceneState((prev: any) => ({
                                            ...prev,
                                            notes: e.target.value,
                                        }))
                                    }
                                    className="w-full h-24 px-3 py-2 bg-slate-900 text-white rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                    placeholder="Notas rápidas ou legendas para os jogadores"
                                />
                            </div>
                        </div>
                    </CardBorder>

                    {/* Seção de Tokens */}
                    <CardBorder className="bg-slate-800/50">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-white">Tokens</h3>
                            <Button
                                buttonLabel={
                                    <div className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        <span>Novo</span>
                                    </div>
                                }
                                onClick={(e) => {
                                    e.preventDefault();
                                    onAddToken();
                                }}
                                classname="bg-emerald-700 hover:bg-emerald-600 text-sm"
                            />
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {sceneState.tokens?.map((token) => (
                                <div
                                    key={token.id}
                                    className="p-3 bg-slate-900/60 rounded border border-slate-700 space-y-2"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <input
                                            type="text"
                                            value={token.name}
                                            onChange={(e) =>
                                                onTokenChange(token.id, { name: e.target.value })
                                            }
                                            className="flex-1 px-2 py-1 bg-slate-800 text-white rounded border border-slate-700 text-sm"
                                        />
                                        <Button
                                            buttonLabel="X"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onRemoveToken(token.id);
                                            }}
                                            classname="bg-red-700 hover:bg-red-600 text-xs px-2 py-1"
                                        />
                                    </div>

                                    {/* Dropdown para vincular personagem */}
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-slate-300">Personagem vinculado</label>
                                        <select
                                            value={token.character_id || ''}
                                            onChange={(e) => {
                                                const charId = e.target.value ? parseInt(e.target.value) : undefined;
                                                const selectedChar = characters.find(c => c.id === charId);
                                                onTokenChange(token.id, {
                                                    character_id: charId,
                                                    name: selectedChar ? selectedChar.name : token.name
                                                });
                                            }}
                                            className="px-2 py-1 bg-slate-800 text-white rounded border border-slate-700 text-sm"
                                            disabled={loadingCharacters}
                                        >
                                            <option value="">Nenhum personagem</option>
                                            {characters.map((char) => (
                                                <option key={char.id} value={char.id}>
                                                    {char.name} - Nv{char.level} {char.class}
                                                </option>
                                            ))}
                                        </select>
                                        {token.character_id && characters.find(c => c.id === token.character_id) && (
                                            <div className="text-xs text-emerald-400 mt-1">
                                                HP: {characters.find(c => c.id === token.character_id)?.current_hp || characters.find(c => c.id === token.character_id)?.hp} / {characters.find(c => c.id === token.character_id)?.hp}
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 text-sm text-slate-200">
                                        <label className="flex flex-col gap-1">
                                            X (%)
                                            <input
                                                type="number"
                                                value={token.x}
                                                onChange={(e) =>
                                                    onTokenChange(token.id, {
                                                        x: clampPercent(parseFloat(e.target.value) || 0),
                                                    })
                                                }
                                                min={0}
                                                max={100}
                                                className="px-2 py-1 bg-slate-800 text-white rounded border border-slate-700"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1">
                                            Y (%)
                                            <input
                                                type="number"
                                                value={token.y}
                                                onChange={(e) =>
                                                    onTokenChange(token.id, {
                                                        y: clampPercent(parseFloat(e.target.value) || 0),
                                                    })
                                                }
                                                min={0}
                                                max={100}
                                                className="px-2 py-1 bg-slate-800 text-white rounded border border-slate-700"
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

                    {/* Seção de Iniciativa */}
                    <CardBorder className="bg-slate-800/50">
                        <div className="flex items-center gap-2 mb-4">
                            <Swords className="w-5 h-5 text-red-400" />
                            <h3 className="text-lg font-semibold text-white">Ordem de Iniciativa</h3>
                        </div>
                        <InitiativeTracker
                            tokens={sceneState.tokens || []}
                            currentTurnTokenId={currentTurnTokenId}
                            onSelectToken={onSelectToken}
                            onNextTurn={onNextTurn}
                        />
                    </CardBorder>

                    {/* Seção de Chat */}
                    <CardBorder className="bg-slate-800/50">
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
                        <div className="bg-slate-950/40 border border-slate-800 rounded p-3 h-64 overflow-y-auto space-y-2">
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
                                onKeyDown={onChatSubmit}
                                className="flex-1 px-3 py-2 bg-slate-900 text-white rounded border border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Digite uma mensagem"
                            />
                            <Button
                                buttonLabel="Enviar"
                                onClick={onChatSubmit}
                                classname="bg-blue-700 hover:bg-blue-600"
                                disabled={!chatInput.trim()}
                            />
                        </div>
                    </CardBorder>
                </div>
            </div>
        </>
    );
};
