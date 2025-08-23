import React from 'react';
import { LootGeneratorForm } from './LootGeneratorForm';
import { LootSheet } from './LootSheet';
import apiService from '../../../services/apiService';
import { Page, Section } from '../../../ui';
import { useAsyncOperation } from '../../../hooks';

export const LootCreation: React.FC = () => {
    const { data: loot, loading, error, execute } = useAsyncOperation();

    const handleGenerateLoot = async (formData: any) => {
        await execute(() => apiService.generateLoot(formData));
    };

    return (
        <Page>
            <Section title="Geração de Tesouro" className="py-8">
                <p className="text-lg mb-8 max-w-3xl mx-auto">
                    Gere tesouros e recompensas adequados para sua campanha.
                    Configure o nível de dificuldade e tipo de tesouro desejado.
                </p>

                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    <div>
                        <LootGeneratorForm onGenerateLoot={handleGenerateLoot} />

                        {loading && (
                            <div className="mt-4 text-center text-indigo-300">
                                <p>Gerando tesouro...</p>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 text-center text-red-400">
                                <p>{error}</p>
                            </div>
                        )}
                    </div>

                    <LootSheet loot={loot} />
                </div>
            </Section>
        </Page>
    );
};

export default LootCreation;