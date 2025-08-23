import React from 'react';
import { EncounterGeneratorForm } from './EncounterGeneratorForm';
import { EncounterSheet } from './EncounterSheet';
import apiService from '../../../services/apiService';
import { Page, Section } from '../../../ui';
import { useAsyncOperation } from '../../../hooks';

export const EncounterCreation: React.FC = () => {
    const { data: encounter, loading, error, execute } = useAsyncOperation();

    const handleGenerateEncounter = async (formData: any) => {
        await execute(() => apiService.generateEncounter(formData));
    };

    return (
        <Page>
            <Section title="Geração de Encontros" className="py-8">
                <p className="text-lg mb-8 max-w-3xl mx-auto">
                    Gere encontros balanceados para sua campanha de RPG.
                    Configure o nível dos jogadores, quantidade e dificuldade desejada.
                </p>

                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    <div>
                        <EncounterGeneratorForm onGenerateEncounter={handleGenerateEncounter} />

                        {loading && (
                            <div className="mt-4 text-center text-indigo-300">
                                <p>Gerando encontro...</p>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 text-center text-red-400">
                                <p>{error}</p>
                            </div>
                        )}
                    </div>

                    <EncounterSheet encounter={encounter} />
                </div>
            </Section>
        </Page>
    );
};

export default EncounterCreation;