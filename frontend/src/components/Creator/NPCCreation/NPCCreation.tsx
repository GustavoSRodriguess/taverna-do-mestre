import React, { useState } from 'react';
import { NPCGeneratorForm } from './NPCGeneratorForm';
import { NPCSheet } from './NPCSheet';
import apiService from '../../../api/apiService';
import { Page, Section } from '../../../ui';

export const NPCCreation: React.FC = () => {
    const [npc, setNPC] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateNPC = async (formData: any) => {
        setLoading(true);
        setError(null);

        try {
            const npcData = await apiService.generateNPC(formData);
            setNPC(npcData);
        } catch (err) {
            setError("Erro ao gerar NPC. Por favor, tente novamente.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Page>
            <Section title="Geração de NPCs" className="py-8">
                <p className="text-lg mb-8 max-w-3xl mx-auto">
                    Gere NPCs para sua campanha de RPG de forma rápida e fácil.
                    Escolha entre geração automática aleatória ou controle manualmente as características.
                </p>

                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    <div>
                        <NPCGeneratorForm onGenerateNPC={handleGenerateNPC} />

                        {loading && (
                            <div className="mt-4 text-center text-indigo-300">
                                <p>Gerando NPC...</p>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 text-center text-red-400">
                                <p>{error}</p>
                            </div>
                        )}
                    </div>

                    <NPCSheet npc={npc} />
                </div>
            </Section>
        </Page>
    );
};

export default NPCCreation;