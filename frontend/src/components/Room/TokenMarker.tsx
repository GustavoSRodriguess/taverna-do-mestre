import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { SceneToken } from '../../types/room';
import { FullCharacter, GameAttributes, GameSpell, GameAttack } from '../../types/game';
import { pcService } from '../../services/pcService';
import { getConditionById } from '../../constants/conditions';
import { clampPercent, calculateHPPercentage, getHPColor, getHPTextColor } from '../../utils/tokenUtils';
import { useDice } from '../../context/DiceContext';
import { campaignService, CampaignCharacter } from '../../services/campaignService';
import { Swords } from 'lucide-react';

interface TokenMarkerProps {
    token: SceneToken;
    onMouseDown: (e: React.MouseEvent) => void;
    onClick?: () => void;
    isCurrentTurn?: boolean;
    currentUserId?: number;
    isGM?: boolean;
    campaignId?: number;
}

export const TokenMarker: React.FC<TokenMarkerProps> = ({
    token,
    onMouseDown,
    onClick,
    isCurrentTurn = false,
    currentUserId,
    isGM = false,
    campaignId,
}) => {
    const [character, setCharacter] = useState<(FullCharacter | CampaignCharacter) | null>(null);
    const [characterError, setCharacterError] = useState<string | null>(null);
    const [isCharacterLoading, setIsCharacterLoading] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const { roll } = useDice();

    useEffect(() => {
        const charId = token.character_id;
        if (charId === undefined || charId === null) {
            setCharacter(null);
            setCharacterError(null);
            setIsCharacterLoading(false);
            return;
        }
        const characterId = Number(charId);

        let isCurrentRequest = true;

        const fetchCharacter = async () => {
            try {
                setIsCharacterLoading(true);
                setCharacter(null);
                setCharacterError(null);
                const char = campaignId
                    ? await campaignService.getCampaignCharacter(campaignId, characterId)
                    : await pcService.getPC(characterId);
                if (!isCurrentRequest) return;
                setCharacter(char as FullCharacter | CampaignCharacter);
            } catch (error) {
                if (!isCurrentRequest) return;
                console.error(`Erro ao carregar personagem ${characterId}`, error);
                setCharacter(null);
                setCharacterError('Personagem não encontrado');
            } finally {
                if (!isCurrentRequest) return;
                setIsCharacterLoading(false);
            }
        };

        fetchCharacter();

        return () => {
            isCurrentRequest = false;
        };
    }, [token.character_id, campaignId]);

    const currentHP = token.current_hp ?? character?.current_hp ?? character?.hp ?? 0;
    const tempHP = token.temp_hp || 0;
    const maxHP = token.max_hp || character?.hp || 0;
    const hpPercentage = calculateHPPercentage(currentHP, maxHP);
    const activeConditions = token.conditions || [];
    const showTooltip = Boolean(!showQuickActions && (character || characterError || maxHP > 0 || activeConditions.length > 0));
    const canControl = useMemo(() => {
        if (isGM) return true;
        if (character?.player_id && currentUserId) {
            return character.player_id === currentUserId;
        }
        // tokens sem personagem: só GM controla
        return false;
    }, [character?.player_id, currentUserId, isGM]);

    const abilityMod = useCallback((score?: number) => {
        if (score === undefined || score === null) return 0;
        return Math.floor((score - 10) / 2);
    }, []);

    const quickAbilityChecks = useMemo(() => {
        if (!character || !character.attributes) return [];
        const attrs = character.attributes;
        return [
            { key: 'str', label: 'STR', mod: abilityMod(attrs.strength) },
            { key: 'dex', label: 'DEX', mod: abilityMod(attrs.dexterity) },
            { key: 'con', label: 'CON', mod: abilityMod(attrs.constitution) },
            { key: 'int', label: 'INT', mod: abilityMod(attrs.intelligence) },
            { key: 'wis', label: 'WIS', mod: abilityMod(attrs.wisdom) },
            { key: 'cha', label: 'CHA', mod: abilityMod(attrs.charisma) },
        ];
    }, [abilityMod, character]);

    const spellStats = useMemo(() => {
        if (!character) {
            return { spells: { known_spells: [], spell_slots: {} }, attackBonus: 0, saveDC: 0, prepared: [] as GameSpell[] };
        }
        const spells = (character as any).spells || { known_spells: [], spell_slots: {} };
        const abilityKey = spells.spellcasting_ability as keyof GameAttributes | undefined;
        const mod = abilityKey && character.attributes ? abilityMod(character.attributes[abilityKey]) : 0;
        const prof = character.proficiency_bonus || 0;
        const attackBonus = spells.spell_attack_bonus ?? mod + prof;
        const saveDC = spells.spell_save_dc ?? 8 + mod + prof;
        const knownSpells = (spells.known_spells || []) as GameSpell[];
        const prepared = knownSpells.filter((s: GameSpell) => s.prepared ?? true);
        return { spells, attackBonus, saveDC, prepared };
    }, [abilityMod, character]);

    const handleRoll = useCallback(
        async (notation: string, label?: string) => {
            if (!canControl) return;
            try {
                await roll(notation, label);
            } catch (err) {
                // falha na rolagem é silenciosa para não travar UI
            }
        },
        [canControl, roll],
    );

    const handleSpellDamageRoll = useCallback(
        async (spellName?: string) => {
            if (!canControl) return;
            const notation = window.prompt('Notação do dano da magia', '1d8');
            if (!notation || !notation.trim()) return;
            await handleRoll(notation.trim(), spellName ? `Dano: ${spellName}` : 'Dano de Magia');
        },
        [canControl, handleRoll],
    );

    const handleMouseDownSafe = useCallback(
        (e: React.MouseEvent) => {
            if (!canControl) return;
            onMouseDown(e);
        },
        [canControl, onMouseDown],
    );

    const handleDoubleClickSafe = useCallback(
        (e: React.MouseEvent) => {
            if (!canControl) return;
            e.stopPropagation();
            onClick?.();
        },
        [canControl, onClick],
    );

    return (
        <div
            className="absolute group"
            style={{
                left: `${clampPercent(token.x)}%`,
                top: `${clampPercent(token.y)}%`,
                transform: 'translate(-50%, -50%)',
            }}
        >
            {/* Quick actions hotspot (somente para quem pode controlar) */}
            {canControl && character && (
                <div className="absolute -left-14 top-1/2 -translate-y-1/2 z-20">
                    <button
                        className={`w-10 h-10 rounded-full border border-purple-400/70 bg-slate-900/80 text-purple-200 shadow-lg transition hover:scale-105 ${
                            showQuickActions ? 'ring-2 ring-purple-400/60' : ''
                        }`}
                        onClick={() => setShowQuickActions((v) => !v)}
                        title="Ações rápidas"
                    >
                        <Swords className="w-5 h-5 mx-auto" />
                    </button>
                    {showQuickActions && (
                        <div
                            className="mt-2 w-52 bg-slate-900/95 border border-slate-700 rounded-lg shadow-2xl p-3 space-y-3"
                            onMouseLeave={() => setShowQuickActions(false)}
                        >
                            <div className="text-xs text-slate-400 uppercase tracking-wide">Ataques</div>
                            <div className="space-y-1">
                {character.attacks?.length ? (
                    character.attacks.slice(0, 4).map((atk: GameAttack) => (
                        <div
                            key={atk.name}
                            className="w-full text-sm text-white bg-slate-800/80 rounded px-2 py-1"
                        >
                                            <div className="flex justify-between items-center">
                                                <span>{atk.name}</span>
                                                <span className="text-indigo-300 text-xs">+{atk.bonus}</span>
                                            </div>
                                            <div className="flex gap-1 mt-1">
                                                <button
                                                    className="flex-1 bg-slate-700 hover:bg-slate-600 rounded px-2 py-1 text-xs"
                                                    onClick={() => handleRoll(`1d20+${atk.bonus}`, `Ataque: ${atk.name}`)}
                                                >
                                                    Acerto
                                                </button>
                                                {atk.damage && (
                                                    <button
                                                        className="flex-1 bg-slate-700 hover:bg-slate-600 rounded px-2 py-1 text-xs"
                                                        onClick={() => handleRoll(atk.damage, `Dano: ${atk.name}`)}
                                                    >
                                                        Dano ({atk.damage})
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xs text-slate-500">Nenhum ataque cadastrado</div>
                                )}
                            </div>
                            <div className="text-xs text-slate-400 uppercase tracking-wide">Testes</div>
                            <div className="grid grid-cols-3 gap-2">
                                {quickAbilityChecks.map((ability) => (
                                    <button
                                        key={ability.key}
                                        className="text-sm text-white bg-slate-800/80 hover:bg-slate-700 rounded px-2 py-1 text-center"
                                        onClick={() => handleRoll(`1d20+${ability.mod}`, `Teste ${ability.label}`)}
                                    >
                                        {ability.label} {ability.mod >= 0 ? `+${ability.mod}` : ability.mod}
                                    </button>
                                ))}
                            </div>
                            {spellStats.prepared.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-slate-800">
                                    <div className="text-xs text-slate-400 uppercase tracking-wide">Magias</div>
                                    <div className="flex items-center justify-between text-xs text-indigo-200">
                                        <button
                                            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-white text-xs"
                                            onClick={() => handleRoll(`1d20+${spellStats.attackBonus}`, 'Ataque de Magia')}
                                        >
                                            Ataque mágico +{spellStats.attackBonus}
                                        </button>
                                        <span className="px-2 py-1 rounded bg-slate-800/60 text-slate-300">
                                            CD {spellStats.saveDC}
                                        </span>
                                    </div>
                                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                        {spellStats.prepared.slice(0, 6).map((spell: GameSpell, idx: number) => (
                                            <div
                                                key={`${spell.name}-${idx}`}
                                                className="bg-slate-800/60 rounded px-2 py-1 text-xs text-white border border-slate-700"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span>{spell.name}</span>
                                                    <span className="text-indigo-300">Nv {spell.level ?? 0}</span>
                                                </div>
                                                <div className="flex gap-1 mt-1">
                                                    <button
                                                        className="flex-1 bg-slate-700 hover:bg-slate-600 rounded px-2 py-1"
                                                        onClick={() =>
                                                            handleRoll(
                                                                `1d20+${spellStats.attackBonus}`,
                                                                `Ataque de Magia: ${spell.name}`,
                                                            )
                                                        }
                                                    >
                                                        Atacar
                                                    </button>
                                                    <button
                                                        className="flex-1 bg-slate-700 hover:bg-slate-600 rounded px-2 py-1"
                                                        onClick={() => handleSpellDamageRoll(spell.name)}
                                                    >
                                                        Dano
                                                    </button>
                                                    <span className="flex-1 bg-slate-700/60 rounded px-2 py-1 text-center text-slate-200">
                                                        CD {spellStats.saveDC}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
            {/* Token principal */}
            <div
                className="flex flex-col items-center cursor-grab active:cursor-grabbing select-none"
                onMouseDown={handleMouseDownSafe}
                onDoubleClick={handleDoubleClickSafe}
            >
                {/* Círculo do token */}
                <div className="relative">
                    <div
                        className={`flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full text-sm md:text-base font-bold shadow-2xl transition-all hover:scale-110 ${
                            isCurrentTurn
                                ? 'border-4 border-yellow-400 ring-4 ring-yellow-400/50 animate-pulse'
                                : 'border-2 border-white/60'
                        }`}
                        style={{
                            backgroundColor: token.color || '#6366f1',
                        }}
                        title={token.name}
                    >
                        {token.name.slice(0, 3).toUpperCase()}
                    </div>

                    {/* Indicadores de Condições */}
                    {activeConditions.length > 0 && (
                        <div className="absolute -top-1 -right-1 flex gap-0.5">
                            {activeConditions.slice(0, 3).map((condId) => {
                                const cond = getConditionById(condId);
                                if (!cond) return null;
                                return (
                                    <div
                                        key={condId}
                                        className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white shadow-lg"
                                        style={{ backgroundColor: cond.color }}
                                        title={cond.name}
                                    />
                                );
                            })}
                            {activeConditions.length > 3 && (
                                <div
                                    className="w-3 h-3 md:w-4 md:h-4 rounded-full border-2 border-white shadow-lg bg-slate-700 flex items-center justify-center text-[8px] font-bold text-white"
                                    title={`+${activeConditions.length - 3} condições`}
                                >
                                    +{activeConditions.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Barra de HP (mostra sempre se tiver HP definido) */}
                {maxHP > 0 && (
                    <div className="mt-1 w-12 md:w-16">
                        <div className="bg-slate-800/80 rounded-full h-2 overflow-hidden border border-slate-600">
                            <div
                                className={`h-full transition-all duration-300 ${getHPColor(hpPercentage)}`}
                                style={{ width: `${hpPercentage}%` }}
                            />
                        </div>
                        <div className="text-center text-xs text-white font-semibold mt-0.5 drop-shadow-lg flex items-center justify-center gap-1">
                            {tempHP > 0 && (
                                <span className="text-cyan-400">+{tempHP}</span>
                            )}
                            <span>{currentHP}/{maxHP}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Tooltip com informações detalhadas (aparece ao hover) */}
            {showTooltip && (
                <div className="absolute left-full ml-2 top-0 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-slate-900/95 backdrop-blur-sm border border-slate-700 rounded-lg p-3 shadow-xl min-w-[200px]">
                        <div className="space-y-1 text-sm text-white">
                            <div className="font-bold text-base text-indigo-300">
                                {character?.name || token.name}
                            </div>
                            <div className="text-xs text-yellow-400 italic">
                                Duplo clique para editar
                            </div>
                            {isCharacterLoading && (
                                <div className="text-xs text-slate-400">Carregando personagem...</div>
                            )}
                            {character && (
                                <div className="text-slate-300">
                                    {character.race} {character.class} - Nível {character.level}
                                </div>
                            )}
                            {characterError && !isCharacterLoading && (
                                <div className="text-xs text-red-300">{characterError}</div>
                            )}
                            <div className="border-t border-slate-700 pt-1 mt-2 space-y-1">
                                {character && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">CA:</span>
                                            <span className="font-semibold">{character.ca}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">Proficiência:</span>
                                            <span className="font-semibold">+{character.proficiency_bonus}</span>
                                        </div>
                                    </>
                                )}
                                {maxHP > 0 && (
                                    <>
                                        <div className="flex justify-between">
                                            <span className="text-slate-400">HP:</span>
                                            <span className={`font-semibold ${getHPTextColor(hpPercentage)}`}>
                                                {currentHP} / {maxHP}
                                            </span>
                                        </div>
                                        {tempHP > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-400">HP Temp:</span>
                                                <span className="font-semibold text-cyan-400">+{tempHP}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                                {activeConditions.length > 0 && (
                                    <div className="border-t border-slate-700 pt-1 mt-1">
                                        <div className="text-slate-400 text-xs mb-1">Condições:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {activeConditions.map((condId) => {
                                                const cond = getConditionById(condId);
                                                if (!cond) return null;
                                                return (
                                                    <span
                                                        key={condId}
                                                        className="text-xs px-1.5 py-0.5 rounded"
                                                        style={{ backgroundColor: cond.color + '40', color: cond.color }}
                                                        title={cond.description}
                                                    >
                                                        {cond.name}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
