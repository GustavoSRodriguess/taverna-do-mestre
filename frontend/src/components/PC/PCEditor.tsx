import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, Section, Button, Tabs, Alert, Loading } from '../../ui';
import { pcService, PC, CreatePCData, PCAttributesType } from '../../services/pcService';
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
    player_id?: number;
    created_at?: string;
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
            const pc = await pcService.getPC(parseInt(id!));

            // Converter PC para PCData garantindo todos os campos obrigatórios
            const pcData: PCData = {
                ...pc,
                // Garantir que todos os campos obrigatórios existam com valores padrão
                name: pc.name || '',
                race: pc.race || '',
                class: pc.class || '',
                level: pc.level || 1,
                background: pc.background || '',
                alignment: pc.alignment || '',
                attributes: pc.attributes || {
                    strength: 10,
                    dexterity: 10,
                    constitution: 10,
                    intelligence: 10,
                    wisdom: 10,
                    charisma: 10
                },
                hp: pc.hp || 1,
                current_hp: pc.current_hp ?? pc.hp ?? 1,
                ca: pc.ca || 10,
                proficiency_bonus: pc.proficiency_bonus || pcService.calculateProficiencyBonus(pc.level || 1),
                skills: pc.skills || {},
                attacks: pc.attacks || [],
                spells: pc.spells || {
                    spell_slots: {},
                    known_spells: []
                },
                equipment: pc.equipment || [],
                inspiration: pc.inspiration || false,
                description: pc.description || '',
                personality_traits: pc.personality_traits || '',
                ideals: pc.ideals || '',
                bonds: pc.bonds || '',
                flaws: pc.flaws || '',
                features: pc.features || []
            };

            setPCData(pcData);
        } catch (err: any) {
            setError('Erro ao carregar personagem: ' + err.message);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const initializeNewPC = () => {
        const defaultPC = pcService.createDefaultPC('', '', 1);

        setPCData({
            name: '',
            race: '',
            class: '',
            level: 1,
            background: '',
            alignment: '',
            attributes: defaultPC.attributes,
            hp: defaultPC.hp,
            current_hp: defaultPC.hp,
            ca: defaultPC.ca,
            proficiency_bonus: defaultPC.proficiency_bonus || 2,
            skills: {},
            attacks: [],
            spells: {
                spell_slots: {},
                known_spells: []
            },
            equipment: [],
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

            // Validar dados
            const validationErrors = pcService.validatePCData(pcData);
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

    const updatePCData = (updates: Partial<PCData>) => {
        if (pcData) {
            const newData = { ...pcData, ...updates };

            // Recalcular bônus de proficiência se o nível mudou
            if (updates.level && updates.level !== pcData.level) {
                newData.proficiency_bonus = pcService.calculateProficiencyBonus(updates.level);
            }

            // Recalcular CA base se a destreza mudou
            if (updates.attributes?.dexterity && updates.attributes.dexterity !== pcData.attributes.dexterity) {
                const dexMod = pcService.calculateModifier(updates.attributes.dexterity);
                newData.ca = 10 + dexMod; // CA base
            }

            setPCData(newData);
        }
    };

    // Função auxiliar para aplicar modificadores raciais
    const applyRacialModifiers = (raceIndex: string, baseAttributes: PCAttributesType): PCAttributesType => {
        const race = dndRaces.find(r => r.api_index === raceIndex);
        if (!race || !race.ability_bonuses) return baseAttributes;

        const modifiedAttributes = { ...baseAttributes };

        try {
            const bonuses = Array.isArray(race.ability_bonuses)
                ? race.ability_bonuses
                : JSON.parse(race.ability_bonuses);

            bonuses.forEach((bonus: any) => {
                const abilityName = bonus.ability_score?.name || bonus.ability_score;
                const bonusValue = bonus.bonus || 0;

                switch (abilityName) {
                    case 'str':
                    case 'strength':
                        modifiedAttributes.strength += bonusValue;
                        break;
                    case 'dex':
                    case 'dexterity':
                        modifiedAttributes.dexterity += bonusValue;
                        break;
                    case 'con':
                    case 'constitution':
                        modifiedAttributes.constitution += bonusValue;
                        break;
                    case 'int':
                    case 'intelligence':
                        modifiedAttributes.intelligence += bonusValue;
                        break;
                    case 'wis':
                    case 'wisdom':
                        modifiedAttributes.wisdom += bonusValue;
                        break;
                    case 'cha':
                    case 'charisma':
                        modifiedAttributes.charisma += bonusValue;
                        break;
                }
            });
        } catch (err) {
            console.error('Erro ao aplicar modificadores raciais:', err);
        }

        return modifiedAttributes;
    };

    // Handler para mudança de raça
    const handleRaceChange = (raceIndex: string) => {
        if (!pcData) return;

        const race = dndRaces.find(r => r.api_index === raceIndex);
        if (!race) return;

        // Aplicar modificadores raciais aos atributos base
        const baseAttributes: PCAttributesType = {
            strength: 10,
            dexterity: 10,
            constitution: 10,
            intelligence: 10,
            wisdom: 10,
            charisma: 10
        };

        const modifiedAttributes = applyRacialModifiers(raceIndex, baseAttributes);

        updatePCData({
            race: race.name,
            attributes: modifiedAttributes
        });
    };

    // Handler para mudança de classe
    const handleClassChange = (classIndex: string) => {
        if (!pcData) return;

        const dndClass = dndClasses.find(c => c.api_index === classIndex);
        if (!dndClass) return;

        // Calcular HP base baseado no Hit Die da classe
        const hitDie = dndClass.hit_die || 8;
        const conMod = pcService.calculateModifier(pcData.attributes.constitution);
        const newHP = hitDie + conMod + (pcData.level - 1) * (Math.floor(hitDie / 2) + 1 + conMod);

        updatePCData({
            class: dndClass.name,
            hp: Math.max(newHP, 1)
        });
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
                            onClick={() => navigate('/characters')}
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
                                onClick={() => navigate('/characters')}
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
                                buttonLabel={saving ? "Salvando..." : "💾 Salvar"}
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
                                onRaceChange={handleRaceChange}
                                onClassChange={handleClassChange}
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