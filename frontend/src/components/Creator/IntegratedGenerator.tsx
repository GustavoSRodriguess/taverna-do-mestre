import React, { useState } from 'react';
import { CharacterGeneratorForm, CharacterSheet } from './CharCreation';
import { NPCGeneratorForm, NPCSheet } from './NPCCreation';
import { EncounterGeneratorForm, EncounterSheet } from './EncounterCreation';
import { LootGeneratorForm, LootSheet } from './LootCreation';
import apiService from '../../services/apiService';
import { Button, CardBorder, Page, Section } from '../../ui';
import CreatorTabs from './CreatorTabs';

const IntegratedGenerator: React.FC = () => {
    const [activeTab, setActiveTab] = useState('character');

    // Character state
    const [character, setCharacter] = useState<any>(null);
    const [characterLoading, setCharacterLoading] = useState(false);
    const [characterError, setCharacterError] = useState<string | null>(null);

    // NPC state
    const [npc, setNPC] = useState<any>(null);
    const [npcLoading, setNPCLoading] = useState(false);
    const [npcError, setNPCError] = useState<string | null>(null);

    // Encounter state
    const [encounter, setEncounter] = useState<any>(null);
    const [encounterLoading, setEncounterLoading] = useState(false);
    const [encounterError, setEncounterError] = useState<string | null>(null);

    // Loot state
    const [loot, setLoot] = useState<any>(null);
    const [lootLoading, setLootLoading] = useState(false);
    const [lootError, setLootError] = useState<string | null>(null);

    const handleGenerateCharacter = async (formData: any) => {
        setCharacterLoading(true);
        setCharacterError(null);

        try {
            const characterData = await apiService.generateCharacter(formData);
            setCharacter(characterData);
        } catch (err) {
            setCharacterError("Erro ao gerar personagem. Por favor, tente novamente.");
            console.error(err);
        } finally {
            setCharacterLoading(false);
        }
    };

    const handleGenerateNPC = async (formData: any) => {
        setNPCLoading(true);
        setNPCError(null);

        try {
            const npcData = await apiService.generateNPC(formData);
            setNPC(npcData);
        } catch (err) {
            setNPCError("Erro ao gerar NPC. Por favor, tente novamente.");
            console.error(err);
        } finally {
            setNPCLoading(false);
        }
    };

    const handleGenerateEncounter = async (formData: any) => {
        setEncounterLoading(true);
        setEncounterError(null);

        try {
            const encounterData = await apiService.generateEncounter(formData);
            setEncounter(encounterData);
        } catch (err) {
            setEncounterError("Erro ao gerar encontro. Por favor, tente novamente.");
            console.error(err);
        } finally {
            setEncounterLoading(false);
        }
    };

    const handleGenerateLoot = async (formData: any) => {
        setLootLoading(true);
        setLootError(null);

        try {
            const lootData = await apiService.generateLoot(formData);
            setLoot(lootData);
        } catch (err) {
            setLootError("Erro ao gerar tesouro. Por favor, tente novamente.");
            console.error(err);
        } finally {
            setLootLoading(false);
        }
    };

    const handleRandomGenerate = () => {
        switch (activeTab) {
            case 'character':
                handleGenerateCharacter({
                    nivel: Math.floor(Math.random() * 10) + 1,
                    raca: ["Humano", "Elfo", "Anão", "Halfling"][Math.floor(Math.random() * 4)],
                    classe: ["Guerreiro", "Mago", "Ladino", "Clérigo"][Math.floor(Math.random() * 4)],
                    antecedente: ["Nobre", "Eremita", "Soldado", "Criminoso"][Math.floor(Math.random() * 4)],
                    metodoAtributos: "rolagem"
                });
                break;
            case 'npc':
                handleGenerateNPC({
                    nivel: Math.floor(Math.random() * 10) + 1,
                    metodo: "automatic"
                });
                break;
            case 'encounter':
                handleGenerateEncounter({
                    nivelJogadores: Math.floor(Math.random() * 10) + 1,
                    quantidadeJogadores: Math.floor(Math.random() * 4) + 2,
                    dificuldade: ['f', 'm', 'd', 'mo'][Math.floor(Math.random() * 4)]
                });
                break;
            case 'loot':
                handleGenerateLoot({
                    level: Math.floor(Math.random() * 10) + 1,
                    coin_type: "standard",
                    item_categories: ["armor", "weapons", "potions", "rings", "rods", "scrolls", "staves", "wands", "wondrous"],
                    quantity: 1,
                    gems: Math.random() > 0.3, // 70% chance de incluir gemas
                    art_objects: Math.random() > 0.4, // 60% chance de incluir objetos de arte
                    magic_items: Math.random() > 0.2, // 80% chance de incluir itens mágicos
                    ranks: ["minor", "medium", "major"],
                    
                    // Campos adicionais
                    valuable_type: "standard",
                    item_type: "standard",
                    more_random_coins: false,
                    trade: "none", 
                    psionic_items: false,
                    chaositech_items: false,
                    max_value: 0,
                    combine_hoards: false
                });
                break;
            default:
                break;
        }
    };

    const renderTitle = () => {
        switch (activeTab) {
            case 'character':
                return "Criação de Personagem";
            case 'npc':
                return "Geração de NPC";
            case 'encounter':
                return "Gerador de Encontros";
            case 'loot':
                return 'Gerador de Loot'
            default:
                return "Criação";
        }
    };

    const renderForm = () => {
        switch (activeTab) {
            case 'character':
                return (
                    <div>
                        <div className="flex justify-between mb-4">
                            <h1 className='bold text-xl'>Gerador de Personagem</h1>
                            <Button buttonLabel="Aleatório" onClick={handleRandomGenerate} classname="bg-purple-600" />
                        </div>
                        <CharacterGeneratorForm onGenerateCharacter={handleGenerateCharacter} />

                        {characterLoading && (
                            <div className="mt-4 text-center text-indigo-300">
                                <p>Gerando personagem...</p>
                            </div>
                        )}

                        {characterError && (
                            <div className="mt-4 text-center text-red-400">
                                <p>{characterError}</p>
                            </div>
                        )}
                    </div>
                );
            case 'npc':
                return (
                    <div>
                        <div className="flex justify-between mb-4">
                            <h1 className='bold text-xl'>Gerador de NPC</h1>
                            <Button buttonLabel="Aleatório" onClick={handleRandomGenerate} classname="bg-purple-600" />
                        </div>
                        <NPCGeneratorForm onGenerateNPC={handleGenerateNPC} />

                        {npcLoading && (
                            <div className="mt-4 text-center text-indigo-300">
                                <p>Gerando NPC...</p>
                            </div>
                        )}

                        {npcError && (
                            <div className="mt-4 text-center text-red-400">
                                <p>{npcError}</p>
                            </div>
                        )}
                    </div>
                );
            case 'encounter':
                return (
                    <div>
                        <div className="flex justify-between mb-4">
                            <h1 className='bold text-xl'>Gerador de Encontros</h1>
                            <Button buttonLabel="Aleatório" onClick={handleRandomGenerate} classname="bg-purple-600" />
                        </div>
                        <EncounterGeneratorForm onGenerateEncounter={handleGenerateEncounter} />

                        {encounterLoading && (
                            <div className="mt-4 text-center text-indigo-300">
                                <p>Gerando encontro...</p>
                            </div>
                        )}

                        {encounterError && (
                            <div className="mt-4 text-center text-red-400">
                                <p>{encounterError}</p>
                            </div>
                        )}
                    </div>
                );
            case 'loot':
                return (
                    <div>
                        <div className="flex justify-between mb-4">
                            <h1 className='bold text-xl'>Gerador de Tesouro</h1>
                            <Button buttonLabel="Aleatório" onClick={handleRandomGenerate} classname="bg-purple-600" />
                        </div>
                        <LootGeneratorForm onGenerateLoot={handleGenerateLoot} />

                        {lootLoading && (
                            <div className="mt-4 text-center text-indigo-300">
                                <p>Gerando tesouro...</p>
                            </div>
                        )}

                        {lootError && (
                            <div className="mt-4 text-center text-red-400">
                                <p>{lootError}</p>
                            </div>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    const renderSheet = () => {
        switch (activeTab) {
            case 'character':
                console.log(character);
                return <CharacterSheet character={character} />;
            case 'npc':
                return <NPCSheet npc={npc} />;
            case 'encounter':
                return <EncounterSheet encounter={encounter} />;
            case 'loot':
                return <LootSheet loot={loot} />;
            default:
                return null;
        }
    };

    return (
        <Page>
            <Section title={renderTitle()} className="py-8">
                <p className="text-lg mb-8 max-w-3xl mx-auto">
                    Crie recursos para sua campanha de RPG de forma rápida e fácil.
                    Selecione a guia desejada e preencha o formulário com as características desejadas.
                </p>

                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    <div>
                        <CreatorTabs
                            activeTab={activeTab}
                            onTabChange={setActiveTab}
                        />
                        <CardBorder className="bg-indigo-950/80">
                            {renderForm()}
                        </CardBorder>
                    </div>
                    <div>
                        {renderSheet()}
                    </div>
                </div>
            </Section>
        </Page>
    );
};

export default IntegratedGenerator;