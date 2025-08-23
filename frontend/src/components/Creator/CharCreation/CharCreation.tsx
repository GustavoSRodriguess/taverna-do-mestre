import React from 'react';
import { CharacterGeneratorForm } from './CharacterGeneratorForm';
import { CharacterSheet } from './CharacterSheet';
import apiService from '../../../services/apiService';
import { Page, Section } from '../../../ui';
import { useAsyncOperation } from '../../../hooks';

export const CharCreation: React.FC = () => {
    const { data: character, loading, error, execute } = useAsyncOperation();

    const handleGenerateCharacter = async (formData: any) => {
        await execute(() => apiService.generateCharacter(formData));
    };

    return (
        <Page>
            <Section title="Criação de Personagem" className="py-8">
                <p className="text-lg mb-8 max-w-3xl mx-auto">
                    Crie personagens para sua campanha de RPG de forma rápida e fácil.
                    Preencha o formulário abaixo com as características desejadas.
                </p>

                <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    <div>
                        <CharacterGeneratorForm onGenerateCharacter={handleGenerateCharacter} />

                        {loading && (
                            <div className="mt-4 text-center text-indigo-300">
                                <p>Gerando personagem...</p>
                            </div>
                        )}

                        {error && (
                            <div className="mt-4 text-center text-red-400">
                                <p>{error}</p>
                            </div>
                        )}
                    </div>

                    <CharacterSheet character={character} />
                </div>
            </Section>
        </Page>
    );
};

export default CharCreation;