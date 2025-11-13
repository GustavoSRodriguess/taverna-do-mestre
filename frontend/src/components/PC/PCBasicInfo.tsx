// frontend/src/components/PC/PCBasicInfo.tsx - Versão Refatorada
import React, { useState } from 'react';
import { CardBorder, Modal, ModalConfirmFooter } from '../../ui';
import { FullCharacter } from '../../types/game';
import { HomebrewRace, HomebrewClass, HomebrewBackground } from '../../services/homebrewService';
import { ALIGNMENTS } from '../../utils/gameUtils';
import { pcService } from '../../services/pcService';
import { User, Info, BookOpen, Users, Sword, Scroll, Sparkles, Wand2, AlertTriangle } from 'lucide-react';

interface PCBasicInfoProps {
    pcData: FullCharacter;
    updatePCData: (updates: Partial<FullCharacter>) => void;
    races: any[];
    classes: any[];
    backgrounds: any[];
    homebrewRaces: HomebrewRace[];
    homebrewClasses: HomebrewClass[];
    homebrewBackgrounds: HomebrewBackground[];
    useHomebrew: boolean;
    setUseHomebrew: (value: boolean) => void;
}

const PCBasicInfo: React.FC<PCBasicInfoProps> = ({
    pcData,
    updatePCData,
    races,
    classes,
    backgrounds,
    homebrewRaces,
    homebrewClasses,
    homebrewBackgrounds,
    useHomebrew,
    setUseHomebrew
}) => {
    const [showUniqueWarning, setShowUniqueWarning] = useState(false);
    const [campaignCount, setCampaignCount] = useState(0);

    console.log('races2, classes2, backgrounds2');
    console.log(races, classes, backgrounds);

    // Combine official and homebrew data based on toggle
    const availableRaces = useHomebrew ? [...(races || []), ...(homebrewRaces || [])] : races;
    const availableClasses = useHomebrew ? [...(classes || []), ...(homebrewClasses || [])] : classes;
    const availableBackgrounds = useHomebrew ? [...(backgrounds || []), ...(homebrewBackgrounds || [])] : backgrounds;

    const handleUniqueCheckboxChange = async (checked: boolean) => {
        // Se está marcando como único
        if (checked && pcData.id) {
            try {
                // Verificar quantas campanhas o PC está
                const availability = await pcService.checkPCAvailability(pcData.id);

                if (availability.campaign_count > 1) {
                    // Mostrar aviso se está em mais de uma campanha
                    setCampaignCount(availability.campaign_count);
                    setShowUniqueWarning(true);
                    return; // Não marca ainda
                }
            } catch (err) {
                console.error('Erro ao verificar disponibilidade:', err);
            }
        }

        // Se está desmarcando ou se não há problema, atualiza normalmente
        updatePCData({ is_unique: checked });
    };

    const confirmUniqueChange = () => {
        updatePCData({ is_unique: true });
        setShowUniqueWarning(false);
    };

    const handleRaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        // Try to find in homebrew first, then in official races
        let selectedRace = homebrewRaces?.find(r => r.name === e.target.value);
        if (!selectedRace) {
            selectedRace = races?.find(r => r.name === e.target.value);
        }

        if (selectedRace) {
            updatePCData({ race: selectedRace.name });
        }
    };

    const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        // Try to find in homebrew first, then in official classes
        let selectedClass = homebrewClasses?.find(c => c.name === e.target.value);
        if (!selectedClass) {
            selectedClass = classes?.find(c => c.name === e.target.value);
        }

        if (selectedClass) {
            const hitDie = selectedClass.hit_die || 8;
            const conMod = Math.floor((pcData.attributes.constitution - 10) / 2);
            const newHP = hitDie + conMod + (pcData.level - 1) * (Math.floor(hitDie / 2) + 1 + conMod);

            updatePCData({
                class: selectedClass.name,
                hp: Math.max(newHP, 1)
            });
        }
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <CardBorder className="bg-indigo-950/80">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <User className="w-6 h-6 text-purple-400" />
                        <h3 className="text-xl font-bold text-purple-400">Informações Básicas</h3>
                    </div>

                    {/* Homebrew Toggle */}
                    <div className="flex items-center gap-2 bg-indigo-900/50 px-3 py-2 rounded border border-indigo-700">
                        <Wand2 className={`w-4 h-4 ${useHomebrew ? 'text-purple-400' : 'text-gray-400'}`} />
                        <label className="flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useHomebrew}
                                onChange={(e) => {
                                    const newValue = e.target.checked;
                                    setUseHomebrew(newValue);
                                    updatePCData({ is_homebrew: newValue });
                                }}
                                className="mr-2 w-4 h-4 text-purple-600 focus:ring-purple-500
                                 border-indigo-600 rounded bg-indigo-900/50"
                            />
                            <span className="text-sm text-indigo-200 font-medium">Homebrew</span>
                        </label>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-indigo-200 mb-2 font-medium">Nome do Personagem *</label>
                        <input
                            type="text"
                            value={pcData.name}
                            onChange={(e) => updatePCData({ name: e.target.value })}
                            className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                             bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Ex: Gandalf, Legolas..."
                            maxLength={100}
                        />
                    </div>

                    <div>
                        <label className="block text-indigo-200 mb-2 font-medium">Nome do Jogador</label>
                        <input
                            type="text"
                            value={pcData.player_name || ''}
                            onChange={(e) => updatePCData({ player_name: e.target.value })}
                            className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                             bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Seu nome"
                            maxLength={100}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-indigo-200 mb-2 font-medium">Raça *</label>
                            <select
                                value={pcData.race}
                                onChange={handleRaceChange}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md
                                 bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Selecione uma raça</option>
                                {useHomebrew ? (
                                    <>
                                        {races && races.length > 0 && (
                                            <optgroup label="📖 Oficial D&D 5e">
                                                {races.map((race) => (
                                                    <option key={race.api_index || race.index} value={race.name}>{race.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                        {homebrewRaces && homebrewRaces.length > 0 && (
                                            <optgroup label="✨ Homebrew">
                                                {homebrewRaces.map((race) => (
                                                    <option key={race.id} value={race.name}>{race.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </>
                                ) : (
                                    availableRaces && availableRaces.map((race) => (
                                        <option key={race.api_index || race.id || race.index} value={race.name}>{race.name}</option>
                                    ))
                                )}
                            </select>
                            {(!availableRaces || availableRaces.length === 0) && (
                                <div className="text-xs text-yellow-400 mt-1">
                                    Carregando raças...
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-indigo-200 mb-2 font-medium">Classe *</label>
                            <select
                                value={pcData.class}
                                onChange={handleClassChange}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md
                                 bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">Selecione uma classe</option>
                                {useHomebrew ? (
                                    <>
                                        {classes && classes.length > 0 && (
                                            <optgroup label="📖 Oficial D&D 5e">
                                                {classes.map((cls) => (
                                                    <option key={cls.api_index} value={cls.name}>{cls.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                        {homebrewClasses && homebrewClasses.length > 0 && (
                                            <optgroup label="✨ Homebrew">
                                                {homebrewClasses.map((cls) => (
                                                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </>
                                ) : (
                                    availableClasses && availableClasses.map((cls) => (
                                        <option key={cls.api_index || cls.id} value={cls.name}>{cls.name}</option>
                                    ))
                                )}
                            </select>
                            {(!availableClasses || availableClasses.length === 0) && (
                                <div className="text-xs text-yellow-400 mt-1">
                                    Carregando classes...
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-indigo-200 mb-2 font-medium">Nível</label>
                            <input
                                type="number"
                                value={pcData.level}
                                onChange={(e) => updatePCData({ level: parseInt(e.target.value) || 1 })}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                                 bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                min={1}
                                max={20}
                            />
                        </div>

                        <div>
                            <label className="block text-indigo-200 mb-2 font-medium">Bônus de Proficiência</label>
                            <input
                                type="number"
                                value={pcData.proficiency_bonus}
                                onChange={(e) => updatePCData({ proficiency_bonus: parseInt(e.target.value) || 2 })}
                                className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                                 bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                                min={1}
                                max={6}
                            />
                            <div className="text-xs text-indigo-400 mt-1">Calculado automaticamente pelo nível</div>
                        </div>
                    </div>
                </div>
            </CardBorder>

            {/* Additional Details */}
            <CardBorder className="bg-indigo-950/80">
                <div className="flex items-center gap-2 mb-4">
                    <Info className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-bold text-purple-400">Detalhes</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-indigo-200 mb-2 font-medium">Antecedente</label>
                        <select
                            value={pcData.background}
                            onChange={(e) => updatePCData({ background: e.target.value })}
                            className="w-full px-3 py-2 border border-indigo-700 rounded-md
                             bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Selecione um antecedente</option>
                            {useHomebrew ? (
                                <>
                                    {backgrounds && backgrounds.length > 0 && (
                                        <optgroup label="📖 Oficial D&D 5e">
                                            {backgrounds.map((bg) => (
                                                <option key={bg.api_index} value={bg.name}>{bg.name}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                    {homebrewBackgrounds && homebrewBackgrounds.length > 0 && (
                                        <optgroup label="✨ Homebrew">
                                            {homebrewBackgrounds.map((bg) => (
                                                <option key={bg.id} value={bg.name}>{bg.name}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                </>
                            ) : (
                                availableBackgrounds && availableBackgrounds.map((bg) => (
                                    <option key={bg.api_index || bg.id} value={bg.name}>{bg.name}</option>
                                ))
                            )}
                        </select>
                        {(!availableBackgrounds || availableBackgrounds.length === 0) && (
                            <div className="text-xs text-yellow-400 mt-1">
                                Carregando antecedentes...
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-indigo-200 mb-2 font-medium">Alinhamento</label>
                        <select
                            value={pcData.alignment}
                            onChange={(e) => updatePCData({ alignment: e.target.value })}
                            className="w-full px-3 py-2 border border-indigo-700 rounded-md 
                             bg-indigo-900/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Selecione um alinhamento</option>
                            {ALIGNMENTS.map((alignment) => (
                                <option key={alignment} value={alignment}>{alignment}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="inspiration"
                            checked={pcData.inspiration}
                            onChange={(e) => updatePCData({ inspiration: e.target.checked })}
                            className="mr-3 w-4 h-4 text-purple-600 focus:ring-purple-500
                             border-indigo-600 rounded bg-indigo-900/50"
                        />
                        <label htmlFor="inspiration" className="text-white font-medium">Inspiração</label>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is_unique"
                            checked={pcData.is_unique || false}
                            onChange={(e) => handleUniqueCheckboxChange(e.target.checked)}
                            className="mr-3 w-4 h-4 text-purple-600 focus:ring-purple-500
                             border-indigo-600 rounded bg-indigo-900/50"
                        />
                        <label htmlFor="is_unique" className="text-white font-medium">Personagem Único</label>
                    </div>
                    <div className="text-xs text-indigo-300 -mt-2 ml-7">
                        Personagens únicos podem estar em apenas uma campanha por vez
                    </div>
                </div>

                {/* Preview */}
                <div className="mt-6 p-4 bg-indigo-900/30 rounded border border-indigo-800">
                    <h4 className="font-medium text-indigo-200 mb-2">Preview</h4>
                    <div className="text-sm text-indigo-300">
                        <p className="font-bold text-white">{pcData.name || 'Nome do Personagem'}</p>
                        <p>
                            {pcData.race && pcData.class
                                ? `${pcData.race} ${pcData.class}`
                                : 'Raça e Classe não definidas'
                            }
                        </p>
                        <p>Nível {pcData.level} • Proficiência +{pcData.proficiency_bonus}</p>
                        <p>{pcData.background || 'Antecedente não definido'}</p>
                        {pcData.alignment && <p>Alinhamento: {pcData.alignment}</p>}
                        {pcData.inspiration && (
                            <div className="flex items-center gap-1 text-yellow-400">
                                <Sparkles className="w-3 h-3" />
                                <span>Inspirado</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* D&D API Info */}
                {(pcData.race || pcData.class || pcData.background) && (
                    <div className="mt-4 p-3 rounded border bg-purple-900/20 border-purple-800">
                        <div className="flex items-center gap-2 mb-2">
                            {useHomebrew ? (
                                <>
                                    <BookOpen className="w-4 h-4 text-purple-300" />
                                    <Wand2 className="w-4 h-4 text-purple-300" />
                                </>
                            ) : (
                                <BookOpen className="w-4 h-4 text-purple-300" />
                            )}
                            <h5 className="text-sm font-bold text-purple-300">
                                {useHomebrew ? 'Modo Homebrew (Oficial + Customizado)' : 'Dados do D&D 5e API'}
                            </h5>
                        </div>
                        <div className="text-xs text-purple-200 space-y-1">
                            {useHomebrew ? (
                                <p>Com Homebrew ativado, você pode escolher entre conteúdo oficial do D&D 5e e suas criações customizadas.</p>
                            ) : (
                                <>
                                    {pcData.race && (
                                        <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            <span>Modificadores raciais aplicados automaticamente</span>
                                        </div>
                                    )}
                                    {pcData.class && (
                                        <div className="flex items-center gap-1">
                                            <Sword className="w-3 h-3" />
                                            <span>Dado de vida e HP calculados pela classe</span>
                                        </div>
                                    )}
                                    {pcData.background && (
                                        <div className="flex items-center gap-1">
                                            <Scroll className="w-3 h-3" />
                                            <span>Proficiências do antecedente disponíveis</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}
            </CardBorder>

            {/* Modal de Aviso - Múltiplas Campanhas */}
            <Modal
                isOpen={showUniqueWarning}
                onClose={() => setShowUniqueWarning(false)}
                title={
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-400" />
                        <span>Atenção: Personagem em Múltiplas Campanhas</span>
                    </div>
                }
                size="md"
                footer={
                    <ModalConfirmFooter
                        onConfirm={confirmUniqueChange}
                        onCancel={() => setShowUniqueWarning(false)}
                        confirmLabel="Marcar como Único Mesmo Assim"
                        cancelLabel="Cancelar"
                        confirmVariant="bg-yellow-600 hover:bg-yellow-700"
                    />
                }
            >
                <div className="space-y-4">
                    <div className="bg-yellow-900/20 p-4 rounded border border-yellow-600/30">
                        <h4 className="font-bold text-yellow-200 mb-2">Personagem em {campaignCount} campanhas</h4>
                        <p className="text-yellow-300 text-sm">
                            Este personagem está atualmente em <strong>{campaignCount} campanhas ativas</strong>.
                        </p>
                    </div>

                    <div className="bg-indigo-900/30 p-4 rounded border border-indigo-800">
                        <p className="text-indigo-200 text-sm mb-3">
                            <strong>Personagens únicos</strong> só podem estar em <strong>uma campanha por vez</strong>.
                        </p>
                        <p className="text-indigo-300 text-sm">
                            Se você marcar este personagem como único:
                        </p>
                        <ul className="text-indigo-300 text-sm mt-2 space-y-1 ml-4">
                            <li>• Você precisará removê-lo de todas as campanhas exceto uma</li>
                            <li>• Não poderá adicioná-lo a outras campanhas sem removê-lo da atual</li>
                            <li>• Esta configuração pode ser alterada a qualquer momento</li>
                        </ul>
                    </div>

                    <div className="text-center">
                        <p className="text-white font-medium">
                            Deseja marcar <strong>{pcData.name}</strong> como personagem único?
                        </p>
                        <p className="text-indigo-300 text-sm mt-1">
                            Você terá que removê-lo de {campaignCount - 1} campanha{campaignCount - 1 > 1 ? 's' : ''} manualmente.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default PCBasicInfo;