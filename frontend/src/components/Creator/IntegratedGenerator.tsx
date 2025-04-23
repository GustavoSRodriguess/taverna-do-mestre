import React, { useState } from 'react';
import { CharacterGeneratorForm, CharacterSheet } from './CharCreation';
import { NPCGeneratorForm, NPCSheet } from './NPCCreation';
import apiService from '../../services/apiService';
import { Button, CardBorder, Page, Section } from '../../ui';
import CreatorTabs from './CreatorTabs';

const IntegratedGenerator: React.FC = () => {
    const [activeTab, setActiveTab] = useState('character');

    const [character, setCharacter] = useState<any>(null);
    const [characterLoading, setCharacterLoading] = useState(false);
    const [characterError, setCharacterError] = useState<string | null>(null);

    const [npc, setNPC] = useState<any>(null);
    const [npcLoading, setNPCLoading] = useState(false);
    const [npcError, setNPCError] = useState<string | null>(null);

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

    const handleRandomGenerate = () => {
        if (activeTab === 'character') {
            handleGenerateCharacter({
                nivel: Math.floor(Math.random() * 10) + 1,
                raca: ["Humano", "Elfo", "Anão", "Halfling"][Math.floor(Math.random() * 4)],
                classe: ["Guerreiro", "Mago", "Ladino", "Clérigo"][Math.floor(Math.random() * 4)],
                antecedente: ["Nobre", "Eremita", "Soldado", "Criminoso"][Math.floor(Math.random() * 4)],
                metodoAtributos: "rolagem"
            });
        } else if (activeTab === 'npc') {
            handleGenerateNPC({
                nivel: Math.floor(Math.random() * 10) + 1,
                metodo: "automatic"
            });
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
                    <div className="text-center py-8">
                        <h2 className="text-2xl font-bold mb-4">Gerador de Encontros</h2>
                        <p className="text-indigo-300 mb-4">Esta funcionalidade será implementada em breve!</p>
                        <Button
                            buttonLabel="Voltar para Personagens"
                            onClick={() => setActiveTab('character')}
                        />
                    </div>
                );
            case 'loot':
                return (
                    <div className="text-center py-8">
                        <h2 className="text-2xl font-bold mb-4">Gerador de loot</h2>
                        <p className="text-indigo-300 mb-4">Esta funcionalidade será implementada em breve!</p>
                        <Button
                            buttonLabel="Voltar para Personagens"
                            onClick={() => setActiveTab('character')}
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    const renderSheet = () => {
        switch (activeTab) {
            case 'character':
                return <CharacterSheet character={character} />;
            case 'npc':
                return <NPCSheet npc={npc} />;
            case 'encounter':
                return (
                    <CardBorder className="h-full flex items-center justify-center text-center bg-indigo-950/50">
                        <p className="text-indigo-300">O gerador de encontros será implementado em breve!</p>
                    </CardBorder>
                );
            case 'loot':
                return (
                    <CardBorder className="h-full flex items-center justify-center text-center bg-indigo-950/50">
                        <p className="text-indigo-300">O gerador de loot será implementado em breve!</p>
                    </CardBorder>
                );
            default:
                return null;
        }
    };

    return (
        <Page>
            <Section title={renderTitle()} className="py-8">
                <p className="text-lg mb-8 max-w-3xl mx-auto">
                    Crie personagens para sua campanha de RPG de forma rápida e fácil.
                    Preencha o formulário abaixo com as características desejadas.
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