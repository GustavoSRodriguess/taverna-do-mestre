import React, { useState } from 'react';
import { CharacterGeneratorForm } from './CharacterGeneratorForm';
import { CharacterSheet } from './CharacterSheet';
import apiService from '../../../services/apiService';
import { Page, Section } from '../../../ui';

export const CharCreation: React.FC = () => {
    const [character, setCharacter] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateCharacter = async (formData: any) => {
        setLoading(true);
        setError(null);

        try {
            const characterData = await apiService.generateCharacter(formData);
            setCharacter(characterData);
        } catch (err) {
            setError("Erro ao gerar personagem. Por favor, tente novamente.");
            console.error(err);
        } finally {
            setLoading(false);
        }
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