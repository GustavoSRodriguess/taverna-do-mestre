import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, Section, Button, Tabs, Alert, Loading } from '../../ui';
import { pcService } from '../../services/pcService';
import { dndService } from '../../services/dndService';
import { FullCharacter } from '../../types/game';
import { validateCharacterName, validateLevel, validateAttributes, validateHP } from '../../utils/gameUtils';
import { ArrowLeft, Save, User, Zap, Target, Sword, Wand2, Backpack, FileText } from 'lucide-react';
import PCBasicInfo from './PCBasicInfo';
import PCAttributes from './PCAttributes';
import PCSkills from './PCSkills';
import PCCombat from './PCCombat';
import PCSpells from './PCSpells';
import PCEquipment from './PCEquipment';
import PCDescription from './PCDescription';
import { AIChatbot } from '../Chatbot/AIChatbot';

const PCEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('basic');
    const [pcData, setPCData] = useState<FullCharacter | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // D&D API Data
    const [dndRaces, setDndRaces] = useState<any[]>([]);
    const [dndClasses, setDndClasses] = useState<any[]>([]);
    const [dndBackgrounds, setDndBackgrounds] = useState<any[]>([]);

    const isNew = !id || id === 'new';

    useEffect(() => {
        loadDnDData();
        if (!isNew) {
            loadPC();
        } else {
            initializeNewPC();
        }
    }, [id]);

    const loadDnDData = async () => {
        try {
            const [races, classes, backgrounds] = await Promise.all([
                dndService.getRaces({ limit: 50 }),
                dndService.getClasses({ limit: 50 }),
                dndService.getBackgrounds({ limit: 50 })
            ]);
            console.log('races, classes, backgrounds');
            console.log(races, classes, backgrounds);
            setDndRaces(races.results);
            setDndClasses(classes.results);
            setDndBackgrounds(backgrounds.results);
        } catch (err) {
            console.error('Erro ao carregar dados D&D:', err);
        }
    };

    const loadPC = async () => {
        try {
            setLoading(true);
            const pc = await pcService.getPC(parseInt(id!));
            setPCData({
                ...pc,
                name: pc.name || '',
                race: pc.race || '',
                class: pc.class || '',
                background: pc.background || '',
                alignment: pc.alignment || '',
                abilities: pc.abilities || {},
                skills: pc.skills || {},
                attacks: pc.attacks || [],
                spells: pc.spells || { spell_slots: {}, known_spells: [] },
                equipment: pc.equipment || [],
                description: pc.description || '',
                personality_traits: pc.personality_traits || '',
                ideals: pc.ideals || '',
                bonds: pc.bonds || '',
                flaws: pc.flaws || '',
                features: pc.features || []
            });
        } catch (err: any) {
            setError('Erro ao carregar personagem: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const initializeNewPC = () => {
        const defaultPC = pcService.createDefaultPC('', '', 1);
        setPCData({
            ...defaultPC,
            name: '',
            race: '',
            class: '',
            background: '',
            alignment: '',
            attributes: defaultPC.attributes ?? {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10
            },
            abilities: {},
            skills: {},
            attacks: [],
            spells: { spell_slots: {}, known_spells: [] },
            equipment: [],
            inspiration: false,
            description: '',
            personality_traits: '',
            ideals: '',
            bonds: '',
            flaws: '',
            features: [],
            // Ensure level is always a number
            level: defaultPC.level ?? 1,
            hp: defaultPC.hp ?? 1,
            current_hp: defaultPC.current_hp ?? defaultPC.hp ?? 1,
            ca: typeof defaultPC.ca === 'number'
                ? defaultPC.ca
                : 10 + (defaultPC.attributes?.dexterity !== undefined
                    ? pcService.calculateModifier(defaultPC.attributes.dexterity)
                    : 0),
            proficiency_bonus: typeof defaultPC.proficiency_bonus === 'number'
                ? defaultPC.proficiency_bonus
                : pcService.calculateProficiencyBonus(defaultPC.level ?? 1)
        });
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
        if (!pcData) return;

        try {
            setSaving(true);
            setError(null);

            const validationErrors = validateData(pcData);
            if (validationErrors.length > 0) {
                setError('Erros de validação: ' + validationErrors.join(', '));
                return;
            }

            if (isNew) {
                const result = await pcService.createPC(pcData);
                setPCData({ ...pcData, id: result.id, player_id: result.player_id, created_at: result.created_at });
                navigate(`/pc-editor/${result.id}`, { replace: true });
            } else {
                const result = await pcService.updatePC(pcData.id!, pcData);
                setPCData({ ...pcData, ...result });
            }

            setSuccess('Personagem salvo com sucesso!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError('Erro ao salvar: ' + err.message);
        } finally {
            setSaving(false);
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
        { id: 'basic', label: 'Básico', icon: <User className="w-4 h-4" /> },
        { id: 'attributes', label: 'Atributos', icon: <Zap className="w-4 h-4" /> },
        { id: 'skills', label: 'Perícias', icon: <Target className="w-4 h-4" /> },
        { id: 'combat', label: 'Combate', icon: <Sword className="w-4 h-4" /> },
        { id: 'spells', label: 'Magias', icon: <Wand2 className="w-4 h-4" /> },
        { id: 'equipment', label: 'Equipamentos', icon: <Backpack className="w-4 h-4" /> },
        { id: 'description', label: 'Descrição', icon: <FileText className="w-4 h-4" /> }
    ];

    if (loading) {
        return (
            <Page>
                <Section title="Carregando...">
                    <Loading text="Carregando personagem..." />
                </Section>
            </Page>
        );
    }

    if (!pcData) {
        return (
            <Page>
                <Section title="Erro">
                    <div className="text-center">
                        <p className="mb-4">Erro ao carregar o personagem.</p>
                        <Button buttonLabel="Voltar" onClick={() => navigate('/characters')} />
                    </div>
                </Section>
            </Page>
        );
    }

    return (
        <Page>
            <Section title={isNew ? "Criar Personagem" : `Editando: ${pcData.name || 'Personagem'}`} className="py-6">
                <div className="max-w-7xl mx-auto">
                    {error && <Alert message={error} variant="error" onClose={() => setError(null)} className="mb-6" />}
                    {success && <Alert message={success} variant="success" className="mb-6" />}

                    {/* Action Bar */}
                    <div className="flex justify-between items-center mb-6 bg-indigo-950/50 p-4 rounded-lg border border-indigo-800">
                        <div className="flex items-center gap-4">
                            <Button buttonLabel={
                                <div className="flex items-center gap-1">
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Voltar</span>
                                </div>
                            } onClick={() => navigate('/characters')} classname="bg-gray-600 hover:bg-gray-700" />
                            <div className="text-indigo-200">
                                <h3 className="font-bold">{pcData.name || 'Novo Personagem'}</h3>
                                <p className="text-sm">{pcData.race} {pcData.class} - Nível {pcData.level}</p>
                            </div>
                        </div>
                        <Button
                            buttonLabel={saving ? "Salvando..." : (
                                <div className="flex items-center gap-1">
                                    <Save className="w-4 h-4" />
                                    <span>Salvar</span>
                                </div>
                            )}
                            onClick={handleSave}
                            disabled={saving}
                            classname="bg-green-600 hover:bg-green-700"
                        />
                    </div>

                    <Tabs tabs={tabs} defaultTabId="basic" onChange={setActiveTab} className="mb-6" />

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
            <AIChatbot />
        </Page>
    );
};

export default PCEditor;