import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, Section, Button, Tabs, Alert, Loading } from '../../ui';
import { fetchFromAPI } from '../../services/apiService';
import { dndService } from '../../services/dndService';
import PCBasicInfo from './PCBasicInfo';
import PCAttributes from './PCAttributes';
import PCSkills from './PCSkills';
import PCCombat from './PCCombat';
import PCSpells from './PCSpells';
import PCEquipment from './PCEquipment';
import PCDescription from './PCDescription';


export interface PCData {
    id?: number;
    name: string;
    race: string;
    class: string;
    level: number;
    background: string;
    alignment: string;
    attributes: {
        strength: number;
        dexterity: number;
        constitution: number;
        intelligence: number;
        wisdom: number;
        charisma: number;
    };
    skills: { [key: string]: { proficient: boolean; expertise: boolean; bonus: number } };
    hp: number;
    current_hp?: number;
    ca: number;
    attacks: Array<{
        name: string;
        bonus: number;
        damage: string;
        type: string;
        range?: string;
    }>;
    spells: {
        spell_slots: { [level: string]: { total: number; used: number } };
        known_spells: Array<{
            name: string;
            level: number;
            school: string;
            prepared?: boolean;
        }>;
        spellcasting_ability?: string;
        spell_attack_bonus?: number;
        spell_save_dc?: number;
    };
    equipment: Array<{
        name: string;
        quantity: number;
        equipped?: boolean;
        description?: string;
    }>;
    proficiency_bonus: number;
    inspiration: boolean;
    description: string;
    personality_traits: string;
    ideals: string;
    bonds: string;
    flaws: string;
    features: string[];
    player_name?: string;
}

const PCEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('basic');
    const [pcData, setPCData] = useState<PCData | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Dados D&D para dropdown
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
            const pc = await fetchFromAPI(`/pcs/${id}`);
            setPCData(pc);
        } catch (err) {
            setError('Erro ao carregar personagem');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const initializeNewPC = () => {
        setPCData({
            name: '',
            race: '',
            class: '',
            level: 1,
            background: '',
            alignment: '',
            attributes: {
                strength: 10,
                dexterity: 10,
                constitution: 10,
                intelligence: 10,
                wisdom: 10,
                charisma: 10
            },
            skills: {},
            hp: 8,
            ca: 10,
            attacks: [],
            spells: {
                spell_slots: {},
                known_spells: []
            },
            equipment: [],
            proficiency_bonus: 2,
            inspiration: false,
            description: '',
            personality_traits: '',
            ideals: '',
            bonds: '',
            flaws: '',
            features: []
        });
    };

    const handleSave = async () => {
        if (!pcData) return;

        try {
            setSaving(true);
            setError(null);

            if (isNew) {
                const result = await fetchFromAPI('/pcs', 'POST', pcData);
                setPCData(result);
                navigate(`/pc-editor/${result.id}`, { replace: true });
            } else {
                const result = await fetchFromAPI(`/pcs/${id}`, 'PUT', pcData);
                setPCData(result);
            }

            setSuccess('Personagem salvo com sucesso!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar personagem');
        } finally {
            setSaving(false);
        }
    };

    const updatePCData = (updates: Partial<PCData>) => {
        if (pcData) {
            setPCData({ ...pcData, ...updates });
        }
    };

    const tabs = [
        { id: 'basic', label: 'Básico', icon: '📋' },
        { id: 'attributes', label: 'Atributos', icon: '💪' },
        { id: 'skills', label: 'Perícias', icon: '🎯' },
        { id: 'combat', label: 'Combate', icon: '⚔️' },
        { id: 'spells', label: 'Magias', icon: '✨' },
        { id: 'equipment', label: 'Equipamentos', icon: '🎒' },
        { id: 'description', label: 'Descrição', icon: '📝' }
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
                        <Button
                            buttonLabel="Voltar"
                            onClick={() => navigate('/campaigns')}
                        />
                    </div>
                </Section>
            </Page>
        );
    }

    return (
        <Page>
            <Section title={isNew ? "Criar Personagem" : `Editando: ${pcData.name || 'Personagem'}`} className="py-6">
                <div className="max-w-7xl mx-auto">
                    {error && (
                        <Alert
                            message={error}
                            variant="error"
                            onClose={() => setError(null)}
                            className="mb-6"
                        />
                    )}

                    {success && (
                        <Alert
                            message={success}
                            variant="success"
                            className="mb-6"
                        />
                    )}

                    {/* Barra de ações */}
                    <div className="flex justify-between items-center mb-6 bg-indigo-950/50 p-4 rounded-lg border border-indigo-800">
                        <div className="flex items-center gap-4">
                            <Button
                                buttonLabel="← Voltar"
                                onClick={() => navigate('/campaigns')}
                                classname="bg-gray-600 hover:bg-gray-700"
                            />
                            <div className="text-indigo-200">
                                <h3 className="font-bold">{pcData.name || 'Novo Personagem'}</h3>
                                <p className="text-sm">
                                    {pcData.race} {pcData.class} - Nível {pcData.level}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                buttonLabel={saving ? "Salvando..." : "Salvar"}
                                onClick={handleSave}
                                disabled={saving}
                                classname="bg-green-600 hover:bg-green-700"
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs
                        tabs={tabs}
                        defaultTabId="basic"
                        onChange={setActiveTab}
                        className="mb-6"
                    />

                    {/* Conteúdo das tabs */}
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
                            <PCAttributes
                                pcData={pcData}
                                updatePCData={updatePCData}
                            />
                        )}

                        {activeTab === 'skills' && (
                            <PCSkills
                                pcData={pcData}
                                updatePCData={updatePCData}
                            />
                        )}

                        {activeTab === 'combat' && (
                            <PCCombat
                                pcData={pcData}
                                updatePCData={updatePCData}
                            />
                        )}

                        {activeTab === 'spells' && (
                            <PCSpells
                                pcData={pcData}
                                updatePCData={updatePCData}
                            />
                        )}

                        {activeTab === 'equipment' && (
                            <PCEquipment
                                pcData={pcData}
                                updatePCData={updatePCData}
                            />
                        )}

                        {activeTab === 'description' && (
                            <PCDescription
                                pcData={pcData}
                                updatePCData={updatePCData}
                            />
                        )}
                    </div>
                </div>
            </Section>
        </Page>
    );
};

export default PCEditor;