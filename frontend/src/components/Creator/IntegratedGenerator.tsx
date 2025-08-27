// frontend/src/components/Creator/IntegratedGenerator.tsx - Versão Refatorada com useAsyncOperation
import React, { useState } from 'react';
import { Button, CardBorder, Page, Section, Alert } from '../../ui';
import apiService from '../../services/apiService';
import { NPCGeneratorForm, NPCSheet } from './NPCCreation';
import { EncounterGeneratorForm, EncounterSheet } from './EncounterCreation';
import { LootGeneratorForm, LootSheet } from './LootCreation';
import { useAsyncOperation } from '../../hooks';
import { LEVEL_RANGE, DIFFICULTY_LEVELS, PLAYER_COUNT_RANGE } from '../../constants';
import CreatorTabs from './CreatorTabs';
import { Dice6 } from 'lucide-react';

const IntegratedGenerator: React.FC = () => {
    const [activeTab, setActiveTab] = useState('npc');

    // Using useAsyncOperation for each generator
    const npcGenerator = useAsyncOperation();
    const encounterGenerator = useAsyncOperation();
    const lootGenerator = useAsyncOperation();

    const handleGenerateNPC = async (formData: any) => {
        const result = await npcGenerator.execute(() => apiService.generateNPC(formData));
        // Transform for NPC if needed
        if (result) {
            // apiService.transformToCharacterSheet could be applied here if needed
        }
    };

    const handleGenerateEncounter = async (formData: any) => {
        await encounterGenerator.execute(() => apiService.generateEncounter(formData));
    };

    const handleGenerateLoot = async (formData: any) => {
        await lootGenerator.execute(() => apiService.generateLoot(formData));
    };

    const handleRandomGenerate = () => {
        // Generate random values using constants
        const randomLevel = Math.floor(Math.random() * (LEVEL_RANGE.MAX - LEVEL_RANGE.MIN + 1)) + LEVEL_RANGE.MIN;
        const randomPlayerCount = Math.floor(Math.random() * (PLAYER_COUNT_RANGE.MAX - PLAYER_COUNT_RANGE.MIN + 1)) + PLAYER_COUNT_RANGE.MIN;
        const randomDifficulty = DIFFICULTY_LEVELS[Math.floor(Math.random() * DIFFICULTY_LEVELS.length)].value;

        const randomGenerators = {
            npc: () => handleGenerateNPC({
                level: randomLevel.toString(),
                manual: false,
                attributes_method: "rolagem"
            }),
            encounter: () => handleGenerateEncounter({
                nivelJogadores: randomLevel.toString(),
                quantidadeJogadores: randomPlayerCount.toString(),
                dificuldade: randomDifficulty
            }),
            loot: () => handleGenerateLoot({
                level: randomLevel.toString(),
                coin_type: "standard",
                item_categories: ["armor", "weapons", "potions", "rings", "scrolls"],
                quantity: 1,
                gems: Math.random() > 0.3,
                art_objects: Math.random() > 0.4,
                magic_items: Math.random() > 0.2,
                ranks: ["minor", "medium", "major"]
            })
        };

        const generator = randomGenerators[activeTab as keyof typeof randomGenerators];
        if (generator) generator();
    };

    const getTitle = (): string => {
        const titles = {
            npc: "Geração de NPC",
            encounter: "Gerador de Encontros",
            loot: "Gerador de Loot"
        };
        return titles[activeTab as keyof typeof titles] || "Criação";
    };

    const getCurrentGenerator = () => {
        const generators = {
            npc: npcGenerator,
            encounter: encounterGenerator,
            loot: lootGenerator
        };
        return generators[activeTab as keyof typeof generators];
    };

    const renderForm = () => {
        const currentGenerator = getCurrentGenerator();

        const forms = {
            npc: (
                <NPCGeneratorForm
                    onGenerateNPC={handleGenerateNPC}
                />
            ),
            encounter: (
                <EncounterGeneratorForm
                    onGenerateEncounter={handleGenerateEncounter}
                />
            ),
            loot: (
                <LootGeneratorForm
                    onGenerateLoot={handleGenerateLoot}
                />
            )
        };

        return (
            <div>
                <div className="flex justify-between mb-4">
                    <h1 className="bold text-xl">Gerador de {activeTab.toUpperCase()}</h1>
                    <Button
                        buttonLabel={
                            <div className="flex items-center gap-1">
                                <Dice6 className="w-4 h-4" />
                                <span>Aleatório</span>
                            </div>
                        }
                        onClick={handleRandomGenerate}
                        classname="bg-purple-600"
                    />
                </div>

                {forms[activeTab as keyof typeof forms]}

                {currentGenerator.loading && (
                    <div className="mt-4 text-center text-indigo-300">
                        <p>Gerando {activeTab}...</p>
                    </div>
                )}

                {currentGenerator.error && (
                    <Alert
                        message={currentGenerator.error}
                        variant="error"
                        className="mt-4"
                        onClose={() => currentGenerator.reset()}
                    />
                )}
            </div>
        );
    };

    const renderSheet = () => {
        const sheets = {
            npc: <NPCSheet npc={npcGenerator.data} />,
            encounter: <EncounterSheet encounter={encounterGenerator.data} />,
            loot: <LootSheet loot={lootGenerator.data} />
        };

        return sheets[activeTab as keyof typeof sheets] || null;
    };

    return (
        <Page>
            <Section title={getTitle()} className="py-8">
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