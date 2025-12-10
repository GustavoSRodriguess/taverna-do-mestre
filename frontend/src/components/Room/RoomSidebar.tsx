import React, { useEffect, useState, useMemo } from 'react';
import { X, Users, MessageSquare, Image as ImageIcon, Plus, Swords, Dices } from 'lucide-react';
import { Badge, Button, CardBorder } from '../../ui';
import { RoomChatMessage, SceneToken, Room, SceneState } from '../../types/room';
import { useCharacters } from '../../context/CharactersContext';
import { campaignService, CampaignCharacter } from '../../services/campaignService';

interface RoomSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    room: Room | null;
    onlineMembers: number[];
    sceneState: SceneState;
    setSceneState: React.Dispatch<React.SetStateAction<SceneState>>;
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
    onStartCombat: () => void;
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
    onStartCombat
}) => {
    const memberCount = room?.members?.length || 0;
    const { characters, loading: loadingCharacters } = useCharacters();
    const chatContainerRef = React.useRef<HTMLDivElement>(null);
    const [campaignCharacters, setCampaignCharacters] = useState<CampaignCharacter[]>([]);
    const [loadingCampaignChars, setLoadingCampaignChars] = useState(false);
    const campaignId = room?.campaign_id;

    useEffect(() => {
        const loadCampaignChars = async () => {
            if (!campaignId) {
                setCampaignCharacters([]);
                return;
            }
            try {
                setLoadingCampaignChars(true);
                const response = await campaignService.getCampaignCharacters(campaignId);
                setCampaignCharacters(response.characters || []);
            } catch (err) {
                setCampaignCharacters([]);
            } finally {
                setLoadingCampaignChars(false);
            }
        };
        loadCampaignChars();
    }, [campaignId]);

    const availableCharacters = useMemo(() => {
        if (campaignId) {
            return campaignCharacters;
        }
        return characters;
    }, [campaignCharacters, characters, campaignId]);

    // Scroll automático do chat quando novas mensagens chegam
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

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
                className={`fixed top-0 right-0 h-screen w-full md:w-96 bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto custom-scrollbar ${isOpen ? 'translate-x-0' : 'translate-x-full'
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
                                        setSceneState((prev) => ({
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
                                        setSceneState((prev) => ({
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
                            <div className="flex gap-2">
                                <Button
                                    buttonLabel={
                                        <div className="flex items-center gap-2">
                                            <Swords className="w-4 h-4" />
                                            <span>Combate</span>
                                        </div>
                                    }
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onStartCombat();
                                    }}
                                    classname="bg-red-700 hover:bg-red-600 text-sm"
                                />
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
                        </div>
                        <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                            {sceneState.tokens?.map((token) => {
                                // Memoizar busca do personagem para evitar múltiplas buscas no render
                                const linkedCharacter = token.character_id
                                    ? availableCharacters.find((c) => c.id === token.character_id)
                                    : null;

                                return (
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
                                                    const selectedChar = availableCharacters.find((c) => c.id === charId);
                                                    onTokenChange(token.id, {
                                                        character_id: charId,
                                                        name: selectedChar ? selectedChar.name : token.name
                                                    });
                                                }}
                                                className="px-2 py-1 bg-slate-800 text-white rounded border border-slate-700 text-sm"
                                                disabled={loadingCharacters || loadingCampaignChars}
                                            >
                                                <option value="">Nenhum personagem</option>
                                                {availableCharacters.map((char) => (
                                                    <option key={char.id} value={char.id}>
                                                        {char.name} - Nv{char.level} {char.class}
                                                    </option>
                                                ))}
                                            </select>
                                            {linkedCharacter && (
                                                <div className="text-xs text-emerald-400 mt-1">
                                                    HP: {linkedCharacter.current_hp || linkedCharacter.hp} / {linkedCharacter.hp}
                                                </div>
                                            )}
                                            {campaignId && !linkedCharacter && token.character_id && (
                                                <div className="text-xs text-amber-400 mt-1">
                                                    Personagem fora da campanha
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
                                );
                            })}
                            {!sceneState.tokens?.length && (
                                <p className="text-sm text-slate-400">
                                    Nenhum token. Adicione um para iniciar.
                                </p>
                            )}
                        </div>
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
                        <div
                            ref={chatContainerRef}
                            className="bg-slate-950/40 border border-slate-800 rounded p-3 h-64 overflow-y-auto space-y-2 custom-scrollbar"
                        >
                            {chatMessages.length === 0 && (
                                <p className="text-sm text-slate-400">Nenhuma mensagem ainda.</p>
                            )}
                            {chatMessages.map((msg: RoomChatMessage) => {
                                const displayName = msg.username || (msg.user_id ? `User ${msg.user_id}` : 'Desconhecido');
                                return (
                                msg.kind === 'dice' && msg.dice ? (
                                    <div
                                        key={msg.id}
                                        className="p-3 bg-slate-900/60 border border-indigo-800/70 rounded shadow-sm"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 rounded-full bg-indigo-800/60 text-indigo-200">
                                                    <Dices className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="text-xs text-slate-400">
                                                        {new Date(msg.timestamp).toLocaleTimeString()} · {displayName}
                                                    </div>
                                                    <div className="text-sm text-indigo-100 font-semibold">
                                                        {msg.dice.label || 'Rolagem de dados'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div
                                                className={`text-lg font-bold ${msg.dice.isCritical
                                                    ? 'text-emerald-300'
                                                    : msg.dice.isFumble
                                                        ? 'text-red-300'
                                                        : 'text-white'
                                                    }`}
                                            >
                                                {msg.dice.total ?? '-'}
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-slate-300 flex flex-wrap gap-2">
                                            {msg.dice.notation && (
                                                <span className="px-2 py-1 rounded border border-slate-700 bg-slate-800/70">
                                                    {msg.dice.notation}
                                                </span>
                                            )}
                                            {msg.dice.rolls?.length ? (
                                                <span className="flex items-center gap-1">
                                                    <span className="text-slate-400">Rolagens:</span>
                                                    <span className="text-slate-100">{msg.dice.rolls.join(', ')}</span>
                                                </span>
                                            ) : null}
                                            {typeof msg.dice.modifier === 'number' && msg.dice.modifier !== 0 && (
                                                <span className="text-slate-400">
                                                    Mod: {msg.dice.modifier > 0 ? `+${msg.dice.modifier}` : msg.dice.modifier}
                                                </span>
                                            )}
                                            {msg.dice.advantage && <span className="text-emerald-300">Vantagem</span>}
                                            {msg.dice.disadvantage && <span className="text-amber-300">Desvantagem</span>}
                                            {msg.dice.droppedRolls?.length ? (
                                                <span className="text-slate-400">
                                                    Descartados: {msg.dice.droppedRolls.join(', ')}
                                                </span>
                                            ) : null}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-1">{msg.message}</div>
                                    </div>
                                ) : (
                                    <div key={msg.id} className="text-sm text-slate-200">
                                        <span className="text-slate-400 mr-2 text-xs">
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </span>
                                        <span className="font-semibold text-indigo-100">
                                            {displayName}:
                                        </span>{' '}
                                        <span className="text-slate-100">{msg.message}</span>
                                    </div>
                                )
                                );
                            })}
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
