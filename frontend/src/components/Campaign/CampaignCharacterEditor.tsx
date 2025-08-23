import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, Section, Button, Alert, Loading, Modal, ModalConfirmFooter } from '../../ui';
import { pcService } from '../../services/pcService';
import { campaignService, UpdateCampaignCharacterData } from '../../services/campaignService';
import { dndService } from '../../services/dndService';
import { FullCharacter } from '../../types/game';
import { validateCharacterName, validateLevel, validateAttributes, validateHP } from '../../utils/gameUtils';
import PCBasicInfo from '../PC/PCBasicInfo';
import PCAttributes from '../PC/PCAttributes';
import PCSkills from '../PC/PCSkills';
import PCCombat from '../PC/PCCombat';
import PCSpells from '../PC/PCSpells';
import PCEquipment from '../PC/PCEquipment';
import PCDescription from '../PC/PCDescription';
import { ArrowLeft, Save, RefreshCw, Copy } from 'lucide-react';

const CampaignCharacterEditor: React.FC = () => {
    const { campaignId, characterId } = useParams<{ campaignId: string; characterId: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('basic');
    const [pcData, setPCData] = useState<FullCharacter | null>(null);
    const [campaignInfo, setCampaignInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showSyncModal, setShowSyncModal] = useState(false);

    // D&D API Data
    const [dndRaces, setDndRaces] = useState<any[]>([]);
    const [dndClasses, setDndClasses] = useState<any[]>([]);
    const [dndBackgrounds, setDndBackgrounds] = useState<any[]>([]);

    useEffect(() => {
        loadDnDData();
        if (campaignId && characterId) {
            loadCampaignCharacter();
        }
    }, [campaignId, characterId]);

    const loadDnDData = async () => {
        try {
            const [races, classes, backgrounds] = await Promise.all([
                dndService.getRaces({ limit: 50 }),
                dndService.getClasses({ limit: 50 }),
                dndService.getBackgrounds({ limit: 50 })
            ]);
            setDndRaces(races.results);
            setDndClasses(classes.results);
            setDndBackgrounds(backgrounds.results);
        } catch (err) {
            console.error('Erro ao carregar dados D&D:', err);
        }
    };

    const loadCampaignCharacter = async () => {
        try {
            setLoading(true);
            setError(null);

            // Carregar dados da campanha
            const campaign = await campaignService.getCampaign(parseInt(campaignId!));
            setCampaignInfo(campaign);

            // Carregar personagem da campanha (snapshot)
            const character = await campaignService.getCampaignCharacter(
                parseInt(campaignId!), 
                parseInt(characterId!)
            );

            // Converter para formato FullCharacter
            setPCData({
                id: character.id,
                player_id: character.player_id,
                name: character.name,
                description: character.description,
                level: character.level,
                race: character.race,
                class: character.class,
                background: character.background,
                alignment: character.alignment,
                attributes: character.attributes || {
                    strength: 10,
                    dexterity: 10,
                    constitution: 10,
                    intelligence: 10,
                    wisdom: 10,
                    charisma: 10
                },
                abilities: character.abilities || {},
                skills: character.skills || {},
                attacks: character.attacks || [],
                spells: character.spells || { spell_slots: {}, known_spells: [] },
                equipment: character.equipment || [],
                hp: character.hp,
                current_hp: character.current_hp,
                ca: character.ca,
                proficiency_bonus: character.proficiency_bonus,
                inspiration: character.inspiration,
                personality_traits: character.personality_traits,
                ideals: character.ideals,
                bonds: character.bonds,
                flaws: character.flaws,
                features: character.features || [],
                player_name: character.player_name,
                created_at: character.joined_at
            });
        } catch (err: any) {
            setError('Erro ao carregar personagem da campanha: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const validateData = (data: FullCharacter): string[] => {
        const errors: string[] = [];

        const nameError = validateCharacterName(data.name);
        if (nameError) errors.push(nameError);

        const levelError = validateLevel(data.level);
        if (levelError) errors.push(levelError);

        errors.push(...validateAttributes(data.attributes));
        errors.push(...validateHP(data.hp, data.current_hp));

        if (!data.race?.trim()) errors.push('Raça é obrigatória');
        if (!data.class?.trim()) errors.push('Classe é obrigatória');

        return errors;
    };

    const handleSave = async () => {
        if (!pcData || !campaignId || !characterId) return;

        try {
            setSaving(true);
            setError(null);

            const validationErrors = validateData(pcData);
            if (validationErrors.length > 0) {
                setError('Erros de validação: ' + validationErrors.join(', '));
                return;
            }

            // Atualizar o snapshot completo na campanha
            const updateData: UpdateCampaignCharacterData = {
                name: pcData.name,
                description: pcData.description || '',
                level: pcData.level,
                race: pcData.race || '',
                class: pcData.class || '',
                background: pcData.background || '',
                alignment: pcData.alignment || '',
                attributes: pcData.attributes,
                abilities: pcData.abilities,
                equipment: pcData.equipment,
                hp: pcData.hp,
                current_hp: pcData.current_hp,
                ca: pcData.ca,
                proficiency_bonus: pcData.proficiency_bonus,
                inspiration: pcData.inspiration,
                skills: pcData.skills,
                attacks: pcData.attacks,
                spells: pcData.spells,
                personality_traits: pcData.personality_traits || '',
                ideals: pcData.ideals || '',
                bonds: pcData.bonds || '',
                flaws: pcData.flaws || '',
                features: pcData.features,
                player_name: pcData.player_name || ''
            };

            await campaignService.updateCampaignCharacterFull(
                parseInt(campaignId),
                parseInt(characterId),
                updateData
            );

            setSuccess('Personagem salvo na campanha com sucesso!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError('Erro ao salvar: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSyncToOtherCampaigns = async () => {
        if (!campaignId || !characterId) return;

        try {
            setLoading(true);
            setError(null);

            // Sincronizar com outras campanhas
            const result = await campaignService.syncCampaignCharacter(
                parseInt(campaignId),
                parseInt(characterId),
                { sync_to_other_campaigns: true }
            );

            setShowSyncModal(false);
            setSuccess(result.message || 'Personagem sincronizado com outras campanhas!');
            setTimeout(() => setSuccess(null), 5000);
        } catch (err: any) {
            setError('Erro ao sincronizar: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const updatePCData = (updates: Partial<FullCharacter>) => {
        if (!pcData) return;

        const newData = { ...pcData, ...updates };

        // Auto-calculations
        if (updates.level && updates.level !== pcData.level) {
            newData.proficiency_bonus = pcService.calculateProficiencyBonus(updates.level);
        }

        if (updates.attributes?.dexterity && updates.attributes.dexterity !== pcData.attributes.dexterity) {
            const dexMod = pcService.calculateModifier(updates.attributes.dexterity);
            newData.ca = 10 + dexMod;
        }

        setPCData(newData);
    };

    const tabs = [
        { id: 'basic', label: 'Básico', icon: 'user' },
        { id: 'attributes', label: 'Atributos', icon: 'zap' },
        { id: 'skills', label: 'Perícias', icon: 'target' },
        { id: 'combat', label: 'Combate', icon: 'sword' },
        { id: 'spells', label: 'Magias', icon: 'sparkles' },
        { id: 'equipment', label: 'Equipamentos', icon: 'backpack' },
        { id: 'description', label: 'Descrição', icon: 'file-text' }
    ];

    if (loading) {
        return (
            <Page>
                <Section title="Carregando...">
                    <Loading text="Carregando personagem da campanha..." />
                </Section>
            </Page>
        );
    }

    if (!pcData || !campaignInfo) {
        return (
            <Page>
                <Section title="Erro">
                    <div className="text-center">
                        <p className="mb-4">Erro ao carregar o personagem da campanha.</p>
                        <Button 
                            buttonLabel="Voltar" 
                            onClick={() => navigate(`/campaigns/${campaignId}`)} 
                        />
                    </div>
                </Section>
            </Page>
        );
    }

    return (
        <Page>
            <Section title={`Editando: ${pcData.name || 'Personagem'}`} className="py-6">
                <div className="max-w-7xl mx-auto">
                    {error && <Alert message={error} variant="error" onClose={() => setError(null)} className="mb-6" />}
                    {success && <Alert message={success} variant="success" className="mb-6" />}

                    {/* Campaign Context Bar */}
                    <div className="mb-6 p-4 bg-purple-950/50 rounded-lg border border-purple-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-purple-200">
                                    Editando na Campanha: {campaignInfo.name}
                                </h3>
                                <p className="text-purple-300 text-sm">
                                    Esta é uma versão específica do personagem para esta campanha
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowSyncModal(true)}
                                    className="flex items-center px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 
                                             text-white rounded transition-colors"
                                    title="Sincronizar com outras campanhas"
                                >
                                    <RefreshCw size={16} className="mr-1" />
                                    Sincronizar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-between items-center mb-6 bg-indigo-950/50 p-4 rounded-lg border border-indigo-800">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(`/campaigns/${campaignId}`)}
                                className="flex items-center px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                            >
                                <ArrowLeft size={16} className="mr-1" />
                                Voltar
                            </button>
                            <div className="text-indigo-200">
                                <h3 className="font-bold">{pcData.name || 'Personagem'}</h3>
                                <p className="text-sm">{pcData.race} {pcData.class} - Nível {pcData.level}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 
                                     text-white rounded transition-colors"
                        >
                            <Save size={16} className="mr-1" />
                            {saving ? "Salvando..." : "Salvar"}
                        </button>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="mb-6">
                        <div className="border-b border-indigo-800">
                            <nav className="-mb-px flex space-x-8">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                                            activeTab === tab.id
                                                ? 'border-purple-500 text-purple-400'
                                                : 'border-transparent text-indigo-300 hover:text-indigo-200 hover:border-indigo-700'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-96">
                        {activeTab === 'basic' && (
                            <PCBasicInfo
                                pcData={pcData}
                                updatePCData={updatePCData}
                                races={dndRaces}
                                classes={dndClasses}
                                backgrounds={dndBackgrounds}
                            />
                        )}
                        {activeTab === 'attributes' && (
                            <PCAttributes pcData={pcData} updatePCData={updatePCData} />
                        )}
                        {activeTab === 'skills' && (
                            <PCSkills pcData={pcData} updatePCData={updatePCData} />
                        )}
                        {activeTab === 'combat' && (
                            <PCCombat pcData={pcData} updatePCData={updatePCData} />
                        )}
                        {activeTab === 'spells' && (
                            <PCSpells pcData={pcData} updatePCData={updatePCData} />
                        )}
                        {activeTab === 'equipment' && (
                            <PCEquipment pcData={pcData} updatePCData={updatePCData} />
                        )}
                        {activeTab === 'description' && (
                            <PCDescription pcData={pcData} updatePCData={updatePCData} />
                        )}
                    </div>
                </div>
            </Section>

            {/* Modal de Sincronização */}
            <Modal
                isOpen={showSyncModal}
                onClose={() => setShowSyncModal(false)}
                title="Sincronizar com Outras Campanhas"
                size="md"
                footer={
                    <ModalConfirmFooter
                        onConfirm={handleSyncToOtherCampaigns}
                        onCancel={() => setShowSyncModal(false)}
                        confirmLabel="Sincronizar"
                        cancelLabel="Cancelar"
                        confirmVariant="bg-blue-600 hover:bg-blue-700"
                    />
                }
            >
                <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                        <Copy size={20} className="text-blue-400 mt-1" />
                        <div>
                            <h4 className="font-medium text-white">Sincronizar Mudanças</h4>
                            <p className="text-indigo-300 text-sm mt-1">
                                Isso irá aplicar as mudanças deste personagem para todas as outras campanhas
                                onde ele participa.
                            </p>
                        </div>
                    </div>
                    <div className="p-3 bg-yellow-900/20 border border-yellow-800 rounded">
                        <p className="text-yellow-200 text-sm">
                            <strong>Atenção:</strong> Esta ação não pode ser desfeita. Certifique-se de que
                            deseja aplicar estas mudanças em todas as campanhas.
                        </p>
                    </div>
                </div>
            </Modal>
        </Page>
    );
};

export default CampaignCharacterEditor;