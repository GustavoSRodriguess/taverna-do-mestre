// frontend/src/components/Creator/IntegratedGenerator.tsx - Versão Refatorada
import React, { useState } from 'react';
import { Button, CardBorder, Page, Section, Alert } from '../../ui';
import apiService, { GenerationFormData } from '../../services/apiService';
import { NPCGeneratorForm, NPCSheet } from './NPCCreation';
import { EncounterGeneratorForm, EncounterSheet } from './EncounterCreation';
import { LootGeneratorForm, LootSheet } from './LootCreation';
import CreatorTabs from './CreatorTabs';

interface GenerationState {
    data: any;
    loading: boolean;
    error: string | null;
}

const IntegratedGenerator: React.FC = () => {
    const [activeTab, setActiveTab] = useState('npc');

    // Consolidated state for all generators
    const [npc, setNPC] = useState<GenerationState>({ data: null, loading: false, error: null });
    const [encounter, setEncounter] = useState<GenerationState>({ data: null, loading: false, error: null });
    const [loot, setLoot] = useState<GenerationState>({ data: null, loading: false, error: null });

    // Generic handler for all generation types
    const handleGeneration = async (
        type: 'npc' | 'encounter' | 'loot',
        formData: GenerationFormData,
        generatorFunction: (data: GenerationFormData) => Promise<any>,
        setState: React.Dispatch<React.SetStateAction<GenerationState>>
    ) => {
        setState(prev => ({ ...prev, loading: true, error: null }));

        try {
            const result = await generatorFunction(formData);
            const transformedResult = type === 'npc'
                ? apiService.transformToCharacterSheet(result)
                : result;

            setState({ data: transformedResult, loading: false, error: null });
        } catch (err) {
            setState({
                data: null,
                loading: false,
                error: `Erro ao gerar ${type}. Tente novamente.`
            });
            console.error(`Error generating ${type}:`, err);
        }
    };

    const handleGenerateNPC = (formData: any) => {
        handleGeneration('npc', formData, apiService.generateNPC.bind(apiService), setNPC);
    };

    const handleGenerateEncounter = (formData: any) => {
        handleGeneration('encounter', formData, apiService.generateEncounter.bind(apiService), setEncounter);
    };

    const handleGenerateLoot = (formData: any) => {
        handleGeneration('loot', formData, apiService.generateLoot.bind(apiService), setLoot);
    };

    const handleRandomGenerate = () => {
        const randomGenerators = {
            npc: () => handleGenerateNPC({
                level: (Math.floor(Math.random() * 10) + 1).toString(),
                manual: false,
                attributes_method: "rolagem"
            }),
            encounter: () => handleGenerateEncounter({
                nivelJogadores: (Math.floor(Math.random() * 10) + 1).toString(),
                quantidadeJogadores: (Math.floor(Math.random() * 4) + 2).toString(),
                dificuldade: ['f', 'm', 'd', 'mo'][Math.floor(Math.random() * 4)]
            }),
            loot: () => handleGenerateLoot({
                level: (Math.floor(Math.random() * 10) + 1).toString(),
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

    const getCurrentState = (): GenerationState => {
        const states = { npc, encounter, loot };
        return states[activeTab as keyof typeof states] || { data: null, loading: false, error: null };
    };

    const renderForm = () => {
        const currentState = getCurrentState();

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
                        buttonLabel="🎲 Aleatório"
                        onClick={handleRandomGenerate}
                        classname="bg-purple-600"
                    />
                </div>

                {forms[activeTab as keyof typeof forms]}

                {currentState.loading && (
                    <div className="mt-4 text-center text-indigo-300">
                        <p>Gerando {activeTab}...</p>
                    </div>
                )}

                {currentState.error && (
                    <Alert
                        message={currentState.error}
                        variant="error"
                        className="mt-4"
                        onClose={() => {
                            const setters = { npc: setNPC, encounter: setEncounter, loot: setLoot };
                            const setter = setters[activeTab as keyof typeof setters];
                            if (setter) {
                                setter(prev => ({ ...prev, error: null }));
                            }
                        }}
                    />
                )}
            </div>
        );
    };

    const renderSheet = () => {
        const sheets = {
            npc: <NPCSheet npc={npc.data} />,
            encounter: <EncounterSheet encounter={encounter.data} />,
            loot: <LootSheet loot={loot.data} />
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